import { determineStatisticalSignificance } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1230: [edge] 精度改善効果の統計的有意性判定 - 有意水準p値が境界値0.05ちょうどの場合、有意と判定される
  test("p値が境界値0.05の場合、統計的有意性判定は有意と判定される", () => {
    const p_value = 0.05;
    const significance_level = 0.05;

    const result = determineStatisticalSignificance({
      p_value,
      significance_level,
    });

    expect(result.is_significant).toBe(true);
    expect(result.judgment_result).toBe("有意");
    expect(result.p_value_boundary_comparison).toBe("equal");
  });
});