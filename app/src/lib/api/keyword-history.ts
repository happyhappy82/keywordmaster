// 키워드 발송 이력 관리 (Upstash Redis REST API)
//
// 이미 보낸 자동완성 키워드를 기억해서 중복 발송 방지.
// 환경변수: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (Upstash에서 발급)

const REDIS_KEY = 'keyword-alert:sent';

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[HISTORY] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. Dedup disabled.');
    return null;
  }

  return { url, token };
}

async function redisCommand(...args: string[]): Promise<unknown> {
  const config = getRedisConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });

  if (!response.ok) {
    console.error('[HISTORY] Redis error:', response.status, await response.text());
    return null;
  }

  const data = await response.json();
  return data.result;
}

// 이미 발송된 키워드 목록 가져오기
export async function getSentKeywords(): Promise<Set<string>> {
  const result = await redisCommand('SMEMBERS', REDIS_KEY);
  if (!result || !Array.isArray(result)) return new Set();
  return new Set(result.map((k: string) => k.toLowerCase()));
}

// 새로 발송한 키워드 저장
export async function markKeywordsAsSent(keywords: string[]): Promise<void> {
  if (keywords.length === 0) return;

  const normalized = keywords.map(k => k.toLowerCase());
  await redisCommand('SADD', REDIS_KEY, ...normalized);
}

// 새 키워드만 필터링 (이미 보낸 것 제외)
export function filterNewKeywords(keywords: string[], sentSet: Set<string>): string[] {
  return keywords.filter(k => !sentSet.has(k.toLowerCase()));
}

// 이력 초기화 (필요 시 수동 호출)
export async function clearHistory(): Promise<void> {
  await redisCommand('DEL', REDIS_KEY);
}

// 저장된 키워드 수 확인
export async function getSentCount(): Promise<number> {
  const result = await redisCommand('SCARD', REDIS_KEY);
  return typeof result === 'number' ? result : 0;
}
