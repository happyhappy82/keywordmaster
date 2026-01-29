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

중요: 수식어만 출력하세요. "${keyword}"를 포함하지 마세요!

예시 (키워드: "노트북 추천"):
✅ 올바른 응답: ["가성비", "게이밍", "사무용", "학생용", "2024", "저렴한"]
❌ 잘못된 응답: ["가성비 노트북 추천", "게이밍 노트북 추천"]

예시 (키워드: "피자"):
✅ 올바른 응답: ["맛집", "배달", "냉동", "1인", "근처"]

수식어 종류:
- 용도: 게이밍, 사무용, 학생용, 업무용, 개발용
- 가격: 가성비, 저렴한, 싼, 프리미엄, 고급
- 시간: 2024, 2025, 최신, 신상
- 평가: 인기, 베스트, 최고의, 유명한
- 특징: 가벼운, 슬림, 휴대용, 고성능

**최소 50개 이상** 생성하세요.
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
