import { extractBillingItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-935: [error] 請求書・報告書配信機能 - 顧客企業種別がマスタに存在しない場合、処理が中断され不正値エラーが記録される
  test('顧客企業種別が不正な場合、エラーを記録して処理を中断する', () => {
    const invalid_customer_data = {
      customer_id: 'CUST-001',
      customer_type_code: 'INVALID_TYPE_999',
      sales_data: [
        {
          service_id: 'SVC-A',
          appointment_count: 5,
          contract_count: 2,
          service_type: 'STANDARD'
        }
      ]
    };

    const valid_customer_types = ['NORMAL', 'VIP', 'PARTNER'];

    expect(() => {
      extractBillingItems(invalid_customer_data, valid_customer_types);
    }).toThrow(/企業種別/);
  });

  test('顧客企業種別が正常な場合、請求対象項目を正確に抽出し、顧客ごと・サービスごとの請求額を集計する', () => {
    const valid_customer_data = {
      customer_id: 'CUST-001',
      customer_type_code: 'VIP',
      sales_data: [
        {
          service_id: 'SVC-A',
          appointment_count: 10,
          contract_count: 4,
          service_type: 'STANDARD'
        },
        {
          service_id: 'SVC-B',
          appointment_count: 8,
          contract_count: 3,
          service_type: 'PREMIUM'
        }
      ]
    };

    const valid_customer_types = ['NORMAL', 'VIP', 'PARTNER'];

    const billing_result = extractBillingItems(valid_customer_data, valid_customer_types);

    expect(billing_result).toEqual({
      customer_id: 'CUST-001',
      customer_type_code: 'VIP',
      billing_items_by_service: [
        {
          service_id: 'SVC-A',
          billing_amount: 12000,
          billable_appointment_count: 10,
          billable_contract_count: 4
        },
        {
          service_id: 'SVC-B',
          billing_amount: 18000,
          billable_appointment_count: 8,
          billable_contract_count: 3
        }
      ],
      total_billing_amount: 30000,
      extraction_timestamp: expect.any(String)
    });
  });

  test('複数の顧客データから請求対象項目を抽出する際、各顧客の企業種別が検証される', () => {
    const customers_with_mixed_validity = [
      {
        customer_id: 'CUST-002',
        customer_type_code: 'NORMAL',
        sales_data: [
          {
            service_id: 'SVC-A',
            appointment_count: 5,
            contract_count: 2,
            service_type: 'STANDARD'
          }
        ]
      },
      {
        customer_id: 'CUST-003',
        customer_type_code: 'UNKNOWN_TYPE',
        sales_data: [
          {
            service_id: 'SVC-B',
            appointment_count: 3,
            contract_count: 1,
            service_type: 'PREMIUM'
          }
        ]
      }
    ];

    const valid_customer_types = ['NORMAL', 'VIP', 'PARTNER'];

    expect(() => {
      customers_with_mixed_validity.forEach(customer => {
        extractBillingItems(customer, valid_customer_types);
      });
    }).toThrow(/企業種別/);
  });

  test('顧客データにサービスデータが存在しない場合、空の請求対象項目リストを返す', () => {
    const customer_without_services = {
      customer_id: 'CUST-004',
      customer_type_code: 'VIP',
      sales_data: []
    };

    const valid_customer_types = ['NORMAL', 'VIP', 'PARTNER'];

    const result = extractBillingItems(customer_without_services, valid_customer_types);

    expect(result).toEqual({
      customer_id: 'CUST-004',
      customer_type_code: 'VIP',
      billing_items_by_service: [],
      total_billing_amount: 0,
      extraction_timestamp: expect.any(String)
    });
  });

  test('請求対象外のサービスタイプが含まれる場合、フィルタリングして集計する', () => {
    const customer_with_mixed_service_types = {
      customer_id: 'CUST-005',
      customer_type_code: 'NORMAL',
      sales_data: [
        {
          service_id: 'SVC-A',
          appointment_count: 6,
          contract_count: 2,
          service_type: 'STANDARD'
        },
        {
          service_id: 'SVC-C',
          appointment_count: 4,
          contract_count: 1,
          service_type: 'TRIAL'
        }
      ]
    };

    const valid_customer_types = ['NORMAL', 'VIP', 'PARTNER'];

    const result = extractBillingItems(customer_with_mixed_service_types, valid_customer_types);

    expect(result.billing_items_by_service.length).toBe(1);
    expect(result.billing_items_by_service[0].service_id).toBe('SVC-A');
    expect(result.total_billing_amount).toBe(7200);
  });

  test('顧客企業種別がnullまたはundefinedの場合、エラーを記録して処理を中断する', () => {
    const customer_with_null_type = {
      customer_id: 'CUST-006',
      customer_type_code: null as any,
      sales_data: [
        {
          service_id: 'SVC-A',
          appointment_count: 5,
          contract_count: 2,
          service_type: 'STANDARD'
        }
      ]
    };

    const valid_customer_types = ['NORMAL', 'VIP', 'PARTNER'];

    expect(() => {
      extractBillingItems(customer_with_null_type, valid_customer_types);
    }).toThrow(/企業種別/);
  });

  test('複数サービスの請求額を集計し、顧客別の合計請求額を正確に計算する', () => {
    const multi_service_customer = {
      customer_id: 'CUST-007',
      customer_type_code: 'PARTNER',
      sales_data: [
        {
          service_id: 'SVC-A',
          appointment_count: 15,
          contract_count: 5,
          service_type: 'STANDARD'
        },
        {
          service_id: 'SVC-B',
          appointment_count: 12,
          contract_count: 4,
          service_type: 'PREMIUM'
        },
        {
          service_id: 'SVC-C',
          appointment_count: 8,
          contract_count: 3,
          service_type: 'STANDARD'
        }
      ]
    };

    const valid_customer_types = ['NORMAL', 'VIP', 'PARTNER'];

    const result = extractBillingItems(multi_service_customer, valid_customer_types);

    expect(result.billing_items_by_service.length).toBe(3);
    expect(result.total_billing_amount).toBe(54000);
    expect(result.billing_items_by_service[0].billing_amount).toBe(18000);
    expect(result.billing_items_by_service[1].billing_amount).toBe(24000);
    expect(result.billing_items_by_service[2].billing_amount).toBe(12000);
  });
});