import { calculateStatisticalSignificance } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1229
  test("サンプルサイズがゼロの場合、有意性判定が失敗する", () => {
    const sampleSize = 0;
    const preImprovementData: number[] = [];
    const postImprovementData: number[] = [];

    const result = calculateStatisticalSignificance({
      sampleSize,
      preImprovementData,
      postImprovementData,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toMatch(/サンプルサイズ/);
  });
});