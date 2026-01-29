import { NextRequest, NextResponse } from 'next/server';
import { getNaverAutocomplete } from '@/lib/api/naver';

// 한글 자음 (14개)
const CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 한글 모음 (14개) - 키보드로 입력 가능한 것만
const VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ'];

// 자음 + 모음 조합으로 음절 생성 (196개)
function generateSyllables(): string[] {
  const syllables: string[] = [];
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];

  for (const consonant of CONSONANTS) {
    for (const vowel of VOWELS) {
      // 초성 인덱스
      const choIndex = CHO.indexOf(consonant);
      // 중성 인덱스
      const jungIndex = JUNG.indexOf(vowel);

      if (choIndex !== -1 && jungIndex !== -1) {
        // 한글 유니코드 공식: 0xAC00 + (초성 * 21 * 28) + (중성 * 28)
        const syllableCode = 0xAC00 + (choIndex * 21 * 28) + (jungIndex * 28);
        syllables.push(String.fromCharCode(syllableCode));
      }
    }
  }

  return syllables;
}

const KOREAN_SYLLABLES = generateSyllables();

// 딜레이 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword string is required' },
        { status: 400 }
      );
    }

    console.log('[NAVER EXPAND] Starting expanded autocomplete for:', keyword);
    console.log('[NAVER EXPAND] Total syllables to check:', KOREAN_SYLLABLES.length);

    // 모든 음절에 대해 자동완성 조회 (순차 처리 - rate limit 회피)
    const allResults: { keyword: string; volume: number; source: string }[] = [];
    const seenKeywords = new Set<string>();

    for (let i = 0; i < KOREAN_SYLLABLES.length; i++) {
      const syllable = KOREAN_SYLLABLES[i];
      const expandedKeyword = `${keyword} ${syllable}`;

      try {
        const results = await getNaverAutocomplete(expandedKeyword);

        for (const item of results) {
          // 띄어쓰기 제거하여 중복 체크 (노트북 추천 = 노트북추천)
          const normalizedKeyword = item.keyword.toLowerCase().replace(/\s+/g, '');
          if (!seenKeywords.has(normalizedKeyword)) {
            seenKeywords.add(normalizedKeyword);
            allResults.push({
              keyword: item.keyword,
              volume: 0,
              source: syllable,
            });
          }
        }
      } catch (error) {
        console.error(`[NAVER EXPAND] Error for ${syllable}:`, error);
      }

      // 매 10개마다 로그 출력
      if ((i + 1) % 10 === 0) {
        console.log(`[NAVER EXPAND] Progress: ${i + 1}/${KOREAN_SYLLABLES.length}`);
      }

      // rate limit 회피를 위한 딜레이 (50ms)
      await delay(50);
    }

    console.log('[NAVER EXPAND] Total unique keywords:', allResults.length);

    return NextResponse.json({
      success: true,
      data: allResults,
      count: allResults.length,
    });
  } catch (error) {
    console.error('Naver expanded autocomplete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
