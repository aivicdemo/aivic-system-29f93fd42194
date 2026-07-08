import { aggregateOperationalIndicators } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-1184
  test('運用指標自動集計 - 日次定時監視タイミング（午前6時）で運用指標が自動集計される', () => {
    // 前日のテスト対象データ
    const previousDayDate = new Date('2024-01-14T00:00:00Z');
    const targetDate = new Date('2024-01-15T06:00:00Z');

    // 前日の運用データセット
    const operationalDataPreviousDay = {
      date: previousDayDate,
      ocrAccuracy: 92.5,
      aiJudgmentAccuracy: 88.3,
      learningModelUpdateFrequency: 1,
      userFeedbackCount: 3,
      assessmentCount: 145,
      averageProcessingTimeMinutes: 8.2,
      systemUptimePercentage: 99.5,
      incidentCount: 0,
    };

    // 期待される集計結果（構造化）
    // - ocrAccuracy: 92.5 (%)
    // - aiJudgmentAccuracy: 88.3 (%)
    // - learningModelUpdateFrequency: 1 (回)
    // - userFeedbackCount: 3 (件)
    // - systemUptimePercentage: 99.5 (%)
    // - assessmentCountTotal: 145 (件)
    // - averageProcessingTimeMinutes: 8.2 (分)
    // 判定: すべて正常範囲内（閾値超過なし）
    const expectedAggregatedResult = {
      aggregationDate: '2024-01-15',
      aggregationTimestamp: targetDate.toISOString(),
      targetDate: '2024-01-14',
      ocrAccuracy: 92.5,
      aiJudgmentAccuracy: 88.3,
      learningModelUpdateCount: 1,
      userFeedbackCount: 3,
      systemUptimePercentage: 99.5,
      totalAssessmentCount: 145,
      averageProcessingTimeMinutes: 8.2,
      anomalyDetected: false,
      thresholdExceededMetrics: [],
      processingStatus: 'completed',
      processedRecordCount: 1,
    };

    // 関数実行
    const result = aggregateOperationalIndicators({
      targetDate: previousDayDate,
      executionTimestamp: targetDate,
      operationalData: [operationalDataPreviousDay],
      aggregationMode: 'scheduled_daily',
    });

    // 集計処理の実行確認
    expect(result.processingStatus).toBe('completed');

    // 集計結果の正確性検証
    expect(result.aggregationDate).toBe(expectedAggregatedResult.aggregationDate);
    expect(result.targetDate).toBe(expectedAggregatedResult.targetDate);

    // OCR精度の集計値検証
    expect(result.ocrAccuracy).toBe(92.5);

    // AI判定精度の集計値検証
    expect(result.aiJudgmentAccuracy).toBe(88.3);

    // 学習モデル更新頻度の集計値検証
    expect(result.learningModelUpdateCount).toBe(1);

    // ユーザーフィードバック件数の集計値検証
    expect(result.userFeedbackCount).toBe(3);

    // システム稼働率の集計値検証
    expect(result.systemUptimePercentage).toBe(99.5);

    // 査定件数合計の集計値検証
    expect(result.totalAssessmentCount).toBe(145);

    // 平均処理時間の集計値検証
    expect(result.averageProcessingTimeMinutes).toBe(8.2);

    // 異常検知なし（すべての指標が正常範囲内）
    expect(result.anomalyDetected).toBe(false);
    expect(result.thresholdExceededMetrics).toEqual([]);

    // 処理されたレコード数
    expect(result.processedRecordCount).toBe(1);

    // 集計ログに処理完了エントリが記録されていることを確認
    expect(result.aggregationTimestamp).toBeDefined();
    expect(new Date(result.aggregationTimestamp)).toEqual(targetDate);
  });
});