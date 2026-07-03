import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateValidationResultReport } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ検証結果レポート確認・不完全/破損レポート検出", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1006
  test("不完全または破損した検証結果レポートに対して、適切なエラーが検出され、具体的なエラーメッセージが出力される", () => {
    // ケース1: 必須フィールド欠落（validation_report_id が null）
    const incomplete_report_1 = {
      validation_report_id: null,
      validation_execution_id: "exec_20240115_001",
      target_data_type: "営業データ",
      validation_start_datetime: new Date("2024-01-15T09:00:00Z"),
      validation_end_datetime: new Date("2024-01-15T09:15:00Z"),
      total_records_checked: 150,
      passed_records_count: 145,
      failed_records_count: 5,
      validation_result_summary: "一部不合格",
      error_details: [
        {
          error_id: "err_001",
          field_name: "customer_name",
          error_type: "missing_required_field",
          affected_record_count: 3,
          error_description: "顧客名が欠落しています"
        }
      ],
      generated_at: new Date("2024-01-15T09:15:30Z"),
      generated_by_user_id: "user_rep_001"
    };

    expect(() => validateValidationResultReport(incomplete_report_1)).toThrow(
      /validation_report_id/
    );

    // ケース2: 必須フィールド欠落（validation_execution_id が undefined）
    const incomplete_report_2 = {
      validation_report_id: "rep_20240115_001",
      validation_execution_id: undefined,
      target_data_type: "営業データ",
      validation_start_datetime: new Date("2024-01-15T09:00:00Z"),
      validation_end_datetime: new Date("2024-01-15T09:15:00Z"),
      total_records_checked: 150,
      passed_records_count: 145,
      failed_records_count: 5,
      validation_result_summary: "一部不合格",
      error_details: [
        {
          error_id: "err_001",
          field_name: "amount",
          error_type: "out_of_range",
          affected_record_count: 2,
          error_description: "金額が範囲外です"
        }
      ],
      generated_at: new Date("2024-01-15T09:15:30Z"),
      generated_by_user_id: "user_rep_001"
    };

    expect(() => validateValidationResultReport(incomplete_report_2)).toThrow(
      /validation_execution_id/
    );

    // ケース3: データ形式不正（total_records_checked が負数）
    const corrupted_report_1 = {
      validation_report_id: "rep_20240115_002",
      validation_execution_id: "exec_20240115_002",
      target_data_type: "営業データ",
      validation_start_datetime: new Date("2024-01-15T10:00:00Z"),
      validation_end_datetime: new Date("2024-01-15T10:15:00Z"),
      total_records_checked: -150,
      passed_records_count: 145,
      failed_records_count: 5,
      validation_result_summary: "一部不合格",
      error_details: [],
      generated_at: new Date("2024-01-15T10:15:30Z"),
      generated_by_user_id: "user_rep_002"
    };

    expect(() => validateValidationResultReport(corrupted_report_1)).toThrow(
      /total_records_checked/
    );

    // ケース4: データ形式不正（passed_records_count > total_records_checked）
    const corrupted_report_2 = {
      validation_report_id: "rep_20240115_003",
      validation_execution_id: "exec_20240115_003",
      target_data_type: "営業データ",
      validation_start_datetime: new Date("2024-01-15T11:00:00Z"),
      validation_end_datetime: new Date("2024-01-15T11:15:00Z"),
      total_records_checked: 100,
      passed_records_count: 120,
      failed_records_count: -20,
      validation_result_summary: "不正",
      error_details: [],
      generated_at: new Date("2024-01-15T11:15:30Z"),
      generated_by_user_id: "user_rep_003"
    };

    expect(() => validateValidationResultReport(corrupted_report_2)).toThrow(
      /passed_records_count/
    );

    // ケース5: 必須フィールド欠落（error_details が null）
    const incomplete_report_3 = {
      validation_report_id: "rep_20240115_004",
      validation_execution_id: "exec_20240115_004",
      target_data_type: "営業データ",
      validation_start_datetime: new Date("2024-01-15T12:00:00Z"),
      validation_end_datetime: new Date("2024-01-15T12:15:00Z"),
      total_records_checked: 150,
      passed_records_count: 145,
      failed_records_count: 5,
      validation_result_summary: "一部不合格",
      error_details: null,
      generated_at: new Date("2024-01-15T12:15:30Z"),
      generated_by_user_id: "user_rep_004"
    };

    expect(() => validateValidationResultReport(incomplete_report_3)).toThrow(
      /error_details/
    );

    // ケース6: データ形式不正（validation_start_datetime が無効な日付）
    const corrupted_report_3 = {
      validation_report_id: "rep_20240115_005",
      validation_execution_id: "exec_20240115_005",
      target_data_type: "営業データ",
      validation_start_datetime: "invalid_date_string",
      validation_end_datetime: new Date("2024-01-15T13:15:00Z"),
      total_records_checked: 150,
      passed_records_count: 145,
      failed_records_count: 5,
      validation_result_summary: "一部不合格",
      error_details: [
        {
          error_id: "err_005",
          field_name: "contact_date",
          error_type: "data_type_mismatch",
          affected_record_count: 1,
          error_description: "日付形式が不正です"
        }
      ],
      generated_at: new Date("2024-01-15T13:15:30Z"),
      generated_by_user_id: "user_rep_005"
    };

    expect(() => validateValidationResultReport(corrupted_report_3)).toThrow(
      /validation_start_datetime/
    );

    // ケース7: データ形式不正（end_datetime が start_datetime より前）
    const corrupted_report_4 = {
      validation_report_id: "rep_20240115_006",
      validation_execution_id: "exec_20240115_006",
      target_data_type: "営業データ",
      validation_start_datetime: new Date("2024-01-15T14:15:00Z"),
      validation_end_datetime: new Date("2024-01-15T14:00:00Z"),
      total_records_checked: 150,
      passed_records_count: 145,
      failed_records_count: 5,
      validation_result_summary: "一部不合格",
      error_details: [],
      generated_at: new Date("2024-01-15T14:15:30Z"),
      generated_by_user_id: "user_rep_006"
    };

    expect(() => validateValidationResultReport(corrupted_report_4)).toThrow(
      /validation_end_datetime/
    );

    // ケース8: 正常なレポート（成功ケース）
    const valid_report = {
      validation_report_id: "rep_20240115_valid",
      validation_execution_id: "exec_20240115_valid",
      target_data_type: "営業データ",
      validation_start_datetime: new Date("2024-01-15T15:00:00Z"),
      validation_end_datetime: new Date("2024-01-15T15:15:00Z"),
      total_records_checked: 200,
      passed_records_count: 195,
      failed_records_count: 5,
      validation_result_summary: "一部不合格",
      error_details: [
        {
          error_id: "err_valid_001",
          field_name: "sales_amount",
          error_type: "out_of_range",
          affected_record_count: 5,
          error_description: "売上金額が負数です"
        }
      ],
      generated_at: new Date("2024-01-15T15:15:30Z"),
      generated_by_user_id: "user_rep_valid"
    };

    const result = validateValidationResultReport(valid_report);

    expect(result).toEqual({
      is_valid: true,
      validation_report_id: "rep_20240115_valid",
      report_status: "completed",
      passed_record_ratio: 0.975,
      failed_record_ratio: 0.025,
      error_count: 1,
      approval_status: "ready_for_review",
      message: "検証結果レポートは正常です。確認・承認が可能です。"
    });
  });
});