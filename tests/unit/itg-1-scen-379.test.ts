import { validateWorkCompletionStatus } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("品質チェック不合格で作業未完了と判定され再作業指示が発行される", () => {
    // SCEN-379
    const actualQuantity = 100;
    const plannedQuantity = 100;
    const qualityCheckResults = [
      { checkItem: "寸法精度", result: "fail" as const, measuredValue: 8.5 },
      { checkItem: "表面仕上げ", result: "pass" as const, measuredValue: 3.2 },
      { checkItem: "材質強度", result: "fail" as const, measuredValue: 320 }
    ];
    const qualityStandards = [
      { checkItem: "寸法精度", standardValue: 10.0, tolerance: 0.5 },
      { checkItem: "表面仕上げ", standardValue: 3.0, tolerance: 0.2 },
      { checkItem: "材質強度", standardValue: 350, tolerance: 20 }
    ];

    const result = validateWorkCompletionStatus(
      actualQuantity,
      plannedQuantity,
      qualityCheckResults,
      qualityStandards
    );

    expect(result.isCompleted).toBe(false);
    expect(result.completionStatus).toBe("quality_failure");
    expect(result.requiredActions).toEqual(["品質調整"]);
    expect(result.nextProcessReady).toBe(false);
  });
});