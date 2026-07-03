import { verifyDistributionList } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1131: [normal] 配信リスト妥当性確認 - 配信対象顧客が配信停止フラグなし・契約状態が有効な顧客のみで構成される', () => {
    // 配信停止フラグなし・契約状態が有効な顧客
    const validCustomer1 = {
      customer_id: 'CUST001',
      customer_name: '顧客A株式会社',
      distribution_stop_flag: false,
      contract_status: 'active',
      contract_id: 'CONT001',
    };

    const validCustomer2 = {
      customer_id: 'CUST002',
      customer_name: '顧客B株式会社',
      distribution_stop_flag: false,
      contract_status: 'active',
      contract_id: 'CONT002',
    };

    // 配信停止フラグありの顧客（配信リストから除外されるべき）
    const stoppedCustomer = {
      customer_id: 'CUST003',
      customer_name: '顧客C株式会社',
      distribution_stop_flag: true,
      contract_status: 'active',
      contract_id: 'CONT003',
    };

    // 契約状態が無効な顧客（配信リストから除外されるべき）
    const inactiveCustomer = {
      customer_id: 'CUST004',
      customer_name: '顧客D株式会社',
      distribution_stop_flag: false,
      contract_status: 'inactive',
      contract_id: 'CONT004',
    };

    // 配信停止フラグありかつ契約状態が無効な顧客（配信リストから除外されるべき）
    const invalidCustomer = {
      customer_id: 'CUST005',
      customer_name: '顧客E株式会社',
      distribution_stop_flag: true,
      contract_status: 'inactive',
      contract_id: 'CONT005',
    };

    const allCustomers = [
      validCustomer1,
      validCustomer2,
      stoppedCustomer,
      inactiveCustomer,
      invalidCustomer,
    ];

    const distributionList = verifyDistributionList(allCustomers);

    // 配信リストに正当な顧客のみが含まれていることを確認
    expect(distributionList).toHaveLength(2);

    // 配信対象の顧客IDが期待値と一致することを確認
    const distributionCustomerIds = distributionList.map((c: any) => c.customer_id);
    expect(distributionCustomerIds).toEqual(['CUST001', 'CUST002']);

    // 各顧客について配信停止フラグがfalseであることを確認
    distributionList.forEach((customer: any) => {
      expect(customer.distribution_stop_flag).toBe(false);
    });

    // 各顧客について契約状態が'active'であることを確認
    distributionList.forEach((customer: any) => {
      expect(customer.contract_status).toBe('active');
    });

    // 配信停止フラグありの顧客が配信リストに含まれていないことを確認
    expect(distributionList.some((c: any) => c.customer_id === 'CUST003')).toBe(false);

    // 契約状態が無効の顧客が配信リストに含まれていないことを確認
    expect(distributionList.some((c: any) => c.customer_id === 'CUST004')).toBe(false);

    // 配信停止フラグありかつ契約状態が無効の顧客が配信リストに含まれていないことを確認
    expect(distributionList.some((c: any) => c.customer_id === 'CUST005')).toBe(false);

    // 配信リストの構造が正しいことを確認
    expect(distributionList).toEqual([
      {
        customer_id: 'CUST001',
        customer_name: '顧客A株式会社',
        distribution_stop_flag: false,
        contract_status: 'active',
        contract_id: 'CONT001',
      },
      {
        customer_id: 'CUST002',
        customer_name: '顧客B株式会社',
        distribution_stop_flag: false,
        contract_status: 'active',
        contract_id: 'CONT002',
      },
    ]);
  });
});