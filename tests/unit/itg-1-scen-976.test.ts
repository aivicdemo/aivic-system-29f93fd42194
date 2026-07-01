import { validateBillingCalculationAgainstManual } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-976: 割引適用時の請求額計算結果が手順書ルールに逸脱する場合、異常として正しく検出される', () => {
    // テストデータ: 割引適用対象の営業案件データ
    const billingCalculationInput = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      baseBillingAmount: 100000,
      discountRate: 0.15,
      discountApplicationCondition: {
        minTargetAmount: 80000,
        maxDiscountRate: 0.2,
        applicableServiceTypes: ['SVC-A', 'SVC-B']
      },
      manualCalculationRule: {
        calculationFormula: 'baseBillingAmount * (1 - discountRate)',
        expectedMinimumBillingAmount: 50000,
        expectedMaximumBillingAmount: 150000,
        allowableErrorPercentage: 0.01
      }
    };

    // 手順書ルール: 割引適用時の計算ロジック
    // 期待計算値: 100000 * (1 - 0.15) = 85000
    const expectedCalculatedAmount = 85000;
    const manualRuleDeviationThreshold = 0.01; // 1% 以内の誤差を許容

    // 正常系: 手順書ルール に従った計算結果
    const validResult = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      baseBillingAmount: 100000,
      discountRate: 0.15,
      calculatedBillingAmount: 85000,
      discountApplied: true,
      discountAmount: 15000,
      isAbnormal: false,
      deviationFromManualRule: 0,
      errorLog: []
    };

    // 異常系: 手順書ルールに逸脱した計算結果
    // 計算誤り例: 割引を二重適用して計算 (100000 * (1 - 0.15) * (1 - 0.05) = 80750)
    const abnormalResult = {
      customerId: 'CUST-001',
      serviceId: 'SVC-A',
      baseBillingAmount: 100000,
      discountRate: 0.15,
      calculatedBillingAmount: 80750,
      discountApplied: true,
      discountAmount: 19250,
      isAbnormal: true,
      deviationFromManualRule: 0.051765, // (85000 - 80750) / 85000 ≈ 5.18% 逸脱率
      errorLog: [
        {
          errorCode: 'DISCOUNT_CALCULATION_DEVIATION',
          errorMessage: '割引適用時の請求額計算が手順書ルールから逸脱',
          deviationPercentage: 5.18,
          expectedAmount: 85000,
          actualAmount: 80750,
          severity: 'HIGH'
        }
      ]
    };

    // 正常系の検証
    const validValidationResult = validateBillingCalculationAgainstManual(
      validResult,
      billingCalculationInput.manualCalculationRule,
      manualRuleDeviationThreshold
    );

    expect(validValidationResult.isAbnormal).toBe(false);
    expect(validValidationResult.deviationFromManualRule).toBe(0);
    expect(validValidationResult.errorLog.length).toBe(0);

    // 異常系の検証: 手順書ルール逸脱を検出
    const abnormalValidationResult = validateBillingCalculationAgainstManual(
      abnormalResult,
      billingCalculationInput.manualCalculationRule,
      manualRuleDeviationThreshold
    );

    expect(abnormalValidationResult.isAbnormal).toBe(true);
    expect(abnormalValidationResult.deviationFromManualRule).toBeGreaterThan(manualRuleDeviationThreshold);
    expect(abnormalValidationResult.errorLog.length).toBeGreaterThan(0);
    expect(abnormalValidationResult.errorLog[0].errorCode).toBe('DISCOUNT_CALCULATION_DEVIATION');
    expect(abnormalValidationResult.errorLog[0].severity).toBe('HIGH');
    expect(abnormalValidationResult.errorLog[0].expectedAmount).toBe(85000);
    expect(abnormalValidationResult.errorLog[0].actualAmount).toBe(80750);

    // エラーテスト: 計算ルール違反時に例外が発生する場合
    const invalidInput = {
      customerId: 'CUST-001',
      serviceId: 'SVC-INVALID',
      baseBillingAmount: -50000, // 負の金額は不正
      discountRate: 0.15,
      calculatedBillingAmount: -42500,
      discountApplied: true,
      discountAmount: -7500,
      isAbnormal: false,
      deviationFromManualRule: 0,
      errorLog: []
    };

    expect(() =>
      validateBillingCalculationAgainstManual(
        invalidInput,
        billingCalculationInput.manualCalculationRule,
        manualRuleDeviationThreshold
      )
    ).toThrow(/金額/);

    // エラーテスト: 割引率が手順書の上限を超える場合
    const excessiveDiscountInput = {
      ...abnormalResult,
      discountRate: 0.35, // 手順書上限 0.2を超過
      calculatedBillingAmount: 65000, // 100000 * (1 - 0.35)
      discountAmount: 35000
    };

    expect(() =>
      validateBillingCalculationAgainstManual(
        excessiveDiscountInput,
        billingCalculationInput.manualCalculationRule,
        manualRuleDeviationThreshold
      )
    ).toThrow(/割引率/);

    // エラーテスト: 計算結果が手順書の最小・最大範囲外の場合
    const outOfRangeInput = {
      ...abnormalResult,
      calculatedBillingAmount: 200000, // 手順書最大上限 150000 超過
      isAbnormal: false,
      errorLog: []
    };

    const outOfRangeValidationResult = validateBillingCalculationAgainstManual(
      outOfRangeInput,
      billingCalculationInput.manualCalculationRule,
      manualRuleDeviationThreshold
    );

    expect(outOfRangeValidationResult.isAbnormal).toBe(true);
    expect(outOfRangeValidationResult.errorLog.some(
      log => log.errorCode === 'BILLING_AMOUNT_OUT_OF_RANGE'
    )).toBe(true);
  });
});