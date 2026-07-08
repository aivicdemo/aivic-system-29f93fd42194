import { analyzeDiscrepancyAndJudgeModificationNeed } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-977: [error] 月次実績と配置計画の乖離判定・修正要否自動判定 - 計画値がゼロの場合、エラーが返される（ゼロ除算対策）
  test("計画値がゼロの場合、ゼロ除算エラーが返される", () => {
    const actualResult = 100;
    const plannedValue = 0;

    const result = analyzeDiscrepancyAndJudgeModificationNeed({
      actualResult,
      plannedValue,
    });

    expect(result).toHaveProperty("error");
    expect(result.error).toBe(true);
    expect(result.message).toMatch(/計画値がゼロ/);
    expect(result.errorType).toBe("DIVISION_BY_ZERO");
    expect(result.discrepancyRate).toBeUndefined();
    expect(result.modificationRequired).toBeUndefined();
  });
});