import { validateSystemCompatibility } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業システム・バックオフィス連携検証機能", () => {
  test("SCEN-1360: 営業システム出力データ項目・形式・更新頻度がバックオフィス入力要件と完全に互換性がある場合、検証成功と判定される", () => {
    // Arrange: 営業システム出力データの項目一覧
    const sales_system_output_fields = [
      {
        field_id: "sales_001",
        field_name: "apo_count",
        data_type: "integer",
        format: "digits(10)",
        unit: "count",
        update_frequency: "daily",
        calculation_logic: "COUNT(appointment_records WHERE status='completed')",
      },
      {
        field_id: "sales_002",
        field_name: "contract_count",
        data_type: "integer",
        format: "digits(10)",
        unit: "count",
        update_frequency: "daily",
        calculation_logic: "COUNT(contract_records WHERE status='signed')",
      },
      {
        field_id: "sales_003",
        field_name: "customer_reaction",
        data_type: "string",
        format: "varchar(255)",
        unit: "text",
        update_frequency: "daily",
        calculation_logic: "CONCATENATE(feedback_notes)",
      },
      {
        field_id: "sales_004",
        field_name: "service_type",
        data_type: "string",
        format: "varchar(50)",
        unit: "text",
        update_frequency: "daily",
        calculation_logic: "service_master.service_name",
      },
      {
        field_id: "sales_005",
        field_name: "transaction_amount",
        data_type: "decimal",
        format: "decimal(15,2)",
        unit: "JPY",
        update_frequency: "daily",
        calculation_logic: "SUM(sales_transactions.amount)",
      },
    ];

    // Arrange: バックオフィスシステムの入力要件ドキュメント
    const backoffice_input_requirements = {
      required_fields: [
        {
          field_name: "apo_count",
          data_type: "integer",
          format: "digits(10)",
          unit: "count",
          update_frequency: "daily",
        },
        {
          field_name: "contract_count",
          data_type: "integer",
          format: "digits(10)",
          unit: "count",
          update_frequency: "daily",
        },
        {
          field_name: "customer_reaction",
          data_type: "string",
          format: "varchar(255)",
          unit: "text",
          update_frequency: "daily",
        },
        {
          field_name: "service_type",
          data_type: "string",
          format: "varchar(50)",
          unit: "text",
          update_frequency: "daily",
        },
        {
          field_name: "transaction_amount",
          data_type: "decimal",
          format: "decimal(15,2)",
          unit: "JPY",
          update_frequency: "daily",
        },
      ],
    };

    // Arrange: テスト用の営業システムから出力されたテストデータ
    const test_output_data = {
      apo_count: 5,
      contract_count: 2,
      customer_reaction: "Very interested in service upgrade",
      service_type: "Premium Support",
      transaction_amount: 125000.5,
      export_timestamp: "2024-01-15T10:30:00Z",
      export_status: "success",
    };

    // Arrange: 検証入力パラメータ
    const validation_input = {
      sales_system_fields: sales_system_output_fields,
      backoffice_requirements: backoffice_input_requirements,
      test_data: test_output_data,
      validation_timestamp: "2024-01-15T10:30:00Z",
    };

    // Act: 互換性検証を実行
    const validation_result = validateSystemCompatibility(validation_input);

    // Assert: 検証ステータスが「成功」
    expect(validation_result.validation_status).toBe("success");

    // Assert: すべてのフィールド互換性チェックが合格
    expect(validation_result.field_compatibility_checks.length).toBe(5);
    expect(
      validation_result.field_compatibility_checks.every(
        (check: any) => check.compatibility_status === "compatible"
      )
    ).toBe(true);

    // Assert: 全フィールドのデータ型互換性が確認される
    const apo_count_check = validation_result.field_compatibility_checks.find(
      (check: any) => check.field_name === "apo_count"
    );
    expect(apo_count_check.data_type_match).toBe(true);
    expect(apo_count_check.format_match).toBe(true);
    expect(apo_count_check.update_frequency_match).toBe(true);

    // Assert: decimal型フィールドのフォーマットが正確に一致
    const transaction_amount_check =
      validation_result.field_compatibility_checks.find(
        (check: any) => check.field_name === "transaction_amount"
      );
    expect(transaction_amount_check.data_type_match).toBe(true);
    expect(transaction_amount_check.format_match).toBe(true);
    expect(transaction_amount_check.expected_format).toBe("decimal(15,2)");

    // Assert: 全フィールドの単位が互換
    expect(
      validation_result.field_compatibility_checks.every(
        (check: any) => check.unit_match === true
      )
    ).toBe(true);

    // Assert: テストデータがバックオフィスシステムに正常に入力される
    expect(validation_result.test_data_ingestion_status).toBe("success");
    expect(validation_result.test_data_record_count).toBe(1);

    // Assert: 検証ログに成功が記録される
    expect(validation_result.validation_log_entries.length).toBeGreaterThan(0);
    const success_log = validation_result.validation_log_entries.find(
      (log: any) => log.log_level === "info" && log.message.includes("互換性")
    );
    expect(success_log).toBeDefined();
    expect(success_log.validation_result).toBe("success");

    // Assert: 互換性チェック完了タイムスタンプが記録される
    expect(validation_result.validation_completed_at).toBe(
      "2024-01-15T10:30:00Z"
    );

    // Assert: 問題がないことを示す詳細な互換性スコア
    expect(validation_result.compatibility_score).toBe(100);

    // Assert: 不整合フィールドがない
    expect(validation_result.incompatible_fields.length).toBe(0);

    // Assert: 全体的な検証サマリー
    expect(validation_result.summary).toEqual({
      total_fields_checked: 5,
      compatible_fields: 5,
      incompatible_fields: 0,
      validation_passed: true,
      compatibility_percentage: 100,
    });
  });
});