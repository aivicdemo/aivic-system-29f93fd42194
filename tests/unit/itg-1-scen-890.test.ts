import { describe, test, expect } from "@jest/globals";
import { validateBillingChecklistItem } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-890: [error] 請求書作成チェックリスト検証機能 - チェックリスト項目の検証エラーが検出され修正指示が生成される
  test("チェックリスト項目の検証エラーが検出され修正指示が生成される", () => {
    // 必須項目欠落: 顧客名が空欄
    const invalidInput_missingCustomer = {
      customer_name: "",
      contact_email: "contact@example.com",
      invoice_amount: 50000,
      service_type: "standard",
      billing_period_start: "2024-01-01",
      billing_period_end: "2024-01-31",
      payment_terms: "30days",
    };

    const result_missing_customer =
      validateBillingChecklistItem(invalidInput_missingCustomer);
    expect(result_missing_customer.is_valid).toBe(false);
    expect(result_missing_customer.error_count).toBe(1);
    expect(result_missing_customer.error_details[0].field_name).toBe(
      "customer_name"
    );
    expect(result_missing_customer.error_details[0].error_type).toBe(
      "REQUIRED_FIELD_MISSING"
    );
    expect(result_missing_customer.error_details[0].error_message).toMatch(
      /顧客名/
    );
    expect(result_missing_customer.error_details[0].expected_format).toBe(
      "顧客名は1〜100文字の日本語または英数字"
    );
    expect(result_missing_customer.correction_instruction).toMatch(
      /顧客名を入力してください/
    );

    // 形式エラー: 不正なメールアドレス
    const invalidInput_badEmail = {
      customer_name: "テスト顧客A",
      contact_email: "invalid-email-format",
      invoice_amount: 50000,
      service_type: "standard",
      billing_period_start: "2024-01-01",
      billing_period_end: "2024-01-31",
      payment_terms: "30days",
    };

    const result_bad_email =
      validateBillingChecklistItem(invalidInput_badEmail);
    expect(result_bad_email.is_valid).toBe(false);
    expect(result_bad_email.error_count).toBe(1);
    expect(result_bad_email.error_details[0].field_name).toBe(
      "contact_email"
    );
    expect(result_bad_email.error_details[0].error_type).toBe("FORMAT_ERROR");
    expect(result_bad_email.error_details[0].error_message).toMatch(
      /メールアドレス/
    );
    expect(result_bad_email.error_details[0].expected_format).toBe(
      "有効なメールアドレス形式（例：user@example.com）"
    );
    expect(result_bad_email.correction_instruction).toMatch(
      /正しいメールアドレス形式で入力してください/
    );

    // 範囲エラー: 請求額が負数
    const invalidInput_negativeAmount = {
      customer_name: "テスト顧客B",
      contact_email: "contact@example.com",
      invoice_amount: -10000,
      service_type: "standard",
      billing_period_start: "2024-01-01",
      billing_period_end: "2024-01-31",
      payment_terms: "30days",
    };

    const result_negative_amount =
      validateBillingChecklistItem(invalidInput_negativeAmount);
    expect(result_negative_amount.is_valid).toBe(false);
    expect(result_negative_amount.error_count).toBe(1);
    expect(result_negative_amount.error_details[0].field_name).toBe(
      "invoice_amount"
    );
    expect(result_negative_amount.error_details[0].error_type).toBe(
      "RANGE_ERROR"
    );
    expect(result_negative_amount.error_details[0].error_message).toMatch(
      /請求額/
    );
    expect(result_negative_amount.error_details[0].expected_format).toBe(
      "0以上1000000000以下の整数値"
    );
    expect(result_negative_amount.correction_instruction).toMatch(
      /請求額は0以上の値を入力してください/
    );

    // 複数エラー: 必須項目欠落＋形式エラー＋範囲エラー
    const invalidInput_multiple = {
      customer_name: "",
      contact_email: "bad-email",
      invoice_amount: -5000,
      service_type: "standard",
      billing_period_start: "2024-01-01",
      billing_period_end: "2024-01-31",
      payment_terms: "30days",
    };

    const result_multiple = validateBillingChecklistItem(invalidInput_multiple);
    expect(result_multiple.is_valid).toBe(false);
    expect(result_multiple.error_count).toBe(3);
    expect(result_multiple.error_details.length).toBe(3);
    expect(result_multiple.error_details.map((e) => e.field_name)).toEqual([
      "customer_name",
      "contact_email",
      "invoice_amount",
    ]);
    expect(result_multiple.correction_instruction).toMatch(/複数の項目に誤り/);

    // 修正後のデータ: すべて正常
    const validInput = {
      customer_name: "テスト顧客C",
      contact_email: "customer.c@example.com",
      invoice_amount: 100000,
      service_type: "premium",
      billing_period_start: "2024-02-01",
      billing_period_end: "2024-02-29",
      payment_terms: "60days",
    };

    const result_valid = validateBillingChecklistItem(validInput);
    expect(result_valid.is_valid).toBe(true);
    expect(result_valid.error_count).toBe(0);
    expect(result_valid.error_details.length).toBe(0);
    expect(result_valid.correction_instruction).toBe("");
  });
});