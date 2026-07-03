import { filterDistributionList } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業活動データから顧客別成果指標の月次抽出・配信 - 顧客企業別配信リスト確認', () => {
  test('SCEN-1135: 各顧客企業の契約状態と配信停止フラグが正確に確認され、配信可能な顧客が特定される', () => {
    // 入力: テストデータとして複数の顧客企業を登録（契約状態：有効/無効、配信停止フラグ：ON/OFF）
    const customers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A社',
        contract_status: 'active',
        distribution_stop_flag: false,
      },
      {
        customer_id: 'CUST002',
        customer_name: '顧客B社',
        contract_status: 'active',
        distribution_stop_flag: true,
      },
      {
        customer_id: 'CUST003',
        customer_name: '顧客C社',
        contract_status: 'inactive',
        distribution_stop_flag: false,
      },
      {
        customer_id: 'CUST004',
        customer_name: '顧客D社',
        contract_status: 'inactive',
        distribution_stop_flag: true,
      },
      {
        customer_id: 'CUST005',
        customer_name: '顧客E社',
        contract_status: 'active',
        distribution_stop_flag: false,
      },
    ];

    // 実行: 配信可能な顧客をフィルタリング
    const distributionList = filterDistributionList(customers);

    // 期待結果:
    // 1. 配信可能な顧客（契約状態：有効 かつ 配信停止フラグ：OFF）のみがリストに含まれる
    expect(distributionList).toHaveLength(2);
    expect(distributionList).toEqual([
      {
        customer_id: 'CUST001',
        customer_name: '顧客A社',
        contract_status: 'active',
        distribution_stop_flag: false,
      },
      {
        customer_id: 'CUST005',
        customer_name: '顧客E社',
        contract_status: 'active',
        distribution_stop_flag: false,
      },
    ]);

    // 2. 契約無効の顧客（CUST003, CUST004）がリストから除外されていることを確認
    const excluded_inactive = distributionList.filter(
      (c) => c.customer_id === 'CUST003' || c.customer_id === 'CUST004'
    );
    expect(excluded_inactive).toHaveLength(0);

    // 3. 配信停止フラグがONの顧客（CUST002）がリストから除外されていることを確認
    const excluded_stop = distributionList.filter(
      (c) => c.customer_id === 'CUST002'
    );
    expect(excluded_stop).toHaveLength(0);

    // 4. すべての配信可能顧客の契約状態が有効であることを確認
    const all_active = distributionList.every(
      (c) => c.contract_status === 'active'
    );
    expect(all_active).toBe(true);

    // 5. すべての配信可能顧客の配信停止フラグがOFFであることを確認
    const all_not_stopped = distributionList.every(
      (c) => c.distribution_stop_flag === false
    );
    expect(all_not_stopped).toBe(true);
  });
});