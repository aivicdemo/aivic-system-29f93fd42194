import { diagnoseAccuracyDecline } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能", () => {
  // SCEN-1176: [edge] 精度低下要因診断 - 前月比でAI判定精度が-4.9%の低下に留まった場合、正常判定され低下フラグが立たない
  test("前月比-4.9%のAI判定精度低下は正常範囲内として判定される", () => {
    const previousMonthAccuracy = 95.0;
    const currentMonthAccuracy = 90.1;
    
    const result = diagnoseAccuracyDecline({
      previousMonthAccuracy,
      currentMonthAccuracy,
    });

    // 前月比-4.9%は-5.0%の低下閾値未満であるため、正常判定フラグはtrue
    expect(result.isNormal).toBe(true);
    
    // 低下フラグはfalse（アラート未発生）
    expect(result.hasDecline).toBe(false);
    
    // 実際の低下率が-4.9%であることを確認
    const declineRate = ((currentMonthAccuracy - previousMonthAccuracy) / previousMonthAccuracy) * 100;
    expect(declineRate).toBeCloseTo(-4.9, 1);
  });
});