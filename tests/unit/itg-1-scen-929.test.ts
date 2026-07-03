import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - エラー検出と進行遮断", () => {
  // SCEN-929: [error] 営業データ品質検証ルール適用 - 検証エラー検出時、請求額計算ステップへの進行が遮断される
  test("検証エラーが検出された場合、エラーメッセージが表示され請求額計算ステップへの進行が遮断される", () => {
    // 必須項目不足のデータ（顧客名が空）
    const invalidData_missingCustomer = {
      customer_name: "",
      contact_date: "2024-01-15",
      outcome_type: "appointment",
      appointment_status: "confirmed",
      amount: 50000,
    };

    // 第1検証: 必須項目欠落エラー
    const validationResult_missing = validateSalesData(
      invalidData_missingCustomer
    );
    expect(validationResult_missing.is_valid).toBe(false);
    expect(validationResult_missing.error_message).toMatch(/顧客名/);
    expect(validationResult_missing.can_proceed_to_billing).toBe(false);

    // データ型不整合（金額が文字列）
    const invalidData_wrongType = {
      customer_name: "顧客A",
      contact_date: "2024-01-15",
      outcome_type: "appointment",
      appointment_status: "confirmed",
      amount: "50000",
    };

    const validationResult_type = validateSalesData(invalidData_wrongType);
    expect(validationResult_type.is_valid).toBe(false);
    expect(validationResult_type.error_message).toMatch(/金額/);
    expect(validationResult_type.can_proceed_to_billing).toBe(false);

    // 値の範囲外（金額が負数）
    const invalidData_outOfRange = {
      customer_name: "顧客A",
      contact_date: "2024-01-15",
      outcome_type: "appointment",
      appointment_status: "confirmed",
      amount: -10000,
    };

    const validationResult_range = validateSalesData(invalidData_outOfRange);
    expect(validationResult_range.is_valid).toBe(false);
    expect(validationResult_range.error_message).toMatch(/範囲/);
    expect(validationResult_range.can_proceed_to_billing).toBe(false);

    // 不正な列挙値（outcome_type が定義外）
    const invalidData_invalidEnum = {
      customer_name: "顧客A",
      contact_date: "2024-01-15",
      outcome_type: "invalid_type",
      appointment_status: "confirmed",
      amount: 50000,
    };

    const validationResult_enum = validateSalesData(invalidData_invalidEnum);
    expect(validationResult_enum.is_valid).toBe(false);
    expect(validationResult_enum.error_message).toMatch(/成果種別/);
    expect(validationResult_enum.can_proceed_to_billing).toBe(false);

    // 修正後のデータ（全項目が正常）
    const validData = {
      customer_name: "顧客A",
      contact_date: "2024-01-15",
      outcome_type: "appointment",
      appointment_status: "confirmed",
      amount: 50000,
    };

    const validationResult_success = validateSalesData(validData);
    expect(validationResult_success.is_valid).toBe(true);
    expect(validationResult_success.error_message).toBe("");
    expect(validationResult_success.can_proceed_to_billing).toBe(true);

    // 進行ボタン有効化の確認
    expect(validationResult_success.can_proceed_to_billing).toBe(true);
  });
});