import { recordAuditTrail } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-834: [normal] 対応内容のシステムログ記録・監査証跡機能
  test("代表兼営業オペレーターがポータルに対応結果を入力・送信した際、送信日時・送信者・対応内容・対応ステータスがシステムログに正常に記録される", () => {
    const submission_timestamp = new Date("2024-12-15T14:32:45Z");
    const user_id = "USR-001";
    const user_name = "山田太郎";
    const user_role = "代表兼営業オペレーター";
    const correspondence_content = "顧客企業との納期調整に合意。新納期は2025年1月31日に設定。請求額は前月比5%削減で確定。";
    const correspondence_status = "完了";
    const case_id = "CASE-2024-1201";

    const auditTrailRecord = recordAuditTrail({
      submission_timestamp,
      user_id,
      user_name,
      user_role,
      correspondence_content,
      correspondence_status,
      case_id,
    });

    // 送信日時が正確に記録される
    expect(auditTrailRecord.logged_timestamp).toEqual(submission_timestamp);

    // 送信者情報が完全に記録される
    expect(auditTrailRecord.sender_user_id).toBe("USR-001");
    expect(auditTrailRecord.sender_user_name).toBe("山田太郎");
    expect(auditTrailRecord.sender_role).toBe("代表兼営業オペレーター");

    // 対応内容が全文記録される
    expect(auditTrailRecord.recorded_correspondence_content).toBe(
      "顧客企業との納期調整に合意。新納期は2025年1月31日に設定。請求額は前月比5%削減で確定。"
    );

    // 対応ステータスが記録される
    expect(auditTrailRecord.recorded_status).toBe("完了");

    // 関連するケースIDが紐付く
    expect(auditTrailRecord.associated_case_id).toBe("CASE-2024-1201");

    // 監査証跡IDが生成される
    expect(auditTrailRecord.audit_trail_id).toBeDefined();
    expect(typeof auditTrailRecord.audit_trail_id).toBe("string");

    // 改ざん防止ハッシュが生成される
    expect(auditTrailRecord.tamper_check_hash).toBeDefined();
    expect(typeof auditTrailRecord.tamper_check_hash).toBe("string");

    // ログレコード全体の構造が整合している
    expect(auditTrailRecord).toHaveProperty("logged_timestamp");
    expect(auditTrailRecord).toHaveProperty("sender_user_id");
    expect(auditTrailRecord).toHaveProperty("sender_user_name");
    expect(auditTrailRecord).toHaveProperty("sender_role");
    expect(auditTrailRecord).toHaveProperty("recorded_correspondence_content");
    expect(auditTrailRecord).toHaveProperty("recorded_status");
    expect(auditTrailRecord).toHaveProperty("associated_case_id");
    expect(auditTrailRecord).toHaveProperty("audit_trail_id");
    expect(auditTrailRecord).toHaveProperty("tamper_check_hash");
    expect(auditTrailRecord).toHaveProperty("is_auditable");

    // 監査証跡としてアクセス可能であることを確認
    expect(auditTrailRecord.is_auditable).toBe(true);
  });
});