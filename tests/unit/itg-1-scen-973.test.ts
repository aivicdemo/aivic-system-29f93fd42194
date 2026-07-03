import { describe, test, expect, beforeEach } from "@jest/globals";
import { recalculateAndAdjustBillingAmount } from "../../src/logic/it-1781935279444-2-1-1";

describe("顧客異議に基づく再計算・修正判定", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-973
  test("顧客異議から算出される修正請求額が再計算ルール境界値に該当し、正確に新金額が決定される", () => {
    // テストデータ設定：顧客異議が登録された請求レコード
    const originalBillingAmount = 150000; // 元請求額: 150,000円
    const customerObjectionAmount = 140000; // 顧客異議に基づく修正後金額: 140,000円
    const billingAdjustmentThreshold = 10000; // 再計算ルール境界値: 10,000円未満は調整対象、10,000円以上は別プロセス
    const calculatedDifference = originalBillingAmount - customerObjectionAmount; // 差分: 10,000円

    // 再計算ルール境界値ちょうど（10,000円）に該当するケース
    expect(calculatedDifference).toBe(10000);

    // 修正請求額の再計算処理を実行
    const result = recalculateAndAdjustBillingAmount({
      originalBillingAmount,
      customerObjectionAmount,
      billingAdjustmentThreshold,
      customerId: "CUST-001",
      billingRecordId: "BIL-202401-001",
      objectionReason: "過剰計上と割引漏れ",
      adjustmentProcessedAt: "2024-01-15T10:30:00Z",
    });

    // システムが正しいルール分岐を選択したことを確認
    // 差分が境界値（10,000円）以上のため、別プロセスが適用される
    expect(result.appliedAdjustmentRule).toBe("advanced_review_required");

    // 新しい請求金額が正確に計算・決定されたことを確認
    expect(result.revisedBillingAmount).toBe(140000);

    // 修正後の請求レコードが正常に更新されたことを検証
    expect(result.billingRecordStatus).toBe("adjustment_approved");

    // 修正金額の根拠を検証
    expect(result.adjustmentJustification).toContain("10000");

    // 監査ログに修正履歴が正確に記録されていることを確認
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.action).toBe("billing_adjustment");
    expect(result.auditLog.previousAmount).toBe(150000);
    expect(result.auditLog.newAmount).toBe(140000);
    expect(result.auditLog.adjustmentReason).toBe("customer_objection");
    expect(result.auditLog.timestamp).toBe("2024-01-15T10:30:00Z");
    expect(result.auditLog.customerId).toBe("CUST-001");
    expect(result.auditLog.billingRecordId).toBe("BIL-202401-001");
    expect(result.auditLog.recordedAt).toBeDefined();

    // トレーサビリティが確保されていることを確認
    expect(result.traceabilityId).toBeDefined();
    expect(result.traceabilityId).toMatch(/^TRACE-/);
  });
});