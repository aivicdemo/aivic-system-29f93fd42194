import { aggregateAssessmentVarianceByRegionSeasonType } from '../../src/logic/it-1-br-6-2-1';

describe('相場判定ロジック地域別・季節別適用機能 - サンプル数不足時のアラート通知と判定保留', () => {
  // SCEN-816
  test('地域別・季節別・工種別で最小サンプル数が不足する場合、アラート通知が発生して判定が保留される', () => {
    // Arrange: 入力データの準備
    const regionCode = 'TOKYO';
    const region = '東京都';
    const season = '冬季';
    const constructionType = '木造戸建';
    const minSampleThreshold = 50;
    const currentSampleSize = 30;

    const input = {
      regionCode,
      region,
      season,
      constructionType,
      minSampleThreshold,
      currentSampleSize,
      assessmentLogicId: 'LOGIC_001',
      executionTimestamp: '2024-01-15T10:30:00Z',
    };

    // Act: 関数実行
    const result = aggregateAssessmentVarianceByRegionSeasonType(input);

    // Assert: 期待値の検証
    // 1) アラート通知が発生し、「サンプル数不足」の警告メッセージが表示される
    expect(result.alertNotificationGenerated).toBe(true);
    expect(result.alertMessage).toMatch(/サンプル数不足/);
    expect(result.alertSeverity).toBe('WARNING');

    // 2) 相場判定ステータスが「保留中」となり、判定が実行されない
    expect(result.assessmentStatus).toBe('PENDING');
    expect(result.judgmentExecuted).toBe(false);

    // 3) エラーログに「INSUFFICIENT_SAMPLE_SIZE」が記録される
    expect(result.errorLogCode).toBe('INSUFFICIENT_SAMPLE_SIZE');
    expect(result.logRecorded).toBe(true);

    // 追加検証: 判定結果が未実行状態であることを確認
    expect(result.varianceRate).toBeNull();
    expect(result.varianceAmount).toBeNull();

    // 通知対象ユーザーが正しく特定されていることを確認
    expect(result.notificationTargetUserIds).toContain('USER_ASSESSMENT_MANAGER');
    expect(Array.isArray(result.notificationTargetUserIds)).toBe(true);
    expect(result.notificationTargetUserIds.length).toBeGreaterThan(0);

    // サンプル数不足の詳細情報が記録されていることを確認
    expect(result.sampleSizeDeficiency).toBe(20); // 50 - 30 = 20件不足
    expect(result.insufficiencyPercentage).toBe(40); // (20 / 50) * 100 = 40%

    // 相場判定処理の実行フローが正しく保留されていることを確認
    expect(result.judgmentHoldReason).toBe('INSUFFICIENT_SAMPLE_SIZE_FOR_REGION_SEASON_TYPE_COMBINATION');
    expect(result.holdTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 入力条件の組み合わせが正しく記録されていることを確認
    expect(result.recordedRegion).toBe('東京都');
    expect(result.recordedSeason).toBe('冬季');
    expect(result.recordedConstructionType).toBe('木造戸建');
    expect(result.recordedMinSampleThreshold).toBe(50);
    expect(result.recordedCurrentSampleSize).toBe(30);
  });
});