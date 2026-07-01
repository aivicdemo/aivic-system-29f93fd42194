import { calculateBillingAmountByCustomerService } from '../../src/logic/it-1-2-1';

describe('顧客ごと・サービスごとの請求額計算機能', () => {
  // SCEN-1295: [edge] 請求額が 0 円である場合に、最小請求額との判定が正確に行われる
  test('should correctly apply minimum billing amount when calculated amount is zero', () => {
    const input = {
      customerId: 'CUST-001',
      serviceId: 'SVC-001',
      performanceMetrics: {
        appointmentCount: 0,
        contractCount: 0,
        customerResponse: 0,
      },
      contractTerms: {
        baseFee: 0,
        performanceFeePerAppointment: 5000,
        performanceFeePerContract: 10000,
        minimumBillingAmount: 50000,
        discountRate: 0,
      },
      billingPeriod: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
    };

    const result = calculateBillingAmountByCustomerService(input);

    // 基本料金 0円 + 成果報酬(アポ数 0 × 5000 + 成約数 0 × 10000) = 0円
    // 計算結果が 0円であることを確認
    expect(result.calculatedAmount).toBe(0);

    // 最小請求額判定が正確に行われていることを確認
    // 計算額 0円 < 最小請求額 50000円 のため、最小請求額が適用される
    expect(result.finalBillingAmount).toBe(50000);

    // 最小請求額が適用されたことを示すフラグが true であることを確認
    expect(result.minimumBillingApplied).toBe(true);

    // 割引が適用されない（割引率 0%）ことを確認
    expect(result.discountAmount).toBe(0);

    // 計算ロジックが エラーなく完了していることを確認
    expect(result.status).toBe('SUCCESS');

    // 割引後の請求額が最小請求額と同じであることを確認
    expect(result.finalBillingAmount).toBe(50000);
  });

  // エラーケース: 最小請求額が設定されていない場合、0円請求が保持される
  test('should preserve zero billing amount when no minimum billing amount is configured', () => {
    const input = {
      customerId: 'CUST-002',
      serviceId: 'SVC-002',
      performanceMetrics: {
        appointmentCount: 0,
        contractCount: 0,
        customerResponse: 0,
      },
      contractTerms: {
        baseFee: 0,
        performanceFeePerAppointment: 3000,
        performanceFeePerContract: 8000,
        minimumBillingAmount: 0, // 最小請求額なし
        discountRate: 0,
      },
      billingPeriod: {
        startDate: '2024-02-01',
        endDate: '2024-02-29',
      },
    };

    const result = calculateBillingAmountByCustomerService(input);

    // 計算額が 0円であることを確認
    expect(result.calculatedAmount).toBe(0);

    // 最小請求額が設定されていないため、最終請求額も 0円のままであることを確認
    expect(result.finalBillingAmount).toBe(0);

    // 最小請求額が適用されていないことを確認
    expect(result.minimumBillingApplied).toBe(false);

    // ステータスが成功であることを確認
    expect(result.status).toBe('SUCCESS');
  });

  // 成功ケース: 請求額が 0円であっても、割引計算後に最小請求額が適用される
  test('should correctly apply minimum billing amount even with zero calculated amount and discount present', () => {
    const input = {
      customerId: 'CUST-003',
      serviceId: 'SVC-003',
      performanceMetrics: {
        appointmentCount: 0,
        contractCount: 0,
        customerResponse: 0,
      },
      contractTerms: {
        baseFee: 100000,
        performanceFeePerAppointment: 2000,
        performanceFeePerContract: 5000,
        minimumBillingAmount: 80000,
        discountRate: 1.0, // 100% 割引（特殊ケース）
      },
      billingPeriod: {
        startDate: '2024-03-01',
        endDate: '2024-03-31',
      },
    };

    const result = calculateBillingAmountByCustomerService(input);

    // 基本料金 100000円 - 100%割引 = 0円
    expect(result.calculatedAmount).toBe(0);

    // 割引額が 100000円であることを確認
    expect(result.discountAmount).toBe(100000);

    // 計算後が 0円であっても、最小請求額 80000円が適用されることを確認
    expect(result.finalBillingAmount).toBe(80000);

    // 最小請求額が適用されたことを確認
    expect(result.minimumBillingApplied).toBe(true);

    expect(result.status).toBe('SUCCESS');
  });

  // エラーケース: 不正な入力値（負の数）で例外が発生する
  test('should throw error when performanceMetrics contains negative values', () => {
    const input = {
      customerId: 'CUST-004',
      serviceId: 'SVC-004',
      performanceMetrics: {
        appointmentCount: -1, // 不正な値
        contractCount: 0,
        customerResponse: 0,
      },
      contractTerms: {
        baseFee: 0,
        performanceFeePerAppointment: 5000,
        performanceFeePerContract: 10000,
        minimumBillingAmount: 50000,
        discountRate: 0,
      },
      billingPeriod: {
        startDate: '2024-04-01',
        endDate: '2024-04-30',
      },
    };

    expect(() => calculateBillingAmountByCustomerService(input)).toThrow(/アポ数/);
  });

  // エラーケース: 割引率が 1.0 を超える場合
  test('should throw error when discount rate exceeds 1.0', () => {
    const input = {
      customerId: 'CUST-005',
      serviceId: 'SVC-005',
      performanceMetrics: {
        appointmentCount: 5,
        contractCount: 2,
        customerResponse: 10,
      },
      contractTerms: {
        baseFee: 50000,
        performanceFeePerAppointment: 5000,
        performanceFeePerContract: 10000,
        minimumBillingAmount: 50000,
        discountRate: 1.5, // 150%は不正
      },
      billingPeriod: {
        startDate: '2024-05-01',
        endDate: '2024-05-31',
      },
    };

    expect(() => calculateBillingAmountByCustomerService(input)).toThrow(/割引率/);
  });

  // 境界値ケース: 計算額が正確に最小請求額と同じ場合
  test('should correctly handle when calculated amount equals minimum billing amount', () => {
    const input = {
      customerId: 'CUST-006',
      serviceId: 'SVC-006',
      performanceMetrics: {
        appointmentCount: 10,
        contractCount: 0,
        customerResponse: 0,
      },
      contractTerms: {
        baseFee: 0,
        performanceFeePerAppointment: 5000, // 10 × 5000 = 50000
        performanceFeePerContract: 0,
        minimumBillingAmount: 50000,
        discountRate: 0,
      },
      billingPeriod: {
        startDate: '2024-06-01',
        endDate: '2024-06-30',
      },
    };

    const result = calculateBillingAmountByCustomerService(input);

    // 計算額が 50000円であることを確認
    expect(result.calculatedAmount).toBe(50000);

    // 計算額が最小請求額と同じなため、最終請求額も 50000円であることを確認
    expect(result.finalBillingAmount).toBe(50000);

    // 最小請求額の判定結果（適用の必要がないため false または true のいずれか）を確認
    // 計算額 >= 最小請求額 の場合、通常は最小請求額は適用されない
    expect(result.minimumBillingApplied).toBe(false);

    expect(result.status).toBe('SUCCESS');
  });

  // 成功ケース: 複数のサービスで 0円請求が含まれる場合の正確性
  test('should correctly aggregate multiple services with zero calculated amount', () => {
    const input = {
      customerId: 'CUST-007',
      serviceId: 'SVC-007',
      performanceMetrics: {
        appointmentCount: 0,
        contractCount: 0,
        customerResponse: 0,
      },
      contractTerms: {
        baseFee: 25000,
        performanceFeePerAppointment: 0,
        performanceFeePerContract: 0,
        minimumBillingAmount: 100000,
        discountRate: 0.5, // 50% 割引
      },
      billingPeriod: {
        startDate: '2024-07-01',
        endDate: '2024-07-31',
      },
    };

    const result = calculateBillingAmountByCustomerService(input);

    // 基本料金 25000円 - 50%割引 = 12500円
    expect(result.calculatedAmount).toBe(12500);

    // 割引額が 12500円であることを確認
    expect(result.discountAmount).toBe(12500);

    // 割引後が 12500円であっても、最小請求額 100000円が適用されることを確認
    expect(result.finalBillingAmount).toBe(100000);

    // 最小請求額が適用されたことを確認
    expect(result.minimumBillingApplied).toBe(true);

    expect(result.status).toBe('SUCCESS');
  });

  // エラーケース: 必須フィールドが欠落している場合
  test('should throw error when required fields are missing', () => {
    const input = {
      customerId: 'CUST-008',
      serviceId: 'SVC-008',
      performanceMetrics: {
        appointmentCount: 0,
        contractCount: 0,
        // customerResponse フィールドが欠落
      },
      contractTerms: {
        baseFee: 0,
        performanceFeePerAppointment: 5000,
        performanceFeePerContract: 10000,
        minimumBillingAmount: 50000,
        discountRate: 0,
      },
      billingPeriod: {
        startDate: '2024-08-01',
        endDate: '2024-08-31',
      },
    } as any;

    expect(() => calculateBillingAmountByCustomerService(input)).toThrow(/必須項目/);
  });
});