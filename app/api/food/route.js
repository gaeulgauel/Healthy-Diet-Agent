import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { food, amount } = await request.json();
    if (!food) return Response.json({ error: "음식 이름을 입력해주세요." }, { status: 400 });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
당신은 영양사 AI입니다.
음식 "${food}" ${amount || "1인분"}의 정확한 영양 정보를 계산해주세요.
한국 음식 데이터베이스 기준으로 계산하세요.

반드시 아래 JSON만 응답하세요 (설명, 마크다운 없이):
{
  "name": "${food}",
  "amount": "${amount || "1인분"}",
  "calories": 칼로리_정수,
  "protein": 단백질_g_정수,
  "carbs": 탄수화물_g_정수,
  "fat": 지방_g_정수
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("파싱 실패");

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    console.error(e);
    return Response.json({ error: "칼로리 계산에 실패했습니다." }, { status: 500 });
  }
}
