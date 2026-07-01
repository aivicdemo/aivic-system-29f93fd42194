import { recordDecisionAndUpdateStatus } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-822: 対応方針の記録・ステータス更新機能 - 営業責任者が確認内容に基づいて対応方針を決定し、判断内容・理由・実施予定日時がシステムに正常に記録される", async () => {
    // Arrange: 営業責任者ユーザーでログイン済み状態
    const user_id = "usr_sales_manager_001";
    const user_role = "sales_manager";
    const login_timestamp = new Date("2024-01-15T09:00:00Z");

    // 確認待ちの対応方針レコード
    const decision_record_id = "dec_rec_001";
    const contract_id = "contract_20240115_001";
    const customer_id = "cust_abc_001";
    const current_status = "pending_decision";

    // 対応方針の入力値
    const decision_content = "承認";
    const decision_reason = "顧客要件を確認、基準を満たしている";
    const scheduled_implementation_datetime = new Date("2024-01-15T10:00:00Z");

    // 入力値の妥当性チェック前提条件
    const input_payload = {
      decision_record_id: decision_record_id,
      user_id: user_id,
      user_role: user_role,
      decision_content: decision_content,
      decision_reason: decision_reason,
      scheduled_implementation_datetime: scheduled_implementation_datetime,
      operation_timestamp: login_timestamp,
    };

    // Act: 対応方針の記録・ステータス更新を実行
    const result = await recordDecisionAndUpdateStatus(input_payload);

    // Assert: 保存成功の判定
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.record_id).toBe(decision_record_id);

    // 保存されたレコードの詳細検証
    expect(result.saved_record).toBeDefined();
    expect(result.saved_record.decision_content).toBe(decision_content);
    expect(result.saved_record.decision_reason).toBe(decision_reason);
    expect(result.saved_record.scheduled_implementation_datetime).toEqual(
      scheduled_implementation_datetime
    );

    // ステータスが「記録済み」に更新されていることを検証
    expect(result.saved_record.status).toBe("recorded");
    expect(result.saved_record.status_updated_at).toBeDefined();

    // 監査ログへの記録検証
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.user_id).toBe(user_id);
    expect(result.audit_log.user_role).toBe(user_role);
    expect(result.audit_log.operation_type).toBe("record_decision");
    expect(result.audit_log.target_record_id).toBe(decision_record_id);
    expect(result.audit_log.operation_timestamp).toEqual(login_timestamp);
    expect(result.audit_log.recorded).toBe(true);

    // 返却メッセージの確認
    expect(result.message).toMatch(/記録|成功|完了/);
  });
});