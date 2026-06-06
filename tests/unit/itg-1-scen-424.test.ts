import { validateProductionReport } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  // SCEN-424
  test("完全性と整合性の基準を満たす実績データが報告完了として受理される", () => {
    // 完全性と整合性を満たす実績データを入力
    const workOrderId = "WO-2024-001";
    const completedQuantity = 95; // 計画数量100の95%（妥当な範囲内）
    const qualityStatus = "合格";
    const workStartTime = "2024-01-15T09:00:00";
    const workEndTime = "2024-01-15T17:00:00";
    const plannedQuantity = 100;

    const result = validateProductionReport(
      workOrderId,
      completedQuantity,
      qualityStatus,
      workStartTime,
      workEndTime,
      plannedQuantity
    );

    // 完全性と整合性の基準をすべて満たしているため報告完了として受理される
    expect(result.isValid).toBe(true);
    expect(result.reportStatus).toBe("accepted");
    expect(result.errorMessages).toEqual([]);
    expect(result.nextProcessInfo).toBe("次工程担当者に引き継ぎ完了");
  });
});