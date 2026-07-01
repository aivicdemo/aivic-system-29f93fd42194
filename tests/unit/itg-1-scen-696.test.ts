import { validateSalesActivityData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-696: [normal] 営業データ正確性検証機能 - 営業担当者による営業活動データ入力後、複数の品質検証ルールをすべて適用して矛盾を検出する
  test("複数の品質検証ルールをすべて適用して矛盾を検出する", () => {
    const input_sales_data = {
      customer_name: "A株式会社",
      product_name: "営業支援ツール",
      sales_amount: -50000,
      activity_datetime: "2025-12-31T23:59:59Z",
      status: "completed",
      contact_date: "2024-11-15",
      appointment_confirmed: true,
    };

    const result = validateSalesActivityData(input_sales_data);

    expect(result.is_valid).toBe(false);
    expect(result.validation_errors).toHaveLength(3);

    const error_types = result.validation_errors.map(
      (err: { rule_id: string; error_code: string; message: string }) =>
        err.error_code
    );
    expect(error_types).toContain("AMOUNT_RANGE_VIOLATION");
    expect(error_types).toContain("DATETIME_FUTURE_VIOLATION");
    expect(error_types).toContain("LOGICAL_CONSISTENCY_VIOLATION");

    const amount_error = result.validation_errors.find(
      (err: { error_code: string }) => err.error_code === "AMOUNT_RANGE_VIOLATION"
    );
    expect(amount_error).toBeDefined();
    expect(amount_error.message).toMatch(/売上金額/);
    expect(amount_error.message).toMatch(/マイナス/);

    const datetime_error = result.validation_errors.find(
      (err: { error_code: string }) =>
        err.error_code === "DATETIME_FUTURE_VIOLATION"
    );
    expect(datetime_error).toBeDefined();
    expect(datetime_error.message).toMatch(/活動日時/);
    expect(datetime_error.message).toMatch(/未来/);

    const logical_error = result.validation_errors.find(
      (err: { error_code: string }) =>
        err.error_code === "LOGICAL_CONSISTENCY_VIOLATION"
    );
    expect(logical_error).toBeDefined();
    expect(logical_error.message).toMatch(/矛盾/);

    expect(result.can_save).toBe(false);
    expect(result.correction_required_message).toMatch(/修正/);
  });

  test("必須項目欠落を検出する", () => {
    const input_incomplete_data = {
      customer_name: "",
      product_name: "営業支援ツール",
      sales_amount: 100000,
      activity_datetime: "2024-11-15T10:00:00Z",
      status: "completed",
    };

    const result = validateSalesActivityData(input_incomplete_data);

    expect(result.is_valid).toBe(false);
    expect(result.validation_errors).toContainEqual(
      expect.objectContaining({
        error_code: "MANDATORY_FIELD_MISSING",
      })
    );

    const missing_error = result.validation_errors.find(
      (err: { error_code: string }) =>
        err.error_code === "MANDATORY_FIELD_MISSING"
    );
    expect(missing_error.message).toMatch(/顧客名/);
  });

  test("データ型不整合を検出する", () => {
    const input_invalid_type_data = {
      customer_name: "B株式会社",
      product_name: "営業支援ツール",
      sales_amount: "abc",
      activity_datetime: "2024-11-15T10:00:00Z",
      status: "completed",
    };

    const result = validateSalesActivityData(input_invalid_type_data);

    expect(result.is_valid).toBe(false);
    expect(result.validation_errors).toContainEqual(
      expect.objectContaining({
        error_code: "DATA_TYPE_MISMATCH",
      })
    );

    const type_error = result.validation_errors.find(
      (err: { error_code: string }) => err.error_code === "DATA_TYPE_MISMATCH"
    );
    expect(type_error.message).toMatch(/売上金額/);
    expect(type_error.message).toMatch(/数値/);
  });

  test("正常なデータは検証を通過する", () => {
    const input_valid_data = {
      customer_name: "C株式会社",
      product_name: "営業支援ツール",
      sales_amount: 150000,
      activity_datetime: "2024-11-15T10:00:00Z",
      status: "completed",
      contact_date: "2024-11-14",
      appointment_confirmed: true,
    };

    const result = validateSalesActivityData(input_valid_data);

    expect(result.is_valid).toBe(true);
    expect(result.validation_errors).toHaveLength(0);
    expect(result.can_save).toBe(true);
  });

  test("複数の矛盾が同時に検出される場合の完全性を確保する", () => {
    const input_multiple_errors = {
      customer_name: "",
      product_name: "",
      sales_amount: -30000,
      activity_datetime: "2026-01-01T00:00:00Z",
      status: "invalid_status",
      contact_date: "2025-11-15",
      appointment_confirmed: false,
    };

    const result = validateSalesActivityData(input_multiple_errors);

    expect(result.is_valid).toBe(false);
    expect(result.validation_errors.length).toBeGreaterThanOrEqual(4);

    const error_codes = result.validation_errors.map(
      (err: { error_code: string }) => err.error_code
    );
    expect(error_codes).toContain("MANDATORY_FIELD_MISSING");
    expect(error_codes).toContain("AMOUNT_RANGE_VIOLATION");
    expect(error_codes).toContain("DATETIME_FUTURE_VIOLATION");

    result.validation_errors.forEach(
      (err: { rule_id: string; error_code: string; message: string }) => {
        expect(err.rule_id).toBeDefined();
        expect(err.error_code).toBeDefined();
        expect(err.message).toBeDefined();
        expect(err.message.length).toBeGreaterThan(0);
      }
    );

    expect(result.can_save).toBe(false);
  });
});