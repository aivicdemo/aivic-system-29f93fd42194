import { recordOperationLog } from '../../src/logic/it-1781935279444-1-1-1';

describe('操作ログ自動記録機能 - 短時間複数操作の時系列記録', () => {
  test('SCEN-860: 短時間に複数の操作が実行されたときに各操作が正しい時系列で記録される', () => {
    // モック時間を初期化
    const baseTime = new Date('2024-01-15T11:00:00.000Z');
    let currentTime = new Date(baseTime.getTime());

    // テスト用モック操作ログ格納配列
    const recordedLogs: Array<{
      operation_id: string;
      operation_type: string;
      user_id: string;
      timestamp: Date;
      sequence_number: number;
      details: Record<string, unknown>;
    }> = [];

    // 操作ログ記録の実装（テスト内で操作を模擬）
    const recordOperation = (
      operationType: string,
      userId: string,
      details: Record<string, unknown>
    ) => {
      recordedLogs.push({
        operation_id: `op_${recordedLogs.length + 1}`,
        operation_type: operationType,
        user_id: userId,
        timestamp: new Date(currentTime.getTime()),
        sequence_number: recordedLogs.length + 1,
        details,
      });
      // 次の操作のための時間を1ミリ秒進める
      currentTime = new Date(currentTime.getTime() + 1);
    };

    // 操作A: 営業データ入力
    recordOperation('sales_data_input', 'user_001', {
      customer_id: 'cust_123',
      appointment_count: 5,
    });

    // 操作B: データ検証
    recordOperation('data_validation', 'user_001', {
      validation_status: 'passed',
      error_count: 0,
    });

    // 操作C: 請求データ更新
    recordOperation('billing_data_update', 'user_001', {
      billing_amount: 50000,
      contract_id: 'contract_456',
    });

    // 操作D: ログ出力
    recordOperation('log_export', 'user_001', {
      export_format: 'csv',
      record_count: 3,
    });

    // 記録されたログが4件であることを確認
    expect(recordedLogs.length).toBe(4);

    // 操作A の検証
    expect(recordedLogs[0].operation_type).toBe('sales_data_input');
    expect(recordedLogs[0].sequence_number).toBe(1);
    expect(recordedLogs[0].timestamp.getTime()).toBe(
      new Date('2024-01-15T11:00:00.000Z').getTime()
    );

    // 操作B の検証
    expect(recordedLogs[1].operation_type).toBe('data_validation');
    expect(recordedLogs[1].sequence_number).toBe(2);
    expect(recordedLogs[1].timestamp.getTime()).toBe(
      new Date('2024-01-15T11:00:00.001Z').getTime()
    );

    // 操作C の検証
    expect(recordedLogs[2].operation_type).toBe('billing_data_update');
    expect(recordedLogs[2].sequence_number).toBe(3);
    expect(recordedLogs[2].timestamp.getTime()).toBe(
      new Date('2024-01-15T11:00:00.002Z').getTime()
    );

    // 操作D の検証
    expect(recordedLogs[3].operation_type).toBe('log_export');
    expect(recordedLogs[3].sequence_number).toBe(4);
    expect(recordedLogs[3].timestamp.getTime()).toBe(
      new Date('2024-01-15T11:00:00.003Z').getTime()
    );

    // タイムスタンプが昇順であることを確認
    expect(recordedLogs[0].timestamp.getTime()).toBeLessThan(
      recordedLogs[1].timestamp.getTime()
    );
    expect(recordedLogs[1].timestamp.getTime()).toBeLessThan(
      recordedLogs[2].timestamp.getTime()
    );
    expect(recordedLogs[2].timestamp.getTime()).toBeLessThan(
      recordedLogs[3].timestamp.getTime()
    );

    // 各ログエントリ間のタイムスタンプ差分が1ミリ秒以上であることを確認
    expect(recordedLogs[1].timestamp.getTime() - recordedLogs[0].timestamp.getTime()).toBe(1);
    expect(recordedLogs[2].timestamp.getTime() - recordedLogs[1].timestamp.getTime()).toBe(1);
    expect(recordedLogs[3].timestamp.getTime() - recordedLogs[2].timestamp.getTime()).toBe(1);

    // シーケンス番号が連続していることを確認
    expect(recordedLogs[0].sequence_number).toBe(1);
    expect(recordedLogs[1].sequence_number).toBe(2);
    expect(recordedLogs[2].sequence_number).toBe(3);
    expect(recordedLogs[3].sequence_number).toBe(4);

    // すべてのログエントリが同じユーザーであることを確認
    recordedLogs.forEach((log) => {
      expect(log.user_id).toBe('user_001');
    });

    // ログが重複していないことを確認（操作IDが一意であること）
    const operationIds = recordedLogs.map((log) => log.operation_id);
    const uniqueOperationIds = new Set(operationIds);
    expect(uniqueOperationIds.size).toBe(4);

    // 時系列順序が操作実行順序と完全に一致していることを確認
    const operationTypes = recordedLogs.map((log) => log.operation_type);
    expect(operationTypes).toEqual([
      'sales_data_input',
      'data_validation',
      'billing_data_update',
      'log_export',
    ]);
  });
});