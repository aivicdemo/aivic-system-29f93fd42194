import { describe, test, expect } from "@jest/globals";
import {
  executeValidationApproval,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証レポート - 検証結果承認判定", () => {
  // SCEN-1004: [normal] 検証結果レポート確認・承認判定 - 検証結果レポートが正常かつ完全である場合に承認判定が正確に実行される
  test("正常かつ完全な検証結果レポートに対して承認判定が正確に実行される", () => {
    const validationReport = {
      report_id: "RPT-2024-001",
      validation_date: new Date("2024-01-15T10:30:00Z"),
      validator_id: "USR-001",
      validator_name: "営業オペレーター太郎",
      total_records: 150,
      error_records: 0,
      warning_records: 3,
      passed_records: 147,
      data_quality_score: 98.0,
      required_items_complete: true,
      data_type_valid: true,
      range_valid: true,
      anomaly_detected: false,
      report_status: "complete",
    };

    const approver_id = "USR-ADMIN-001";
    const approver_name = "代表兼営業オペレーター花子";
    const approval_timestamp = new Date("2024-01-15T11:00:00Z");

    const result = executeValidationApproval({
      validation_report: validationReport,
      approver_id: approver_id,
      approver_name: approver_name,
      approval_timestamp: approval_timestamp,
    });

    // 承認ステータスが「承認済み」であることを確認
    expect(result.approval_status).toBe("承認済み");

    // 承認ログに承認日時が正確に記録されていることを確認
    expect(result.approval_log.approval_timestamp).toEqual(approval_timestamp);

    // 承認ログに承認者情報が正確に記録されていることを確認
    expect(result.approval_log.approver_id).toBe(approver_id);
    expect(result.approval_log.approver_name).toBe(approver_name);

    // 承認ログに承認理由が記録されていることを確認
    expect(result.approval_log.approval_reason).toBe(
      "データ品質スコア98.0%、必須項目完全、異常値なし"
    );

    // 検証結果レポートのすべての必須項目が含まれていることを確認
    expect(result.validation_report_summary.total_records).toBe(150);
    expect(result.validation_report_summary.error_records).toBe(0);
    expect(result.validation_report_summary.warning_records).toBe(3);
    expect(result.validation_report_summary.validation_date).toEqual(
      new Date("2024-01-15T10:30:00Z")
    );
    expect(result.validation_report_summary.validator_name).toBe(
      "営業オペレーター太郎"
    );

    // データ品質スコアが100%に近い値であることを確認
    expect(result.validation_report_summary.data_quality_score).toBe(98.0);
    expect(result.validation_report_summary.data_quality_score).toBeGreaterThanOrEqual(
      90.0
    );

    // 承認処理が正常に完了したことを確認
    expect(result.processing_status).toBe("completed");
    expect(result.approval_executed).toBe(true);

    // 承認後のレポートステータスが確定状態に遷移していることを確認
    expect(result.report_status_after_approval).toBe("confirmed");
  });
});