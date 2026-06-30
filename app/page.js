"use client";
import { useState, useEffect } from "react";

// ─── 상수 ──────────────────────────────────────────────────────────────────

const ACTIVITY_LEVELS = [
  { value: 1.2,   label: "비활동적",    desc: "앉아서 생활 위주" },
  { value: 1.375, label: "가벼운 활동", desc: "주 1–3회 운동" },
  { value: 1.55,  label: "보통 활동",   desc: "주 3–5회 운동" },
  { value: 1.725, label: "활동적",      desc: "주 6–7회 운동" },
  { value: 1.9,   label: "매우 활동적", desc: "하루 2회 이상" },
];

const FOOD_QUICK = [
  "공기밥", "김치찌개", "된장찌개", "삼겹살 200g", "닭가슴살 100g",
  "샐러드", "바나나 1개", "아메리카노", "라면 1봉", "고구마 1개",
  "계란 2개", "두부 반모", "요거트 1개", "견과류 한줌",
];
const EXERCISE_QUICK = [
  "걷기", "달리기", "자전거", "수영", "헬스 (근력)", "요가",
  "줄넘기", "등산", "HIIT", "배드민턴", "필라테스", "스쿼시",
];
const MEAL_TIMES = ["아침", "점심", "저녁", "간식"];

// ─── 유틸 ──────────────────────────────────────────────────────────────────

function getLocalDateStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
}

function formatDateShort(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

// ─── 계산 함수 ─────────────────────────────────────────────────────────────

function calcBMR(gender, weight, height, age) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return Math.round(gender === "male" ? base + 5 : base - 161);
}

function calcBMI(weight, height) {
  return +(weight / ((height / 100) ** 2)).toFixed(1);
}

function bmiInfo(bmi) {
  if (bmi < 18.5) return { label: "저체중", bg: "bg-sky-50 text-sky-700",     color: "text-sky-500" };
  if (bmi < 23)   return { label: "정상",   bg: "bg-emerald-50 text-emerald-700", color: "text-emerald-600" };
  if (bmi < 25)   return { label: "과체중", bg: "bg-amber-50 text-amber-700",  color: "text-amber-500" };
  return              { label: "비만",   bg: "bg-red-50 text-red-700",      color: "text-red-500" };
}

function calcGoalCal(tdee, current, goal) {
  const diff = goal - current;
  if (diff <= -7) return Math.max(tdee - 750, 1200);
  if (diff < -2)  return Math.max(tdee - 500, 1200);
  if (diff < 0)   return tdee - 300;
  if (diff > 7)   return tdee + 600;
  if (diff > 2)   return tdee + 400;
  if (diff > 0)   return tdee + 200;
  return tdee;
}

function goalLabel(current, goal) {
  const d = goal - current;
  if (d < -1) return `${Math.abs(d).toFixed(1)}kg 감량`;
  if (d > 1)  return `${d.toFixed(1)}kg 증량`;
  return "체중 유지";
}

function weeksToGoal(current, goal) {
  const diff = Math.abs(current - goal);
  if (diff < 0.5) return null;
  return Math.ceil(diff / 0.5);
}

// ─── CalorieRing ───────────────────────────────────────────────────────────

function CalorieRing({ consumed, burned, goal }) {
  const net = consumed - burned;
  const pct = goal > 0 ? Math.min(Math.max(net / goal, 0), 1) : 0;
  const isOver = net > goal;
  const r = 48, circ = +(2 * Math.PI * r).toFixed(2);
  const dash = +(circ * pct).toFixed(2);
  const ringColor = isOver ? "#ef4444" : pct > 0.88 ? "#f59e0b" : "#10b981";
  const remaining = goal - net;
  return (
    <div className="flex items-center gap-5 px-1">
      <div className="relative flex-shrink-0">
        <svg width="112" height="112" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r={r} fill="none" stroke="#f3f4f6" strokeWidth="9" />
          <circle cx="56" cy="56" r={r} fill="none"
            stroke={ringColor} strokeWidth="9"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeLinecap="round"
            transform="rotate(-90 56 56)"
            style={{ transition: "stroke-dasharray .7s cubic-bezier(.4,0,.2,1), stroke .3s" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[17px] font-bold text-gray-900 leading-tight">{Math.abs(remaining).toLocaleString()}</span>
          <span className="text-[10px] text-gray-400 leading-tight">{isOver ? "kcal 초과" : "kcal 남음"}</span>
        </div>
      </div>
      <div className="space-y-2 text-[12.5px] min-w-0">
        {[
          { dot: "#e5e7eb", label: "목표",    val: `${goal.toLocaleString()} kcal` },
          { dot: "#fb923c", label: "섭취",    val: `${consumed.toLocaleString()} kcal` },
          { dot: "#60a5fa", label: "운동소모", val: `-${burned.toLocaleString()} kcal` },
          { dot: ringColor, label: "순 섭취", val: `${net.toLocaleString()} kcal`, bold: true },
        ].map(({ dot, label, val, bold }) => (
          <div key={label} className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
            <span className="text-gray-400 w-[52px] flex-shrink-0">{label}</span>
            <span className={`${bold ? "font-semibold text-gray-800" : "text-gray-600"} truncate`}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MacroBar ──────────────────────────────────────────────────────────────

function MacroBar({ label, current, goal, bar, dim }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const over = current > goal;
  return (
    <div>
      <div className="flex justify-between mb-1 text-[11px]">
        <span className={dim}>{label}</span>
        <span className={over ? "text-red-500 font-semibold" : "text-gray-500"}>{current}g / {goal}g</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-400" : bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── ProfileTab ────────────────────────────────────────────────────────────

function ProfileTab({ profile, setProfile, computed, onSave }) {
  const { bmr, tdee, goalCal, macros, bmi, bmiMeta, weeks } = computed;
  const p = profile;
  const set = (k, v) => setProfile(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4 fade-up">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
        <h2 className="font-semibold text-gray-900">내 신체 정보</h2>
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">성별</p>
          <div className="flex gap-2">
            {[["female", "여성"], ["male", "남성"]].map(([v, lbl]) => (
              <button key={v} onClick={() => set("gender", v)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${p.gender === v ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "border-gray-200 text-gray-500"}`}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">기본 정보</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "age",    label: "나이",  unit: "세",  step: 1,   min: 10,  max: 100 },
              { key: "height", label: "키",    unit: "cm",  step: 0.5, min: 100, max: 220 },
            ].map(({ key, label, unit, step, min, max }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-300">
                  <input type="number" value={p[key]} min={min} max={max} step={step}
                    onChange={e => set(key, parseFloat(e.target.value) || 0)}
                    className="flex-1 w-0 px-3 py-2.5 text-sm focus:outline-none" />
                  <span className="text-xs text-gray-400 pr-3 flex-shrink-0">{unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">체중</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ key: "weight", label: "현재 체중" }, { key: "goalWeight", label: "목표 체중" }].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-300">
                  <input type="number" value={p[key]} min={20} max={300} step={0.1}
                    onChange={e => set(key, parseFloat(e.target.value) || 0)}
                    className="flex-1 w-0 px-3 py-2.5 text-sm focus:outline-none" />
                  <span className="text-xs text-gray-400 pr-3 flex-shrink-0">kg</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
              목표: {goalLabel(p.weight, p.goalWeight)}
            </span>
            {weeks && <span className="text-xs text-gray-400">약 {weeks}주 소요 예상</span>}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">활동 수준</p>
          <div className="space-y-1.5">
            {ACTIVITY_LEVELS.map(({ value, label, desc }) => (
              <button key={value} onClick={() => set("activityLevel", value)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                  p.activityLevel === value
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-gray-50"
                }`}>
                <span className="font-medium">{label}</span>
                <span className="text-xs text-gray-400">{desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
        <h2 className="font-semibold text-gray-900">맞춤 칼로리 계산</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">체질량지수 (BMI)</p>
            <p className="text-3xl font-bold text-gray-900">{bmi}</p>
          </div>
          <div className="text-right">
            <span className={`text-base font-bold px-3 py-1 rounded-full ${bmiMeta.bg}`}>{bmiMeta.label}</span>
            <p className="text-xs text-gray-400 mt-1.5">정상 범위: 18.5–22.9</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "기초대사량", sub: "BMR",  val: bmr,     bg: "bg-gray-50",      txt: "text-gray-800" },
            { label: "활동대사량", sub: "TDEE", val: tdee,    bg: "bg-blue-50",      txt: "text-blue-800" },
            { label: "목표 칼로리", sub: "GOAL", val: goalCal, bg: "bg-emerald-50",   txt: "text-emerald-800" },
          ].map(({ label, val, bg, txt }) => (
            <div key={label} className={`rounded-xl p-3.5 ${bg}`}>
              <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
              <p className={`font-bold text-base leading-tight ${txt}`}>{val.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">kcal</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">권장 영양소</p>
          <div className="space-y-3">
            <MacroBar label={`단백질 — 목표 ${macros.protein}g/일`} current={0} goal={macros.protein} bar="bg-blue-400" dim="text-blue-500" />
            <MacroBar label={`탄수화물 — 목표 ${macros.carbs}g/일`} current={0} goal={macros.carbs} bar="bg-amber-400" dim="text-amber-500" />
            <MacroBar label={`지방 — 목표 ${macros.fat}g/일`} current={0} goal={macros.fat} bar="bg-purple-400" dim="text-purple-500" />
          </div>
        </div>
      </div>

      <button onClick={onSave}
        className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-2xl py-4 text-[15px] transition-all shadow-sm">
        저장하고 오늘 식단 기록하기 →
      </button>
    </div>
  );
}

// ─── FoodTab ───────────────────────────────────────────────────────────────

function FoodTab({ foods, setFoods, totalFood, totalEx, goalCal, macros, readOnly }) {
  const [input,    setInput]    = useState("");
  const [amount,   setAmount]   = useState("");
  const [meal,     setMeal]     = useState("점심");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState(null); // 계산 결과 미리보기

  const net = totalFood - totalEx;
  const remaining = goalCal - net;
  const pct = goalCal > 0 ? Math.min((net / goalCal) * 100, 100) : 0;
  const isOver = net > goalCal;
  const barColor = isOver ? "bg-red-500" : pct > 88 ? "bg-amber-500" : "bg-emerald-500";
  const totalP = foods.reduce((s, f) => s + (f.protein || 0), 0);
  const totalC = foods.reduce((s, f) => s + (f.carbs   || 0), 0);
  const totalF = foods.reduce((s, f) => s + (f.fat     || 0), 0);
  const grouped = MEAL_TIMES.reduce((acc, t) => { acc[t] = foods.filter(f => f.mealTime === t); return acc; }, {});

  // 1단계: AI 칼로리 계산 → 미리보기
  const calcFood = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(""); setPreview(null);
    try {
      const res = await fetch("/api/food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ food: input.trim(), amount: amount.trim() || "1인분" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // 2단계: 미리보기 확인 후 추가
  const confirmAdd = () => {
    if (!preview) return;
    setFoods(prev => [{ ...preview, id: Date.now(), mealTime: meal }, ...prev]);
    setPreview(null); setInput(""); setAmount("");
  };

  const cancelPreview = () => { setPreview(null); };

  return (
    <div className="space-y-4 fade-up">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-baseline">
          <span className="text-sm font-medium text-gray-700">칼로리</span>
          <span className={`text-sm font-semibold ${isOver ? "text-red-500" : "text-emerald-600"}`}>
            {isOver ? `${(net - goalCal).toLocaleString()} kcal 초과 ⚠` : `${remaining.toLocaleString()} kcal 남음`}
          </span>
        </div>
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400">
            <span>섭취 {totalFood.toLocaleString()} kcal</span>
            {totalEx > 0 && <span className="text-blue-400">운동 -{totalEx.toLocaleString()}</span>}
            <span>목표 {goalCal.toLocaleString()} kcal</span>
          </div>
        </div>
        <div className="border-t border-gray-50 pt-3 space-y-2.5">
          <MacroBar label={`단백질 (목표 ${macros.protein}g)`} current={totalP} goal={macros.protein} bar="bg-blue-400" dim="text-blue-500" />
          <MacroBar label={`탄수화물 (목표 ${macros.carbs}g)`} current={totalC} goal={macros.carbs} bar="bg-amber-400" dim="text-amber-500" />
          <MacroBar label={`지방 (목표 ${macros.fat}g)`} current={totalF} goal={macros.fat} bar="bg-purple-400" dim="text-purple-500" />
        </div>
      </div>

      {!readOnly && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3.5">
          <h2 className="font-semibold text-gray-900">음식 추가</h2>
          <div className="flex gap-2">
            {MEAL_TIMES.map(t => (
              <button key={t} onClick={() => setMeal(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${meal === t ? "bg-emerald-600 text-white border-emerald-600" : "border-gray-200 text-gray-500"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addFood()}
              placeholder="음식 이름 (예: 된장찌개)"
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent" />
            <input type="text" value={amount} onChange={e => setAmount(e.target.value)} placeholder="양 (예: 1그릇)"
              className="w-28 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FOOD_QUICK.map(f => (
              <button key={f} onClick={() => setInput(f)}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-700 transition-all">
                {f}
              </button>
            ))}
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">{error}</div>}

          {/* 계산 결과 미리보기 */}
          {preview && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-emerald-800">{preview.name} <span className="font-normal text-emerald-600">{preview.amount}</span></span>
                <span className="text-base font-bold text-orange-500">{preview.calories} kcal</span>
              </div>
              <div className="flex gap-3 text-xs">
                <span className="text-blue-600 font-medium">단백질 {preview.protein}g</span>
                <span className="text-amber-600 font-medium">탄수 {preview.carbs}g</span>
                <span className="text-purple-600 font-medium">지방 {preview.fat}g</span>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={confirmAdd}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all">
                  + 추가하기
                </button>
                <button onClick={cancelPreview}
                  className="px-4 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                  취소
                </button>
              </div>
            </div>
          )}

          {!preview && (
            <button onClick={calcFood} disabled={loading || !input.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm">
              {loading ? <><span className="spinner" /> AI 칼로리 계산 중...</> : "AI 칼로리 자동 계산 →"}
            </button>
          )}
        </div>
      )}

      {readOnly && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="text-amber-500 text-sm">📅</span>
          <p className="text-xs text-amber-700">과거 기록은 보기 전용입니다.</p>
        </div>
      )}

      {foods.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {MEAL_TIMES.filter(t => grouped[t].length > 0).map(t => {
            const mealCal = grouped[t].reduce((s, f) => s + f.calories, 0);
            return (
              <div key={t}>
                <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-y border-gray-100 first:border-t-0">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t}</span>
                  <span className="text-xs font-semibold text-orange-500">{mealCal.toLocaleString()} kcal</span>
                </div>
                {grouped[t].map(f => (
                  <div key={f.id} className="flex items-start justify-between px-5 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{f.name}</span>
                        <span className="text-xs text-gray-400">{f.amount}</span>
                      </div>
                      <div className="flex gap-3 mt-1">
                        <span className="text-[11px] text-blue-500 font-medium">단백질 {f.protein}g</span>
                        <span className="text-[11px] text-amber-500 font-medium">탄수 {f.carbs}g</span>
                        <span className="text-[11px] text-purple-500 font-medium">지방 {f.fat}g</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-bold text-orange-500">{f.calories.toLocaleString()} kcal</span>
                      {!readOnly && (
                        <button onClick={() => setFoods(prev => prev.filter(x => x.id !== f.id))}
                          className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors w-5 text-center">×</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          <div className="flex items-center justify-between px-5 py-3.5 bg-orange-50">
            <div className="text-xs text-orange-600 font-medium">
              총 섭취 <span className="mx-2 text-orange-300">|</span>
              <span className="text-blue-500">P {totalP}g</span><span className="mx-1 text-orange-200">/</span>
              <span className="text-amber-500">C {totalC}g</span><span className="mx-1 text-orange-200">/</span>
              <span className="text-purple-500">F {totalF}g</span>
            </div>
            <span className="text-base font-bold text-orange-600">{totalFood.toLocaleString()} kcal</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-300">
          <p className="text-5xl mb-3">🍽️</p>
          <p className="text-sm">{readOnly ? "이 날의 식단 기록이 없습니다." : "오늘 먹은 음식을 기록해보세요"}</p>
        </div>
      )}
    </div>
  );
}

// ─── ExerciseTab ───────────────────────────────────────────────────────────

function ExerciseTab({ exercises, setExercises, totalEx, weight, readOnly }) {
  const [input,    setInput]    = useState("");
  const [duration, setDuration] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [preview,  setPreview]  = useState(null);

  const calcExercise = async () => {
    if (!input.trim() || !duration) return;
    setLoading(true); setError(""); setPreview(null);
    try {
      const res = await fetch("/api/exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exercise: input.trim(), duration: Number(duration), weight }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreview(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const confirmAdd = () => {
    if (!preview) return;
    setExercises(prev => [{ ...preview, id: Date.now() }, ...prev]);
    setPreview(null); setInput(""); setDuration("");
  };

  const intensityColor = (i) => {
    if (i === "높음") return "bg-red-100 text-red-600";
    if (i === "보통") return "bg-amber-100 text-amber-600";
    return "bg-emerald-100 text-emerald-600";
  };

  return (
    <div className="space-y-4 fade-up">
      {totalEx > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-5 text-white shadow-sm">
          <p className="text-sm text-blue-200 mb-1">총 운동 소모 칼로리</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{totalEx.toLocaleString()}</span>
            <span className="text-xl text-blue-200">kcal</span>
          </div>
          <p className="text-xs text-blue-200 mt-1">체중 {weight}kg 기준 MET 공식 계산</p>
        </div>
      )}

      {!readOnly && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3.5">
          <h2 className="font-semibold text-gray-900">운동 기록</h2>
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && duration && addExercise()}
              placeholder="운동 종류 (예: 달리기)"
              className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent" />
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-300 w-28 flex-shrink-0">
              <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="시간" min={1} max={300}
                className="w-0 flex-1 px-3 py-2.5 text-sm focus:outline-none" />
              <span className="text-xs text-gray-400 pr-3 flex-shrink-0">분</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXERCISE_QUICK.map(ex => (
              <button key={ex} onClick={() => setInput(ex)}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all">
                {ex}
              </button>
            ))}
          </div>
          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">{error}</div>}

          {preview && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-800">{preview.name} <span className="font-normal text-blue-600">{preview.duration}분</span></span>
                <span className="text-base font-bold text-blue-600">-{preview.calories} kcal</span>
              </div>
              <div className="flex gap-3 text-xs text-blue-500">
                {preview.intensity && <span>강도: {preview.intensity}</span>}
                {preview.met && <span>MET {preview.met}</span>}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={confirmAdd}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all">
                  + 추가하기
                </button>
                <button onClick={() => setPreview(null)}
                  className="px-4 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-all">
                  취소
                </button>
              </div>
            </div>
          )}

          {!preview && (
            <button onClick={calcExercise} disabled={loading || !input.trim() || !duration}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm">
              {loading ? <><span className="spinner" /> 칼로리 계산 중...</> : "운동 칼로리 계산 →"}
            </button>
          )}
        </div>
      )}

      {readOnly && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-2">
          <span className="text-amber-500 text-sm">📅</span>
          <p className="text-xs text-amber-700">과거 기록은 보기 전용입니다.</p>
        </div>
      )}

      {exercises.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {exercises.map(e => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-lg flex-shrink-0">🏃</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{e.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{e.duration}분</span>
                    {e.intensity && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${intensityColor(e.intensity)}`}>{e.intensity}</span>}
                    {e.met && <span className="text-[11px] text-gray-400">MET {e.met}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">-{e.calories.toLocaleString()} kcal</span>
                  {!readOnly && (
                    <button onClick={() => setExercises(prev => prev.filter(x => x.id !== e.id))}
                      className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors w-5 text-center">×</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 bg-blue-50">
            <span className="text-xs text-blue-600 font-medium">총 소모 칼로리</span>
            <span className="text-base font-bold text-blue-700">-{totalEx.toLocaleString()} kcal</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-300">
          <p className="text-5xl mb-3">💪</p>
          <p className="text-sm">{readOnly ? "이 날의 운동 기록이 없습니다." : "오늘 운동을 기록해보세요"}</p>
        </div>
      )}
    </div>
  );
}

// ─── AnalysisTab ───────────────────────────────────────────────────────────

function AnalysisTab({ foods, exercises, profile, goalCal, macros, viewDate }) {
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // 날짜 바뀌면 결과 초기화
  useEffect(() => { setResult(null); setError(""); }, [viewDate]);

  const analyze = async () => {
    if (foods.length === 0) { setError("식단 기록이 없어 분석할 수 없습니다."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/analyze-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foods, exercises, profile, goalCal, macros }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) { setError(e.message || "분석 실패"); }
    finally { setLoading(false); }
  };

  const sc = (s) => {
    if (s >= 80) return { ring: "#10b981", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    if (s >= 60) return { ring: "#f59e0b", text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200" };
    return              { ring: "#ef4444", text: "text-red-500",     bg: "bg-red-50",     border: "border-red-200" };
  };
  const nb = (s) => s === "부족" ? "bg-sky-100 text-sky-700" : s === "과다" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700";
  const ni = (s) => s === "부족" ? "↓" : s === "과다" ? "↑" : "✓";
  const NL = { protein: "단백질", carbs: "탄수화물", fat: "지방", fiber: "식이섬유", sodium: "나트륨" };

  return (
    <div className="space-y-4 fade-up">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-1">AI 영양 분석</h2>
        <p className="text-xs text-gray-400 mb-4">
          {formatDateLabel(viewDate)} 식단 전체를 AI 영양사가 분석합니다.
        </p>
        {foods.length === 0 ? (
          <div className="text-center py-8 text-gray-300">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-sm">이 날의 식단 기록이 없습니다</p>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-xs text-gray-500 space-y-0.5">
              <p>🍽️ 기록된 음식 <span className="font-semibold text-gray-700">{foods.length}개</span></p>
              <p>💪 운동 기록 <span className="font-semibold text-gray-700">{exercises.length}개</span></p>
            </div>
            {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3">{error}</div>}
            <button onClick={analyze} disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.98] disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl py-3.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm">
              {loading ? <><span className="spinner" /> 영양사 AI 분석 중...</> : "🔬 식단 전체 분석하기 →"}
            </button>
          </>
        )}
      </div>

      {result && (() => {
        const c = sc(result.score);
        const r2 = 44, circ2 = +(2 * Math.PI * r2).toFixed(2);
        const dash2 = +(circ2 * result.score / 100).toFixed(2);
        const scoreMsg = result.score >= 80 ? "훌륭해요! 🎉" : result.score >= 60 ? "양호해요 👍" : "개선이 필요해요 💪";
        return (
          <>
            <div className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm`}>
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r={r2} fill="none" stroke="#f3f4f6" strokeWidth="8" />
                    <circle cx="50" cy="50" r={r2} fill="none" stroke={c.ring} strokeWidth="8"
                      strokeDasharray={`${dash2} ${circ2 - dash2}`} strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-bold ${c.text}`}>{result.score}</span>
                    <span className="text-[9px] text-gray-400">/ 100</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-gray-400 mb-1">건강 점수</p>
                  <p className={`text-lg font-bold ${c.text} leading-tight mb-1`}>{scoreMsg}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.scoreComment}</p>
                </div>
              </div>
              <div className={`mt-4 px-4 py-3 rounded-xl ${c.bg} text-sm ${c.text}`}>{result.calorieStatus}</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">영양소별 평가</h3>
              <div className="space-y-3">
                {Object.entries(result.nutrients || {}).map(([key, { status, comment }]) => (
                  <div key={key} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${nb(status)}`}>{ni(status)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-gray-800">{NL[key] || key}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${nb(status)}`}>{status}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>👍</span> 잘한 점</h3>
              <ul className="space-y-2.5">
                {(result.positives || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0 font-bold">✓</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.warnings?.length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2"><span>⚠️</span> 주의할 점</h3>
                <ul className="space-y-2.5">
                  {result.warnings.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-amber-700">
                      <span className="mt-0.5 flex-shrink-0 font-bold">!</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>💡</span> 식단 개선 제안</h3>
              <ol className="space-y-3">
                {(result.improvements || []).map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><span>🥦</span> 추천 음식</h3>
              <div className="space-y-2.5">
                {(result.recommendations || []).map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{item.food}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {result.tomorrowTip && (
              <div className="bg-violet-600 rounded-2xl p-5 text-white shadow-sm">
                <p className="text-xs text-violet-300 mb-1.5 font-medium">💬 핵심 팁</p>
                <p className="text-sm leading-relaxed font-medium">{result.tomorrowTip}</p>
              </div>
            )}

            <button onClick={() => setResult(null)}
              className="w-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-300 rounded-2xl py-3 text-sm transition-all">
              다시 분석하기
            </button>
          </>
        );
      })()}
    </div>
  );
}

// ─── HistoryTab ────────────────────────────────────────────────────────────

function HistoryTab({ history, goalCal, viewDate, setViewDate, todayISO }) {
  const days = Object.keys(history)
    .filter(d => (history[d]?.foods || []).length > 0)
    .sort((a, b) => b.localeCompare(a));

  if (days.length === 0) {
    return (
      <div className="fade-up text-center py-20 text-gray-300">
        <p className="text-5xl mb-3">📅</p>
        <p className="text-sm">아직 기록된 날이 없습니다.</p>
        <p className="text-xs mt-1">식단을 기록하면 여기에 리포트가 쌓입니다.</p>
      </div>
    );
  }

  const ringColor = (net, goal) => {
    const pct = goal > 0 ? net / goal : 0;
    if (net > goal) return "#ef4444";
    if (pct > 0.88) return "#f59e0b";
    return "#10b981";
  };

  return (
    <div className="fade-up space-y-3">
      <p className="text-xs text-gray-400 px-1">총 {days.length}일 기록 · 탭하면 해당 날짜로 이동합니다</p>
      {days.map(d => {
        const { foods = [], exercises = [] } = history[d] || {};
        const totalCal = foods.reduce((s, f) => s + f.calories, 0);
        const totalEx  = exercises.reduce((s, e) => s + e.calories, 0);
        const net = totalCal - totalEx;
        const pct = goalCal > 0 ? Math.min(net / goalCal * 100, 100) : 0;
        const color = ringColor(net, goalCal);
        const isToday = d === todayISO;
        const isSelected = d === viewDate;
        const totalP = foods.reduce((s, f) => s + (f.protein || 0), 0);
        const totalC = foods.reduce((s, f) => s + (f.carbs   || 0), 0);

        return (
          <button key={d} onClick={() => setViewDate(d)}
            className={`w-full text-left bg-white rounded-2xl border shadow-sm p-4 transition-all active:scale-[0.99] ${isSelected ? "border-emerald-300 ring-2 ring-emerald-100" : "border-gray-100 hover:border-gray-200"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">{formatDateLabel(d)}</span>
                {isToday && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">오늘</span>}
                {isSelected && !isToday && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">보는 중</span>}
              </div>
              <div className="text-right">
                <span className="text-sm font-bold" style={{ color }}>{net.toLocaleString()} kcal</span>
                <p className="text-[10px] text-gray-400">/ {goalCal.toLocaleString()} kcal</p>
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <div className="flex gap-3">
                <span>🍽️ {foods.length}가지</span>
                {exercises.length > 0 && <span>💪 -{totalEx.toLocaleString()} kcal</span>}
              </div>
              <div className="flex gap-2">
                <span className="text-blue-400">P {totalP}g</span>
                <span className="text-amber-400">C {totalC}g</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export default function Home() {
  const todayISO = getLocalDateStr();

  const [tab,      setTab]      = useState("profile");
  const [saved,    setSaved]    = useState(false);
  const [viewDate, setViewDate] = useState(todayISO);
  const [profile,  setProfile]  = useState({
    gender: "female", age: 25, height: 165, weight: 60, goalWeight: 57, activityLevel: 1.375,
  });
  const [history, setHistory] = useState({});

  const isToday  = viewDate === todayISO;
  const dayData  = history[viewDate] || { foods: [], exercises: [] };
  const foods    = dayData.foods    || [];
  const exercises= dayData.exercises|| [];

  const setFoods = (updater) => {
    setHistory(prev => {
      const cur = prev[viewDate] || { foods: [], exercises: [] };
      return { ...prev, [viewDate]: { ...cur, foods: typeof updater === "function" ? updater(cur.foods || []) : updater } };
    });
  };
  const setExercises = (updater) => {
    setHistory(prev => {
      const cur = prev[viewDate] || { foods: [], exercises: [] };
      return { ...prev, [viewDate]: { ...cur, exercises: typeof updater === "function" ? updater(cur.exercises || []) : updater } };
    });
  };

  // LocalStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("diet-agent-v5");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.profile)  { setProfile(d.profile); setSaved(true); setTab("food"); }
      if (d.history)  setHistory(d.history);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("diet-agent-v5", JSON.stringify({ profile, history })); } catch {}
  }, [profile, history]);

  // 날짜 네비게이션
  const allDates = [...new Set([...Object.keys(history).filter(d => (history[d]?.foods || []).length > 0), todayISO])].sort();
  const currentIdx = allDates.indexOf(viewDate);
  const canGoPrev  = currentIdx > 0;
  const canGoNext  = viewDate < todayISO;

  const prevDay = () => { if (canGoPrev) setViewDate(allDates[currentIdx - 1]); };
  const nextDay = () => {
    if (!canGoNext) return;
    const nextIdx = currentIdx + 1;
    setViewDate(nextIdx < allDates.length ? allDates[nextIdx] : todayISO);
  };

  // 계산
  const bmr     = calcBMR(profile.gender, profile.weight, profile.height, profile.age);
  const tdee    = Math.round(bmr * profile.activityLevel);
  const goalCal = calcGoalCal(tdee, profile.weight, profile.goalWeight);
  const macros  = {
    protein: Math.round((goalCal * 0.30) / 4),
    carbs:   Math.round((goalCal * 0.45) / 4),
    fat:     Math.round((goalCal * 0.25) / 9),
  };
  const bmi     = calcBMI(profile.weight, profile.height);
  const bmiMeta = bmiInfo(bmi);
  const weeks   = weeksToGoal(profile.weight, profile.goalWeight);
  const computed= { bmr, tdee, goalCal, macros, bmi, bmiMeta, weeks };

  const totalFood = foods.reduce((s, f) => s + (f.calories || 0), 0);
  const totalEx   = exercises.reduce((s, e) => s + (e.calories || 0), 0);

  const recordedDays = Object.keys(history).filter(d => (history[d]?.foods || []).length > 0).length;

  const TABS = [
    { key: "profile",  icon: "👤", label: "내 정보" },
    { key: "food",     icon: "🍽️", label: "식단" },
    { key: "exercise", icon: "💪", label: "운동" },
    { key: "analysis", icon: "🔬", label: "분석" },
    { key: "history",  icon: "📅", label: "기록" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 pb-6">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-0">

          {/* 앱 제목 + 날짜 네비게이터 */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 tracking-widest uppercase">AI Diet Agent</p>
              <h1 className="text-[22px] font-bold text-gray-900 leading-tight">식단 관리</h1>
            </div>

            {/* 날짜 네비게이터 */}
            <div className="flex items-center gap-1 mt-1">
              <button onClick={prevDay} disabled={!canGoPrev}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-sm">
                ‹
              </button>
              <div className="text-center min-w-[80px]">
                <input
                  type="date"
                  value={viewDate}
                  max={todayISO}
                  onChange={e => e.target.value && setViewDate(e.target.value)}
                  className="text-xs font-semibold text-gray-700 text-center cursor-pointer focus:outline-none w-full bg-transparent"
                  style={{ colorScheme: "light" }}
                />
                {!isToday && (
                  <button onClick={() => setViewDate(todayISO)}
                    className="text-[10px] text-emerald-600 hover:underline leading-none mt-0.5 block w-full">
                    오늘로 →
                  </button>
                )}
                {isToday && <p className="text-[10px] text-emerald-500 leading-none mt-0.5">오늘</p>}
              </div>
              <button onClick={nextDay} disabled={!canGoNext}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-all text-sm">
                ›
              </button>
            </div>
          </div>

          {/* 과거 날짜 뷰 배너 */}
          {!isToday && (
            <div className="mb-3 flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2">
              <p className="text-xs text-amber-700 font-medium">📅 {formatDateLabel(viewDate)} 기록 보기</p>
              <button onClick={() => setViewDate(todayISO)} className="text-xs text-emerald-600 font-semibold hover:underline">오늘로</button>
            </div>
          )}

          {/* 칼로리 링 */}
          {saved && (
            <div className="pb-3">
              <CalorieRing consumed={totalFood} burned={totalEx} goal={goalCal} />
            </div>
          )}
          {!saved && <p className="text-sm text-gray-400 pb-3">내 정보를 입력하면 맞춤 목표 칼로리가 계산됩니다.</p>}

          {/* 탭 바 */}
          <div className="flex border-t border-gray-100 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, icon, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`relative flex-shrink-0 flex items-center justify-center gap-1 px-3 py-3 text-xs font-semibold border-b-2 transition-all ${
                  tab === key ? "border-emerald-500 text-emerald-700" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}>
                <span className="text-sm leading-none">{icon}</span>
                <span>{label}</span>
                {key === "history" && recordedDays > 0 && (
                  <span className="ml-0.5 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {recordedDays}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4">
        {tab === "profile" && (
          <ProfileTab profile={profile} setProfile={setProfile} computed={computed}
            onSave={() => { setSaved(true); setTab("food"); }} />
        )}
        {tab === "food" && (
          <FoodTab foods={foods} setFoods={setFoods} totalFood={totalFood} totalEx={totalEx}
            goalCal={goalCal} macros={macros} readOnly={!isToday} />
        )}
        {tab === "exercise" && (
          <ExerciseTab exercises={exercises} setExercises={setExercises} totalEx={totalEx}
            weight={profile.weight} readOnly={!isToday} />
        )}
        {tab === "analysis" && (
          <AnalysisTab foods={foods} exercises={exercises} profile={profile}
            goalCal={goalCal} macros={macros} viewDate={viewDate} />
        )}
        {tab === "history" && (
          <HistoryTab history={history} goalCal={goalCal}
            viewDate={viewDate} setViewDate={(d) => { setViewDate(d); setTab("food"); }}
            todayISO={todayISO} />
        )}
      </div>

      <footer className="text-center mt-8 pb-2 text-[11px] text-gray-200">made with AI · 식단 Agent</footer>
    </main>
  );
}
