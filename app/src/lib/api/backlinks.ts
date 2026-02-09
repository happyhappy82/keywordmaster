import type {
  BacklinkSummary,
  BacklinkItem,
  ReferringDomain,
  AnchorItem,
  BacklinkHistoryItem,
  NewLostItem,
  CompetitorItem,
  BulkRankItem,
} from '@/types/backlinks';

// Make.com 유니버설 웹훅을 통한 DataForSEO API 호출
async function callDataForSEO(apiPath: string, payload: Record<string, unknown>) {
  const webhookUrl = process.env.MAKE_DATAFORSEO_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('MAKE_DATAFORSEO_WEBHOOK_URL is not configured');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: apiPath,
      method: 'POST',
      body: JSON.stringify([payload]),
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status}`);
  }

  const text = await response.text();

  // Make.com 응답에서 DataForSEO 데이터 파싱
  // 응답 형식: DataForSEO JSON + HTTP status + headers (연결된 형태)
  // 첫 번째 JSON 객체만 추출
  let data;
  try {
    // 200{ 또는 }200{ 패턴으로 분리하여 첫 번째 JSON만 파싱
    const jsonEnd = text.search(/\}[\s]*\d{3}\s*\{/);
    const jsonStr = jsonEnd > -1 ? text.substring(0, jsonEnd + 1) : text;
    data = JSON.parse(jsonStr);
  } catch {
    // 전체가 유효한 JSON인 경우
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Failed to parse DataForSEO response');
    }
  }

  if (data.status_code !== 20000) {
    throw new Error(data.status_message || 'DataForSEO API error');
  }

  return data;
}

// 백링크 요약
export async function getBacklinkSummary(target: string): Promise<BacklinkSummary> {
  const data = await callDataForSEO('/backlinks/summary/live', {
    target,
    internal_list_limit: 10,
    backlinks_status_type: 'all',
  });

  const result = data.tasks?.[0]?.result?.[0];
  if (!result) throw new Error('No summary data returned');
  return result as BacklinkSummary;
}

// 백링크 목록
export async function getBacklinkList(
  target: string,
  limit: number = 50,
  offset: number = 0,
  orderBy: string = 'rank,desc'
): Promise<{ items: BacklinkItem[]; total_count: number }> {
  const data = await callDataForSEO('/backlinks/backlinks/live', {
    target,
    limit,
    offset,
    order_by: [orderBy],
    backlinks_status_type: 'all',
  });

  const task = data.tasks?.[0]?.result?.[0];
  return {
    items: (task?.items || []) as BacklinkItem[],
    total_count: task?.total_count || 0,
  };
}

// 참조 도메인
export async function getReferringDomains(
  target: string,
  limit: number = 50,
  offset: number = 0,
  orderBy: string = 'rank,desc'
): Promise<{ items: ReferringDomain[]; total_count: number }> {
  const data = await callDataForSEO('/backlinks/referring_domains/live', {
    target,
    limit,
    offset,
    order_by: [orderBy],
  });

  const task = data.tasks?.[0]?.result?.[0];
  return {
    items: (task?.items || []) as ReferringDomain[],
    total_count: task?.total_count || 0,
  };
}

// 앵커 텍스트
export async function getAnchorTexts(
  target: string,
  limit: number = 50,
  offset: number = 0,
  orderBy: string = 'backlinks,desc'
): Promise<{ items: AnchorItem[]; total_count: number }> {
  const data = await callDataForSEO('/backlinks/anchors/live', {
    target,
    limit,
    offset,
    order_by: [orderBy],
  });

  const task = data.tasks?.[0]?.result?.[0];
  return {
    items: (task?.items || []) as AnchorItem[],
    total_count: task?.total_count || 0,
  };
}

// 백링크 히스토리
export async function getBacklinkHistory(
  target: string,
  dateFrom?: string,
  dateTo?: string
): Promise<BacklinkHistoryItem[]> {
  const payload: Record<string, unknown> = { target };
  if (dateFrom) payload.date_from = dateFrom;
  if (dateTo) payload.date_to = dateTo;

  const data = await callDataForSEO('/backlinks/history/live', payload);
  return (data.tasks?.[0]?.result?.[0]?.items || []) as BacklinkHistoryItem[];
}

// 신규/손실 백링크 타임시리즈
export async function getNewLostTimeseries(
  target: string,
  dateFrom?: string,
  dateTo?: string
): Promise<NewLostItem[]> {
  const payload: Record<string, unknown> = { target, group: 'month' };
  if (dateFrom) payload.date_from = dateFrom;
  if (dateTo) payload.date_to = dateTo;

  const data = await callDataForSEO('/backlinks/timeseries_new_lost_summary/live', payload);
  return (data.tasks?.[0]?.result?.[0]?.items || []) as NewLostItem[];
}

// 백링크 경쟁사 분석
export async function getBacklinkCompetitors(
  target: string,
  limit: number = 20
): Promise<CompetitorItem[]> {
  const data = await callDataForSEO('/backlinks/competitors/live', {
    target,
    limit,
  });

  return (data.tasks?.[0]?.result?.[0]?.items || []) as CompetitorItem[];
}

// 대량 도메인 랭크 조회
export async function getBulkRanks(targets: string[]): Promise<BulkRankItem[]> {
  const data = await callDataForSEO('/backlinks/bulk_ranks/live', {
    targets,
  });

  return (data.tasks?.[0]?.result || []) as BulkRankItem[];
}
