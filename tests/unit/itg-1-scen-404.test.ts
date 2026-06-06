import { recordWorkHistory } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("正常な作業完了実績入力で作業履歴が適切に記録される", () => {
    // SCEN-404
    const productionOrderId = "PRD-2024-001";
    const processId = "PROC-ASSEMBLY-001";
    const workerId = "WORKER-001";
    const startTime = new Date("2024-01-15T09:00:00Z");
    const endTime = new Date("2024-01-15T17:00:00Z");
    const actualQuantity = 50;
    const qualityResult = "合格";

    const result = recordWorkHistory(
      productionOrderId,
      processId,
      workerId,
      startTime,
      endTime,
      actualQuantity,
      qualityResult
    );

    expect(result.isValid).toBe(true);
    expect(result.historyId).toBeDefined();
    expect(typeof result.historyId).toBe("string");
    expect(result.recordedAt).toBeInstanceOf(Date);
  });
});