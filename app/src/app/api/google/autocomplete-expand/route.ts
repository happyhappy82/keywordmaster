import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAutocomplete } from '@/lib/api/google';

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
    const { keyword, expandKeyword } = body;

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword string is required' },
        { status: 400 }
      );
    }

    const allResults: { keyword: string; volume: number; source: string }[] = [];
    const seenKeywords = new Set<string>();

    const addResults = (results: { keyword: string; volume: number }[], source: string) => {
      for (const item of results) {
        const normalizedKeyword = item.keyword.toLowerCase();
        if (!seenKeywords.has(normalizedKeyword)) {
          seenKeywords.add(normalizedKeyword);
          allResults.push({ keyword: item.keyword, volume: 0, source });
        }
      }
    };

    // ========================================
    // 모드 1: 개별 키워드 심층 확장 (196음절)
    // ========================================
    if (expandKeyword && typeof expandKeyword === 'string') {
      console.log(`[GOOGLE EXPAND] Single keyword expand: "${expandKeyword}"`);

      const batchSize = 10;
      for (let i = 0; i < KOREAN_SYLLABLES.length; i += batchSize) {
        const batch = KOREAN_SYLLABLES.slice(i, i + batchSize);

        const batchPromises = batch.map(async (syllable) => {
          try {
            const results = await getGoogleAutocomplete(`${expandKeyword} ${syllable}`);
            return { syllable, results };
          } catch {
            return { syllable, results: [] };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        for (const { syllable, results } of batchResults) {
          addResults(results, syllable);
        }

        await delay(100);
      }

      console.log(`[GOOGLE EXPAND] "${expandKeyword}" → ${allResults.length} keywords`);

      return NextResponse.json({
        success: true,
        data: allResults,
        count: allResults.length,
        expandedFrom: expandKeyword,
      });
    }

    // ========================================
    // 모드 2: 기본 196음절 확장
    // ========================================
    console.log('[GOOGLE EXPAND] Simple expand for:', keyword);

    const batchSize = 10;
    for (let i = 0; i < KOREAN_SYLLABLES.length; i += batchSize) {
      const batch = KOREAN_SYLLABLES.slice(i, i + batchSize);

      const batchPromises = batch.map(async (syllable) => {
        try {
          const results = await getGoogleAutocomplete(`${keyword} ${syllable}`);
          return { syllable, results };
        } catch {
          return { syllable, results: [] };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const { syllable, results } of batchResults) {
        addResults(results, syllable);
      }

      console.log(`[GOOGLE EXPAND] Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(KOREAN_SYLLABLES.length / batchSize)}`);
      await delay(100);
    }

    console.log('[GOOGLE EXPAND] Total:', allResults.length);

    return NextResponse.json({
      success: true,
      data: allResults,
      count: allResults.length,
    });
  } catch (error) {
    console.error('Google expanded autocomplete API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
