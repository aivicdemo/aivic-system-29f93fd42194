import { validateRegistrationData } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  test("SCEN-1485: [error] 登録データ品質検証 - 登録データが値域外の場合、不適合データとして隔離される", () => {
    // === Setup: テストデータの準備 ===
    const valid_registration_data = {
      assessment_item_id: "ITM-001",
      assessment_value: 150000,
      quantity: 10,
      unit_price: 15000,
      region_code: "JP-13",
      work_type_code: "WT-002",
      assessment_date: "2024-01-15T10:30:00Z",
      assessor_id: "ASS-042",
    };

    // === 正常系：値域内の登録データ ===
    const result_valid = validateRegistrationData(valid_registration_data);
    expect(result_valid.is_valid).toBe(true);
    expect(result_valid.validation_errors).toEqual([]);
    expect(result_valid.quarantined_data).toBeNull();

    // === 異常系1：負数（値域外） ===
    const negative_value_data = {
      ...valid_registration_data,
      assessment_value: -50000,
    };
    const result_negative = validateRegistrationData(negative_value_data);
    expect(result_negative.is_valid).toBe(false);
    expect(result_negative.validation_errors.length).toBeGreaterThan(0);
    expect(result_negative.validation_errors[0].field_name).toBe(
      "assessment_value"
    );
    expect(result_negative.validation_errors[0].error_code).toBe(
      "INVALID_NEGATIVE_VALUE"
    );
    expect(result_negative.quarantined_data).not.toBeNull();
    expect(result_negative.quarantined_data?.input_value).toBe(-50000);
    expect(result_negative.quarantined_data?.quarantine_reason).toBe(
      "値域外（負数）"
    );
    expect(result_negative.quarantined_data?.quarantine_timestamp).toBeDefined();

    // === 異常系2：上限超過値（値域外） ===
    const exceeded_value_data = {
      ...valid_registration_data,
      assessment_value: 10000000,
    };
    const result_exceeded = validateRegistrationData(exceeded_value_data);
    expect(result_exceeded.is_valid).toBe(false);
    expect(result_exceeded.validation_errors.length).toBeGreaterThan(0);
    expect(result_exceeded.validation_errors[0].field_name).toBe(
      "assessment_value"
    );
    expect(result_exceeded.validation_errors[0].error_code).toBe(
      "EXCEEDS_UPPER_LIMIT"
    );
    expect(result_exceeded.quarantined_data).not.toBeNull();
    expect(result_exceeded.quarantined_data?.input_value).toBe(10000000);
    expect(result_exceeded.quarantined_data?.quarantine_reason).toBe(
      "値域外（上限超過）"
    );

    // === 異常系3：不正な形式（文字列値） ===
    const invalid_format_data = {
      ...valid_registration_data,
      unit_price: "invalid_string",
    };
    expect(() => validateRegistrationData(invalid_format_data)).toThrow(
      /形式/
    );

    // === 異常系4：必須フィールド欠落 ===
    const missing_field_data = {
      assessment_item_id: "ITM-002",
      assessment_value: 200000,
      // quantity フィールド欠落
      unit_price: 20000,
      region_code: "JP-13",
      work_type_code: "WT-003",
      assessment_date: "2024-01-16T11:00:00Z",
      assessor_id: "ASS-043",
    };
    expect(() => validateRegistrationData(missing_field_data)).toThrow(
      /必須/
    );

    // === 異常系5：数量が0（値域外） ===
    const zero_quantity_data = {
      ...valid_registration_data,
      quantity: 0,
    };
    const result_zero_qty = validateRegistrationData(zero_quantity_data);
    expect(result_zero_qty.is_valid).toBe(false);
    expect(result_zero_qty.validation_errors[0].field_name).toBe("quantity");
    expect(result_zero_qty.validation_errors[0].error_code).toBe(
      "INVALID_ZERO_VALUE"
    );
    expect(result_zero_qty.quarantined_data).not.toBeNull();
    expect(result_zero_qty.quarantined_data?.input_value).toBe(0);
    expect(result_zero_qty.quarantined_data?.quarantine_reason).toBe(
      "値域外（ゼロ値）"
    );

    // === 異常系6：無効な地域コード ===
    const invalid_region_data = {
      ...valid_registration_data,
      region_code: "XX-99",
    };
    const result_invalid_region = validateRegistrationData(invalid_region_data);
    expect(result_invalid_region.is_valid).toBe(false);
    expect(result_invalid_region.validation_errors[0].field_name).toBe(
      "region_code"
    );
    expect(result_invalid_region.validation_errors[0].error_code).toBe(
      "INVALID_REGION_CODE"
    );
    expect(result_invalid_region.quarantined_data).not.toBeNull();
    expect(result_invalid_region.quarantined_data?.input_value).toBe(
      "XX-99"
    );
    expect(result_invalid_region.quarantined_data?.quarantine_reason).toBe(
      "値域外（無効な地域コード）"
    );

    // === 隔離データの詳細情報検証 ===
    const quarantine_detail = result_negative.quarantined_data;
    expect(quarantine_detail?.field_name).toBe("assessment_value");
    expect(quarantine_detail?.error_code).toBe("INVALID_NEGATIVE_VALUE");
    expect(quarantine_detail?.quarantine_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
    expect(quarantine_detail?.assessor_id).toBe("ASS-042");
    expect(quarantine_detail?.is_rectifiable).toBe(true);

    // === 隔離データが本体DBへ登録されていないことの確認（結果の is_valid フラグ） ===
    expect(result_negative.is_valid).toBe(false);
    expect(result_negative.database_insert_prevented).toBe(true);
    expect(result_negative.quarantine_record_created).toBe(true);
  });
});