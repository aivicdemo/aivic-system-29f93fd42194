import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateSalesDataQuality,
  type ValidateSalesDataQualityInput,
  type ValidateSalesDataQualityOutput,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1312: [edge] 月次営業データ品質検証機能 - 営業データが空の場合（件数 0 件）、検証を完了するか中断するかの判定が正確に実行される
  test("SCEN-1312: 営業データが0件の場合、検証処理は中断またはスキップされ、適切なステータスが返却される", () => {
    // Arrange: 営業データが空の状態でテスト入力を準備
    const empty_sales_data_input: ValidateSalesDataQualityInput = {
      sales_records: [],
      validation_rules: [
        {
          rule_id: "required_customer_name",
          field_name: "customer_name",
          rule_type: "required",
          error_message: "顧客名は必須です",
        },
        {
          rule_id: "required_contact_date",
          field_name: "contact_date",
          rule_type: "required",
          error_message: "接触日時は必須です",
        },
        {
          rule_id: "valid_amount_range",
          field_name: "sales_amount",
          rule_type: "range",
          min_value: 0,
          max_value: 10000000,
          error_message: "売上金額は0～10,000,000の範囲で入力してください",
        },
      ],
      execution_timestamp: "2024-01-15T09:00:00Z",
      execution_user_id: "user_001",
    };

    // Act: 営業データ品質検証機能を実行
    const validation_result: ValidateSalesDataQualityOutput =
      validateSalesDataQuality(empty_sales_data_input);

    // Assert 1: 営業データ件数が0件であることを確認
    expect(validation_result.total_records_count).toBe(0);

    // Assert 2: 検証処理が中断またはスキップされ、ステータスが適切であることを確認
    expect(
      validation_result.validation_status === "SKIPPED" ||
        validation_result.validation_status === "COMPLETED_WITH_WARNING"
    ).toBe(true);

    // Assert 3: 検証結果レポートが生成されていることを確認
    expect(validation_result.validation_report).toBeDefined();

    // Assert 4: エラー件数が0件であることを確認（データそのものが空のため、エラーは検出されない）
    expect(validation_result.error_records_count).toBe(0);

    // Assert 5: 警告メッセージまたはスキップ理由が適切に設定されていることを確認
    expect(validation_result.validation_report.message).toMatch(/データが存在しません|検証をスキップしました|データなし/);

    // Assert 6: 検証処理が正常に完了し、システムエラーが発生していないことを確認
    expect(validation_result.is_success).toBe(true);

    // Assert 7: 検証実行日時がタイムスタンプとして記録されていることを確認
    expect(validation_result.validation_report.executed_at).toBe(
      "2024-01-15T09:00:00Z"
    );

    // Assert 8: 検証ルール適用件数が0件であることを確認（データがないため適用されない）
    expect(validation_result.validation_report.rules_applied_count).toBe(0);

    // Assert 9: 検証が完了する場合と中断する場合の両方で、次の処理へ正常に遷移できるステータスであることを確認
    expect(
      validation_result.validation_status === "SKIPPED" ||
        validation_result.validation_status === "COMPLETED"
    ).toBe(true);

    // Assert 10: システムエラーレポートが空であり、エラー状態に陥っていないことを確認
    expect(validation_result.validation_report.system_errors).toEqual([]);
  });
});