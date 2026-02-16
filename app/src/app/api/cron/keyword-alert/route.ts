import type { NextRequest } from 'next/server';
import { getGoogleTrendingKeywords } from '@/lib/api/trends';
import { getGoogleAutocomplete } from '@/lib/api/google';
import { getNaverAutocomplete } from '@/lib/api/naver';
import { sendTelegramMessage, escapeHtml } from '@/lib/api/telegram';
import { getSentKeywords, markKeywordsAsSent, filterNewKeywords } from '@/lib/api/keyword-history';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// 한글 초성 14개 (ㄱ~ㅎ에 대응하는 첫 음절)
const CHOSUNG_SYLLABLES = [
  '가', '나', '다', '라', '마', '바', '사',
  '아', '자', '차', '카', '타', '파', '하',
];

interface ExpandedTrend {
  keyword: string;
  approxTraffic: string;
  category?: string;
  googleSuggestions: string[];
  naverSuggestions: string[];
  newCount: number;
  totalCount: number;
}

// 시드 키워드 + 초성 14개 확장으로 자동완성 수집
async function expandWithChosung(
  keyword: string,
  fetcher: (q: string) => Promise<{ keyword: string; volume: number }[]>,
): Promise<string[]> {
  const allKeywords = new Set<string>();

  // 1) 기본 자동완성
  const baseResults = await fetcher(keyword).catch(() => []);
  for (const r of baseResults) allKeywords.add(r.keyword);

  // 2) 초성 14개 확장 (5개씩 병렬, 100ms 딜레이)
  for (let i = 0; i < CHOSUNG_SYLLABLES.length; i += 5) {
    const batch = CHOSUNG_SYLLABLES.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(s => fetcher(`${keyword} ${s}`)),
    );
    for (const r of results) {
      if (r.status === 'fulfilled') {
        for (const item of r.value) allKeywords.add(item.keyword);
      }
    }
    if (i + 5 < CHOSUNG_SYLLABLES.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return [...allKeywords];
}

export async function GET(request: NextRequest) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 1. 트렌드/시드 키워드 수집
    const trends = await getGoogleTrendingKeywords(20);

    if (trends.length === 0) {
      await sendTelegramMessage('⚠️ 트렌드 키워드를 가져오지 못했습니다.');
      return Response.json({ success: false, error: 'No trends found' });
    }

    // 2. 이전 발송 이력 로드
    const sentSet = await getSentKeywords();

    // 3. 각 키워드에 대해 초성 확장 포함 자동완성 수집 (2개씩 순차 처리)
    const expandedTrends: ExpandedTrend[] = [];

    for (let i = 0; i < trends.length; i += 2) {
      const batch = trends.slice(i, i + 2);
      const results = await Promise.all(
        batch.map(async (trend) => {
          const [allGoogle, allNaver] = await Promise.allSettled([
            expandWithChosung(trend.title, getGoogleAutocomplete),
            expandWithChosung(trend.title, getNaverAutocomplete),
          ]);

          const googleKws = allGoogle.status === 'fulfilled' ? allGoogle.value : [];
          const naverKws = allNaver.status === 'fulfilled' ? allNaver.value : [];

          // 메인 키워드 자체 제외 + 신규만 필터
          const newGoogle = filterNewKeywords(
            googleKws.filter(k => k.toLowerCase() !== trend.title.toLowerCase()),
            sentSet,
          );
          const newNaver = filterNewKeywords(
            naverKws.filter(k => k.toLowerCase() !== trend.title.toLowerCase()),
            sentSet,
          );

          return {
            keyword: trend.title,
            approxTraffic: trend.approxTraffic,
            category: trend.category,
            googleSuggestions: newGoogle,
            naverSuggestions: newNaver,
            newCount: newGoogle.length + newNaver.length,
            totalCount: googleKws.length + naverKws.length,
          };
        })
      );
      expandedTrends.push(...results);
    }

    // 4. 새 키워드가 있는 트렌드만 필터
    const trendsWithNew = expandedTrends.filter(t => t.newCount > 0);

    if (trendsWithNew.length === 0) {
      await sendTelegramMessage('📭 오늘은 새로운 자동완성 키워드가 없습니다.');
      return Response.json({ success: true, newKeywords: 0 });
    }

    // 5. 텔레그램 메시지 포맷팅 및 발송
    const message = formatAlertMessage(trendsWithNew, sentSet.size);
    const sent = await sendTelegramMessage(message);

    // 6. 발송한 키워드를 이력에 저장
    if (sent) {
      const allNewKeywords = trendsWithNew.flatMap(t => [
        ...t.googleSuggestions,
        ...t.naverSuggestions,
      ]);
      await markKeywordsAsSent(allNewKeywords);
    }

    const totalNew = trendsWithNew.reduce((sum, t) => sum + t.newCount, 0);
    return Response.json({
      success: sent,
      trendsProcessed: expandedTrends.length,
      trendsWithNewKeywords: trendsWithNew.length,
      newKeywords: totalNew,
      previouslySent: sentSet.size,
    });
  } catch (error) {
    console.error('[CRON] Keyword alert error:', error);
    await sendTelegramMessage('❌ 키워드 알림 생성 중 오류가 발생했습니다.');
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function formatAlertMessage(trends: ExpandedTrend[], totalTracked: number): string {
  const date = new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const totalNew = trends.reduce((sum, t) => sum + t.newCount, 0);

  let msg = `<b>📊 신규 롱테일 키워드 알림</b>\n`;
  msg += `<i>${date}</i>\n`;
  msg += `🆕 <b>${totalNew}개</b> 신규 | 📦 누적 ${totalTracked}개 추적 중\n`;

  for (const trend of trends) {
    msg += `\n<b>🔍 ${escapeHtml(trend.keyword)}</b>`;
    if (trend.category) msg += ` [${escapeHtml(trend.category)}]`;
    msg += ` <i>(+${trend.newCount}개 신규)</i>\n`;

    if (trend.googleSuggestions.length > 0) {
      msg += `  <b>G:</b> ${trend.googleSuggestions.map(s => escapeHtml(s)).join(' | ')}\n`;
    }

    if (trend.naverSuggestions.length > 0) {
      msg += `  <b>N:</b> ${trend.naverSuggestions.map(s => escapeHtml(s)).join(' | ')}\n`;
    }
  }

  return msg;
}
