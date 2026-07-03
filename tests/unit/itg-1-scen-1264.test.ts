import { calculateBillingAmounts } from '../../src/logic/it-1-2-1';

describe('顧客別・サービス別請求額計算機能', () => {
  // SCEN-1264
  test('複数の請求対象項目が正確に集計され、顧客ごと・サービスごとの請求額が計算される', () => {
    const billing_items = [
      {
        customer_id: 'CUST_A',
        service_id: 'SVC_X',
        item_quantity: 10,
        unit_price: 100,
      },
      {
        customer_id: 'CUST_A',
        service_id: 'SVC_Y',
        item_quantity: 5,
        unit_price: 200,
      },
      {
        customer_id: 'CUST_B',
        service_id: 'SVC_X',
        item_quantity: 8,
        unit_price: 100,
      },
      {
        customer_id: 'CUST_B',
        service_id: 'SVC_Z',
        item_quantity: 3,
        unit_price: 300,
      },
    ];

    const result = calculateBillingAmounts({ billing_items });

    expect(result.customer_totals).toEqual({
      CUST_A: 2000,
      CUST_B: 1700,
    });

    expect(result.service_by_customer).toEqual({
      CUST_A: {
        SVC_X: 1000,
        SVC_Y: 1000,
      },
      CUST_B: {
        SVC_X: 800,
        SVC_Z: 900,
      },
    });

    expect(result.total_billing_amount).toBe(3700);
    expect(result.item_count).toBe(4);
  });
});