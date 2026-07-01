import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  calculateContractChangeVerificationDeadline,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-877: [normal] 契約変更検証完了期限の自動計算
  it("should calculate contract change verification deadline and customer report deadline correctly", () => {
    // Arrange: 契約変更通知受領日時を設定
    const notification_received_date = new Date("2024-01-15T09:00:00Z");
    const business_days_to_deadline = 10;
    const customer_report_lead_days = 2;

    // Act: 検証完了期限と顧客報告期限を計算
    const result = calculateContractChangeVerificationDeadline({
      notification_received_date,
      business_days_to_deadline,
      customer_report_lead_days,
    });

    // Assert: 検証完了期限が正確に計算されたことを確認
    // 2024-01-15（月）から10営業日後を計算
    // 1/15(月)→16(火)→17(水)→18(木)→19(金)→22(月)→23(火)→24(水)→25(木)→26(金) = 10営業日後は 2024-01-26
    expect(result.verification_deadline).toEqual(
      new Date("2024-01-26T17:00:00Z")
    );

    // Assert: 顧客報告期限が検証完了期限の2営業日前に設定されたことを確認
    // 2024-01-26（金）の2営業日前 = 2024-01-24（水）
    expect(result.customer_report_deadline).toEqual(
      new Date("2024-01-24T17:00:00Z")
    );

    // Assert: 通知受領日が正確に記録されたことを確認
    expect(result.notification_received_date).toEqual(notification_received_date);

    // Assert: 計算ロジックで使用された営業日数が正確であることを確認
    expect(result.business_days_applied).toBe(business_days_to_deadline);

    // Assert: 計算ロジックで使用された顧客報告リード日数が正確であることを確認
    expect(result.customer_report_lead_days_applied).toBe(
      customer_report_lead_days
    );

    // Assert: 検証期限と顧客報告期限が存在し、有効な日付オブジェクトであることを確認
    expect(result.verification_deadline).toBeInstanceOf(Date);
    expect(result.customer_report_deadline).toBeInstanceOf(Date);

    // Assert: 顧客報告期限が検証完了期限より前の日付であることを確認（ビジネスロジック検証）
    expect(result.customer_report_deadline.getTime()).toBeLessThan(
      result.verification_deadline.getTime()
    );

    // Assert: 計算状態フラグが正常（completed）であることを確認
    expect(result.calculation_status).toBe("completed");

    // Assert: エラーメッセージが存在しないことを確認
    expect(result.error_message).toBeUndefined();
  });
});