import { evaluateModelRetrainingDecision } from '../../src/logic/it-6-2-1-1';

describe('モデル再学習実行タイミング自動判定機能', () => {
  // SCEN-785: [edge] 精度がしきい値と同数の境界値でモデル再学習の判定が実行される
  test('現在精度がしきい値と同数の場合、モデル再学習判定が実行される', () => {
    // Arrange: テストデータ初期化
    const thresholdPrecision = 85.0;
    const historicalPrecisionValues = [80.0, 82.5, 84.0];
    const currentPrecision = 85.0;
    const retrainingExecutionDateTime = new Date('2024-01-15T14:30:00Z');
    const systemLogTimestamp = new Date('2024-01-15T14:30:00Z');

    // テストデータベース状態を表現するための入力オブジェクト
    const retrainingJudgmentInput = {
      currentPrecision: currentPrecision,
      precisionThreshold: thresholdPrecision,
      historicalPrecisionDataPoints: historicalPrecisionValues,
      judgementExecutionDateTime: systemLogTimestamp,
      retrainingScheduledDateTime: retrainingExecutionDateTime,
    };

    // Act: 自動判定ロジックを実行
    const result = evaluateModelRetrainingDecision(retrainingJudgmentInput);

    // Assert: 判定結果の検証
    expect(result).toEqual({
      shouldRetrainModel: true,
      retrainingFlag: true,
      retrainingScheduledDateTime: retrainingExecutionDateTime,
      systemLogMessage: '精度がしきい値に達したため再学習を実行します',
      precisionComparisonResult: 'THRESHOLD_REACHED',
      historicalPrecisionTrend: {
        previousDataPoints: [80.0, 82.5, 84.0],
        currentPrecision: 85.0,
        precisionImprovement: 1.0,
      },
      recordedInDatabase: true,
      logEventRecorded: true,
    });

    // 再学習フラグが true に設定されていることを検証
    expect(result.retrainingFlag).toBe(true);

    // 再学習実行予定日時が正しく記録されていることを検証
    expect(result.retrainingScheduledDateTime).toEqual(retrainingExecutionDateTime);

    // システムログメッセージが出力されていることを検証
    expect(result.systemLogMessage).toMatch(/精度がしきい値に達したため再学習を実行します/);

    // データベース記録フラグが true であることを検証
    expect(result.recordedInDatabase).toBe(true);

    // ログイベント記録フラグが true であることを検証
    expect(result.logEventRecorded).toBe(true);

    // 精度がしきい値と同数であることを検証
    expect(result.precisionComparisonResult).toBe('THRESHOLD_REACHED');

    // 過去精度データからの改善度が正しく算出されていることを検証
    expect(result.historicalPrecisionTrend.precisionImprovement).toBe(1.0);
  });
});