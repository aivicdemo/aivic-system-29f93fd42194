import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-997
  test('手順書未確認の状態で請求額算出を試行した場合、エラーが返される', () => {
    const inputData = {
      customerId: 'C001',
      serviceId: 'S001',
      appointmentCount: 5,
      contractAmount: 100000,
      discountRate: 0.1,
      handbookConfirmed: false,
    };

    expect(() => calculateBillingAmount(inputData)).toThrow(/手順書/);
  });

  // 手順書確認済み時の正常系
  test('手順書確認済み且つ有効な営業データで請求額が正確に計算される', () => {
    const inputData = {
      customerId: 'C001',
      serviceId: 'S001',
      appointmentCount: 5,
      contractAmount: 100000,
      discountRate: 0.1,
      handbookConfirmed: true,
    };

    const result = calculateBillingAmount(inputData);

    // 計算ロジック: 契約額 × (1 - 割引率) = 100000 × 0.9 = 90000
    expect(result).toEqual({
      customerId: 'C001',
      serviceId: 'S001',
      billingAmount: 90000,
      discountAmount: 10000,
      status: 'approved',
    });
  });

  // 必須項目欠落時のエラー
  test('顧客IDが未指定の場合、エラーが返される', () => {
    const inputData = {
      customerId: '',
      serviceId: 'S001',
      appointmentCount: 5,
      contractAmount: 100000,
      discountRate: 0.1,
      handbookConfirmed: true,
    };

    expect(() => calculateBillingAmount(inputData)).toThrow(/顧客/);
  });

  // データ型不整合時のエラー
  test('契約額が負数の場合、エラーが返される', () => {
    const inputData = {
      customerId: 'C001',
      serviceId: 'S001',
      appointmentCount: 5,
      contractAmount: -100000,
      discountRate: 0.1,
      handbookConfirmed: true,
    };

    expect(() => calculateBillingAmount(inputData)).toThrow(/金額/);
  });

  // 割引率が範囲外時のエラー
  test('割引率が1.0を超える場合、エラーが返される', () => {
    const inputData = {
      customerId: 'C001',
      serviceId: 'S001',
      appointmentCount: 5,
      contractAmount: 100000,
      discountRate: 1.5,
      handbookConfirmed: true,
    };

    expect(() => calculateBillingAmount(inputData)).toThrow(/割引/);
  });

  // 複数顧客・複数サービスの集計
  test('複数の顧客・サービス組み合わせで請求額が正確に集計される', () => {
    const inputDataList = [
      {
        customerId: 'C001',
        serviceId: 'S001',
        appointmentCount: 5,
        contractAmount: 100000,
        discountRate: 0.1,
        handbookConfirmed: true,
      },
      {
        customerId: 'C001',
        serviceId: 'S002',
        appointmentCount: 3,
        contractAmount: 50000,
        discountRate: 0.05,
        handbookConfirmed: true,
      },
    ];

    const results = inputDataList.map((data) => calculateBillingAmount(data));

    // C001, S001: 100000 × 0.9 = 90000
    expect(results[0].billingAmount).toBe(90000);

    // C001, S002: 50000 × 0.95 = 47500
    expect(results[1].billingAmount).toBe(47500);
  });

  // 割引率0%（割引なし）の場合
  test('割引率が0の場合、請求額は契約額と一致する', () => {
    const inputData = {
      customerId: 'C002',
      serviceId: 'S003',
      appointmentCount: 10,
      contractAmount: 200000,
      discountRate: 0,
      handbookConfirmed: true,
    };

    const result = calculateBillingAmount(inputData);

    // 契約額 × (1 - 0) = 200000
    expect(result.billingAmount).toBe(200000);
    expect(result.discountAmount).toBe(0);
  });

  // アポイント数が0の場合の検証
  test('アポイント数が0の場合でも請求額は計算される', () => {
    const inputData = {
      customerId: 'C003',
      serviceId: 'S001',
      appointmentCount: 0,
      contractAmount: 50000,
      discountRate: 0.2,
      handbookConfirmed: true,
    };

    const result = calculateBillingAmount(inputData);

    // 契約額 × (1 - 割引率) = 50000 × 0.8 = 40000
    expect(result.billingAmount).toBe(40000);
    expect(result.discountAmount).toBe(10000);
  });
});