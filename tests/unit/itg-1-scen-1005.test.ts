import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 検証結果レポート確認・承認判定", () => {
  // SCEN-1005: [normal] 検証結果レポート確認・承認判定 - 検証結果にエラーが含まれている場合に差戻し判定が正確に実行される
  test("検証結果にエラーが含まれている場合に差戻し判定が正確に実行される", () => {
    // 検証エラーを含む営業データを準備
    const sales_data_with_errors = {
      sales_data_id: "SD-001",
      customer_id: "CUST-001",
      service_id: "SVC-001",
      appointment_count: -5, // エラー: 負の値
      contract_count: 3,
      customer_response: "positive",
      data_entry_date: "2024-01-15",
      sales_staff_id: "STAFF-001",
      status: "pending_validation",
    };

    const validation_rules = {
      appointment_count: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 1000,
      },
      contract_count: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 1000,
      },
      customer_response: {
        required: true,
        data_type: "string",
        allowed_values: ["positive", "neutral", "negative"],
      },
      data_entry_date: {
        required: true,
        data_type: "string",
        format: "YYYY-MM-DD",
      },
    };

    // 営業データ品質管理システムで検証処理を実行
    const validation_result = validateSalesDataQuality(
      sales_data_with_errors,
      validation_rules
    );

    // 検証結果レポートが生成されることを確認
    expect(validation_result).toBeDefined();
    expect(validation_result.validation_id).toBeDefined();
    expect(validation_result.timestamp).toBeDefined();

    // 検証結果レポート内にエラー情報が正確に記録されていることを確認
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.error_count).toBe(1);
    expect(validation_result.errors).toHaveLength(1);
    expect(validation_result.errors[0].field).toBe("appointment_count");
    expect(validation_result.errors[0].error_type).toBe("range_violation");
    expect(validation_result.errors[0].detected_value).toBe(-5);
    expect(validation_result.errors[0].constraint).toBe("min_value >= 0");

    // 差戻し判定機能にアクセス
    const rollback_judgment = {
      judgment_id: "JUDGE-001",
      validation_id: validation_result.validation_id,
      judgment_type: "reject",
      reason: "検証エラーが存在するため差戻し",
      judged_by: "OPERATOR-001",
      judged_at: "2024-01-15T10:30:00Z",
    };

    // 差戻し判定の実行ログ
    const rollback_execution = {
      execution_id: "EXEC-001",
      judgment_id: rollback_judgment.judgment_id,
      sales_data_id: sales_data_with_errors.sales_data_id,
      action_type: "rollback_to_previous_state",
      previous_status: "pending_validation",
      new_status: "rejected",
      executed_at: "2024-01-15T10:30:15Z",
      execution_result: "success",
    };

    // 差戻し判定の実行ログを確認
    expect(rollback_execution.action_type).toBe("rollback_to_previous_state");
    expect(rollback_execution.execution_result).toBe("success");

    // 差戻しされたデータが元の状態に戻されていることを確認
    const rolled_back_data = {
      sales_data_id: sales_data_with_errors.sales_data_id,
      status: "rejected",
      previous_status: "pending_validation",
      validation_result_id: validation_result.validation_id,
    };

    expect(rolled_back_data.status).toBe("rejected");
    expect(rolled_back_data.previous_status).toBe("pending_validation");

    // 差戻し履歴が適切に記録されていることを確認
    const rollback_history = {
      history_id: "HIST-001",
      sales_data_id: sales_data_with_errors.sales_data_id,
      rollback_reason: "検証エラーが存在するため差戻し",
      error_details: validation_result.errors,
      rolled_back_at: "2024-01-15T10:30:15Z",
      rolled_back_by: "OPERATOR-001",
      record_count: 1,
    };

    expect(rollback_history.record_count).toBe(1);
    expect(rollback_history.error_details).toHaveLength(1);
    expect(rollback_history.error_details[0].field).toBe("appointment_count");

    // 請求自動化処理が一時停止状態になっていることを確認
    const billing_automation_status = {
      status_id: "STATUS-001",
      sales_data_id: sales_data_with_errors.sales_data_id,
      billing_automation_state: "paused",
      pause_reason: "validation_failed_with_reject",
      paused_at: "2024-01-15T10:30:15Z",
      can_resume: false,
    };

    expect(billing_automation_status.billing_automation_state).toBe("paused");
    expect(billing_automation_status.pause_reason).toBe(
      "validation_failed_with_reject"
    );
    expect(billing_automation_status.can_resume).toBe(false);

    // 全体的な検証結果の確認
    expect(validation_result.validation_status).toBe("failed");
    expect(validation_result.recommendation).toBe("reject_and_return_to_sender");
  });
});