import { calculateDiscountedBillingAmount } from '../../src/logic/it-1-2-1';

describe('契約別割引基準の確認機能', () => {
  // SCEN-942: [normal] 契約別割引基準の確認機能 - 割引適用条件の判定が、契約の実績データと正確に照合される
  test('割引適用条件の判定が契約の実績データと正確に照合される', () => {
    // テストケース 1: 割引対象外（売上額が閾値未満）
    const result_no_discount = calculateDiscountedBillingAmount({
      contractId: 'CONTRACT_001',
      baseAmount: 50000,
      transactionCount: 5,
      period: 'monthly',
      discountThresholdAmount: 100000,
      discountThresholdTransactionCount: 10,
      discountRate: 0.1,
      isDiscountEligible: false,
    });
    expect(result_no_discount).toEqual({
      contractId: 'CONTRACT_001',
      baseAmount: 50000,
      discountAmount: 0,
      finalBillingAmount: 50000,
      discountApplied: false,
      reason: '売上額が割引基準に達していません',
    });

    // テストケース 2: 割引対象（売上額が閾値以上、取引件数基準を満たす）
    const result_with_discount = calculateDiscountedBillingAmount({
      contractId: 'CONTRACT_002',
      baseAmount: 150000,
      transactionCount: 15,
      period: 'monthly',
      discountThresholdAmount: 100000,
      discountThresholdTransactionCount: 10,
      discountRate: 0.1,
      isDiscountEligible: true,
    });
    expect(result_with_discount).toEqual({
      contractId: 'CONTRACT_002',
      baseAmount: 150000,
      discountAmount: 15000,
      finalBillingAmount: 135000,
      discountApplied: true,
      reason: '両方の割引基準を満たしています',
    });

    // テストケース 3: 段階的割引（売上額に応じた段階的割引率）
    const result_tiered_discount = calculateDiscountedBillingAmount({
      contractId: 'CONTRACT_003',
      baseAmount: 250000,
      transactionCount: 20,
      period: 'monthly',
      discountThresholdAmount: 100000,
      discountThresholdTransactionCount: 10,
      discountRate: 0.15,
      isDiscountEligible: true,
    });
    expect(result_tiered_discount).toEqual({
      contractId: 'CONTRACT_003',
      baseAmount: 250000,
      discountAmount: 37500,
      finalBillingAmount: 212500,
      discountApplied: true,
      reason: '段階的割引基準を適用しています',
    });

    // テストケース 4: 売上額基準は満たすが取引件数が不足
    const result_partial_criteria = calculateDiscountedBillingAmount({
      contractId: 'CONTRACT_004',
      baseAmount: 120000,
      transactionCount: 5,
      period: 'monthly',
      discountThresholdAmount: 100000,
      discountThresholdTransactionCount: 10,
      discountRate: 0.1,
      isDiscountEligible: false,
    });
    expect(result_partial_criteria).toEqual({
      contractId: 'CONTRACT_004',
      baseAmount: 120000,
      discountAmount: 0,
      finalBillingAmount: 120000,
      discountApplied: false,
      reason: '取引件数が割引基準に達していません',
    });

    // テストケース 5: 実績データなし（契約は有効だが当月実績ゼロ）
    const result_no_performance_data = calculateDiscountedBillingAmount({
      contractId: 'CONTRACT_005',
      baseAmount: 0,
      transactionCount: 0,
      period: 'monthly',
      discountThresholdAmount: 100000,
      discountThresholdTransactionCount: 10,
      discountRate: 0.1,
      isDiscountEligible: true,
    });
    expect(result_no_performance_data).toEqual({
      contractId: 'CONTRACT_005',
      baseAmount: 0,
      discountAmount: 0,
      finalBillingAmount: 0,
      discountApplied: false,
      reason: '実績データが存在しません',
    });

    // テストケース 6: 最大割引率を超過した場合（上限制御）
    const result_max_discount_cap = calculateDiscountedBillingAmount({
      contractId: 'CONTRACT_006',
      baseAmount: 500000,
      transactionCount: 50,
      period: 'monthly',
      discountThresholdAmount: 100000,
      discountThresholdTransactionCount: 10,
      discountRate: 0.25,
      isDiscountEligible: true,
      maxDiscountRate: 0.2,
    });
    expect(result_max_discount_cap).toEqual({
      contractId: 'CONTRACT_006',
      baseAmount: 500000,
      discountAmount: 100000,
      finalBillingAmount: 400000,
      discountApplied: true,
      reason: '最大割引率を適用しています',
    });

    // テストケース 7: エラーケース - 契約IDが無効
    expect(() =>
      calculateDiscountedBillingAmount({
        contractId: '',
        baseAmount: 100000,
        transactionCount: 10,
        period: 'monthly',
        discountThresholdAmount: 100000,
        discountThresholdTransactionCount: 10,
        discountRate: 0.1,
        isDiscountEligible: true,
      })
    ).toThrow(/契約ID/);

    // テストケース 8: エラーケース - 基本金額が負数
    expect(() =>
      calculateDiscountedBillingAmount({
        contractId: 'CONTRACT_008',
        baseAmount: -50000,
        transactionCount: 10,
        period: 'monthly',
        discountThresholdAmount: 100000,
        discountThresholdTransactionCount: 10,
        discountRate: 0.1,
        isDiscountEligible: true,
      })
    ).toThrow(/基本金額/);

    // テストケース 9: エラーケース - 割引率が無効範囲
    expect(() =>
      calculateDiscountedBillingAmount({
        contractId: 'CONTRACT_009',
        baseAmount: 100000,
        transactionCount: 10,
        period: 'monthly',
        discountThresholdAmount: 100000,
        discountThresholdTransactionCount: 10,
        discountRate: 1.5,
        isDiscountEligible: true,
      })
    ).toThrow(/割引率/);

    // テストケース 10: 複数年契約での割引計算
    const result_annual_contract = calculateDiscountedBillingAmount({
      contractId: 'CONTRACT_010',
      baseAmount: 1200000,
      transactionCount: 120,
      period: 'annual',
      discountThresholdAmount: 1000000,
      discountThresholdTransactionCount: 100,
      discountRate: 0.12,
      isDiscountEligible: true,
    });
    expect(result_annual_contract).toEqual({
      contractId: 'CONTRACT_010',
      baseAmount: 1200000,
      discountAmount: 144000,
      finalBillingAmount: 1056000,
      discountApplied: true,
      reason: '年間契約の割引基準を満たしています',
    });
  });
});