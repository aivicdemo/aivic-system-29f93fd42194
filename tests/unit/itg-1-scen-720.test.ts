import { validateCorrectionDeadlineAndNotify } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-720: [normal] 修正期限管理と催促通知 - 修正期限超過時に自動催促通知が発行される
  test("修正期限超過時に自動催促通知が発行される", () => {
    // テストデータ: 修正期限が過去日時に設定された未修正のデータ品質問題レコード
    const quality_issue_id = "QI-2024-001";
    const user_email = "operator@example.com";
    const correction_deadline = new Date("2024-01-10T23:59:59Z"); // 過去の期限
    const problem_content = "必須項目『顧客名』が欠落している営業活動レコード";
    const affected_record_ids = ["REC-001", "REC-002", "REC-003"];
    const system_execution_time = new Date("2024-01-15T09:30:00Z"); // 期限を超過した実行時刻

    // 修正期限管理システムの自動催促通知処理を実行
    const notification_result = validateCorrectionDeadlineAndNotify({
      quality_issue_id,
      user_email,
      correction_deadline,
      problem_content,
      affected_record_ids,
      system_execution_time,
    });

    // 催促通知が発行されたかを検証
    expect(notification_result.notification_issued).toBe(true);

    // 催促通知メッセージの内容を検証
    expect(notification_result.notification_message).toContain(quality_issue_id);
    expect(notification_result.notification_message).toContain(problem_content);
    expect(notification_result.notification_message).toContain("2024-01-10");

    // 新しい期限が計算されているかを検証（修正期限から5営業日を想定）
    expect(notification_result.new_deadline).toBeDefined();
    expect(typeof notification_result.new_deadline).toBe("string");

    // 催促通知の配信先アドレスが正しく設定されていることを確認
    expect(notification_result.delivery_email).toBe(user_email);

    // 催促通知の発行日時がシステム実行時刻と一致していることを確認
    expect(notification_result.notification_issued_at).toBe(
      "2024-01-15T09:30:00Z"
    );

    // 催促通知ステータスが『発行済み』に更新されていることを確認
    expect(notification_result.notification_status).toBe("発行済み");

    // 対象レコード数が正しく反映されていることを確認
    expect(notification_result.affected_record_count).toBe(3);

    // 修正期限超過日数が計算されていることを確認（2024-01-15 vs 2024-01-10 = 5日超過）
    expect(notification_result.days_overdue).toBe(5);
  });
});