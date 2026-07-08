import { aggregateOperationalMetrics } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1181: [normal] 運用指標自動集計 - 過去30日間のOCR精度・AI判定精度・学習モデル更新頻度・ユーザーフィードバック件数が自動集計される
  test('should automatically aggregate operational metrics for the past 30 days', () => {
    // 基準日時: 2024-02-15 09:00:00 UTC (シナリオの評価基準日)
    const referenceDate = new Date('2024-02-15T09:00:00Z');
    
    // 過去30日間のデータ (2024-01-16 09:00:00 から 2024-02-15 09:00:00 まで)
    const ocrAccuracyRecords = [
      { timestamp: '2024-01-16T10:30:00Z', accuracy: 92.5 },
      { timestamp: '2024-01-18T14:15:00Z', accuracy: 91.8 },
      { timestamp: '2024-01-20T11:45:00Z', accuracy: 93.2 },
      { timestamp: '2024-01-25T09:20:00Z', accuracy: 90.5 },
      { timestamp: '2024-02-01T16:30:00Z', accuracy: 92.1 },
      { timestamp: '2024-02-05T13:10:00Z', accuracy: 91.9 },
      { timestamp: '2024-02-10T08:00:00Z', accuracy: 93.5 },
      { timestamp: '2024-02-14T15:45:00Z', accuracy: 92.8 },
    ];

    const aiJudgmentAccuracyRecords = [
      { timestamp: '2024-01-17T09:00:00Z', accuracy: 88.3 },
      { timestamp: '2024-01-19T10:20:00Z', accuracy: 87.9 },
      { timestamp: '2024-01-22T14:30:00Z', accuracy: 89.1 },
      { timestamp: '2024-01-26T11:15:00Z', accuracy: 86.5 },
      { timestamp: '2024-02-02T09:45:00Z', accuracy: 88.7 },
      { timestamp: '2024-02-06T16:20:00Z', accuracy: 87.4 },
      { timestamp: '2024-02-11T13:00:00Z', accuracy: 89.5 },
      { timestamp: '2024-02-15T08:30:00Z', accuracy: 88.1 },
    ];

    const modelUpdateRecords = [
      { timestamp: '2024-01-20T10:00:00Z', updateCount: 1 },
      { timestamp: '2024-02-01T14:30:00Z', updateCount: 1 },
      { timestamp: '2024-02-10T09:00:00Z', updateCount: 1 },
    ];

    const userFeedbackRecords = [
      { timestamp: '2024-01-16T12:00:00Z', feedbackCount: 3 },
      { timestamp: '2024-01-20T14:30:00Z', feedbackCount: 2 },
      { timestamp: '2024-01-25T11:00:00Z', feedbackCount: 5 },
      { timestamp: '2024-02-01T15:45:00Z', feedbackCount: 1 },
      { timestamp: '2024-02-05T09:30:00Z', feedbackCount: 4 },
      { timestamp: '2024-02-10T13:15:00Z', feedbackCount: 2 },
      { timestamp: '2024-02-14T16:20:00Z', feedbackCount: 3 },
    ];

    const input = {
      referenceDate: referenceDate.toISOString(),
      pastDaysPeriod: 30,
      ocrAccuracyRecords,
      aiJudgmentAccuracyRecords,
      modelUpdateRecords,
      userFeedbackRecords,
    };

    // 期待値の計算
    // OCR精度: (92.5 + 91.8 + 93.2 + 90.5 + 92.1 + 91.9 + 93.5 + 92.8) / 8 = 734.3 / 8 = 91.7875 ≈ 91.79
    const expectedOcrAverage = 91.79;

    // AI判定精度: (88.3 + 87.9 + 89.1 + 86.5 + 88.7 + 87.4 + 89.5 + 88.1) / 8 = 706.5 / 8 = 88.3125 ≈ 88.31
    const expectedAiAverage = 88.31;

    // 学習モデル更新頻度: 3回 (20日、02-01日、10日)
    const expectedModelUpdateFrequency = 3;

    // ユーザーフィードバック件数: 3 + 2 + 5 + 1 + 4 + 2 + 3 = 20件
    const expectedTotalFeedback = 20;

    const result = aggregateOperationalMetrics(input);

    // 集計値の検証
    expect(result.ocrAverageAccuracy).toBeCloseTo(expectedOcrAverage, 2);
    expect(result.aiJudgmentAverageAccuracy).toBeCloseTo(expectedAiAverage, 2);
    expect(result.modelUpdateFrequency).toBe(expectedModelUpdateFrequency);
    expect(result.totalUserFeedbackCount).toBe(expectedTotalFeedback);

    // 期間の検証
    expect(result.periodStartDate).toBe('2024-01-16T09:00:00Z');
    expect(result.periodEndDate).toBe('2024-02-15T09:00:00Z');

    // データ件数の検証
    expect(result.ocrRecordCount).toBe(8);
    expect(result.aiJudgmentRecordCount).toBe(8);
    expect(result.modelUpdateRecordCount).toBe(3);
    expect(result.userFeedbackRecordCount).toBe(7);

    // 自動集計フラグ (再計算時に true となることを確認)
    expect(result.isAutoAggregated).toBe(true);
    expect(result.aggregatedAt).toBeDefined();
  });
});