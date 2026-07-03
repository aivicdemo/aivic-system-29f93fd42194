import { sendContractChangeReminderNotification } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-1217: 契約変更確認催促通知機能 - 設定超過時間経過後に営業責任者に催促通知が送信される", () => {
    // 入力データ: 契約変更確認待機中のデータ
    const contractChangeConfirmationInput = {
      contract_id: "CONT-2024-001",
      customer_id: "CUST-ABC001",
      customer_name: "株式会社テスト顧客",
      change_content: "サービス数量を5から10に変更",
      change_date: new Date("2024-01-15T09:00:00Z"),
      customer_agreement_received_at: new Date("2024-01-15T14:30:00Z"),
      confirmation_received_at: new Date("2024-01-15T14:30:00Z"),
      sales_manager_email: "manager@example.com",
      sales_manager_name: "営業マネージャー太郎",
      reminder_threshold_hours: 24,
      current_time: new Date("2024-01-16T15:00:00Z"),
      notification_log_id: "NTF-LOG-001",
    };

    // 実行: 催促通知送信処理
    const result = sendContractChangeReminderNotification(
      contractChangeConfirmationInput
    );

    // 期待結果の検証
    // 1. 通知が送信されたことを確認
    expect(result.notification_sent).toBe(true);

    // 2. 催促通知に必須情報が含まれていることを確認
    expect(result.notification_content).toEqual({
      customer_info: {
        customer_id: "CUST-ABC001",
        customer_name: "株式会社テスト顧客",
      },
      contract_change_details: {
        contract_id: "CONT-2024-001",
        change_content: "サービス数量を5から10に変更",
        change_date: new Date("2024-01-15T09:00:00Z"),
      },
      confirmation_status: "待機中",
      confirmation_received_at: new Date("2024-01-15T14:30:00Z"),
      elapsed_hours: 24.5,
      reminder_message:
        "契約変更の承認確認がまだ完了していません。至急ご確認ください。",
    });

    // 3. 送信先メールアドレスが正確であることを確認
    expect(result.recipient_email).toBe("manager@example.com");

    // 4. 送信者情報が記録されていることを確認
    expect(result.sender_name).toBe("営業代行企業");

    // 5. 通知ログに正しく記録されていることを確認
    expect(result.notification_log).toEqual({
      notification_log_id: "NTF-LOG-001",
      contract_id: "CONT-2024-001",
      customer_id: "CUST-ABC001",
      sales_manager_email: "manager@example.com",
      notification_type: "契約変更確認催促",
      sent_at: new Date("2024-01-16T15:00:00Z"),
      status: "送信完了",
      content_summary:
        "契約変更CONT-2024-001の確認待機時間が設定閾値(24時間)を超過したため催促通知を送信",
    });

    // 6. 超過時間が計算されて記録されていることを確認
    expect(result.elapsed_hours).toBe(24.5);
    expect(result.is_reminder_threshold_exceeded).toBe(true);

    // 7. 通知送信時刻が現在時刻と一致することを確認
    expect(result.notification_sent_at).toEqual(new Date("2024-01-16T15:00:00Z"));

    // 8. 催促通知後のステータスが更新されていることを確認
    expect(result.updated_confirmation_status).toBe("催促済み");
  });
});