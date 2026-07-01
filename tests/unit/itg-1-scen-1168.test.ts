import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1168: [error] 営業データ品質検証・異常検出 - 必須項目が欠落している営業データは検証失敗と判定される
  test("必須項目が欠落した営業データは検証失敗と判定され、欠落項目の詳細エラーメッセージが返される", () => {
    // 有効なテストデータ（必須項目が全て揃っている場合）
    const valid_sales_data = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15T10:30:00Z",
      service_type: "営業代行",
      appointment_status: "確定",
      amount: 50000,
      transaction_date: "2024-01-15T10:30:00Z",
    };

    const valid_result = validateSalesData(valid_sales_data);
    expect(valid_result.is_valid).toBe(true);
    expect(valid_result.error_messages).toEqual([]);

    // 顧客名が欠落した場合
    const missing_customer_name = {
      contact_date: "2024-01-15T10:30:00Z",
      service_type: "営業代行",
      appointment_status: "確定",
      amount: 50000,
      transaction_date: "2024-01-15T10:30:00Z",
    };

    const result_missing_name = validateSalesData(missing_customer_name);
    expect(result_missing_name.is_valid).toBe(false);
    expect(result_missing_name.error_messages.length).toBeGreaterThan(0);
    expect(result_missing_name.error_messages[0]).toMatch(/顧客名/);

    // 金額が欠落した場合
    const missing_amount = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15T10:30:00Z",
      service_type: "営業代行",
      appointment_status: "確定",
      transaction_date: "2024-01-15T10:30:00Z",
    };

    const result_missing_amount = validateSalesData(missing_amount);
    expect(result_missing_amount.is_valid).toBe(false);
    expect(result_missing_amount.error_messages.length).toBeGreaterThan(0);
    expect(result_missing_amount.error_messages[0]).toMatch(/金額/);

    // 日付が欠落した場合
    const missing_date = {
      customer_name: "株式会社ABC",
      service_type: "営業代行",
      appointment_status: "確定",
      amount: 50000,
      transaction_date: "2024-01-15T10:30:00Z",
    };

    const result_missing_date = validateSalesData(missing_date);
    expect(result_missing_date.is_valid).toBe(false);
    expect(result_missing_date.error_messages.length).toBeGreaterThan(0);
    expect(result_missing_date.error_messages[0]).toMatch(/日付|接触日/);

    // 複数の必須項目が欠落した場合
    const missing_multiple = {
      service_type: "営業代行",
      appointment_status: "確定",
    };

    const result_missing_multiple = validateSalesData(missing_multiple);
    expect(result_missing_multiple.is_valid).toBe(false);
    expect(result_missing_multiple.error_messages.length).toBeGreaterThanOrEqual(2);

    // データ型が不正な場合（金額が文字列）
    const invalid_type = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15T10:30:00Z",
      service_type: "営業代行",
      appointment_status: "確定",
      amount: "50000",
      transaction_date: "2024-01-15T10:30:00Z",
    };

    const result_invalid_type = validateSalesData(invalid_type);
    expect(result_invalid_type.is_valid).toBe(false);
    expect(result_invalid_type.error_messages[0]).toMatch(/型|データ型|数値/);

    // 金額の範囲外（負数）
    const out_of_range = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15T10:30:00Z",
      service_type: "営業代行",
      appointment_status: "確定",
      amount: -10000,
      transaction_date: "2024-01-15T10:30:00Z",
    };

    const result_out_of_range = validateSalesData(out_of_range);
    expect(result_out_of_range.is_valid).toBe(false);
    expect(result_out_of_range.error_messages[0]).toMatch(/範囲|金額|異常値/);

    // 無効な日付形式
    const invalid_date_format = {
      customer_name: "株式会社ABC",
      contact_date: "2024/01/15",
      service_type: "営業代行",
      appointment_status: "確定",
      amount: 50000,
      transaction_date: "2024-01-15T10:30:00Z",
    };

    const result_invalid_date_format = validateSalesData(invalid_date_format);
    expect(result_invalid_date_format.is_valid).toBe(false);
    expect(result_invalid_date_format.error_messages[0]).toMatch(/日付|形式|ISO/);

    // 無効なステータス値
    const invalid_status = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15T10:30:00Z",
      service_type: "営業代行",
      appointment_status: "無効なステータス",
      amount: 50000,
      transaction_date: "2024-01-15T10:30:00Z",
    };

    const result_invalid_status = validateSalesData(invalid_status);
    expect(result_invalid_status.is_valid).toBe(false);
    expect(result_invalid_status.error_messages[0]).toMatch(/ステータス|アポ|確定/);

    // 処理が中断されることを確認（処理フラグが false に設定される）
    const processing_data = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15T10:30:00Z",
      service_type: "営業代行",
      appointment_status: "確定",
      amount: 50000,
    };

    const result_processing = validateSalesData(processing_data);
    expect(result_processing.is_valid).toBe(false);
    expect(result_processing.should_continue_processing).toBe(false);
  });
});