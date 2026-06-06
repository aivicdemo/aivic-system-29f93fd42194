import { recordWorkHistory } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("実績数量が0の境界値で正常に記録される", () => {
    // SCEN-406
    const result = recordWorkHistory(
      "PO-2024-001",
      "PROC-CUTTING-001", 
      "WORKER-001",
      new Date("2024-01-15T09:00:00Z"),
      new Date("2024-01-15T17:00:00Z"),
      0,
      "完了"
    );

    expect(result.historyId).toBeDefined();
    expect(result.recordedAt).toEqual(new Date());
    expect(result.isValid).toBe(true);
  });
});