import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { exercise, duration, weight } = await request.json();
    if (!exercise || !duration) return Response.json({ error: "운동 정보를 입력해주세요." }, { status: 400 });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
당신은 운동 영양사 AI입니다.
체중 ${weight}kg인 사람이 "${exercise}"를 ${duration}분 했을 때 소모되는 칼로리를 MET 공식으로 정확하게 계산하세요.

반드시 아래 JSON만 응답하세요 (설명, 마크다운 없이):
{
  "name": "${exercise}",
  "duration": ${duration},
  "calories": 소모칼로리_정수,
  "intensity": "낮음 또는 보통 또는 높음",
  "met": MET값_소수점1자리
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("파싱 실패");

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    console.error(e);
    return Response.json({ error: "운동 칼로리 계산에 실패했습니다." }, { status: 500 });
  }
}
