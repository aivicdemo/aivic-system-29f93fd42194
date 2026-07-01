import { recordOperationLog } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 操作ログ自動記録', () => {
  // SCEN-858: [normal] 操作ログ自動記録機能 - 対応内容の記録・更新操作時に変更前後の内容・操作者・実行日時が自動記録される
  test('対応内容の記録・更新操作が実行されるたびに、変更前後の内容・操作者・実行日時が操作ログに自動記録される', () => {
    // 操作者情報の初期化
    const operator_user_id = 'user_20240115_001';
    const operator_name = '営業オペレーター太郎';

    // 初回の対応内容記録操作
    const first_record_time = new Date('2024-01-15T09:00:00Z');
    const first_operation_log_entry = recordOperationLog({
      operator_id: operator_user_id,
      operator_name: operator_name,
      operation_type: 'CREATE',
      target_record_id: 'contract_change_001',
      target_field_name: 'response_content',
      before_value: null,
      after_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は月次請求から適用される予定。',
      operation_timestamp: first_record_time
    });

    expect(first_operation_log_entry).toEqual({
      log_id: expect.any(String),
      operator_id: 'user_20240115_001',
      operator_name: '営業オペレーター太郎',
      operation_type: 'CREATE',
      target_record_id: 'contract_change_001',
      target_field_name: 'response_content',
      before_value: null,
      after_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は月次請求から適用される予定。',
      operation_timestamp: expect.any(Date),
      created_at: expect.any(Date)
    });

    expect(first_operation_log_entry.operation_timestamp.toISOString()).toBe('2024-01-15T09:00:00.000Z');
    expect(first_operation_log_entry.before_value).toBeNull();
    expect(first_operation_log_entry.after_value).toContain('契約変更内容について確認が完了');

    // 1回目の更新操作
    const first_update_time = new Date('2024-01-15T10:30:00Z');
    const first_update_log_entry = recordOperationLog({
      operator_id: operator_user_id,
      operator_name: operator_name,
      operation_type: 'UPDATE',
      target_record_id: 'contract_change_001',
      target_field_name: 'response_content',
      before_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は月次請求から適用される予定。',
      after_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は月次請求から適用される予定。顧客担当者より追加の質問があり、詳細説明を実施予定。',
      operation_timestamp: first_update_time
    });

    expect(first_update_log_entry).toEqual({
      log_id: expect.any(String),
      operator_id: 'user_20240115_001',
      operator_name: '営業オペレーター太郎',
      operation_type: 'UPDATE',
      target_record_id: 'contract_change_001',
      target_field_name: 'response_content',
      before_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は月次請求から適用される予定。',
      after_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は月次請求から適用される予定。顧客担当者より追加の質問があり、詳細説明を実施予定。',
      operation_timestamp: expect.any(Date),
      created_at: expect.any(Date)
    });

    expect(first_update_log_entry.operation_timestamp.toISOString()).toBe('2024-01-15T10:30:00.000Z');
    expect(first_update_log_entry.before_value).toContain('契約変更内容について確認が完了');
    expect(first_update_log_entry.after_value).toContain('追加の質問があり');

    // 変更前後のログIDが異なることを確認（独立したエントリ）
    expect(first_operation_log_entry.log_id).not.toBe(first_update_log_entry.log_id);

    // 2回目の更新操作
    const second_update_time = new Date('2024-01-15T14:15:00Z');
    const second_update_log_entry = recordOperationLog({
      operator_id: operator_user_id,
      operator_name: operator_name,
      operation_type: 'UPDATE',
      target_record_id: 'contract_change_001',
      target_field_name: 'response_content',
      before_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は月次請求から適用される予定。顧客担当者より追加の質問があり、詳細説明を実施予定。',
      after_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は2024年2月請求から適用される。顧客担当者からの追加質問に対して説明完了。合意確認待ち。',
      operation_timestamp: second_update_time
    });

    expect(second_update_log_entry).toEqual({
      log_id: expect.any(String),
      operator_id: 'user_20240115_001',
      operator_name: '営業オペレーター太郎',
      operation_type: 'UPDATE',
      target_record_id: 'contract_change_001',
      target_field_name: 'response_content',
      before_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は月次請求から適用される予定。顧客担当者より追加の質問があり、詳細説明を実施予定。',
      after_value: '顧客との契約変更内容について確認が完了。変更内容は合意済みで、新請求額は2024年2月請求から適用される。顧客担当者からの追加質問に対して説明完了。合意確認待ち。',
      operation_timestamp: expect.any(Date),
      created_at: expect.any(Date)
    });

    expect(second_update_log_entry.operation_timestamp.toISOString()).toBe('2024-01-15T14:15:00.000Z');
    expect(second_update_log_entry.before_value).toContain('詳細説明を実施予定');
    expect(second_update_log_entry.after_value).toContain('2024年2月請求から適用');

    // 3つのログエントリが独立していることを確認
    expect(first_operation_log_entry.log_id).not.toBe(first_update_log_entry.log_id);
    expect(first_update_log_entry.log_id).not.toBe(second_update_log_entry.log_id);
    expect(first_operation_log_entry.log_id).not.toBe(second_update_log_entry.log_id);

    // 操作者情報が全ログエントリで一貫していることを確認
    expect(first_operation_log_entry.operator_id).toBe('user_20240115_001');
    expect(first_update_log_entry.operator_id).toBe('user_20240115_001');
    expect(second_update_log_entry.operator_id).toBe('user_20240115_001');

    expect(first_operation_log_entry.operator_name).toBe('営業オペレーター太郎');
    expect(first_update_log_entry.operator_name).toBe('営業オペレーター太郎');
    expect(second_update_log_entry.operator_name).toBe('営業オペレーター太郎');

    // タイムスタンプが時系列順であることを確認
    expect(first_operation_log_entry.operation_timestamp.getTime()).toBeLessThan(
      first_update_log_entry.operation_timestamp.getTime()
    );
    expect(first_update_log_entry.operation_timestamp.getTime()).toBeLessThan(
      second_update_log_entry.operation_timestamp.getTime()
    );

    // 各ログエントリの作成タイムスタンプが記録されていることを確認
    expect(first_operation_log_entry.created_at).toBeInstanceOf(Date);
    expect(first_update_log_entry.created_at).toBeInstanceOf(Date);
    expect(second_update_log_entry.created_at).toBeInstanceOf(Date);

    // 対象レコードIDが全エントリで一貫していることを確認
    expect(first_operation_log_entry.target_record_id).toBe('contract_change_001');
    expect(first_update_log_entry.target_record_id).toBe('contract_change_001');
    expect(second_update_log_entry.target_record_id).toBe('contract_change_001');

    // 対象フィールド名が全エントリで一貫していることを確認
    expect(first_operation_log_entry.target_field_name).toBe('response_content');
    expect(first_update_log_entry.target_field_name).toBe('response_content');
    expect(second_update_log_entry.target_field_name).toBe('response_content');

    // 操作タイプが正しく記録されていることを確認
    expect(first_operation_log_entry.operation_type).toBe('CREATE');
    expect(first_update_log_entry.operation_type).toBe('UPDATE');
    expect(second_update_log_entry.operation_type).toBe('UPDATE');
  });
});