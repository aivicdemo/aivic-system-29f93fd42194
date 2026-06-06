import { validateWorkCompletionStatus } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("品質チェック合格かつ数量確認OKで作業完了と判定される", () => {
    // SCEN-378
    const actualQuantity = 100;
    const plannedQuantity = 100;
    const qualityCheckResults = [
      { checkItem: "寸法検査", result: "pass" as const, measuredValue: 98.5 },
      { checkItem: "外観検査", result: "pass" as const, measuredValue: 95.0 },
      { checkItem: "強度検査", result: "pass" as const, measuredValue: 102.3 }
    ];
    const qualityStandards = [
      { checkItem: "寸法検査", standardValue: 100, tolerance: 5 },
      { checkItem: "外観検査", standardValue: 90, tolerance: 10 },
      { checkItem: "強度検査", standardValue: 100, tolerance: 5 }
    ];

    const result = validateWorkCompletionStatus(
      actualQuantity,
      plannedQuantity,
      qualityCheckResults,
      qualityStandards
    );

    expect(result.isCompleted).toBe(true);
    expect(result.completionStatus).toBe("completed");
    expect(result.requiredActions).toEqual([]);
    expect(result.nextProcessReady).toBe(true);
  });
});