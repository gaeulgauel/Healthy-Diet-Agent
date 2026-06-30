import { GoogleGenAI } from "@google/genai";

export async function POST(request) {
  try {
    const { foods } = await request.json();

    if (!foods || foods.length === 0) {
      return Response.json({ error: "음식을 입력해주세요." }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `당신은 영양사 AI입니다. 사용자가 오늘 먹은 음식 목록을 분석하여 JSON 형식으로 응답해주세요.

오늘 먹은 음식: ${foods.join(", ")}

다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "nutrition": {
    "calories": "예상 총 칼로리 (숫자만, kcal)",
    "protein": "단백질 (숫자만, g)",
    "carbs": "탄수화물 (숫자만, g)",
    "fat": "지방 (숫자만, g)",
    "score": "건강 점수 1-100 (숫자만)"
  },
  "positives": [
    "좋은 점 1 (한 문장)",
    "좋은 점 2 (한 문장)"
  ],
  "improvements": [
    "개선할 점 1 (한 문장)",
    "개선할 점 2 (한 문장)"
  ],
  "recommendations": [
    { "food": "추천 음식 이름", "reason": "추천 이유 (한 문장)" },
    { "food": "추천 음식 이름", "reason": "추천 이유 (한 문장)" },
    { "food": "추천 음식 이름", "reason": "추천 이유 (한 문장)" }
  ],
  "summary": "오늘 식단에 대한 전체 총평 (2-3문장)"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid response format");

    const data = JSON.parse(jsonMatch[0]);
    return Response.json(data);
  } catch (error) {
    console.error("Analysis error:", error);
    return Response.json(
      { error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
