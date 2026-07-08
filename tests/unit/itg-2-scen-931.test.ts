import { recordLearningDataVersion } from '../../src/logic/it-6-3-1';

describe('判定基準・学習データ版管理機能 - 過去案件データ追加時の版管理ルール適用', () => {
  // SCEN-931
  test('過去案件データ追加時に変更内容が版管理ルールに従って記録される', () => {
    // 初期状態: 過去案件データ v1.0 が存在
    const previous_version = 'v1.0';
    const previous_data = {
      case_id: 'CASE-2024-001',
      project_type: '建築工事',
      amount: 5000000,
      quantity: 100,
      unit_price: 50000,
      region: '東京',
      recorded_date: '2024-01-15',
    };

    // 新規追加データ
    const new_data = {
      case_id: 'CASE-2024-002',
      project_type: '土木工事',
      amount: 7500000,
      quantity: 150,
      unit_price: 50000,
      region: '大阪',
      recorded_date: '2024-01-20',
    };

    const operator_id = 'USR-12345';
    const operator_name = '山田太郎';
    const change_timestamp = new Date('2024-01-20T14:30:00Z');

    // 関数呼び出し
    const result = recordLearningDataVersion({
      previous_version,
      previous_data,
      new_data,
      operator_id,
      operator_name,
      change_timestamp,
      change_type: 'add',
    });

    // 版番号が自動採番されていることを確認
    expect(result.new_version).toBe('v1.1');

    // 変更者情報が正確に記録されていることを確認
    expect(result.change_record.operator_id).toBe('USR-12345');
    expect(result.change_record.operator_name).toBe('山田太郎');

    // タイムスタンプが正確に記録されていることを確認
    expect(result.change_record.timestamp).toEqual(
      new Date('2024-01-20T14:30:00Z')
    );

    // 変更前後の差分情報が版管理ルールに従って保存されていることを確認
    expect(result.change_record.change_type).toBe('add');
    expect(result.change_record.added_fields).toEqual({
      case_id: 'CASE-2024-002',
      project_type: '土木工事',
      amount: 7500000,
      quantity: 150,
      unit_price: 50000,
      region: '大阪',
      recorded_date: '2024-01-20',
    });

    // 変更前のデータが保持されていることを確認
    expect(result.change_record.previous_version).toBe('v1.0');
    expect(result.change_record.previous_data).toEqual(previous_data);

    // 版管理画面で全ての変更内容が追跡可能な状態で表示されることを確認
    expect(result.version_history).toBeDefined();
    expect(result.version_history.length).toBeGreaterThan(0);

    const latest_entry = result.version_history[0];
    expect(latest_entry.version).toBe('v1.1');
    expect(latest_entry.operator_id).toBe('USR-12345');
    expect(latest_entry.operator_name).toBe('山田太郎');
    expect(latest_entry.timestamp).toEqual(
      new Date('2024-01-20T14:30:00Z')
    );
    expect(latest_entry.change_type).toBe('add');

    // 変更内容の完全性を確認
    expect(result.is_valid_version_record).toBe(true);
    expect(result.change_record.added_fields).toHaveProperty('case_id');
    expect(result.change_record.added_fields).toHaveProperty('project_type');
    expect(result.change_record.added_fields).toHaveProperty('amount');
    expect(result.change_record.added_fields).toHaveProperty('quantity');
    expect(result.change_record.added_fields).toHaveProperty('unit_price');
    expect(result.change_record.added_fields).toHaveProperty('region');
    expect(result.change_record.added_fields).toHaveProperty('recorded_date');

    // 版管理ルールの追跡可能性を確認
    expect(result.audit_trail).toBeDefined();
    expect(result.audit_trail.can_trace_version).toBe(true);
    expect(result.audit_trail.version_sequence).toContain('v1.0');
    expect(result.audit_trail.version_sequence).toContain('v1.1');
  });
});