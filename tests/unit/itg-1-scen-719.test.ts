import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  issueDataCorrectionInstruction,
  resubmitCorrectedSalesData,
  checkReminderNotificationStatus,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-719: [normal] 修正期限管理と催促通知 - 修正指示発行から指定期限内に再入力された場合に催促通知が発行されない
  it("修正指示発行後、指定期限内に正しいデータで再入力された場合、催促通知は発行されないこと", () => {
    // 初期状態：品質検証エラーを含む営業データレコードが存在
    const error_sales_record_id = "SALES_20240115_001";
    const customer_id = "CUST_A001";
    const sales_rep_id = "REP_001";
    const current_timestamp = new Date("2024-01-15T10:00:00Z");
    const correction_deadline = new Date("2024-01-22T23:59:59Z"); // 7日後

    // ステップ1：修正指示を発行
    const issue_result = issueDataCorrectionInstruction({
      sales_record_id: error_sales_record_id,
      customer_id: customer_id,
      sales_rep_id: sales_rep_id,
      error_type: "missing_required_field",
      error_description: "接触日時が未入力です",
      correction_deadline: correction_deadline,
      issued_at: current_timestamp,
    });

    // 修正指示が正常に発行されたことを確認
    expect(issue_result.success).toBe(true);
    expect(issue_result.instruction_id).toBeDefined();
    expect(issue_result.status).toBe("issued");
    expect(issue_result.deadline_timestamp).toEqual(correction_deadline);

    // ステップ2：修正期限内（3日後）に正しいデータで再入力
    const resubmit_timestamp = new Date("2024-01-18T14:30:00Z"); // 3日後
    const corrected_sales_data = {
      sales_record_id: error_sales_record_id,
      customer_id: customer_id,
      sales_rep_id: sales_rep_id,
      contact_date: "2024-01-15",
      contact_time: "10:00",
      transaction_content: "商品提案実施",
      appointment_status: "confirmed",
      amount: 50000,
      service_type: "standard",
      submitted_at: resubmit_timestamp,
    };

    const resubmit_result = resubmitCorrectedSalesData({
      instruction_id: issue_result.instruction_id,
      corrected_data: corrected_sales_data,
      resubmitted_at: resubmit_timestamp,
    });

    // 再入力が正常に処理されたことを確認
    expect(resubmit_result.success).toBe(true);
    expect(resubmit_result.validation_status).toBe("approved");
    expect(resubmit_result.record_status).toBe("confirmed");

    // ステップ3：修正期限到達後、催促通知の発行状況を確認
    const check_notification_timestamp = new Date("2024-01-23T08:00:00Z"); // 期限翌日

    const notification_result = checkReminderNotificationStatus({
      instruction_id: issue_result.instruction_id,
      sales_record_id: error_sales_record_id,
      check_at: check_notification_timestamp,
    });

    // 修正期限内に再入力されたため、催促通知は発行されないこと
    expect(notification_result.reminder_notification_sent).toBe(false);
    expect(notification_result.notification_count).toBe(0);
    expect(notification_result.latest_notification_type).toBeNull();
    expect(notification_result.correction_status).toBe("completed_within_deadline");
  });
});