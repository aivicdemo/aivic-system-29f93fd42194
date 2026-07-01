import { describe, test, expect } from '@jest/globals';
import { extractBillableItemsByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し顧客ごと・サービスごとに集計', () => {
  // SCEN-1019
  test('複数顧客の営業データから請求対象項目が正確に抽出される', () => {
    const salesData = [
      {
        id: 'sales_001',
        customer_id: 'cust_A',
        service_id: 'svc_1',
        transaction_type: 'appointment',
        amount: 5000,
        status: 'completed',
      },
      {
        id: 'sales_002',
        customer_id: 'cust_A',
        service_id: 'svc_1',
        transaction_type: 'appointment',
        amount: 3000,
        status: 'completed',
      },
      {
        id: 'sales_003',
        customer_id: 'cust_A',
        service_id: 'svc_2',
        transaction_type: 'contract',
        amount: 10000,
        status: 'completed',
      },
      {
        id: 'sales_004',
        customer_id: 'cust_A',
        service_id: 'svc_2',
        transaction_type: 'cancellation',
        amount: -2000,
        status: 'completed',
      },
      {
        id: 'sales_005',
        customer_id: 'cust_B',
        service_id: 'svc_1',
        transaction_type: 'appointment',
        amount: 7000,
        status: 'completed',
      },
      {
        id: 'sales_006',
        customer_id: 'cust_B',
        service_id: 'svc_3',
        transaction_type: 'contract',
        amount: 15000,
        status: 'completed',
      },
      {
        id: 'sales_007',
        customer_id: 'cust_B',
        service_id: 'svc_3',
        transaction_type: 'return',
        amount: -5000,
        status: 'completed',
      },
      {
        id: 'sales_008',
        customer_id: 'cust_C',
        service_id: 'svc_2',
        transaction_type: 'contract',
        amount: 20000,
        status: 'completed',
      },
      {
        id: 'sales_009',
        customer_id: 'cust_C',
        service_id: 'svc_2',
        transaction_type: 'appointment',
        amount: 4000,
        status: 'completed',
      },
      {
        id: 'sales_010',
        customer_id: 'cust_A',
        service_id: 'svc_1',
        transaction_type: 'appointment',
        amount: null,
        status: 'completed',
      },
      {
        id: 'sales_011',
        customer_id: 'cust_B',
        service_id: 'svc_2',
        transaction_type: 'appointment',
        amount: 0,
        status: 'completed',
      },
    ];

    const result = extractBillableItemsByCustomerAndService(salesData);

    expect(result).toEqual({
      cust_A: {
        svc_1: {
          items: [
            { id: 'sales_001', amount: 5000 },
            { id: 'sales_002', amount: 3000 },
          ],
          total: 8000,
          count: 2,
        },
        svc_2: {
          items: [
            { id: 'sales_003', amount: 10000 },
          ],
          total: 10000,
          count: 1,
        },
      },
      cust_B: {
        svc_1: {
          items: [
            { id: 'sales_005', amount: 7000 },
          ],
          total: 7000,
          count: 1,
        },
        svc_3: {
          items: [
            { id: 'sales_006', amount: 15000 },
          ],
          total: 15000,
          count: 1,
        },
      },
      cust_C: {
        svc_2: {
          items: [
            { id: 'sales_008', amount: 20000 },
            { id: 'sales_009', amount: 4000 },
          ],
          total: 24000,
          count: 2,
        },
      },
    });

    const cust_A_svc_1_total = result.cust_A.svc_1.total;
    expect(cust_A_svc_1_total).toBe(8000);

    const cust_A_svc_2_total = result.cust_A.svc_2.total;
    expect(cust_A_svc_2_total).toBe(10000);

    const cust_B_svc_1_total = result.cust_B.svc_1.total;
    expect(cust_B_svc_1_total).toBe(7000);

    const cust_B_svc_3_total = result.cust_B.svc_3.total;
    expect(cust_B_svc_3_total).toBe(15000);

    const cust_C_svc_2_total = result.cust_C.svc_2.total;
    expect(cust_C_svc_2_total).toBe(24000);

    expect(result.cust_A.svc_1.items.length).toBe(2);
    expect(result.cust_A.svc_2.items.length).toBe(1);
    expect(result.cust_B.svc_1.items.length).toBe(1);
    expect(result.cust_B.svc_3.items.length).toBe(1);
    expect(result.cust_C.svc_2.items.length).toBe(2);

    const all_items = [
      ...result.cust_A.svc_1.items,
      ...result.cust_A.svc_2.items,
      ...result.cust_B.svc_1.items,
      ...result.cust_B.svc_3.items,
      ...result.cust_C.svc_2.items,
    ];
    const item_ids = all_items.map((item) => item.id);
    const unique_ids = new Set(item_ids);
    expect(unique_ids.size).toBe(item_ids.length);

    expect(result).not.toHaveProperty('cust_A.svc_1.items[2]');
    expect(result).not.toHaveProperty('cust_A.svc_2.items[1]');
    expect(result).not.toHaveProperty('cust_B.svc_1.items[1]');
  });
});