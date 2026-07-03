import { describe, test, expect } from "@jest/globals";
import {
  validateSalesDataCompleteness,
  validateSalesDataFormat,
  validateSalesDataNumericalAccuracy,
  validateSalesDataLogicalConsistency,
  generateInvoiceFromValidatedData,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("バックオフィス業務データ品質検証機能", () => {
  // SCEN-1094: [normal] 請求書作成時に営業データの完全性・正確性が自動検証される
  test("SCEN-1094: 営業データの完全性・正確性が自動検証され、検証合格時に請求書が正常に生成される", () => {
    // === 前提: テスト用営業データの準備 ===
    const sales_data_valid = {
      customer_id: "CUST-2024-001",
      customer_name: "株式会社テスト",
      customer_email: "contact@test-company.jp",
      product_id: "PROD-2024-100",
      product_name: "営業支援システム",
      transaction_date: "2024-01-15",
      quantity: 12,
      unit_price: 50000,
      tax_rate: 0.1,
      discount_rate: 0.05,
    };

    // === 1. 必須項目の存在確認 ===
    const completeness_result = validateSalesDataCompleteness(sales_data_valid);
    expect(completeness_result.is_complete).toBe(true);
    expect(completeness_result.missing_fields).toEqual([]);
    expect(completeness_result.validation_timestamp).toBeDefined();

    // === 2. 形式妥当性の検証（メールアドレス、日付形式など） ===
    const format_result = validateSalesDataFormat(sales_data_valid);
    expect(format_result.is_format_valid).toBe(true);
    expect(format_result.format_errors).toEqual([]);
    expect(format_result.email_valid).toBe(true);
    expect(format_result.date_valid).toBe(true);

    // === 3. 数値精度の検証（金額計算の正確性） ===
    const numerical_result = validateSalesDataNumericalAccuracy(
      sales_data_valid
    );
    expect(numerical_result.is_accurate).toBe(true);
    expect(numerical_result.subtotal).toBe(600000); // 12 * 50000
    expect(numerical_result.discount_amount).toBe(30000); // 600000 * 0.05
    expect(numerical_result.subtotal_after_discount).toBe(570000); // 600000 - 30000
    expect(numerical_result.tax_amount).toBe(57000); // 570000 * 0.1
    expect(numerical_result.total_amount).toBe(627000); // 570000 + 57000
    expect(numerical_result.precision_errors).toEqual([]);

    // === 4. 論理整合性の検証（矛盾がないか） ===
    const logical_result = validateSalesDataLogicalConsistency(
      sales_data_valid
    );
    expect(logical_result.is_consistent).toBe(true);
    expect(logical_result.consistency_errors).toEqual([]);
    expect(logical_result.quantity_positive).toBe(true);
    expect(logical_result.prices_reasonable).toBe(true);
    expect(logical_result.discount_within_bounds).toBe(true);
    expect(logical_result.tax_rate_valid).toBe(true);

    // === 5. 請求書生成（すべての検証に合格した場合） ===
    const invoice_result = generateInvoiceFromValidatedData(sales_data_valid);
    expect(invoice_result.success).toBe(true);
    expect(invoice_result.invoice_id).toBeDefined();
    expect(invoice_result.invoice_id).toMatch(/^INV-/);
    expect(invoice_result.customer_id).toBe("CUST-2024-001");
    expect(invoice_result.customer_name).toBe("株式会社テスト");
    expect(invoice_result.invoice_date).toBe("2024-01-15");
    expect(invoice_result.items).toHaveLength(1);
    expect(invoice_result.items[0].product_name).toBe("営業支援システム");
    expect(invoice_result.items[0].quantity).toBe(12);
    expect(invoice_result.items[0].unit_price).toBe(50000);
    expect(invoice_result.subtotal).toBe(600000);
    expect(invoice_result.discount_total).toBe(30000);
    expect(invoice_result.subtotal_after_discount).toBe(570000);
    expect(invoice_result.tax_total).toBe(57000);
    expect(invoice_result.grand_total).toBe(627000);

    // === 6. 検証ログ・監査記録の確認 ===
    expect(invoice_result.audit_log).toBeDefined();
    expect(invoice_result.audit_log.validation_steps).toEqual([
      "completeness",
      "format",
      "numerical_accuracy",
      "logical_consistency",
    ]);
    expect(invoice_result.audit_log.all_validations_passed).toBe(true);
    expect(invoice_result.audit_log.timestamp).toBeDefined();
    expect(invoice_result.audit_log.operator_id).toBeDefined();

    // === 7. 検証NG項目がある場合のエラーケース ===
    // 7-1. 必須項目欠落
    const sales_data_missing_customer = {
      ...sales_data_valid,
      customer_id: undefined,
    };
    const missing_result = validateSalesDataCompleteness(
      sales_data_missing_customer
    );
    expect(missing_result.is_complete).toBe(false);
    expect(missing_result.missing_fields).toContain("customer_id");

    // 7-2. 形式エラー（無効なメールアドレス）
    const sales_data_invalid_email = {
      ...sales_data_valid,
      customer_email: "invalid-email-format",
    };
    const invalid_email_result = validateSalesDataFormat(
      sales_data_invalid_email
    );
    expect(invalid_email_result.is_format_valid).toBe(false);
    expect(invalid_email_result.email_valid).toBe(false);
    expect(invalid_email_result.format_errors).toContain("email");

    // 7-3. 形式エラー（無効な日付形式）
    const sales_data_invalid_date = {
      ...sales_data_valid,
      transaction_date: "2024/01/15",
    };
    const invalid_date_result = validateSalesDataFormat(
      sales_data_invalid_date
    );
    expect(invalid_date_result.is_format_valid).toBe(false);
    expect(invalid_date_result.date_valid).toBe(false);
    expect(invalid_date_result.format_errors).toContain("date");

    // 7-4. 数値精度エラー（数量が負数）
    const sales_data_negative_quantity = {
      ...sales_data_valid,
      quantity: -5,
    };
    expect(() =>
      validateSalesDataNumericalAccuracy(sales_data_negative_quantity)
    ).toThrow(/数量/);

    // 7-5. 数値精度エラー（単価が負数）
    const sales_data_negative_price = {
      ...sales_data_valid,
      unit_price: -10000,
    };
    expect(() =>
      validateSalesDataNumericalAccuracy(sales_data_negative_price)
    ).toThrow(/単価/);

    // 7-6. 論理整合性エラー（税率が範囲外）
    const sales_data_invalid_tax_rate = {
      ...sales_data_valid,
      tax_rate: 1.5,
    };
    const invalid_tax_result = validateSalesDataLogicalConsistency(
      sales_data_invalid_tax_rate
    );
    expect(invalid_tax_result.is_consistent).toBe(false);
    expect(invalid_tax_result.tax_rate_valid).toBe(false);
    expect(invalid_tax_result.consistency_errors).toContain("tax_rate");

    // 7-7. 論理整合性エラー（割引率が範囲外）
    const sales_data_invalid_discount = {
      ...sales_data_valid,
      discount_rate: 1.2,
    };
    const invalid_discount_result = validateSalesDataLogicalConsistency(
      sales_data_invalid_discount
    );
    expect(invalid_discount_result.is_consistent).toBe(false);
    expect(invalid_discount_result.discount_within_bounds).toBe(false);
    expect(invalid_discount_result.consistency_errors).toContain("discount");

    // === 8. 検証NG時の請求書生成は失敗 ===
    const invoice_fail_result = generateInvoiceFromValidatedData(
      sales_data_invalid_tax_rate
    );
    expect(invoice_fail_result.success).toBe(false);
    expect(invoice_fail_result.error_message).toBeDefined();
    expect(invoice_fail_result.error_message).toMatch(/検証/);
    expect(invoice_fail_result.failed_validation_steps).toContain(
      "logical_consistency"
    );
    expect(invoice_fail_result.audit_log.all_validations_passed).toBe(false);

    // === 9. 修正が必要な項目が明確に指摘される ===
    expect(invoice_fail_result.corrections_required).toBeDefined();
    expect(invoice_fail_result.corrections_required).toHaveLength(1);
    expect(invoice_fail_result.corrections_required[0]).toMatch(/tax_rate/);

    // === 10. 複数のエラーがある場合の検証 ===
    const sales_data_multiple_errors = {
      customer_id: undefined,
      customer_name: "株式会社テスト",
      customer_email: "invalid-email",
      product_id: "PROD-2024-100",
      product_name: "営業支援システム",
      transaction_date: "2024/01/15",
      quantity: -5,
      unit_price: 50000,
      tax_rate: 1.5,
      discount_rate: 1.2,
    };

    const completeness_multiple = validateSalesDataCompleteness(
      sales_data_multiple_errors
    );
    expect(completeness_multiple.is_complete).toBe(false);
    expect(completeness_multiple.missing_fields.length).toBeGreaterThan(0);

    const format_multiple = validateSalesDataFormat(sales_data_multiple_errors);
    expect(format_multiple.is_format_valid).toBe(false);
    expect(format_multiple.format_errors.length).toBeGreaterThan(1);

    const consistency_multiple = validateSalesDataLogicalConsistency(
      sales_data_multiple_errors
    );
    expect(consistency_multiple.is_consistent).toBe(false);
    expect(consistency_multiple.consistency_errors.length).toBeGreaterThan(1);

    const invoice_multiple = generateInvoiceFromValidatedData(
      sales_data_multiple_errors
    );
    expect(invoice_multiple.success).toBe(false);
    expect(invoice_multiple.failed_validation_steps.length).toBeGreaterThan(1);
    expect(invoice_multiple.corrections_required.length).toBeGreaterThan(1);
  });
});