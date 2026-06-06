import { sendProductionProgressReport } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("作業実績データの記録完了後、生産管理システムへの送信と確認可能状態への変更が正常に実行される", () => {
    // SCEN-391
    const workOrderId = "WO-2024-0001";
    const actualQuantity = 150;
    const qualityStatus = "合格";
    const workerId = "W001";
    const completionTime = new Date("2024-01-15T16:30:00Z");
    const remarks = "次工程への引き継ぎ事項：温度管理を22度に維持してください";

    const result = sendProductionProgressReport(
      workOrderId,
      actualQuantity,
      qualityStatus,
      workerId,
      completionTime,
      remarks
    );

    expect(result.reportId).toBeDefined();
    expect(result.status).toBe("送信完了");
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.validationResults).toEqual([]);
  });
});