import {
  validateSalesDataAgainstRules,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証ルール実行機能", () => {
  // SCEN-1346: [error] 検証ルール条件に違反する営業データが異常として検出され通知される
  test("検証ルール条件違反データが検出され、詳細情報と通知が送信される", () => {
    const validation_rules = [
      {
        rule_id: "rule_001",
        rule_name: "金額範囲チェック",
        target_field: "amount",
        operator: "greater_than",
        threshold_value: 0,
        error_message: "金額は0より大きい値を入力してください",
      },
      {
        rule_id: "rule_002",
        rule_name: "顧客名必須チェック",
        target_field: "customer_name",
        operator: "not_empty",
        threshold_value: null,
        error_message: "顧客名は必須項目です",
      },
      {
        rule_id: "rule_003",
        rule_name: "日付形式チェック",
        target_field: "contact_date",
        operator: "date_format_iso",
        threshold_value: null,
        error_message: "日付形式はISO 8601形式で入力してください",
      },
      {
        rule_id: "rule_004",
        rule_name: "ステータス値チェック",
        target_field: "appointment_status",
        operator: "enum_match",
        threshold_value: "confirmed,pending,cancelled",
        error_message: "ステータスは確定,保留中,キャンセルのいずれかです",
      },
    ];

    const sales_data_to_validate = [
      {
        data_id: "data_001",
        customer_name: "顧客A",
        amount: 100000,
        contact_date: "2024-01-15T10:30:00Z",
        appointment_status: "confirmed",
      },
      {
        data_id: "data_002",
        customer_name: "",
        amount: 50000,
        contact_date: "2024-01-16T14:00:00Z",
        appointment_status: "pending",
      },
      {
        data_id: "data_003",
        customer_name: "顧客C",
        amount: -30000,
        contact_date: "2024-01-17T09:15:00Z",
        appointment_status: "confirmed",
      },
      {
        data_id: "data_004",
        customer_name: "顧客D",
        amount: 75000,
        contact_date: "invalid-date-format",
        appointment_status: "confirmed",
      },
      {
        data_id: "data_005",
        customer_name: "顧客E",
        amount: 120000,
        contact_date: "2024-01-18T11:45:00Z",
        appointment_status: "unknown_status",
      },
    ];

    const validation_result = validateSalesDataAgainstRules(
      sales_data_to_validate,
      validation_rules
    );

    // 検証結果の基本構造を確認
    expect(validation_result).toHaveProperty("total_records_checked");
    expect(validation_result).toHaveProperty("total_violations_found");
    expect(validation_result).toHaveProperty("violation_details");
    expect(validation_result).toHaveProperty("notification_sent");

    // 合計チェック件数（入力データ数）
    expect(validation_result.total_records_checked).toBe(5);

    // 違反検出件数: data_002（顧客名空白）、data_003（金額負数）、data_004（日付形式不正）、data_005（ステータス不正） = 4件
    expect(validation_result.total_violations_found).toBe(4);

    // 違反詳細情報を確認
    expect(validation_result.violation_details).toHaveLength(4);

    // 違反1: data_002 - 顧客名が空白
    const violation_002 = validation_result.violation_details.find(
      (v: any) => v.data_id === "data_002"
    );
    expect(violation_002).toBeDefined();
    expect(violation_002.violated_rule_id).toBe("rule_002");
    expect(violation_002.violated_rule_name).toBe("顧客名必須チェック");
    expect(violation_002.target_field).toBe("customer_name");
    expect(violation_002.error_message).toBe("顧客名は必須項目です");
    expect(violation_002.violation_count).toBe(1);

    // 違反2: data_003 - 金額が負数（0以下）
    const violation_003 = validation_result.violation_details.find(
      (v: any) => v.data_id === "data_003"
    );
    expect(violation_003).toBeDefined();
    expect(violation_003.violated_rule_id).toBe("rule_001");
    expect(violation_003.violated_rule_name).toBe("金額範囲チェック");
    expect(violation_003.target_field).toBe("amount");
    expect(violation_003.detected_value).toBe(-30000);
    expect(violation_003.error_message).toBe("金額は0より大きい値を入力してください");
    expect(violation_003.violation_count).toBe(1);

    // 違反3: data_004 - 日付形式が不正
    const violation_004 = validation_result.violation_details.find(
      (v: any) => v.data_id === "data_004"
    );
    expect(violation_004).toBeDefined();
    expect(violation_004.violated_rule_id).toBe("rule_003");
    expect(violation_004.violated_rule_name).toBe("日付形式チェック");
    expect(violation_004.target_field).toBe("contact_date");
    expect(violation_004.detected_value).toBe("invalid-date-format");
    expect(violation_004.error_message).toBe(
      "日付形式はISO 8601形式で入力してください"
    );
    expect(violation_004.violation_count).toBe(1);

    // 違反4: data_005 - ステータス値が不正
    const violation_005 = validation_result.violation_details.find(
      (v: any) => v.data_id === "data_005"
    );
    expect(violation_005).toBeDefined();
    expect(violation_005.violated_rule_id).toBe("rule_004");
    expect(violation_005.violated_rule_name).toBe("ステータス値チェック");
    expect(violation_005.target_field).toBe("appointment_status");
    expect(violation_005.detected_value).toBe("unknown_status");
    expect(violation_005.error_message).toBe(
      "ステータスは確定,保留中,キャンセルのいずれかです"
    );
    expect(violation_005.violation_count).toBe(1);

    // 通知が送信されたことを確認
    expect(validation_result.notification_sent).toBe(true);
    expect(validation_result).toHaveProperty("notification_summary");
    expect(validation_result.notification_summary).toHaveProperty("email_sent");
    expect(validation_result.notification_summary).toHaveProperty(
      "dashboard_alert_created"
    );

    // メール通知が送信されたことを確認
    expect(validation_result.notification_summary.email_sent).toBe(true);
    expect(validation_result.notification_summary).toHaveProperty(
      "email_recipient"
    );
    expect(validation_result.notification_summary.email_recipient).toBe(
      "admin@system.local"
    );

    // ダッシュボードアラートが作成されたことを確認
    expect(validation_result.notification_summary.dashboard_alert_created).toBe(
      true
    );
    expect(validation_result.notification_summary).toHaveProperty(
      "alert_severity"
    );
    expect(validation_result.notification_summary.alert_severity).toBe("error");

    // 通知内容に異常データの詳細情報が含まれているか確認
    expect(validation_result).toHaveProperty("notification_content");
    const notification_content = validation_result.notification_content;
    expect(notification_content).toHaveProperty("detected_violations_summary");
    expect(notification_content).toHaveProperty("violation_records");

    // 検出された違反の要約
    expect(
      notification_content.detected_violations_summary.total_violations
    ).toBe(4);
    expect(
      notification_content.detected_violations_summary.rules_triggered
    ).toHaveLength(4);

    // 通知に含まれる個別の違反レコード
    expect(notification_content.violation_records).toHaveLength(4);

    const notified_violation_002 = notification_content.violation_records.find(
      (v: any) => v.data_id === "data_002"
    );
    expect(notified_violation_002).toBeDefined();
    expect(notified_violation_002.rule_name).toBe("顧客名必須チェック");
    expect(notified_violation_002.issue_description).toBe(
      "顧客名は必須項目です"
    );

    const notified_violation_003 = notification_content.violation_records.find(
      (v: any) => v.data_id === "data_003"
    );
    expect(notified_violation_003).toBeDefined();
    expect(notified_violation_003.rule_name).toBe("金額範囲チェック");
    expect(notified_violation_003.detected_value).toBe(-30000);

    const notified_violation_004 = notification_content.violation_records.find(
      (v: any) => v.data_id === "data_004"
    );
    expect(notified_violation_004).toBeDefined();
    expect(notified_violation_004.rule_name).toBe("日付形式チェック");
    expect(notified_violation_004.issue_description).toBe(
      "日付形式はISO 8601形式で入力してください"
    );

    const notified_violation_005 = notification_content.violation_records.find(
      (v: any) => v.data_id === "data_005"
    );
    expect(notified_violation_005).toBeDefined();
    expect(notified_violation_005.rule_name).toBe("ステータス値チェック");
    expect(notified_violation_005.detected_value).toBe("unknown_status");

    // 通知内容に対応方法が含まれているか確認
    expect(notification_content).toHaveProperty("recommended_actions");
    expect(notification_content.recommended_actions).toHaveLength(4);

    const action_002 = notification_content.recommended_actions.find(
      (a: any) => a.data_id === "data_002"
    );
    expect(action_002).toBeDefined();
    expect(action_002.action_type).toBe("input_correction");
    expect(action_002.description).toContain("顧客名");

    const action_003 = notification_content.recommended_actions.find(
      (a: any) => a.data_id === "data_003"
    );
    expect(action_003).toBeDefined();
    expect(action_003.action_type).toBe("value_correction");
    expect(action_003.description).toContain("金額");

    const action_004 = notification_content.recommended_actions.find(
      (a: any) => a.data_id === "data_004"
    );
    expect(action_004).toBeDefined();
    expect(action_004.action_type).toBe("format_correction");
    expect(action_004.description).toContain("日付形式");

    const action_005 = notification_content.recommended_actions.find(
      (a: any) => a.data_id === "data_005"
    );
    expect(action_005).toBeDefined();
    expect(action_005.action_type).toBe("value_correction");
    expect(action_005.description).toContain("ステータス");

    // 通知タイムスタンプが記録されているか確認
    expect(validation_result.notification_summary).toHaveProperty(
      "notification_timestamp"
    );
    expect(validation_result.notification_summary.notification_timestamp).toBe(
      "2024-01-19T08:00:00Z"
    );

    // 検証結果レポートの全体的な状態を確認
    expect(validation_result.validation_status).toBe("failed");
    expect(validation_result.pass_rate).toBe(0.2); // 1件合格 / 5件 = 20%
  });
});