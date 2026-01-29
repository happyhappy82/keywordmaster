import { NextRequest, NextResponse } from 'next/server';
import { getNaverAutocomplete } from '@/lib/api/naver';

// 한글 자음 (14개)
const CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 한글 모음 (14개)
const VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ', 'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ'];

// 초성, 중성 테이블
const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];

// 한글 음절 생성 함수
function buildSyllable(cho: number, jung: number, jong: number = 0): string {
  return String.fromCharCode(0xAC00 + (cho * 21 * 28) + (jung * 28) + jong);
}

// 한글 음절 분해 함수
function decomposeSyllable(char: string): { cho: number; jung: number; jong: number } | null {
  const code = char.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) return null;

  const offset = code - 0xAC00;
  const jong = offset % 28;
  const jung = ((offset - jong) / 28) % 21;
  const cho = Math.floor(offset / (21 * 28));

  return { cho, jung, jong };
}

// 점진적 타이핑 시퀀스 생성
// "추천" → ["ㅊ", "추", "춫", "추처", "추천"]
function generateTypingSequence(text: string): string[] {
  const sequence: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const decomposed = decomposeSyllable(char);

    if (!decomposed) {
      current += char;
      sequence.push(current);
      continue;
    }

    const { cho, jung, jong } = decomposed;

    // 1. 초성만
    sequence.push(current + CHO[cho]);

    // 2. 초성 + 중성 (완성된 글자)
    const syllableNoJong = buildSyllable(cho, jung, 0);
    sequence.push(current + syllableNoJong);

    // 3. 종성이 있는 경우
    if (jong > 0) {
      const syllableWithJong = buildSyllable(cho, jung, jong);
      sequence.push(current + syllableWithJong);
    }

    current += char;
  }

  return sequence;
}

// 자음 + 모음 조합으로 음절 생성 (196개)
function generateSyllables(): string[] {
  const syllables: string[] = [];

  for (const consonant of CONSONANTS) {
    for (const vowel of VOWELS) {
      const choIndex = CHO.indexOf(consonant);
      const jungIndex = JUNG.indexOf(vowel);

      if (choIndex !== -1 && jungIndex !== -1) {
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
    const { keyword, targetSuffix, batchIndex = 0, phase1Keywords: existingPhase1Keywords } = body;
    const BATCH_SIZE = 5; // 한 번에 처리할 키워드 수

    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json(
        { error: 'Keyword string is required' },
        { status: 400 }
      );
    }

    const allResults: { keyword: string; volume: number; source: string; phase: string }[] = [];
    const seenKeywords = new Set<string>();

    // 결과 추가 헬퍼 함수 (추가된 키워드 반환)
    const addResults = (results: { keyword: string; volume: number }[], source: string, phase: string): string[] => {
      const added: string[] = [];
      for (const item of results) {
        const normalizedKeyword = item.keyword.toLowerCase();
        if (!seenKeywords.has(normalizedKeyword)) {
          seenKeywords.add(normalizedKeyword);
          allResults.push({
            keyword: item.keyword,
            volume: 0,
            source,
            phase,
          });
          added.push(item.keyword);
        }
      }
      return added;
    };

    // targetSuffix가 있으면 점진적 타이핑 모드 (배치 지원)
    if (targetSuffix && typeof targetSuffix === 'string') {
      console.log('[NAVER EXPAND] Progressive typing mode - Batch:', batchIndex);
      console.log('[NAVER EXPAND] Base keyword:', keyword);
      console.log('[NAVER EXPAND] Target suffix:', targetSuffix);

      let phase1Keywords: string[] = [];

      // ========================================
      // Phase 1: 첫 번째 배치(0)에서만 점진적 타이핑 실행
      // ========================================
      if (batchIndex === 0) {
        const typingSequence = generateTypingSequence(targetSuffix);
        console.log('[NAVER EXPAND] Typing sequence:', typingSequence);

        for (let i = 0; i < typingSequence.length; i++) {
          const partial = typingSequence[i];
          const searchKeyword = `${keyword} ${partial}`;

          try {
            const results = await getNaverAutocomplete(searchKeyword);
            const added = addResults(results, partial, 'phase1-typing');
            phase1Keywords.push(...added);
            console.log(`[NAVER EXPAND] Phase 1 (${i + 1}/${typingSequence.length}): "${searchKeyword}" → ${results.length} results, ${added.length} new`);
          } catch (error) {
            console.error(`[NAVER EXPAND] Error for "${searchKeyword}":`, error);
          }

          await delay(50);
        }

        console.log('[NAVER EXPAND] Phase 1 complete. Found', phase1Keywords.length, 'unique keywords');
      } else {
        // 이후 배치에서는 전달받은 Phase 1 키워드 사용
        phase1Keywords = existingPhase1Keywords || [];
        console.log('[NAVER EXPAND] Using existing Phase 1 keywords:', phase1Keywords.length);
      }

      // ========================================
      // Phase 2: 배치별로 키워드 확장 (196개 음절 전체 사용)
      // ========================================
      const baseKeywordLower = `${keyword} ${targetSuffix}`.toLowerCase();
      const allKeywordsToExpand = phase1Keywords.filter(k =>
        k.toLowerCase() !== baseKeywordLower &&
        k.toLowerCase() !== keyword.toLowerCase()
      );

      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min(startIdx + BATCH_SIZE, allKeywordsToExpand.length);
      const keywordsToExpand = allKeywordsToExpand.slice(startIdx, endIdx);
      const hasMore = endIdx < allKeywordsToExpand.length;

      console.log(`[NAVER EXPAND] Phase 2 Batch ${batchIndex}: keywords ${startIdx + 1}-${endIdx} of ${allKeywordsToExpand.length}`);

      for (let kIdx = 0; kIdx < keywordsToExpand.length; kIdx++) {
        const expandKeyword = keywordsToExpand[kIdx];
        console.log(`[NAVER EXPAND] Phase 2 (${kIdx + 1}/${keywordsToExpand.length}): Expanding "${expandKeyword}"`);

        let expandCount = 0;

        // 각 키워드에 대해 196개 음절 뒤에 붙이기
        for (let i = 0; i < KOREAN_SYLLABLES.length; i++) {
          const syllable = KOREAN_SYLLABLES[i];
          const expandedKeyword = `${expandKeyword} ${syllable}`;

          try {
            const results = await getNaverAutocomplete(expandedKeyword);
            const added = addResults(results, `${expandKeyword}+${syllable}`, 'phase2-reexpand');
            expandCount += added.length;
          } catch (error) {
            // 에러 무시하고 계속
          }

          await delay(30);
        }

        console.log(`[NAVER EXPAND] "${expandKeyword}" → ${expandCount} new keywords`);
      }

      // 배치 정보와 함께 반환
      console.log('[NAVER EXPAND] Batch complete. Total:', allResults.length, 'Has more:', hasMore);

      return NextResponse.json({
        success: true,
        data: allResults,
        count: allResults.length,
        batchInfo: {
          currentBatch: batchIndex,
          hasMore,
          totalKeywords: allKeywordsToExpand.length,
          processedKeywords: endIdx,
          phase1Keywords: allKeywordsToExpand, // 다음 배치에서 사용할 키워드 목록
        },
      });

    } else {
      // ========================================
      // 단순 모드: 196개 음절 뒤에만 붙이기
      // ========================================
      console.log('[NAVER EXPAND] Simple expand mode for:', keyword);
      console.log('[NAVER EXPAND] Total syllables:', KOREAN_SYLLABLES.length);

      for (let i = 0; i < KOREAN_SYLLABLES.length; i++) {
        const syllable = KOREAN_SYLLABLES[i];
        const expandedKeyword = `${keyword} ${syllable}`;

        try {
          const results = await getNaverAutocomplete(expandedKeyword);
          addResults(results, syllable, 'simple-suffix');
        } catch (error) {
          console.error(`[NAVER EXPAND] Error for ${syllable}:`, error);
        }

        if ((i + 1) % 20 === 0) {
          console.log(`[NAVER EXPAND] Progress: ${i + 1}/${KOREAN_SYLLABLES.length}`);
        }

        await delay(50);
      }
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
