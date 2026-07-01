import { compareContractChanges } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約変更前後の比較・差分可視化機能', () => {
  // SCEN-852
  test('契約変更が発生したときに変更前後の契約条件が時系列で正しく抽出・比較される', () => {
    // 初期状態の契約条件（変更前）
    const initial_contract = {
      contract_id: 'C001',
      customer_id: 'CUST001',
      customer_name: '顧客A企業',
      service_type: 'サービスX',
      unit_price: 100000,
      monthly_fee: 500000,
      contract_period_start: '2024-01-01',
      contract_period_end: '2024-12-31',
      discount_rate: 0,
      billing_cycle: 'monthly',
      snapshot_date: '2024-01-15T09:00:00Z',
    };

    // 最初の契約変更：割引率を適用
    const change_1 = {
      contract_id: 'C001',
      change_date: '2024-02-15T10:30:00Z',
      changed_by: 'USER001',
      changed_fields: {
        discount_rate: {
          before: 0,
          after: 10,
        },
      },
    };

    // 第二の契約変更：月次料金を値上げ
    const change_2 = {
      contract_id: 'C001',
      change_date: '2024-03-10T14:00:00Z',
      changed_by: 'USER002',
      changed_fields: {
        monthly_fee: {
          before: 500000,
          after: 550000,
        },
      },
    };

    // 変更履歴の全集合
    const change_history = [change_1, change_2];

    // 比較・差分可視化関数を実行
    const result = compareContractChanges({
      contract_id: 'C001',
      initial_state: initial_contract,
      change_history: change_history,
    });

    // 期待結果の検証

    // 1. 変更前の契約条件が正しく抽出されていることを確認
    expect(result.before_state).toEqual({
      contract_id: 'C001',
      customer_id: 'CUST001',
      customer_name: '顧客A企業',
      service_type: 'サービスX',
      unit_price: 100000,
      monthly_fee: 500000,
      contract_period_start: '2024-01-01',
      contract_period_end: '2024-12-31',
      discount_rate: 0,
      billing_cycle: 'monthly',
      snapshot_date: '2024-01-15T09:00:00Z',
    });

    // 2. 変更後の契約条件が正しく計算・抽出されていることを確認
    expect(result.after_state).toEqual({
      contract_id: 'C001',
      customer_id: 'CUST001',
      customer_name: '顧客A企業',
      service_type: 'サービスX',
      unit_price: 100000,
      monthly_fee: 550000,
      contract_period_start: '2024-01-01',
      contract_period_end: '2024-12-31',
      discount_rate: 10,
      billing_cycle: 'monthly',
      snapshot_date: '2024-01-15T09:00:00Z',
    });

    // 3. 変更箇所の差分が正しく抽出されていることを確認
    expect(result.diff).toEqual([
      {
        field_name: 'discount_rate',
        before_value: 0,
        after_value: 10,
        change_date: '2024-02-15T10:30:00Z',
        changed_by: 'USER001',
      },
      {
        field_name: 'monthly_fee',
        before_value: 500000,
        after_value: 550000,
        change_date: '2024-03-10T14:00:00Z',
        changed_by: 'USER002',
      },
    ]);

    // 4. 時系列情報が正しく記録されていることを確認
    expect(result.timeline).toEqual([
      {
        timestamp: '2024-02-15T10:30:00Z',
        event_type: 'contract_change',
        changed_by: 'USER001',
        field_name: 'discount_rate',
        before_value: 0,
        after_value: 10,
      },
      {
        timestamp: '2024-03-10T14:00:00Z',
        event_type: 'contract_change',
        changed_by: 'USER002',
        field_name: 'monthly_fee',
        before_value: 500000,
        after_value: 550000,
      },
    ]);

    // 5. 複数の契約変更がすべて時系列順に表示されていることを確認
    expect(result.timeline).toHaveLength(2);
    expect(result.timeline[0].timestamp).toBe('2024-02-15T10:30:00Z');
    expect(result.timeline[1].timestamp).toBe('2024-03-10T14:00:00Z');
    expect(result.timeline[0].timestamp < result.timeline[1].timestamp).toBe(true);

    // 6. 変更前後の状態が異なっていることを確認（契約が実際に変更されたことの検証）
    expect(result.before_state.discount_rate).not.toBe(
      result.after_state.discount_rate
    );
    expect(result.before_state.monthly_fee).not.toBe(
      result.after_state.monthly_fee
    );

    // 7. 差分の個数が正確であることを確認
    expect(result.diff).toHaveLength(2);

    // 8. 最終的な契約条件の正確性を確認
    expect(result.after_state.discount_rate).toBe(10);
    expect(result.after_state.monthly_fee).toBe(550000);

    // 9. 顧客情報が変更されていないことを確認（非変更フィールドの整合性）
    expect(result.before_state.customer_id).toBe(result.after_state.customer_id);
    expect(result.before_state.contract_period_start).toBe(
      result.after_state.contract_period_start
    );
  });
});