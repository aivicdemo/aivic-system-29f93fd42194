import { validateProductionResults } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("境界値ちょうどの実績数量に対して承認処理が正常に完了し、データのステータスが「承認済み」に更新される", () => {
    // SCEN-397
    const actualQuantity = 100;
    const plannedQuantity = 100;
    const qualityCheckResults = [
      { checkItem: "寸法精度", actualValue: 1.0, standardValue: 1.0, result: "pass" as const },
      { checkItem: "強度", actualValue: 500, standardValue: 500, result: "pass" as const }
    ];
    const workCompletionTime = new Date("2024-01-15T10:00:00Z");
    const plannedCompletionTime = new Date("2024-01-15T09:00:00Z");

    const result = validateProductionResults(
      actualQuantity,
      plannedQuantity,
      qualityCheckResults,
      workCompletionTime,
      plannedCompletionTime
    );

    expect(result.approvalStatus).toBe("approved");
    expect(result.nextProcessFlag).toBe(true);
    expect(result.alertLevel).toBe("none");
    expect(result.comments).toBe("承認");
  });
});