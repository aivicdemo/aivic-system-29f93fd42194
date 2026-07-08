import { collectOperatingIndicators } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-1256
  test('運用指標の自動収集と閾値超過時のアラート生成機能 - 指標収集時に対象データが存在しない場合、警告ログを記録し、次回収集時点での再トライが行われる', async () => {
    // テストの初期状態: 対象データが存在しない場合のログ記録と再トライ動作をテスト

    // 1. 指標収集スケジュール設定：月次実績データが存在しない状態
    const collectionConfig = {
      scheduleId: 'SCHED-2024-001',
      collectionTriggerTime: new Date('2024-01-15T06:00:00Z'),
      targetIndicators: [
        'OCR_READ_ACCURACY',
        'AI_JUDGMENT_ACCURACY',
        'LEARNING_MODEL_UPDATE_FREQUENCY',
        'USER_FEEDBACK_COUNT',
      ],
      retryEnabled: true,
      retryMaxAttempts: 3,
      retryIntervalMinutes: 1440, // 24時間
      thresholdValues: {
        OCR_READ_ACCURACY: 70,
        AI_JUDGMENT_ACCURACY: 75,
        LEARNING_MODEL_UPDATE_FREQUENCY: 1,
        USER_FEEDBACK_COUNT: 50,
      },
    };

    // 2. 収集対象データが存在しない状態の作成
    const noDataContext = {
      dataAvailable: false,
      auditDateFrom: new Date('2024-01-08T00:00:00Z'),
      auditDateTo: new Date('2024-01-14T23:59:59Z'),
      assessorCount: 30,
      estimateCount: 0, // データなし
      systemUptimePercent: 0, // データなし
      ocrAccuracyPercent: 0, // データなし
      aiJudgmentAccuracyPercent: 0, // データなし
    };

    // 3. 指標収集実行時の結果オブジェクト（第1回：失敗）
    const firstCollectionResult = await collectOperatingIndicators({
      scheduleId: collectionConfig.scheduleId,
      collectionTime: collectionConfig.collectionTriggerTime,
      targetIndicators: collectionConfig.targetIndicators,
      dataContext: noDataContext,
      retryConfig: {
        isRetry: false,
        previousAttemptTime: null,
        attemptNumber: 1,
      },
    });

    // 4. 第1回収集結果の検証：警告ログが記録されているか
    expect(firstCollectionResult).toEqual(
      expect.objectContaining({
        collectionStatus: 'WARNING',
        scheduleId: 'SCHED-2024-001',
        collectionTime: new Date('2024-01-15T06:00:00Z'),
        warningLogs: expect.arrayContaining([
          expect.objectContaining({
            level: 'WARNING',
            timestamp: expect.any(Date),
            message: expect.stringMatching(/対象データが存在しません/),
            missingIndicators: expect.arrayContaining([
              'OCR_READ_ACCURACY',
              'AI_JUDGMENT_ACCURACY',
              'LEARNING_MODEL_UPDATE_FREQUENCY',
              'USER_FEEDBACK_COUNT',
            ]),
            detail: expect.objectContaining({
              estimateCount: 0,
              systemUptimePercent: 0,
              ocrAccuracyPercent: 0,
              aiJudgmentAccuracyPercent: 0,
            }),
          }),
        ]),
        collectedIndicators: expect.objectContaining({
          OCR_READ_ACCURACY: null,
          AI_JUDGMENT_ACCURACY: null,
          LEARNING_MODEL_UPDATE_FREQUENCY: null,
          USER_FEEDBACK_COUNT: null,
        }),
        nextRetryScheduled: true,
        nextRetryTime: new Date('2024-01-16T06:00:00Z'),
        thresholdViolations: [],
      }),
    );

    // 5. 警告ログメッセージの詳細確認
    const warningLog = firstCollectionResult.warningLogs[0];
    expect(warningLog.message).toMatch(/対象データが存在しません/);
    expect(warningLog.level).toBe('WARNING');
    expect(warningLog.missingIndicators.length).toBe(4);
    expect(warningLog.detail).toEqual({
      estimateCount: 0,
      systemUptimePercent: 0,
      ocrAccuracyPercent: 0,
      aiJudgmentAccuracyPercent: 0,
    });

    // 6. 次回収集時点での再トライ準備状態を検証
    expect(firstCollectionResult.nextRetryScheduled).toBe(true);
    expect(firstCollectionResult.nextRetryTime).toEqual(
      new Date('2024-01-16T06:00:00Z'),
    );

    // 7. 収集対象データが新たに作成された状態でのシミュレーション（第2回：成功）
    const dataAfterCreation = {
      dataAvailable: true,
      auditDateFrom: new Date('2024-01-08T00:00:00Z'),
      auditDateTo: new Date('2024-01-14T23:59:59Z'),
      assessorCount: 30,
      estimateCount: 1250,
      systemUptimePercent: 99.5,
      ocrAccuracyPercent: 92.3,
      aiJudgmentAccuracyPercent: 88.7,
      averageProcessingTime: 18.5,
      qualityUniformityIndex: 94.2,
      updateFrequency: 2,
      feedbackCount: 35,
    };

    // 8. 第2回（再トライ）の指標収集実行
    const secondCollectionResult = await collectOperatingIndicators({
      scheduleId: collectionConfig.scheduleId,
      collectionTime: new Date('2024-01-16T06:00:00Z'),
      targetIndicators: collectionConfig.targetIndicators,
      dataContext: dataAfterCreation,
      retryConfig: {
        isRetry: true,
        previousAttemptTime: collectionConfig.collectionTriggerTime,
        attemptNumber: 2,
      },
    });

    // 9. 第2回収集結果の検証：正常に収集されたか
    expect(secondCollectionResult).toEqual(
      expect.objectContaining({
        collectionStatus: 'SUCCESS',
        scheduleId: 'SCHED-2024-001',
        collectionTime: new Date('2024-01-16T06:00:00Z'),
        collectedIndicators: expect.objectContaining({
          OCR_READ_ACCURACY: 92.3,
          AI_JUDGMENT_ACCURACY: 88.7,
          LEARNING_MODEL_UPDATE_FREQUENCY: 2,
          USER_FEEDBACK_COUNT: 35,
          AVERAGE_PROCESSING_TIME: 18.5,
          QUALITY_UNIFORMITY_INDEX: 94.2,
          SYSTEM_UPTIME_PERCENT: 99.5,
        }),
        warningLogs: [],
        nextRetryScheduled: false,
        nextRetryTime: null,
      }),
    );

    // 10. 閾値超過判定（AI_JUDGMENT_ACCURACY = 88.7 > 75、USER_FEEDBACK_COUNT = 35 < 50）
    const thresholdViolations = secondCollectionResult.thresholdViolations;
    expect(thresholdViolations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicatorName: 'USER_FEEDBACK_COUNT',
          actualValue: 35,
          thresholdValue: 50,
          violationType: 'BELOW_THRESHOLD',
        }),
      ]),
    );

    // 11. 再トライの実行履歴が記録されているか検証
    expect(secondCollectionResult.retryHistory).toBeDefined();
    expect(secondCollectionResult.retryHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attemptNumber: 1,
          attemptTime: collectionConfig.collectionTriggerTime,
          status: 'FAILED',
          failureReason: '対象データが存在しません',
        }),
        expect.objectContaining({
          attemptNumber: 2,
          attemptTime: new Date('2024-01-16T06:00:00Z'),
          status: 'SUCCESS',
          collectedCount: 7,
        }),
      ]),
    );

    // 12. ダッシュボード表示用のデータ整合性検証
    expect(secondCollectionResult.dashboardData).toEqual(
      expect.objectContaining({
        collectionScheduleId: 'SCHED-2024-001',
        collectionCycleStart: new Date('2024-01-08T00:00:00Z'),
        collectionCycleEnd: new Date('2024-01-14T23:59:59Z'),
        lastSuccessfulCollection: new Date('2024-01-16T06:00:00Z'),
        lastFailedCollection: collectionConfig.collectionTriggerTime,
        indicators: {
          ocrReadAccuracy: 92.3,
          aiJudgmentAccuracy: 88.7,
          learningModelUpdateFrequency: 2,
          userFeedbackCount: 35,
          averageProcessingTime: 18.5,
          qualityUniformityIndex: 94.2,
          systemUptimePercent: 99.5,
        },
        alertsGenerated: [
          expect.objectContaining({
            alertType: 'THRESHOLD_VIOLATION',
            indicatorName: 'USER_FEEDBACK_COUNT',
            severity: 'MEDIUM',
            message: expect.stringMatching(
              /ユーザーフィードバック件数が閾値以下です/,
            ),
          }),
        ],
      }),
    );
  });
});