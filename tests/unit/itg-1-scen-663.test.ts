import { validateReportApprovalCriteria } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - レポート承認基準検証", () => {
  test("SCEN-663: レポート内容がすべての承認基準を満たしている場合、承認可と判定される", () => {
    // テスト用レポートデータ準備: すべての承認基準を満たすデータ
    const report_data = {
      report_id: "RPT-2024-01-001",
      generated_at: "2024-01-15T10:00:00Z",
      submission_deadline: "2024-01-20T23:59:59Z",
      data_completeness_check: true,
      required_fields_present: true,
      numeric_values_valid: true,
      format_compliant: true,
      within_submission_deadline: true,
      total_records: 150,
      valid_records: 150,
      completeness_ratio: 1.0,
      numeric_anomalies_detected: false,
      format_violations_count: 0,
      approval_criteria: {
        data_completeness_threshold: 0.95,
        numeric_validity_required: true,
        format_compliance_required: true,
        deadline_compliance_required: true,
      },
    };

    // レポート承認判定機能を実行
    const approval_result = validateReportApprovalCriteria(report_data);

    // 期待値の計算: すべての基準を満たしているため承認可
    const expected_status = "approved";
    const expected_approval_timestamp = "2024-01-15T10:00:00Z";
    const expected_approval_reason =
      "すべての承認基準を満たしているため";

    // 判定結果を検証
    expect(approval_result.status).toBe(expected_status);
    expect(approval_result.approval_timestamp).toBe(
      expected_approval_timestamp
    );
    expect(approval_result.approval_reason).toBe(expected_approval_reason);
    expect(approval_result.is_approved).toBe(true);

    // 承認ログにタイムスタンプと判定理由が記録されていることを確認
    expect(approval_result.approval_log).toBeDefined();
    expect(approval_result.approval_log.timestamp).toBe(
      expected_approval_timestamp
    );
    expect(approval_result.approval_log.reason).toBe(expected_approval_reason);
    expect(approval_result.approval_log.criteria_validation_results).toEqual({
      data_completeness: true,
      numeric_validity: true,
      format_compliance: true,
      deadline_compliance: true,
    });

    // レポートステータスが『承認済み』に更新されることを確認
    expect(approval_result.report_status).toBe("approved");
    expect(approval_result.approved_at).toBe(expected_approval_timestamp);
  });
});