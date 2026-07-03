import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('顧客別・サービス別請求額計算機能', () => {
  test('SCEN-1265: 割引適用時の請求額が正確に計算される', () => {
    // 基本料金 + オプション料金
    const baseAmount = 100000;
    const optionAmount = 50000;
    const subtotal = baseAmount + optionAmount; // 150000

    // 割引率
    const customerDiscountRate = 0.10; // 顧客割引 10%
    const serviceDiscountRate = 0.05; // サービス割引 5%
    const earlyPaymentDiscountRate = 0.03; // 早期支払割引 3%

    // 計算式：最終請求額 = （基本料金 + オプション料金） × （1 - 顧客割引率） × （1 - サービス割引率） × （1 - 早期支払割引率）
    // = 150000 × (1 - 0.10) × (1 - 0.05) × (1 - 0.03)
    // = 150000 × 0.90 × 0.95 × 0.97
    // = 150000 × 0.83565
    // = 125347.5
    // 小数点以下第2位で四捨五入 => 125347.50
    const expectedFinalAmount = 125347.5;

    const input = {
      baseAmount: baseAmount,
      optionAmount: optionAmount,
      customerDiscountRate: customerDiscountRate,
      serviceDiscountRate: serviceDiscountRate,
      earlyPaymentDiscountRate: earlyPaymentDiscountRate,
    };

    const result = calculateBillingAmount(input);

    // 最終請求額の確認
    expect(result.finalAmount).toBe(expectedFinalAmount);

    // 小数点以下第2位で四捨五入されていることを確認
    expect(Math.round(result.finalAmount * 100) / 100).toBe(125347.5);

    // 計算過程の詳細内訳を確認
    expect(result.details).toBeDefined();
    expect(result.details.baseAmount).toBe(baseAmount);
    expect(result.details.optionAmount).toBe(optionAmount);
    expect(result.details.subtotal).toBe(subtotal);

    // 各割引額の計算確認
    const afterCustomerDiscount = subtotal * (1 - customerDiscountRate); // 135000
    expect(result.details.customerDiscountAmount).toBe(subtotal - afterCustomerDiscount); // 15000

    const afterServiceDiscount = afterCustomerDiscount * (1 - serviceDiscountRate); // 128250
    expect(result.details.serviceDiscountAmount).toBe(afterCustomerDiscount - afterServiceDiscount); // 6750

    const afterEarlyPaymentDiscount = afterServiceDiscount * (1 - earlyPaymentDiscountRate); // 125347.5
    expect(result.details.earlyPaymentDiscountAmount).toBe(afterServiceDiscount - afterEarlyPaymentDiscount); // 3902.5

    // 割引後料金の確認
    expect(result.details.discountedAmount).toBe(expectedFinalAmount);

    // ログに計算過程が記録されていることを確認
    expect(result.calculationLog).toBeDefined();
    expect(result.calculationLog).toContain('基本料金');
    expect(result.calculationLog).toContain('割引');
    expect(result.calculationLog).toContain('最終請求額');
  });
});