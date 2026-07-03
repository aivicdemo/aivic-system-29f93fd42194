import { aggregateBillingItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-600: [edge] 請求対象項目抽出・分類機能 - 同一顧客・同一サービスの複数営業データが単一の請求対象項目に集約される
  test('同一顧客・同一サービスの複数営業データが単一の請求対象項目に集約される', () => {
    const sales_data_1 = {
      id: 'SALES-001',
      customer_id: 'CUST-001',
      service_name: 'クラウドストレージ',
      contract_date: '2024-01-01',
      amount: 10000,
      status: '確定'
    };

    const sales_data_2 = {
      id: 'SALES-002',
      customer_id: 'CUST-001',
      service_name: 'クラウドストレージ',
      contract_date: '2024-01-15',
      amount: 15000,
      status: '確定'
    };

    const sales_data_3 = {
      id: 'SALES-003',
      customer_id: 'CUST-001',
      service_name: 'クラウドストレージ',
      contract_date: '2024-02-01',
      amount: 12000,
      status: '確定'
    };

    const input_sales_data = [sales_data_1, sales_data_2, sales_data_3];

    const result = aggregateBillingItems(input_sales_data);

    expect(result).toHaveLength(1);

    const aggregated_item = result[0];
    expect(aggregated_item.customer_id).toBe('CUST-001');
    expect(aggregated_item.service_name).toBe('クラウドストレージ');
    expect(aggregated_item.total_amount).toBe(37000);
    expect(aggregated_item.source_data_count).toBe(3);
    expect(aggregated_item.source_ids).toEqual(['SALES-001', 'SALES-002', 'SALES-003']);
  });
});