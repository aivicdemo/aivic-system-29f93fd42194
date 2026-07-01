import { getDistributableCustomers } from '../../src/logic/it-1-2-1';

describe('配信可能顧客リストの抽出 - 配信停止フラグ除外ロジック', () => {
  test('SCEN-1165: 配信停止フラグが有効な顧客企業が配信対象から除外される', () => {
    // テストデータ: 複数の顧客企業（配信停止フラグの有無混在）
    const testCustomers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        contract_id: 'CONTRACT001',
        distribution_stop_flag: false,
        contract_status: 'active',
      },
      {
        customer_id: 'CUST002',
        customer_name: '顧客B',
        contract_id: 'CONTRACT002',
        distribution_stop_flag: true, // 配信停止フラグが有効
        contract_status: 'active',
      },
      {
        customer_id: 'CUST003',
        customer_name: '顧客C',
        contract_id: 'CONTRACT003',
        distribution_stop_flag: false,
        contract_status: 'active',
      },
      {
        customer_id: 'CUST004',
        customer_name: '顧客D',
        contract_id: 'CONTRACT004',
        distribution_stop_flag: true, // 配信停止フラグが有効
        contract_status: 'active',
      },
    ];

    // 配信可能顧客の取得
    const distributableCustomers = getDistributableCustomers(testCustomers);

    // 期待結果1: 配信可能顧客には配信停止フラグが false の顧客のみが含まれること
    expect(distributableCustomers).toHaveLength(2);
    expect(distributableCustomers).toEqual([
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        contract_id: 'CONTRACT001',
        distribution_stop_flag: false,
        contract_status: 'active',
      },
      {
        customer_id: 'CUST003',
        customer_name: '顧客C',
        contract_id: 'CONTRACT003',
        distribution_stop_flag: false,
        contract_status: 'active',
      },
    ]);

    // 期待結果2: 配信停止フラグが有効な顧客（CUST002）は配信リストに含まれていないこと
    const cust002_in_list = distributableCustomers.some(
      (c) => c.customer_id === 'CUST002'
    );
    expect(cust002_in_list).toBe(false);

    // 期待結果3: 配信停止フラグが有効な顧客（CUST004）は配信リストに含まれていないこと
    const cust004_in_list = distributableCustomers.some(
      (c) => c.customer_id === 'CUST004'
    );
    expect(cust004_in_list).toBe(false);
  });

  test('SCEN-1165: 配信停止フラグが有効な顧客企業を直接検索した場合、配信対象外を示すエラーが返される', () => {
    const testCustomers = [
      {
        customer_id: 'CUST002',
        customer_name: '顧客B',
        contract_id: 'CONTRACT002',
        distribution_stop_flag: true,
        contract_status: 'active',
      },
    ];

    // 配信停止フラグが有効な顧客を直接検索する場合、エラーが発生すること
    expect(() => {
      getDistributableCustomers(testCustomers);
    }).toThrow(/配信停止/);
  });

  test('SCEN-1165: 配信停止フラグが false（配信可能）な顧客のみが配信リストに含まれること', () => {
    const testCustomers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        contract_id: 'CONTRACT001',
        distribution_stop_flag: false,
        contract_status: 'active',
      },
    ];

    const distributableCustomers = getDistributableCustomers(testCustomers);

    expect(distributableCustomers).toHaveLength(1);
    expect(distributableCustomers[0].customer_id).toBe('CUST001');
    expect(distributableCustomers[0].distribution_stop_flag).toBe(false);
  });

  test('SCEN-1165: 配信停止フラグが有効な顧客のみが入力される場合、空配列が返されること', () => {
    const testCustomers = [
      {
        customer_id: 'CUST002',
        customer_name: '顧客B',
        contract_id: 'CONTRACT002',
        distribution_stop_flag: true,
        contract_status: 'active',
      },
      {
        customer_id: 'CUST004',
        customer_name: '顧客D',
        contract_id: 'CONTRACT004',
        distribution_stop_flag: true,
        contract_status: 'active',
      },
    ];

    const distributableCustomers = getDistributableCustomers(testCustomers);

    expect(distributableCustomers).toEqual([]);
  });
});