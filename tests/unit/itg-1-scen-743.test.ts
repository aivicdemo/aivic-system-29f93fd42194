import { extractBillingItems, aggregateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-743: [normal] 請求対象項目の自動抽出・集計 - 顧客ごと・サービスごとの請求額が正確に集計される
  test('複数顧客・複数サービスの請求対象項目を正確に抽出・集計する', () => {
    const sales_data = [
      {
        sales_data_id: 'sd_001',
        customer_id: 'cust_a',
        service_id: 'svc_1',
        metric_name: 'appointment_count',
        metric_value: 10,
        unit_price: 500,
        billing_flag: true,
        record_date: '2024-01-15',
      },
      {
        sales_data_id: 'sd_002',
        customer_id: 'cust_a',
        service_id: 'svc_1',
        metric_name: 'contract_count',
        metric_value: 3,
        unit_price: 2000,
        billing_flag: true,
        record_date: '2024-01-15',
      },
      {
        sales_data_id: 'sd_003',
        customer_id: 'cust_a',
        service_id: 'svc_2',
        metric_name: 'appointment_count',
        metric_value: 8,
        unit_price: 600,
        billing_flag: true,
        record_date: '2024-01-15',
      },
      {
        sales_data_id: 'sd_004',
        customer_id: 'cust_a',
        service_id: 'svc_2',
        metric_name: 'contract_count',
        metric_value: 2,
        unit_price: 1800,
        billing_flag: true,
        record_date: '2024-01-15',
      },
      {
        sales_data_id: 'sd_005',
        customer_id: 'cust_b',
        service_id: 'svc_1',
        metric_name: 'appointment_count',
        metric_value: 5,
        unit_price: 500,
        billing_flag: true,
        record_date: '2024-01-15',
      },
      {
        sales_data_id: 'sd_006',
        customer_id: 'cust_b',
        service_id: 'svc_1',
        metric_name: 'contract_count',
        metric_value: 1,
        unit_price: 2000,
        billing_flag: true,
        record_date: '2024-01-15',
      },
      {
        sales_data_id: 'sd_007',
        customer_id: 'cust_a',
        service_id: 'svc_3',
        metric_name: 'customer_satisfaction',
        metric_value: 4,
        unit_price: 300,
        billing_flag: true,
        record_date: '2024-01-15',
      },
      {
        sales_data_id: 'sd_008',
        customer_id: 'cust_c',
        service_id: 'svc_1',
        metric_name: 'appointment_count',
        metric_value: 0,
        unit_price: 500,
        billing_flag: false,
        record_date: '2024-01-15',
      },
    ];

    const extracted_items = extractBillingItems(sales_data);

    // 顧客A・サービス1の請求対象項目確認
    const cust_a_svc_1_items = extracted_items.filter(
      (item: any) => item.customer_id === 'cust_a' && item.service_id === 'svc_1'
    );
    expect(cust_a_svc_1_items.length).toBe(2);
    expect(cust_a_svc_1_items[0]).toEqual({
      sales_data_id: 'sd_001',
      customer_id: 'cust_a',
      service_id: 'svc_1',
      metric_name: 'appointment_count',
      metric_value: 10,
      unit_price: 500,
      billing_flag: true,
      record_date: '2024-01-15',
    });
    expect(cust_a_svc_1_items[1]).toEqual({
      sales_data_id: 'sd_002',
      customer_id: 'cust_a',
      service_id: 'svc_1',
      metric_name: 'contract_count',
      metric_value: 3,
      unit_price: 2000,
      billing_flag: true,
      record_date: '2024-01-15',
    });

    // 顧客A・サービス2の請求対象項目確認
    const cust_a_svc_2_items = extracted_items.filter(
      (item: any) => item.customer_id === 'cust_a' && item.service_id === 'svc_2'
    );
    expect(cust_a_svc_2_items.length).toBe(2);
    expect(cust_a_svc_2_items[0]).toEqual({
      sales_data_id: 'sd_003',
      customer_id: 'cust_a',
      service_id: 'svc_2',
      metric_name: 'appointment_count',
      metric_value: 8,
      unit_price: 600,
      billing_flag: true,
      record_date: '2024-01-15',
    });
    expect(cust_a_svc_2_items[1]).toEqual({
      sales_data_id: 'sd_004',
      customer_id: 'cust_a',
      service_id: 'svc_2',
      metric_name: 'contract_count',
      metric_value: 2,
      unit_price: 1800,
      billing_flag: true,
      record_date: '2024-01-15',
    });

    // 顧客B・サービス1の請求対象項目確認
    const cust_b_svc_1_items = extracted_items.filter(
      (item: any) => item.customer_id === 'cust_b' && item.service_id === 'svc_1'
    );
    expect(cust_b_svc_1_items.length).toBe(2);
    expect(cust_b_svc_1_items[0]).toEqual({
      sales_data_id: 'sd_005',
      customer_id: 'cust_b',
      service_id: 'svc_1',
      metric_name: 'appointment_count',
      metric_value: 5,
      unit_price: 500,
      billing_flag: true,
      record_date: '2024-01-15',
    });
    expect(cust_b_svc_1_items[1]).toEqual({
      sales_data_id: 'sd_006',
      customer_id: 'cust_b',
      service_id: 'svc_1',
      metric_name: 'contract_count',
      metric_value: 1,
      unit_price: 2000,
      billing_flag: true,
      record_date: '2024-01-15',
    });

    // 請求フラグがfalseの項目は除外されていることを確認
    const non_billable = extracted_items.filter(
      (item: any) => item.billing_flag === false
    );
    expect(non_billable.length).toBe(0);

    // 顧客A・サービス1の請求額集計: (10 * 500) + (3 * 2000) = 5000 + 6000 = 11000
    const aggregated_amounts = aggregateBillingAmount(extracted_items);
    const cust_a_svc_1_amount = aggregated_amounts.find(
      (agg: any) =>
        agg.customer_id === 'cust_a' &&
        agg.service_id === 'svc_1'
    );
    expect(cust_a_svc_1_amount.total_billing_amount).toBe(11000);

    // 顧客A・サービス2の請求額集計: (8 * 600) + (2 * 1800) = 4800 + 3600 = 8400
    const cust_a_svc_2_amount = aggregated_amounts.find(
      (agg: any) =>
        agg.customer_id === 'cust_a' &&
        agg.service_id === 'svc_2'
    );
    expect(cust_a_svc_2_amount.total_billing_amount).toBe(8400);

    // 顧客B・サービス1の請求額集計: (5 * 500) + (1 * 2000) = 2500 + 2000 = 4500
    const cust_b_svc_1_amount = aggregated_amounts.find(
      (agg: any) =>
        agg.customer_id === 'cust_b' &&
        agg.service_id === 'svc_1'
    );
    expect(cust_b_svc_1_amount.total_billing_amount).toBe(4500);

    // 顧客A・サービス3の請求額集計: (4 * 300) = 1200
    const cust_a_svc_3_amount = aggregated_amounts.find(
      (agg: any) =>
        agg.customer_id === 'cust_a' &&
        agg.service_id === 'svc_3'
    );
    expect(cust_a_svc_3_amount.total_billing_amount).toBe(1200);

    // 顧客Aの合計請求額: 11000 + 8400 + 1200 = 20600
    const cust_a_total = aggregated_amounts
      .filter((agg: any) => agg.customer_id === 'cust_a')
      .reduce((sum: number, agg: any) => sum + agg.total_billing_amount, 0);
    expect(cust_a_total).toBe(20600);

    // 顧客Bの合計請求額: 4500
    const cust_b_total = aggregated_amounts
      .filter((agg: any) => agg.customer_id === 'cust_b')
      .reduce((sum: number, agg: any) => sum + agg.total_billing_amount, 0);
    expect(cust_b_total).toBe(4500);

    // 全顧客の合計請求額: 20600 + 4500 = 25100
    const grand_total = aggregated_amounts.reduce(
      (sum: number, agg: any) => sum + agg.total_billing_amount,
      0
    );
    expect(grand_total).toBe(25100);

    // 集計結果の件数確認
    expect(aggregated_amounts.length).toBe(4);
  });
});