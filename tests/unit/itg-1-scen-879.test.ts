import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  // SCEN-879: [error] 営業データ異常値自動検出機能 - 営業データの形式が不正な場合に『エラー』ステータスと詳細情報が返される
  test("不正な形式の営業データを検証した場合、エラーステータスと詳細情報が返される", () => {
    // 前提: 営業データ異常値自動検出機能が初期化されている状態
    // 発生条件: 不正な形式の営業データ（必須フィールド欠落、データ型不一致、文字列制限超過など）をシステムに入力する

    // 1. 必須フィールド欠落のケース
    const data_missing_required = {
      customer_id: "CUST001",
      // contact_date が欠落（必須）
      contact_content: "商談内容",
      appointment_status: "confirmed",
    };

    const result_missing = validateSalesData(data_missing_required);

    // 期待結果: ステータスが『エラー』として返却される
    expect(result_missing.status).toBe("error");
    // エラー詳細情報に必須フィールド欠落を示す情報が含まれること
    expect(result_missing.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: "required_field_missing",
          field_name: "contact_date",
          expected_format: "ISO 8601 date string (YYYY-MM-DDTHH:mm:ssZ)",
          actual_value: null,
        }),
      ])
    );

    // 2. データ型不一致のケース
    const data_type_mismatch = {
      customer_id: "CUST002",
      contact_date: "2024-01-15T10:00:00Z",
      contact_content: "商談内容",
      appointment_status: "confirmed",
      amount: "100000", // 数値型であるべきが文字列型
    };

    const result_type = validateSalesData(data_type_mismatch);

    expect(result_type.status).toBe("error");
    expect(result_type.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: "type_mismatch",
          field_name: "amount",
          expected_format: "number (integer, >= 0)",
          actual_value: "100000",
        }),
      ])
    );

    // 3. 文字列制限超過のケース
    const data_string_limit_exceeded = {
      customer_id: "CUST003",
      contact_date: "2024-01-15T10:00:00Z",
      contact_content:
        "a".repeat(1001), // 最大1000文字を超過する文字列（1001文字）
      appointment_status: "confirmed",
    };

    const result_limit = validateSalesData(data_string_limit_exceeded);

    expect(result_limit.status).toBe("error");
    expect(result_limit.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: "string_length_exceeded",
          field_name: "contact_content",
          expected_format: "string (max 1000 characters)",
          actual_value: expect.stringContaining("a"),
        }),
      ])
    );

    // 4. 複数の形式不正がある場合
    const data_multiple_errors = {
      customer_id: "CUST004",
      // contact_date が欠落
      contact_content: "b".repeat(1001), // 文字列超過
      appointment_status: "invalid_status", // 無効な値
      amount: "50000", // 型不一致（文字列）
    };

    const result_multiple = validateSalesData(data_multiple_errors);

    expect(result_multiple.status).toBe("error");
    // 複数のエラーが全て列挙されること
    expect(result_multiple.errors.length).toBeGreaterThanOrEqual(4);
    expect(result_multiple.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: "required_field_missing",
          field_name: "contact_date",
        }),
        expect.objectContaining({
          error_type: "string_length_exceeded",
          field_name: "contact_content",
        }),
        expect.objectContaining({
          error_type: "invalid_enum_value",
          field_name: "appointment_status",
        }),
        expect.objectContaining({
          error_type: "type_mismatch",
          field_name: "amount",
        }),
      ])
    );

    // 5. 無効な enum 値のケース（appointment_status）
    const data_invalid_enum = {
      customer_id: "CUST005",
      contact_date: "2024-01-15T10:00:00Z",
      contact_content: "商談内容",
      appointment_status: "pending_invalid", // 無効な値
    };

    const result_enum = validateSalesData(data_invalid_enum);

    expect(result_enum.status).toBe("error");
    expect(result_enum.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: "invalid_enum_value",
          field_name: "appointment_status",
          expected_format: "one of [confirmed, pending, cancelled]",
          actual_value: "pending_invalid",
        }),
      ])
    );

    // 6. 日付形式不正のケース
    const data_invalid_date = {
      customer_id: "CUST006",
      contact_date: "2024-13-45", // 無効な日付形式
      contact_content: "商談内容",
      appointment_status: "confirmed",
    };

    const result_date = validateSalesData(data_invalid_date);

    expect(result_date.status).toBe("error");
    expect(result_date.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: "invalid_date_format",
          field_name: "contact_date",
          expected_format: "ISO 8601 date string (YYYY-MM-DDTHH:mm:ssZ)",
          actual_value: "2024-13-45",
        }),
      ])
    );

    // 7. 負の数値のケース（amount は 0 以上であるべき）
    const data_negative_amount = {
      customer_id: "CUST007",
      contact_date: "2024-01-15T10:00:00Z",
      contact_content: "商談内容",
      appointment_status: "confirmed",
      amount: -50000, // 負の数値
    };

    const result_negative = validateSalesData(data_negative_amount);

    expect(result_negative.status).toBe("error");
    expect(result_negative.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          error_type: "value_out_of_range",
          field_name: "amount",
          expected_format: "integer >= 0",
          actual_value: -50000,
        }),
      ])
    );

    // 8. すべてが正しい場合は成功（負のテスト）
    const data_valid = {
      customer_id: "CUST008",
      contact_date: "2024-01-15T10:00:00Z",
      contact_content: "商談内容",
      appointment_status: "confirmed",
      amount: 75000,
    };

    const result_valid = validateSalesData(data_valid);

    // この場合はエラーが空配列であること
    expect(result_valid.status).toBe("success");
    expect(result_valid.errors).toEqual([]);
  });
});