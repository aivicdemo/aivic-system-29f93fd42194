import { aggregateMonthlyAssessmentResults } from '../../src/logic/it-6-2-1-1';

describe('月次査定業務実績の集計・ダッシュボード表示機能', () => {
  test('SCEN-760: 異常な処理時間データが含まれる場合、集計エラーが検出される', () => {
    // テストデータ: 異常な処理時間を含む月次査定業務実績レコード
    const assessment_records = [
      {
        assessor_id: 'A001',
        assessment_date: '2024-01-15',
        work_category: '基礎工事',
        amount_band: '100-500万円',
        processing_time_minutes: 25,
        assessment_result: 'approved',
      },
      {
        assessor_id: 'A002',
        assessment_date: '2024-01-15',
        work_category: '躯体工事',
        amount_band: '500-1000万円',
        processing_time_minutes: -10, // 異常値: 負の値
        assessment_result: 'approved',
      },
      {
        assessor_id: 'A003',
        assessment_date: '2024-01-15',
        work_category: '基礎工事',
        amount_band: '100-500万円',
        processing_time_minutes: 99999, // 異常値: 極端に大きい値
        assessment_result: 'rejected',
      },
      {
        assessor_id: 'A004',
        assessment_date: '2024-01-15',
        work_category: '仕上工事',
        amount_band: '1000万円以上',
        processing_time_minutes: null, // 異常値: NULL値
        assessment_result: 'approved',
      },
      {
        assessor_id: 'A001',
        assessment_date: '2024-01-16',
        work_category: '躯体工事',
        amount_band: '500-1000万円',
        processing_time_minutes: 30,
        assessment_result: 'approved',
      },
    ];

    // 集計・ダッシュボード表示機能を実行
    const result = aggregateMonthlyAssessmentResults(assessment_records);

    // エラーハンドリング処理が正常に動作していることを確認
    expect(result.success).toBe(false);
    expect(result.error_code).toBe('INVALID_PROCESSING_TIME');
    expect(result.error_message).toMatch(/処理時間/);

    // エラーログに異常データの詳細情報が記録されていることを確認
    expect(result.error_log).toBeDefined();
    expect(result.error_log.length).toBeGreaterThan(0);

    // 異常データが複数検出された場合の詳細確認
    const anomalies = result.error_log;
    expect(anomalies.some((log: any) => log.anomaly_type === 'NEGATIVE_VALUE')).toBe(true);
    expect(
      anomalies.some((log: any) => log.anomaly_type === 'EXCESSIVE_VALUE'),
    ).toBe(true);
    expect(anomalies.some((log: any) => log.anomaly_type === 'NULL_VALUE')).toBe(true);

    // 各異常データの詳細（データID、異常値、検出時刻）が記録されていることを確認
    const negative_anomaly = anomalies.find(
      (log: any) => log.anomaly_type === 'NEGATIVE_VALUE',
    );
    expect(negative_anomaly).toBeDefined();
    expect(negative_anomaly.assessor_id).toBe('A002');
    expect(negative_anomaly.anomaly_value).toBe(-10);
    expect(negative_anomaly.detected_at).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    const excessive_anomaly = anomalies.find(
      (log: any) => log.anomaly_type === 'EXCESSIVE_VALUE',
    );
    expect(excessive_anomaly).toBeDefined();
    expect(excessive_anomaly.assessor_id).toBe('A003');
    expect(excessive_anomaly.anomaly_value).toBe(99999);

    const null_anomaly = anomalies.find(
      (log: any) => log.anomaly_type === 'NULL_VALUE',
    );
    expect(null_anomaly).toBeDefined();
    expect(null_anomaly.assessor_id).toBe('A004');
    expect(null_anomaly.anomaly_value).toBeNull();

    // ダッシュボード表示時にエラーメッセージが適切に表示されることを確認
    expect(result.dashboard_display).toBeDefined();
    expect(result.dashboard_display.error_message_visible).toBe(true);
    expect(result.dashboard_display.error_message).toMatch(/処理時間/);

    // 集計処理が途中で中断され、部分的な結果が表示されないことを確認
    expect(result.partial_results).toBeUndefined();
    expect(result.aggregated_data).toBeUndefined();

    // 正常なレコードのみで部分集計が可能な場合は、制限付き結果が返されることを確認
    // （安全な状態の保証）
    expect(result.safe_subset_available).toBe(true);
    if (result.safe_subset_available && result.safe_subset) {
      // 正常なレコード（A001, A005）のみが含まれることを確認
      expect(result.safe_subset.record_count).toBe(2);
      expect(result.safe_subset.excluded_count).toBe(3);
    }
  });
});