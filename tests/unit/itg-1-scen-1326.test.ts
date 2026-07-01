import { extractBillingItems, aggregateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1326: [edge] 請求対象項目の自動抽出と顧客別・サービス別請求額集計 - 複数顧客が同一サービスを利用している場合、顧客別・サービス別に正しく分離されて集計される
  test('複数顧客が同一サービスを利用している場合、顧客別・サービス別に正しく分離されて集計される', () => {
    // Arrange: テストデータの準備
    // 顧客A、B、Cが同一サービス（クラウドストレージ）を利用している場合
    const salesData = [
      {
        sales_id: 'sales_001',
        customer_id: 'cust_A',
        service_id: 'svc_storage',
        service_name: 'クラウドストレージ',
        billing_period_start: '2024-01-01',
        billing_period_end: '2024-01-31',
        usage_quantity: 100,
        unit_price: 1000,
        discount_rate: 0,
        is_billable: true,
      },
      {
        sales_id: 'sales_002',
        customer_id: 'cust_B',
        service_id: 'svc_storage',
        service_name: 'クラウドストレージ',
        billing_period_start: '2024-01-01',
        billing_period_end: '2024-01-31',
        usage_quantity: 150,
        unit_price: 1000,
        discount_rate: 0.1,
        is_billable: true,
      },
      {
        sales_id: 'sales_003',
        customer_id: 'cust_C',
        service_id: 'svc_storage',
        service_name: 'クラウドストレージ',
        billing_period_start: '2024-01-01',
        billing_period_end: '2024-01-31',
        usage_quantity: 200,
        unit_price: 1000,
        discount_rate: 0.05,
        is_billable: true,
      },
    ];

    // Act: 請求対象項目の自動抽出
    const extracted_items = extractBillingItems(salesData);

    // Assert: 抽出されたデータが顧客IDで正しく分離されていることを確認
    const cust_A_items = extracted_items.filter((item: any) => item.customer_id === 'cust_A');
    const cust_B_items = extracted_items.filter((item: any) => item.customer_id === 'cust_B');
    const cust_C_items = extracted_items.filter((item: any) => item.customer_id === 'cust_C');

    expect(cust_A_items.length).toBe(1);
    expect(cust_B_items.length).toBe(1);
    expect(cust_C_items.length).toBe(1);

    // 顧客A：100 * 1000 * (1 - 0) = 100,000
    expect(cust_A_items[0].billing_amount).toBe(100000);

    // 顧客B：150 * 1000 * (1 - 0.1) = 135,000
    expect(cust_B_items[0].billing_amount).toBe(135000);

    // 顧客C：200 * 1000 * (1 - 0.05) = 190,000
    expect(cust_C_items[0].billing_amount).toBe(190000);

    // 顧客別・サービス別の請求額集計
    const aggregation_result = aggregateBillingAmount(extracted_items);

    // Assert: 各顧客別に、サービス別の請求額が正確に集計されていることを検証
    const cust_A_total = aggregation_result.find(
      (agg: any) => agg.customer_id === 'cust_A' && agg.service_id === 'svc_storage'
    );
    const cust_B_total = aggregation_result.find(
      (agg: any) => agg.customer_id === 'cust_B' && agg.service_id === 'svc_storage'
    );
    const cust_C_total = aggregation_result.find(
      (agg: any) => agg.customer_id === 'cust_C' && agg.service_id === 'svc_storage'
    );

    expect(cust_A_total.total_amount).toBe(100000);
    expect(cust_B_total.total_amount).toBe(135000);
    expect(cust_C_total.total_amount).toBe(190000);

    // Assert: 複数顧客における同一サービスの請求額合計が、各顧客個別の集計値の合計と一致することを確認
    const service_total_from_aggregation = aggregation_result.reduce(
      (sum: number, agg: any) => {
        if (agg.service_id === 'svc_storage') {
          return sum + agg.total_amount;
        }
        return sum;
      },
      0
    );

    const expected_service_total = 100000 + 135000 + 190000;
    expect(service_total_from_aggregation).toBe(expected_service_total);

    // Assert: 顧客A、顧客B、顧客Cの請求額がそれぞれ独立して計算されていることをアサート
    expect(cust_A_total.customer_id).toBe('cust_A');
    expect(cust_B_total.customer_id).toBe('cust_B');
    expect(cust_C_total.customer_id).toBe('cust_C');

    // Assert: サービス別集計において、同一サービスの複数顧客データが適切に分離されていることを確認
    const storage_service_aggregates = aggregation_result.filter(
      (agg: any) => agg.service_id === 'svc_storage'
    );
    expect(storage_service_aggregates.length).toBe(3);
    expect(
      storage_service_aggregates.map((agg: any) => agg.customer_id).sort()
    ).toEqual(['cust_A', 'cust_B', 'cust_C']);

    // Assert: データの二重計上や漏落がないことを確認
    const all_items_in_aggregation = aggregation_result.reduce(
      (sum: number, agg: any) => sum + agg.total_amount,
      0
    );
    expect(all_items_in_aggregation).toBe(425000);
  });
});