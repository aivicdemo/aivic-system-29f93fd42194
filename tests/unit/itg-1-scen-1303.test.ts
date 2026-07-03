import { aggregateBillingByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('顧客別・サービス別請求額集計機能 - 計算ロジック例外処理', () => {
  test('SCEN-1303: 営業データに計算ロジック例外が発生した場合、エラー内容が記録され集計処理が中断される', () => {
    // 計算ロジック例外を引き起こす異常な営業データセット（null値、負の数値、無効な通貨単位）
    const sales_data_with_exception = [
      {
        customer_id: 'CUST001',
        service_id: 'SVC001',
        appointment_count: 5,
        closing_count: 2,
        revenue_amount: 150000,
        currency_unit: 'JPY'
      },
      {
        customer_id: 'CUST001',
        service_id: 'SVC001',
        appointment_count: null, // null値による計算ロジック例外
        closing_count: 1,
        revenue_amount: 100000,
        currency_unit: 'JPY'
      }
    ];

    const contract_rules = {
      CUST001: {
        base_fee: 50000,
        commission_rate: 0.05,
        discount_rate: 0.1
      }
    };

    // 計算ロジック例外が発生し、処理が中断される
    expect(() => {
      aggregateBillingByCustomerAndService(sales_data_with_exception, contract_rules);
    }).toThrow(/計算ロジック/);
  });

  test('SCEN-1303-2: 負の数値による計算ロジック例外が発生した場合、エラーが記録される', () => {
    const sales_data_with_negative = [
      {
        customer_id: 'CUST002',
        service_id: 'SVC002',
        appointment_count: 3,
        closing_count: 1,
        revenue_amount: -50000, // 負の数値による計算ロジック例外
        currency_unit: 'JPY'
      }
    ];

    const contract_rules = {
      CUST002: {
        base_fee: 30000,
        commission_rate: 0.05,
        discount_rate: 0
      }
    };

    expect(() => {
      aggregateBillingByCustomerAndService(sales_data_with_negative, contract_rules);
    }).toThrow(/売上金額/);
  });

  test('SCEN-1303-3: 無効な通貨単位による計算ロジック例外が発生した場合、エラーが記録される', () => {
    const sales_data_with_invalid_currency = [
      {
        customer_id: 'CUST003',
        service_id: 'SVC003',
        appointment_count: 4,
        closing_count: 2,
        revenue_amount: 200000,
        currency_unit: 'INVALID' // 無効な通貨単位
      }
    ];

    const contract_rules = {
      CUST003: {
        base_fee: 60000,
        commission_rate: 0.05,
        discount_rate: 0.05
      }
    };

    expect(() => {
      aggregateBillingByCustomerAndService(sales_data_with_invalid_currency, contract_rules);
    }).toThrow(/通貨/);
  });

  test('SCEN-1303-4: 正常なデータで集計が成功し、顧客別・サービス別の請求額が正確に計算される', () => {
    const sales_data_valid = [
      {
        customer_id: 'CUST001',
        service_id: 'SVC001',
        appointment_count: 10,
        closing_count: 5,
        revenue_amount: 500000,
        currency_unit: 'JPY'
      },
      {
        customer_id: 'CUST001',
        service_id: 'SVC002',
        appointment_count: 8,
        closing_count: 3,
        revenue_amount: 300000,
        currency_unit: 'JPY'
      },
      {
        customer_id: 'CUST002',
        service_id: 'SVC001',
        appointment_count: 6,
        closing_count: 2,
        revenue_amount: 250000,
        currency_unit: 'JPY'
      }
    ];

    const contract_rules = {
      CUST001: {
        base_fee: 50000,
        commission_rate: 0.05,
        discount_rate: 0.1
      },
      CUST002: {
        base_fee: 40000,
        commission_rate: 0.05,
        discount_rate: 0.05
      }
    };

    const result = aggregateBillingByCustomerAndService(sales_data_valid, contract_rules);

    // CUST001_SVC001: 基本料金 50000 + (500000 * 0.05) = 75000、割引 10% = 67500
    // CUST001_SVC002: 基本料金 50000 + (300000 * 0.05) = 65000、割引 10% = 58500
    // CUST002_SVC001: 基本料金 40000 + (250000 * 0.05) = 52500、割引 5% = 49875
    expect(result).toEqual({
      'CUST001_SVC001': {
        customer_id: 'CUST001',
        service_id: 'SVC001',
        billing_amount: 67500,
        currency_unit: 'JPY'
      },
      'CUST001_SVC002': {
        customer_id: 'CUST001',
        service_id: 'SVC002',
        billing_amount: 58500,
        currency_unit: 'JPY'
      },
      'CUST002_SVC001': {
        customer_id: 'CUST002',
        service_id: 'SVC001',
        billing_amount: 49875,
        currency_unit: 'JPY'
      }
    });
  });

  test('SCEN-1303-5: 空の営業データセットで集計を実行した場合、空のオブジェクトが返される', () => {
    const sales_data_empty: any[] = [];

    const contract_rules = {
      CUST001: {
        base_fee: 50000,
        commission_rate: 0.05,
        discount_rate: 0.1
      }
    };

    const result = aggregateBillingByCustomerAndService(sales_data_empty, contract_rules);

    expect(result).toEqual({});
  });

  test('SCEN-1303-6: 契約ルールに存在しない顧客のデータが含まれた場合、エラーが発生する', () => {
    const sales_data_unknown_customer = [
      {
        customer_id: 'CUST_UNKNOWN',
        service_id: 'SVC001',
        appointment_count: 5,
        closing_count: 2,
        revenue_amount: 150000,
        currency_unit: 'JPY'
      }
    ];

    const contract_rules = {
      CUST001: {
        base_fee: 50000,
        commission_rate: 0.05,
        discount_rate: 0.1
      }
    };

    expect(() => {
      aggregateBillingByCustomerAndService(sales_data_unknown_customer, contract_rules);
    }).toThrow(/契約/);
  });
});