import { describe, test, expect } from '@jest/globals';
import { validateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-893: [error] 請求額計算結果検証機能 - 請求額が異常値を示す場合に修正指示が生成される
  test('請求額が異常値を示す場合に修正指示が生成される', () => {
    // 正常な請求額（参考値）
    const normalBillingInput = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      baseAmount: 100000,
      discountRate: 0.1,
      appliedDiscount: 10000,
      finalAmount: 90000
    };

    const normalResult = validateBillingAmount(normalBillingInput);
    expect(normalResult.isValid).toBe(true);
    expect(normalResult.correctionMessages).toEqual([]);

    // 異常値パターン1: 負の金額
    const negativeAmountInput = {
      customerId: 'CUST001',
      serviceId: 'SVC001',
      baseAmount: 100000,
      discountRate: 0.1,
      appliedDiscount: 10000,
      finalAmount: -90000
    };

    const negativeResult = validateBillingAmount(negativeAmountInput);
    expect(negativeResult.isValid).toBe(false);
    expect(negativeResult.correctionMessages.length).toBeGreaterThan(0);
    expect(negativeResult.correctionMessages[0]).toMatch(/負の金額/);
    expect(negativeResult.correctionMessages[0]).toMatch(/CUST001/);

    // 異常値パターン2: 異常に大きい金額
    const excessiveAmountInput = {
      customerId: 'CUST002',
      serviceId: 'SVC002',
      baseAmount: 999999999,
      discountRate: 0.05,
      appliedDiscount: 50000000,
      finalAmount: 949999999
    };

    const excessiveResult = validateBillingAmount(excessiveAmountInput);
    expect(excessiveResult.isValid).toBe(false);
    expect(excessiveResult.correctionMessages.length).toBeGreaterThan(0);
    expect(excessiveResult.correctionMessages[0]).toMatch(/異常に大きい/);

    // 異常値パターン3: NaN
    const nanAmountInput = {
      customerId: 'CUST003',
      serviceId: 'SVC003',
      baseAmount: 100000,
      discountRate: 0.1,
      appliedDiscount: 10000,
      finalAmount: NaN
    };

    const nanResult = validateBillingAmount(nanAmountInput);
    expect(nanResult.isValid).toBe(false);
    expect(nanResult.correctionMessages.length).toBeGreaterThan(0);
    expect(nanResult.correctionMessages[0]).toMatch(/NaN/);

    // 異常値パターン4: undefined
    const undefinedAmountInput = {
      customerId: 'CUST004',
      serviceId: 'SVC004',
      baseAmount: 100000,
      discountRate: 0.1,
      appliedDiscount: 10000,
      finalAmount: undefined as any
    };

    const undefinedResult = validateBillingAmount(undefinedAmountInput);
    expect(undefinedResult.isValid).toBe(false);
    expect(undefinedResult.correctionMessages.length).toBeGreaterThan(0);
    expect(undefinedResult.correctionMessages[0]).toMatch(/未定義/);

    // 異常値パターン5: 割引率が100%を超える
    const excessiveDiscountInput = {
      customerId: 'CUST005',
      serviceId: 'SVC005',
      baseAmount: 100000,
      discountRate: 1.5,
      appliedDiscount: 150000,
      finalAmount: -50000
    };

    const excessiveDiscountResult = validateBillingAmount(excessiveDiscountInput);
    expect(excessiveDiscountResult.isValid).toBe(false);
    expect(excessiveDiscountResult.correctionMessages.length).toBeGreaterThan(0);
    expect(excessiveDiscountResult.correctionMessages[0]).toMatch(/割引率/);

    // 異常値パターン6: 小数点以下の精度が不適切
    const precisionInput = {
      customerId: 'CUST006',
      serviceId: 'SVC006',
      baseAmount: 100000,
      discountRate: 0.1,
      appliedDiscount: 10000,
      finalAmount: 90000.123456789
    };

    const precisionResult = validateBillingAmount(precisionInput);
    expect(precisionResult.isValid).toBe(false);
    expect(precisionResult.correctionMessages.length).toBeGreaterThan(0);
    expect(precisionResult.correctionMessages[0]).toMatch(/精度/);

    // 修正指示メッセージの形式確認: 異常値の種類と発生箇所を含む
    expect(negativeResult.correctionMessages[0]).toContain('負の金額');
    expect(negativeResult.correctionMessages[0]).toContain('finalAmount');

    // 修正指示メッセージの形式確認: 推奨される修正内容を含む
    const hasRecommendation = negativeResult.correctionMessages.some(msg =>
      msg.match(/修正|確認|値を見直す|再計算/)
    );
    expect(hasRecommendation).toBe(true);
  });
});