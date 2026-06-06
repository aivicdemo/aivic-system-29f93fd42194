import { validateProductionResults } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("実績データ承認機能 - 実績データが品質基準と数量基準を満たしている場合、承認処理が正常に実行される", () => {
    // SCEN-394
    const actualQuantity = 100;
    const plannedQuantity = 100;
    const qualityCheckResults = [
      { checkItem: "寸法", actualValue: 10.0, standardValue: 10.0, result: 'pass' },
      { checkItem: "強度", actualValue: 95, standardValue: 90, result: 'pass' },
      { checkItem: "外観", actualValue: 8, standardValue: 7, result: 'pass' }
    ];
    const workCompletionTime = new Date("2024-01-15T14:00:00Z");
    const plannedCompletionTime = new Date("2024-01-15T16:00:00Z");

    const result = validateProductionResults(
      actualQuantity,
      plannedQuantity,
      qualityCheckResults,
      workCompletionTime,
      plannedCompletionTime
    );

    expect(result.approvalStatus).toBe('approved');
    expect(result.nextProcessFlag).toBe(true);
    expect(result.alertLevel).toBe('none');
    expect(result.comments).toBe('承認');
  });
});