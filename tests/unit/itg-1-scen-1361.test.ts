import { validateDataTypeMapping } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業システム・バックオフィス連携検証機能", () => {
  // SCEN-1361
  test("営業システム出力データ型がバックオフィス入力要件と不一致の場合、不整合箇所が特定され修正対象として記録される", () => {
    // 営業システムから出力されたデータセット（営業機会情報、顧客情報、金額データなど）
    const salesSystemOutputData = [
      {
        row_number: 1,
        opportunity_id: "OPP001",
        customer_name: "顧客A",
        contact_date: "2024-01-15",
        appointment_count: "5",
        contract_amount: "1000000.50",
        service_type: "プレミアム",
        status: "成約"
      },
      {
        row_number: 2,
        opportunity_id: "OPP002",
        customer_name: 12345,
        contact_date: "2024/01/16",
        appointment_count: 3,
        contract_amount: "不明",
        service_type: "スタンダード",
        status: "商談中"
      },
      {
        row_number: 3,
        opportunity_id: "OPP003",
        customer_name: "顧客C",
        contact_date: "2024-01-17T10:30:00Z",
        appointment_count: "7.5",
        contract_amount: 2000000,
        service_type: "ライト",
        status: "見込み"
      }
    ];

    // バックオフィスシステムの入力要件仕様書（データ型定義）
    const backofficeInputRequirements = {
      opportunity_id: {
        field_name: "opportunity_id",
        expected_type: "string",
        description: "営業機会ID"
      },
      customer_name: {
        field_name: "customer_name",
        expected_type: "string",
        description: "顧客名"
      },
      contact_date: {
        field_name: "contact_date",
        expected_type: "string",
        format: "YYYY-MM-DD",
        description: "接触日付"
      },
      appointment_count: {
        field_name: "appointment_count",
        expected_type: "number",
        description: "アポイント数"
      },
      contract_amount: {
        field_name: "contract_amount",
        expected_type: "number",
        description: "契約金額"
      },
      service_type: {
        field_name: "service_type",
        expected_type: "string",
        description: "サービス種別"
      },
      status: {
        field_name: "status",
        expected_type: "string",
        description: "ステータス"
      }
    };

    // 営業システム出力データとバックオフィス入力要件のデータ型マッピング検証機能を実行
    const validationResult = validateDataTypeMapping(
      salesSystemOutputData,
      backofficeInputRequirements
    );

    // 不整合検出ロジックが正常に動作し、データ型の相違箇所を検出したことを確認
    expect(validationResult.is_valid).toBe(false);
    expect(validationResult.validation_status).toBe("error");
    expect(validationResult.total_records_checked).toBe(3);
    expect(validationResult.total_mismatches_found).toBe(5);

    // 検出された不整合情報（フィールド名、検出されたデータ型、期待されるデータ型、行番号など）
    const mismatches = validationResult.mismatches;
    expect(mismatches.length).toBe(5);

    // 第1不整合: row 2, customer_name が number（12345）で、string 期待
    expect(mismatches[0]).toEqual({
      row_number: 2,
      field_name: "customer_name",
      detected_type: "number",
      expected_type: "string",
      detected_value: 12345,
      mismatch_reason: "データ型不一致",
      correction_priority: "high",
      record_id: "OPP002"
    });

    // 第2不整合: row 2, contact_date が "2024/01/16" で形式不一致（"2024-01-16" 期待）
    expect(mismatches[1]).toEqual({
      row_number: 2,
      field_name: "contact_date",
      detected_type: "string",
      expected_type: "string",
      detected_value: "2024/01/16",
      detected_format: "YYYY/MM/DD",
      expected_format: "YYYY-MM-DD",
      mismatch_reason: "日付形式不一致",
      correction_priority: "high",
      record_id: "OPP002"
    });

    // 第3不整合: row 2, appointment_count が 3（number）だが、string "3" 期待（実装側では number を string に変換する仕様と想定）
    // 実装側の仕様によっては許容される場合も考えられるが、ここでは strict mode での不整合として記録
    expect(mismatches[2]).toEqual({
      row_number: 2,
      field_name: "contract_amount",
      detected_type: "string",
      expected_type: "number",
      detected_value: "不明",
      mismatch_reason: "データ型不一致・値が数値に変換不可",
      correction_priority: "critical",
      record_id: "OPP002"
    });

    // 第4不整合: row 1, appointment_count が "5"（string）で、number 期待
    expect(mismatches[3]).toEqual({
      row_number: 1,
      field_name: "appointment_count",
      detected_type: "string",
      expected_type: "number",
      detected_value: "5",
      mismatch_reason: "データ型不一致",
      correction_priority: "medium",
      record_id: "OPP001"
    });

    // 第5不整合: row 3, contact_date が ISO 形式（"2024-01-17T10:30:00Z"）で、date-only 形式 期待
    expect(mismatches[4]).toEqual({
      row_number: 3,
      field_name: "contact_date",
      detected_type: "string",
      expected_type: "string",
      detected_value: "2024-01-17T10:30:00Z",
      detected_format: "ISO-8601",
      expected_format: "YYYY-MM-DD",
      mismatch_reason: "日付形式不一致",
      correction_priority: "medium",
      record_id: "OPP003"
    });

    // 修正対象として記録されたデータが修正管理テーブルに格納されていることを検証
    expect(validationResult.correction_records).toBeDefined();
    expect(validationResult.correction_records.length).toBe(5);

    const correctionRecord0 = validationResult.correction_records[0];
    expect(correctionRecord0).toEqual({
      correction_id: expect.stringMatching(/^CORR-/),
      source_row_number: 2,
      source_record_id: "OPP002",
      source_field_name: "customer_name",
      detected_value: 12345,
      detected_type: "number",
      expected_type: "string",
      expected_value: expect.any(String),
      correction_status: "pending",
      created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
      created_by: "system",
      priority: "high"
    });

    const correctionRecord2 = validationResult.correction_records[2];
    expect(correctionRecord2).toEqual({
      correction_id: expect.stringMatching(/^CORR-/),
      source_row_number: 2,
      source_record_id: "OPP002",
      source_field_name: "contract_amount",
      detected_value: "不明",
      detected_type: "string",
      expected_type: "number",
      expected_value: null,
      correction_status: "pending",
      created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
      created_by: "system",
      priority: "critical"
    });

    // これらの情報がレポート機能で参照可能な状態で保存される
    expect(validationResult.report_format).toBeDefined();
    expect(validationResult.report_format.title).toBe(
      "営業システム・バックオフィス連携データ型検証レポート"
    );
    expect(validationResult.report_format.summary).toEqual({
      validation_timestamp: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      ),
      total_records_processed: 3,
      records_with_mismatches: 2,
      total_mismatch_count: 5,
      overall_validation_result: "failed"
    });

    expect(validationResult.report_format.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row_number: 2,
          record_id: "OPP002",
          mismatch_count: 3,
          fields_affected: ["customer_name", "contact_date", "contract_amount"]
        }),
        expect.objectContaining({
          row_number: 3,
          record_id: "OPP003",
          mismatch_count: 1,
          fields_affected: ["contact_date"]
        })
      ])
    );

    expect(validationResult.report_format.export_formats).toContain("JSON");
    expect(validationResult.report_format.export_formats).toContain("CSV");
    expect(validationResult.report_format.export_formats).toContain("PDF");
  });
});