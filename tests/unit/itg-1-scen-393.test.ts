import { sendProductionProgressReport } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("実績数量がゼロの場合でも品質状況が記録されていれば正常に送信される", () => {
    // SCEN-393
    const workOrderId = "WO-2024-001";
    const actualQuantity = 0;
    const qualityStatus = "合格";
    const workerId = "WORKER-001";
    const completionTime = new Date("2024-01-15T14:30:00Z");
    const remarks = "品質確認済み、数量ゼロで完了";

    const result = sendProductionProgressReport(
      workOrderId,
      actualQuantity,
      qualityStatus,
      workerId,
      completionTime,
      remarks
    );

    expect(result.status).toBe("送信完了");
    expect(result.reportId).toBeDefined();
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.validationResults).toEqual([]);
  });
});