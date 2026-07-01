import { extractBillableCustomersForDistribution } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1164
  test('契約状態が無効な顧客企業が配信対象から正確に除外される', () => {
    const input_customers = [
      {
        customer_id: 'CUST_001',
        customer_name: '有効顧客A',
        contract_status: 'active',
        email: 'contact-a@example.com',
        is_distribution_target: true,
      },
      {
        customer_id: 'CUST_002',
        customer_name: '無効顧客B',
        contract_status: 'inactive',
        email: 'contact-b@example.com',
        is_distribution_target: true,
      },
      {
        customer_id: 'CUST_003',
        customer_name: '有効顧客C',
        contract_status: 'active',
        email: 'contact-c@example.com',
        is_distribution_target: true,
      },
      {
        customer_id: 'CUST_004',
        customer_name: '無効顧客D',
        contract_status: 'inactive',
        email: 'contact-d@example.com',
        is_distribution_target: true,
      },
      {
        customer_id: 'CUST_005',
        customer_name: '有効顧客E',
        contract_status: 'active',
        email: 'contact-e@example.com',
        is_distribution_target: true,
      },
    ];

    const result = extractBillableCustomersForDistribution(input_customers);

    const expected_distribution_list = [
      {
        customer_id: 'CUST_001',
        customer_name: '有効顧客A',
        contract_status: 'active',
        email: 'contact-a@example.com',
        is_distribution_target: true,
      },
      {
        customer_id: 'CUST_003',
        customer_name: '有効顧客C',
        contract_status: 'active',
        email: 'contact-c@example.com',
        is_distribution_target: true,
      },
      {
        customer_id: 'CUST_005',
        customer_name: '有効顧客E',
        contract_status: 'active',
        email: 'contact-e@example.com',
        is_distribution_target: true,
      },
    ];

    expect(result.distribution_list).toEqual(expected_distribution_list);
    expect(result.distribution_list.length).toBe(3);
    expect(result.excluded_count).toBe(2);
    expect(result.excluded_customer_ids).toEqual(['CUST_002', 'CUST_004']);
    expect(result.error_log).toContain('契約状態');
  });
});