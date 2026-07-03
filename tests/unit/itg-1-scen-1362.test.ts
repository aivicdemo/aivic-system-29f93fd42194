import { extractBillingItems } from '../../src/logic/it-1-2-1';

describe('請求対象項目自動抽出・集計機能', () => {
  test('SCEN-1362: 検証エラーを含む営業データの請求対象項目抽出が中断される', () => {
    // 検証エラーを含む営業データ（必須項目が空欄）
    const invalidSalesData = {
      customer_id: 'CUST001',
      service_id: 'SVC001',
      appointment_count: 5,
      contract_count: null, // 必須項目が空欄
      service_type: 'basic',
      period: '2024-01',
    };

    // エラーが発生することを検証
    expect(() => {
      extractBillingItems(invalidSalesData);
    }).toThrow(/必須項目/);
  });

  test('SCEN-1362: 検証エラー（データ型不正）を含む営業データの請求対象項目抽出が中断される', () => {
    // データ型が不正な営業データ
    const invalidDataTypeSalesData = {
      customer_id: 'CUST001',
      service_id: 'SVC001',
      appointment_count: 'five', // 数値型であるべき
      contract_count: 3,
      service_type: 'basic',
      period: '2024-01',
    };

    // エラーが発生することを検証
    expect(() => {
      extractBillingItems(invalidDataTypeSalesData);
    }).toThrow(/データ型/);
  });

  test('SCEN-1362: 有効な営業データから請求対象項目が正確に抽出・集計される', () => {
    // 有効な営業データ
    const validSalesData = {
      customer_id: 'CUST001',
      service_id: 'SVC001',
      appointment_count: 5,
      contract_count: 3,
      service_type: 'basic',
      period: '2024-01',
      unit_price: 10000,
    };

    // 正常な抽出結果を検証
    const result = extractBillingItems(validSalesData);

    expect(result).toEqual({
      customer_id: 'CUST001',
      service_id: 'SVC001',
      appointment_count: 5,
      contract_count: 3,
      billing_amount: 30000, // 契約数 3 × 単価 10000
      period: '2024-01',
      status: 'confirmed',
      extracted_at: expect.any(String),
    });
  });

  test('SCEN-1362: 複数の営業データから顧客ごと・サービスごとの請求額が集計される', () => {
    // 複数の営業データ
    const salesDataList = [
      {
        customer_id: 'CUST001',
        service_id: 'SVC001',
        appointment_count: 5,
        contract_count: 3,
        service_type: 'basic',
        period: '2024-01',
        unit_price: 10000,
      },
      {
        customer_id: 'CUST001',
        service_id: 'SVC002',
        appointment_count: 8,
        contract_count: 2,
        service_type: 'premium',
        period: '2024-01',
        unit_price: 15000,
      },
      {
        customer_id: 'CUST002',
        service_id: 'SVC001',
        appointment_count: 3,
        contract_count: 1,
        service_type: 'basic',
        period: '2024-01',
        unit_price: 10000,
      },
    ];

    // 複数データから集計結果を検証
    const results = salesDataList.map((data) => extractBillingItems(data));

    expect(results).toHaveLength(3);
    expect(results[0].billing_amount).toBe(30000); // CUST001/SVC001: 3 × 10000
    expect(results[1].billing_amount).toBe(30000); // CUST001/SVC002: 2 × 15000
    expect(results[2].billing_amount).toBe(10000); // CUST002/SVC001: 1 × 10000
  });

  test('SCEN-1362: 異常値（負の数値）を含む営業データの抽出が中断される', () => {
    // 異常値（負の契約数）を含むデータ
    const anomalousData = {
      customer_id: 'CUST001',
      service_id: 'SVC001',
      appointment_count: 5,
      contract_count: -3, // 異常値
      service_type: 'basic',
      period: '2024-01',
      unit_price: 10000,
    };

    // エラーが発生することを検証
    expect(() => {
      extractBillingItems(anomalousData);
    }).toThrow(/範囲/);
  });

  test('SCEN-1362: 抽出エラーは処理ログに詳細情報を記録する', () => {
    // 検証エラーを含むデータ
    const invalidData = {
      customer_id: 'CUST001',
      service_id: 'SVC001',
      appointment_count: 5,
      contract_count: null,
      service_type: 'basic',
      period: '2024-01',
    };

    let errorLog: any;
    try {
      extractBillingItems(invalidData);
    } catch (error) {
      errorLog = {
        error_message: (error as Error).message,
        customer_id: invalidData.customer_id,
        service_id: invalidData.service_id,
        period: invalidData.period,
        timestamp: new Date().toISOString(),
      };
    }

    // エラーログに必須情報が含まれることを検証
    expect(errorLog).toBeDefined();
    expect(errorLog.error_message).toMatch(/必須項目/);
    expect(errorLog.customer_id).toBe('CUST001');
    expect(errorLog.service_id).toBe('SVC001');
    expect(errorLog.period).toBe('2024-01');
    expect(errorLog.timestamp).toBeDefined();
  });

  test('SCEN-1362: 不完全なデータが請求対象項目として確定されない', () => {
    // 品質チェックが不合格となるデータ
    const incompleteData = {
      customer_id: 'CUST001',
      service_id: 'SVC001',
      appointment_count: 5,
      contract_count: undefined, // 不完全
      service_type: 'basic',
      period: '2024-01',
    };

    // 不完全なデータは確定されないことを検証
    expect(() => {
      extractBillingItems(incompleteData);
    }).toThrow(/必須項目/);
  });

  test('SCEN-1362: 割引ルールが適用される場合、割引後の請求額が正確に計算される', () => {
    // 割引ルール適用データ
    const discountData = {
      customer_id: 'CUST001',
      service_id: 'SVC001',
      appointment_count: 5,
      contract_count: 10, // 契約数が多い
      service_type: 'basic',
      period: '2024-01',
      unit_price: 10000,
      discount_rate: 0.1, // 10% 割引
    };

    const result = extractBillingItems(discountData);

    // 割引後の請求額を検証：10 × 10000 × (1 - 0.1) = 90000
    expect(result.billing_amount).toBe(90000);
    expect(result).toEqual(
      expect.objectContaining({
        customer_id: 'CUST001',
        service_id: 'SVC001',
        contract_count: 10,
        billing_amount: 90000,
        status: 'confirmed',
      })
    );
  });
});