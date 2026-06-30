import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { foods, exercises, profile, goalCal, macros } = await request.json();

    if (!foods || foods.length === 0) {
      return Response.json({ error: "오늘 먹은 음식을 먼저 기록해주세요." }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const totalCal     = foods.reduce((s, f) => s + (f.calories || 0), 0);
    const totalProtein = foods.reduce((s, f) => s + (f.protein  || 0), 0);
    const totalCarbs   = foods.reduce((s, f) => s + (f.carbs    || 0), 0);
    const totalFat     = foods.reduce((s, f) => s + (f.fat      || 0), 0);
    const totalBurned  = exercises.reduce((s, e) => s + (e.calories || 0), 0);

    const foodList = foods.map(f =>
      `${f.mealTime} - ${f.name} ${f.amount}: ${f.calories}kcal (단백질${f.protein}g 탄수${f.carbs}g 지방${f.fat}g)`
    ).join("\n");

    const exerciseList = exercises.length > 0
      ? exercises.map(e => `${e.name} ${e.duration}분: ${e.calories}kcal 소모`).join("\n")
      : "운동 없음";

    const prompt = `
당신은 전문 영양사 AI입니다. 아래 오늘의 식단과 운동 기록을 분석해주세요.

[사용자 정보]
- 성별: ${profile.gender === "female" ? "여성" : "남성"}, 나이: ${profile.age}세
- 키: ${profile.height}cm, 체중: ${profile.weight}kg, 목표 체중: ${profile.goalWeight}kg
- 목표 칼로리: ${goalCal}kcal/일
- 권장 단백질: ${macros.protein}g, 탄수화물: ${macros.carbs}g, 지방: ${macros.fat}g

[오늘 식단]
${foodList}

[오늘 운동]
${exerciseList}

[오늘 합계]
- 총 섭취: ${totalCal}kcal (단백질${totalProtein}g 탄수${totalCarbs}g 지방${totalFat}g)
- 운동 소모: ${totalBurned}kcal
- 순 섭취: ${totalCal - totalBurned}kcal (목표 대비 ${totalCal - totalBurned - goalCal > 0 ? "+" : ""}${totalCal - totalBurned - goalCal}kcal)

위 정보를 바탕으로 전문 영양사로서 상세 분석을 해주세요.
반드시 아래 JSON만 응답하세요 (마크다운, 설명 없이):

{
  "score": 건강점수_0에서100_정수,
  "scoreComment": "점수 한줄 총평 (예: 영양 균형이 잘 잡힌 하루입니다)",
  "calorieStatus": "칼로리 상태 한줄 평가 (목표 대비 어떤지)",
  "positives": [
    "잘한 점 1 (구체적으로, 한 문장)",
    "잘한 점 2 (구체적으로, 한 문장)",
    "잘한 점 3 (구체적으로, 한 문장)"
  ],
  "warnings": [
    "주의할 점 1 (구체적으로, 한 문장)",
    "주의할 점 2 (구체적으로, 한 문장)"
  ],
  "nutrients": {
    "protein": { "status": "부족 또는 적정 또는 과다", "comment": "단백질 평가 한 문장" },
    "carbs":   { "status": "부족 또는 적정 또는 과다", "comment": "탄수화물 평가 한 문장" },
    "fat":     { "status": "부족 또는 적정 또는 과다", "comment": "지방 평가 한 문장" },
    "fiber":   { "status": "부족 또는 적정 또는 과다", "comment": "식이섬유 평가 한 문장" },
    "sodium":  { "status": "부족 또는 적정 또는 과다", "comment": "나트륨 평가 한 문장" }
  },
  "improvements": [
    "개선 제안 1 (매우 구체적으로, 실천 가능한 제안)",
    "개선 제안 2 (매우 구체적으로, 실천 가능한 제안)",
    "개선 제안 3 (매우 구체적으로, 실천 가능한 제안)"
  ],
  "recommendations": [
    { "food": "추천 음식 이름", "reason": "이 음식을 추천하는 구체적인 이유 (어떤 영양소가 보충됨)" },
    { "food": "추천 음식 이름", "reason": "이 음식을 추천하는 구체적인 이유" },
    { "food": "추천 음식 이름", "reason": "이 음식을 추천하는 구체적인 이유" },
    { "food": "추천 음식 이름", "reason": "이 음식을 추천하는 구체적인 이유" }
  ],
  "tomorrowTip": "내일 식단을 위한 핵심 팁 (1-2문장, 가장 중요한 것 하나)"
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("파싱 실패");

    return Response.json(JSON.parse(match[0]));
  } catch (e) {
    console.error(e);
    return Response.json({ error: "분석에 실패했습니다. 다시 시도해주세요." }, { status: 500 });
  }
}
