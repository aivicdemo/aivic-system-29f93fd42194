import { describe, it, expect, beforeEach } from '@jest/globals';
import { validateAndCalculateBillingAmount } from '../../src/logic/it-1781935279444-2-2-1';

describe('請求額算出・検証機能 - 手順書違反検出', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-978
  it('手順書に違反した請求額算出がエラーとして検出される', () => {
    // テスト用営業データ準備：基本契約金額100,000円、割引率10%、税率10%
    const validContractAmount = 100000;
    const validDiscountRate = 0.1;
    const validTaxRate = 0.1;

    // 正規手順：(基本額 - 割引額) × (1 + 税率)
    // = (100,000 - 10,000) × 1.1 = 90,000 × 1.1 = 99,000
    const expectedValidBillingAmount = 99000;

    // 正規パラメータで計算実行 - エラーが発生しないこと
    const validResult = validateAndCalculateBillingAmount({
      contractAmount: validContractAmount,
      discountRate: validDiscountRate,
      taxRate: validTaxRate,
      discountApplicationOrder: 'before_tax',
      taxCalculationOrder: 'after_discount',
    });

    expect(validResult.isValid).toBe(true);
    expect(validResult.billingAmount).toBe(expectedValidBillingAmount);
    expect(validResult.errorCode).toBeNull();

    // 手順書違反ケース1：税率計算を割引前に適用（逆転）
    // 誤手順：(基本額 × (1 + 税率)) - 割引額 = 110,000 - 10,000 = 100,000
    const invalidResult1 = validateAndCalculateBillingAmount({
      contractAmount: validContractAmount,
      discountRate: validDiscountRate,
      taxRate: validTaxRate,
      discountApplicationOrder: 'after_tax',
      taxCalculationOrder: 'before_discount',
    });

    expect(invalidResult1.isValid).toBe(false);
    expect(invalidResult1.errorCode).toBeDefined();
    expect(invalidResult1.errorCode).toMatch(/税率/);
    expect(invalidResult1.violationDetail).toBeDefined();
    expect(invalidResult1.violationDetail).toMatch(/手順書/);

    // 手順書違反ケース2：割引適用タイミング誤り（割引を税込み後に適用）
    // 誤手順では期待される計算順序に違反
    const invalidResult2 = validateAndCalculateBillingAmount({
      contractAmount: validContractAmount,
      discountRate: validDiscountRate,
      taxRate: validTaxRate,
      discountApplicationOrder: 'after_tax',
      taxCalculationOrder: 'after_discount',
    });

    expect(invalidResult2.isValid).toBe(false);
    expect(invalidResult2.errorCode).toMatch(/割引/);
    expect(invalidResult2.violationDetail).toMatch(/手順書/);

    // 再度正規手順で計算実行 - エラーが発生しないことを再確認
    const validRerunResult = validateAndCalculateBillingAmount({
      contractAmount: validContractAmount,
      discountRate: validDiscountRate,
      taxRate: validTaxRate,
      discountApplicationOrder: 'before_tax',
      taxCalculationOrder: 'after_discount',
    });

    expect(validRerunResult.isValid).toBe(true);
    expect(validRerunResult.billingAmount).toBe(expectedValidBillingAmount);
    expect(validRerunResult.errorCode).toBeNull();
    expect(validRerunResult.violationDetail).toBeNull();
  });
});