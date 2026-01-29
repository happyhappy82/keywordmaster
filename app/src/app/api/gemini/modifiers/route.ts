import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const { keyword } = await request.json();

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    const prompt = `당신은 한국어 검색 키워드 전문가입니다.
사용자가 "${keyword}"를 검색할 때, 앞에 붙여서 함께 검색할 가능성이 높은 수식어(modifier)를 최대한 많이 생성해주세요.

예시:
- "노트북" → 가성비, 추천, 순위, 가벼운, 게이밍, 사무용, 학생용, 2024, 최신, 인기, 베스트, 싼, 저렴한, 고성능, 슬림, 터치, 중고, 리퍼, AS좋은, 브랜드...
- "피자" → 맛집, 배달, 추천, 냉동, 수제, 1인, 가성비, 유명한, 인기, 근처, 오픈, 신메뉴, 할인, 쿠폰, 프랜차이즈, 수요미식회...

규칙:
1. 실제 사람들이 검색할 법한 자연스러운 수식어만 생성
2. "${keyword}" 카테고리/분야에 맞는 맥락적 수식어 포함
3. 일반적인 수식어(추천, 순위, 가성비, 인기, 베스트, 후기, 비교, 가격 등)도 포함
4. 시간 관련 (2024, 2025, 최신, 신제품 등)
5. 가격 관련 (저렴한, 싼, 할인, 세일, 무료 등)
6. 품질 관련 (좋은, 최고의, 인기, 유명한 등)
7. 장소/구매처 관련 (온라인, 오프라인, 근처, 매장 등)
8. **최소 50개 이상의 수식어를 생성**
9. JSON 배열 형식으로만 응답 (다른 텍스트 없이)

응답 형식:
["수식어1", "수식어2", "수식어3", ...]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate modifiers' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return NextResponse.json(
        { error: 'No response from Gemini' },
        { status: 500 }
      );
    }

    // JSON 배열 파싱
    let modifiers: string[] = [];
    try {
      // 마크다운 코드 블록 제거
      const cleanedText = textContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      modifiers = JSON.parse(cleanedText);
    } catch {
      // JSON 파싱 실패 시 줄 단위로 파싱 시도
      modifiers = textContent
        .split('\n')
        .map((line: string) => line.replace(/^[-*\d.]\s*/, '').trim())
        .filter((line: string) => line.length > 0 && line.length < 20);
    }

    return NextResponse.json({
      success: true,
      keyword,
      modifiers: modifiers,
    });
  } catch (error) {
    console.error('Modifier generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
