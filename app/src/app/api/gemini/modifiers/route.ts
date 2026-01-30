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

"${keyword}" 앞에 붙일 수 있는 **수식어(prefix modifier)만** 생성해주세요.

## 규칙
1. 수식어만 출력하세요. "${keyword}"를 포함하지 마세요!
2. 한국 사용자가 실제로 검색할 법한 자연스러운 표현만 생성하세요.
3. 해당 키워드와 무관한 수식어는 절대 포함하지 마세요.

## 예시
키워드: "노트북 추천" → ["가성비", "게이밍", "사무용", "삼성", "LG", "대학생", "2025"]
키워드: "피자" → ["배달", "냉동", "도미노", "1인", "맛있는", "강남", "파티"]

## 반드시 아래 10가지 차원을 모두 고려하여 생성하세요

1. **브랜드/업체명**: 해당 분야의 대표 브랜드, 프랜차이즈, 제조사명
2. **용도/목적**: 이 제품/서비스를 사용하는 구체적 목적이나 활동
3. **대상/타겟**: 연령대, 성별, 직업, 생애주기 등 사용자 유형
4. **가격/등급**: 가성비, 저렴한, 프리미엄, 무료, 가격대 표현
5. **특성/스펙**: 해당 분야 고유의 물리적/기능적 특징, 규격, 사양
6. **지역/위치**: 지역명, "근처", "동네" 등 위치 관련 (해당되는 경우만)
7. **시간/시즌**: 연도, 계절, 시기 관련 표현
8. **상황/맥락**: 구매/이용 상황, 계기, 이벤트 (선물, 이사, 입학 등)
9. **관련 콘텐츠**: 해당 키워드와 함께 검색되는 게임명, 앱명, 자격증명, 관련 제품 등
10. **평가/수식**: 인기, 베스트, 추천, 유명한, 좋은 등 평가성 표현

## 주의사항
- 해당 키워드 분야에 맞지 않는 차원은 건너뛰어도 됩니다
- 각 차원에서 최소 3~8개씩, **총 60개 이상** 생성하세요
- 1~3글자 짧은 수식어를 우선하세요 (검색 자동완성에 효과적)

JSON 배열만 응답하세요: ["수식어1", "수식어2", ...]`;

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
