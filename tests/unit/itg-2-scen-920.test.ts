import { recordPriceBookMetadata } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-920: 公開日と廃止予定日が同じ日付の物価本が正しく記録される', () => {
    const input_price_book_id = 'PB-20240115-SHORT';
    const input_published_date = '2024-01-15';
    const input_discontinued_date = '2024-01-15';
    const input_version_number = 1;
    const input_source_name = '標準物価本2024年1月版';
    const input_recorded_by = 'system_user_001';
    const input_timestamp = new Date('2024-01-15T09:30:00Z');

    const result = recordPriceBookMetadata({
      price_book_id: input_price_book_id,
      version_number: input_version_number,
      published_date: input_published_date,
      discontinued_date: input_discontinued_date,
      source_name: input_source_name,
      recorded_by: input_recorded_by,
      recorded_at: input_timestamp,
    });

    expect(result.price_book_id).toBe('PB-20240115-SHORT');
    expect(result.version_number).toBe(1);
    expect(result.published_date).toBe('2024-01-15');
    expect(result.discontinued_date).toBe('2024-01-15');
    expect(result.source_name).toBe('標準物価本2024年1月版');
    expect(result.recorded_by).toBe('system_user_001');
    expect(result.is_valid_date_range).toBe(true);
    expect(result.duration_days).toBe(0);
    expect(result.metadata_status).toBe('recorded');
    expect(result.system_log_message).toMatch(/記録完了/);
    expect(result.database_persisted).toBe(true);
    expect(typeof result.record_id).toBe('string');
    expect(result.record_id.length).toBeGreaterThan(0);
  });
});