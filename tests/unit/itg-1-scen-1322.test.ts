import { describe, test, expect } from "@jest/globals";
import { validateHearingResultContradictions } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1322
  test("ヒアリング結果が矛盾する計算ルール定義を含む場合、警告が生成される", () => {
    // 正常系: 矛盾がない場合
    const validHearingResult = {
      hearing_id: "HEARING-001",
      customer_id: "CUST-A",
      discount_rate: 10,
      tax_rate: 8,
      tax_calculation_order: "after_discount",
      min_billing_amount: 10000,
      max_billing_amount: 1000000,
      commission_rate: 5,
    };

    const validResult = validateHearingResultContradictions(validHearingResult);
    expect(validResult.has_contradiction).toBe(false);
    expect(validResult.warnings).toEqual([]);
    expect(validResult.contradiction_count).toBe(0);

    // 異常系1: 割引率が100%を超える場合
    const contradictionDiscount = {
      hearing_id: "HEARING-002",
      customer_id: "CUST-B",
      discount_rate: 150,
      tax_rate: 8,
      tax_calculation_order: "after_discount",
      min_billing_amount: 10000,
      max_billing_amount: 1000000,
      commission_rate: 5,
    };

    const discountResult = validateHearingResultContradictions(
      contradictionDiscount
    );
    expect(discountResult.has_contradiction).toBe(true);
    expect(discountResult.contradiction_count).toBe(1);
    expect(discountResult.warnings.length).toBeGreaterThan(0);
    expect(discountResult.warnings[0]).toMatch(/割引率/);
    expect(discountResult.warnings[0]).toMatch(/100/);

    // 異常系2: 最小請求額が最大請求額を超えている場合
    const contradictionBillingAmount = {
      hearing_id: "HEARING-003",
      customer_id: "CUST-C",
      discount_rate: 10,
      tax_rate: 8,
      tax_calculation_order: "after_discount",
      min_billing_amount: 2000000,
      max_billing_amount: 1000000,
      commission_rate: 5,
    };

    const billingResult = validateHearingResultContradictions(
      contradictionBillingAmount
    );
    expect(billingResult.has_contradiction).toBe(true);
    expect(billingResult.contradiction_count).toBe(1);
    expect(billingResult.warnings.length).toBeGreaterThan(0);
    expect(billingResult.warnings[0]).toMatch(/最小請求額|最大請求額/);

    // 異常系3: 税計算順序が不正な場合
    const contradictionTaxOrder = {
      hearing_id: "HEARING-004",
      customer_id: "CUST-D",
      discount_rate: 10,
      tax_rate: 8,
      tax_calculation_order: "invalid_order",
      min_billing_amount: 10000,
      max_billing_amount: 1000000,
      commission_rate: 5,
    };

    const taxOrderResult = validateHearingResultContradictions(
      contradictionTaxOrder
    );
    expect(taxOrderResult.has_contradiction).toBe(true);
    expect(taxOrderResult.contradiction_count).toBeGreaterThan(0);
    expect(taxOrderResult.warnings.length).toBeGreaterThan(0);
    expect(taxOrderResult.warnings[0]).toMatch(/税計算順序|計算順序/);

    // 異常系4: 複数の矛盾が同時に存在する場合
    const multipleContradictions = {
      hearing_id: "HEARING-005",
      customer_id: "CUST-E",
      discount_rate: 120,
      tax_rate: 8,
      tax_calculation_order: "before_discount",
      min_billing_amount: 5000000,
      max_billing_amount: 1000000,
      commission_rate: 5,
    };

    const multiResult = validateHearingResultContradictions(
      multipleContradictions
    );
    expect(multiResult.has_contradiction).toBe(true);
    expect(multiResult.contradiction_count).toBeGreaterThanOrEqual(2);
    expect(multiResult.warnings.length).toBeGreaterThanOrEqual(2);

    // 異常系5: 手数料率が負数の場合
    const negativeCommission = {
      hearing_id: "HEARING-006",
      customer_id: "CUST-F",
      discount_rate: 10,
      tax_rate: 8,
      tax_calculation_order: "after_discount",
      min_billing_amount: 10000,
      max_billing_amount: 1000000,
      commission_rate: -5,
    };

    const negativeResult = validateHearingResultContradictions(
      negativeCommission
    );
    expect(negativeResult.has_contradiction).toBe(true);
    expect(negativeResult.contradiction_count).toBe(1);
    expect(negativeResult.warnings[0]).toMatch(/手数料率|commission/);

    // 異常系6: 税率が0未満の場合
    const negativeTax = {
      hearing_id: "HEARING-007",
      customer_id: "CUST-G",
      discount_rate: 10,
      tax_rate: -5,
      tax_calculation_order: "after_discount",
      min_billing_amount: 10000,
      max_billing_amount: 1000000,
      commission_rate: 5,
    };

    const negTaxResult = validateHearingResultContradictions(negativeTax);
    expect(negTaxResult.has_contradiction).toBe(true);
    expect(negTaxResult.contradiction_count).toBe(1);
    expect(negTaxResult.warnings[0]).toMatch(/税率|tax_rate/);

    // エッジケース: 全てが境界値の正常な場合
    const boundaryValid = {
      hearing_id: "HEARING-008",
      customer_id: "CUST-H",
      discount_rate: 0,
      tax_rate: 0,
      tax_calculation_order: "after_discount",
      min_billing_amount: 1,
      max_billing_amount: 999999999,
      commission_rate: 0,
    };

    const boundaryResult = validateHearingResultContradictions(boundaryValid);
    expect(boundaryResult.has_contradiction).toBe(false);
    expect(boundaryResult.contradiction_count).toBe(0);

    // エッジケース: 割引率が100%の境界値
    const boundaryDiscount100 = {
      hearing_id: "HEARING-009",
      customer_id: "CUST-I",
      discount_rate: 100,
      tax_rate: 8,
      tax_calculation_order: "after_discount",
      min_billing_amount: 10000,
      max_billing_amount: 1000000,
      commission_rate: 5,
    };

    const boundary100Result = validateHearingResultContradictions(
      boundaryDiscount100
    );
    expect(boundary100Result.has_contradiction).toBe(false);
    expect(boundary100Result.contradiction_count).toBe(0);
  });
});