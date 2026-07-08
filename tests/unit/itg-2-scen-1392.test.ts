import { recordProcessError } from '../../src/logic/it-6-2-2-1';

describe('検証プロセス履歴の一元管理・監査記録機能', () => {
  // SCEN-1392
  test('プロセス実行中に重大なエラーが発生した場合、エラー発生時刻とエラー内容が監査記録に正確に保存される', () => {
    // Setup: エラーの基準時刻を固定値で設定
    const error_timestamp_iso = '2024-01-15T14:23:45.123Z';
    const error_timestamp_unix = 1705339425123;
    const error_code = 'CRITICAL_PROCESS_FAILURE';
    const error_message = 'データベース接続タイムアウト: 60秒以内に応答がありません';
    const error_stack_trace = 'Error: データベース接続タイムアウト\n  at connectDB (db.ts:42)\n  at processVerification (verification.ts:128)';

    // Act: 重大なエラーが発生したシナリオでプロセス記録機能を実行
    const audit_record = recordProcessError({
      error_timestamp_iso,
      error_timestamp_unix,
      error_code,
      error_message,
      error_stack_trace,
      process_id: 'PROC-20240115-001',
      assessor_id: 'ASS-12345',
      case_id: 'CASE-20240115-0987'
    });

    // Assert: 記録されたエラーログから発生時刻を検証
    expect(audit_record.error_timestamp_iso).toBe('2024-01-15T14:23:45.123Z');
    expect(audit_record.error_timestamp_unix).toBe(1705339425123);

    // Assert: 記録されたエラーログからエラー内容を検証
    expect(audit_record.error_code).toBe('CRITICAL_PROCESS_FAILURE');
    expect(audit_record.error_message).toBe('データベース接続タイムアウト: 60秒以内に応答がありません');
    expect(audit_record.error_stack_trace).toBe('Error: データベース接続タイムアウト\n  at connectDB (db.ts:42)\n  at processVerification (verification.ts:128)');

    // Assert: エラー情報が監査記録に正確に保存されていることを確認
    expect(audit_record.process_id).toBe('PROC-20240115-001');
    expect(audit_record.assessor_id).toBe('ASS-12345');
    expect(audit_record.case_id).toBe('CASE-20240115-0987');

    // Assert: 記録には一元管理・検索可能な状態を示すメタデータが含まれている
    expect(audit_record.is_searchable).toBe(true);
    expect(audit_record.is_auditable).toBe(true);
    expect(typeof audit_record.audit_record_id).toBe('string');
    expect(audit_record.audit_record_id.length).toBeGreaterThan(0);

    // Assert: エラーハンドラーが正常に動作することを確認
    expect(audit_record.handler_status).toBe('SUCCESS');
    expect(audit_record.record_persisted).toBe(true);
  });
});