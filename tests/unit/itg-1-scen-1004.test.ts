import { initializeMonthlyBillingProcess } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-1004: 月次請求業務SLA管理 - トリガー日の午前0時時点で請求業務が自動開始される', () => {
    // トリガー日: 2024-01-25（月次締め日）
    const trigger_date = new Date('2024-01-25T00:00:00Z');
    const before_trigger = new Date('2024-01-24T23:59:59Z');

    // 手順1: テスト用システム時刻を23時59分59秒に設定してプロセス初期化を試みる
    const result_before = initializeMonthlyBillingProcess({
      current_timestamp: before_trigger,
      trigger_day_of_month: 25,
    });

    // 期待: トリガー時刻前なので業務開始ログが記録されていない
    expect(result_before).toEqual({
      is_triggered: false,
      process_status: 'WAITING',
      execution_log: null,
      start_timestamp: null,
      initial_validation_result: null,
    });

    // 手順2: システム時刻を午前0時00分00秒に進める
    const result_trigger = initializeMonthlyBillingProcess({
      current_timestamp: trigger_date,
      trigger_day_of_month: 25,
    });

    // 期待: トリガー時刻に達したので業務が自動開始される
    expect(result_trigger.is_triggered).toBe(true);

    // 期待: 開始ログが記録される
    expect(result_trigger.execution_log).not.toBeNull();
    expect(result_trigger.execution_log).toEqual({
      log_id: expect.any(String),
      event_type: 'BILLING_PROCESS_STARTED',
      message: 'Monthly billing process auto-initiated at trigger time',
      recorded_at: expect.any(String),
    });

    // 期待: 業務ステータスが『実行中』に遷移
    expect(result_trigger.process_status).toBe('EXECUTING');

    // 期待: 開始タイムスタンプがトリガー日の午前0時00分00秒以降
    expect(result_trigger.start_timestamp).not.toBeNull();
    const start_ts = new Date(result_trigger.start_timestamp as string);
    expect(start_ts.getTime()).toBeGreaterThanOrEqual(trigger_date.getTime());
    expect(start_ts.toISOString()).toBe('2024-01-25T00:00:00.000Z');

    // 期待: 初期処理（データ抽出、バリデーション）が正常に実行される
    expect(result_trigger.initial_validation_result).not.toBeNull();
    expect(result_trigger.initial_validation_result).toEqual({
      validation_phase: 'DATA_EXTRACTION_AND_VALIDATION',
      data_extraction_status: 'COMPLETED',
      extracted_record_count: expect.any(Number),
      validation_errors: expect.any(Array),
      validation_warnings: expect.any(Array),
      is_ready_for_next_phase: true,
    });

    // 期待: 抽出されたレコード数が正の整数
    expect(result_trigger.initial_validation_result.extracted_record_count).toBeGreaterThan(0);

    // 期待: バリデーションエラーが空配列（正常実行時）
    expect(result_trigger.initial_validation_result.validation_errors).toEqual([]);

    // 期待: 次フェーズへ進行可能状態
    expect(result_trigger.initial_validation_result.is_ready_for_next_phase).toBe(true);
  });
});