import { executeModelRetraining } from '../../src/logic/it-6-2-2-2';

const fetchMock = require('jest-fetch-mock');

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1134
  test('学習データ更新に基づくモデル再学習実行機能 - 学習データ更新完了後、モデル再学習を実行して本番環境に適用できる', async () => {
    // ========== Setup: 学習データ更新完了のシミュレーション ==========
    const learningDataId = 'ld_20240115_001';
    const trainingDataCount = 15280;
    const validationDataCount = 3820;
    const testDataCount = 1900;
    const updateTimestamp = '2024-01-15T09:30:00Z';
    const dataVersion = 'v2.3.1';

    const inputParams = {
      learningDataId,
      trainingDataCount,
      validationDataCount,
      testDataCount,
      updateTimestamp,
      dataVersion,
      targetEnvironment: 'production' as const,
    };

    // ========== Mock: 再학習開始API ==========
    fetchMock.mockResponseOnce(
      JSON.stringify({
        retrainingJobId: 'rtj_20240115_001',
        status: 'training_started',
        startedAt: '2024-01-15T09:35:00Z',
        estimatedCompletionTime: 900,
      }),
      { status: 200 }
    );

    // ========== Mock: 再학습進捗確認API ==========
    fetchMock.mockResponseOnce(
      JSON.stringify({
        retrainingJobId: 'rtj_20240115_001',
        status: 'training_in_progress',
        progressPercentage: 100,
        completedAt: '2024-01-15T10:20:00Z',
        ocrAccuracyBefore: 87.3,
        ocrAccuracyAfter: 89.8,
        judgeAccuracyBefore: 84.1,
        judgeAccuracyAfter: 86.7,
      }),
      { status: 200 }
    );

    // ========== Mock: 本番環境適用開始API ==========
    fetchMock.mockResponseOnce(
      JSON.stringify({
        deploymentId: 'dep_20240115_001',
        status: 'deployment_started',
        startedAt: '2024-01-15T10:25:00Z',
        targetEnvironment: 'production',
      }),
      { status: 200 }
    );

    // ========== Mock: 本番環境適用完了確認API ==========
    fetchMock.mockResponseOnce(
      JSON.stringify({
        deploymentId: 'dep_20240115_001',
        status: 'deployment_completed',
        completedAt: '2024-01-15T10:35:00Z',
        modelVersion: 'model_v2.3.1_prod',
        activeModelsCount: 1,
      }),
      { status: 200 }
    );

    // ========== Mock: システムログ取得API ==========
    fetchMock.mockResponseOnce(
      JSON.stringify({
        logs: [
          {
            timestamp: '2024-01-15T09:35:00Z',
            eventType: 'model_retraining_started',
            details: {
              retrainingJobId: 'rtj_20240115_001',
              dataVersion,
              trainingRecords: trainingDataCount,
            },
          },
          {
            timestamp: '2024-01-15T10:20:00Z',
            eventType: 'model_retraining_completed',
            details: {
              retrainingJobId: 'rtj_20240115_001',
              ocrAccuracyImprovement: 2.5,
              judgeAccuracyImprovement: 2.6,
            },
          },
          {
            timestamp: '2024-01-15T10:25:00Z',
            eventType: 'model_deployment_started',
            details: {
              deploymentId: 'dep_20240115_001',
              targetEnvironment: 'production',
            },
          },
          {
            timestamp: '2024-01-15T10:35:00Z',
            eventType: 'model_deployment_completed',
            details: {
              deploymentId: 'dep_20240115_001',
              modelVersion: 'model_v2.3.1_prod',
            },
          },
        ],
      }),
      { status: 200 }
    );

    // ========== 実行 ==========
    const result = await executeModelRetraining(inputParams);

    // ========== Assertions ==========
    // 1. 再学習ジョブ開始の検証
    expect(result.retrainingJobId).toBe('rtj_20240115_001');
    expect(result.retrainingStatus).toBe('training_started');
    expect(result.retrainingStartedAt).toBe('2024-01-15T09:35:00Z');

    // 2. 再学習の進捗と精度改善値の検証
    expect(result.trainingProgressPercentage).toBe(100);
    expect(result.ocrAccuracyBefore).toBe(87.3);
    expect(result.ocrAccuracyAfter).toBe(89.8);
    expect(result.ocrAccuracyImprovement).toBe(2.5);
    expect(result.judgeAccuracyBefore).toBe(84.1);
    expect(result.judgeAccuracyAfter).toBe(86.7);
    expect(result.judgeAccuracyImprovement).toBe(2.6);
    expect(result.trainingCompletedAt).toBe('2024-01-15T10:20:00Z');

    // 3. 本番環境適用プロセスの検証
    expect(result.deploymentId).toBe('dep_20240115_001');
    expect(result.deploymentStatus).toBe('deployment_completed');
    expect(result.deploymentStartedAt).toBe('2024-01-15T10:25:00Z');
    expect(result.deploymentCompletedAt).toBe('2024-01-15T10:35:00Z');
    expect(result.modelVersion).toBe('model_v2.3.1_prod');
    expect(result.targetEnvironment).toBe('production');
    expect(result.activeModelsCount).toBe(1);

    // 4. 学習データとモデルバージョンの追跡
    expect(result.learningDataId).toBe(learningDataId);
    expect(result.dataVersion).toBe(dataVersion);
    expect(result.totalTrainingRecords).toBe(trainingDataCount + validationDataCount + testDataCount);

    // 5. ステータス遷移の検証
    expect(result.overallStatus).toBe('production_ready');
    expect(result.statusTransitions).toEqual([
      {
        stage: 'data_validation',
        status: 'completed',
        timestamp: updateTimestamp,
      },
      {
        stage: 'model_retraining',
        status: 'completed',
        timestamp: '2024-01-15T10:20:00Z',
      },
      {
        stage: 'production_deployment',
        status: 'completed',
        timestamp: '2024-01-15T10:35:00Z',
      },
    ]);

    // 6. システムログに記録された履歴の検証
    expect(result.systemLogs).toHaveLength(4);
    expect(result.systemLogs[0].eventType).toBe('model_retraining_started');
    expect(result.systemLogs[0].timestamp).toBe('2024-01-15T09:35:00Z');
    expect(result.systemLogs[1].eventType).toBe('model_retraining_completed');
    expect(result.systemLogs[1].timestamp).toBe('2024-01-15T10:20:00Z');
    expect(result.systemLogs[2].eventType).toBe('model_deployment_started');
    expect(result.systemLogs[2].timestamp).toBe('2024-01-15T10:25:00Z');
    expect(result.systemLogs[3].eventType).toBe('model_deployment_completed');
    expect(result.systemLogs[3].timestamp).toBe('2024-01-15T10:35:00Z');

    // 7. 処理時間の検証（再学習: 45分、デプロイ: 10分）
    const retrainingDurationSeconds =
      new Date('2024-01-15T10:20:00Z').getTime() -
      new Date('2024-01-15T09:35:00Z').getTime();
    expect(retrainingDurationSeconds / 60).toBe(45);

    const deploymentDurationSeconds =
      new Date('2024-01-15T10:35:00Z').getTime() -
      new Date('2024-01-15T10:25:00Z').getTime();
    expect(deploymentDurationSeconds / 60).toBe(10);

    // 8. API 呼び出し回数の検証
    expect(fetchMock.mock.calls.length).toBe(4);

    // 9. 本番環境適用の可用性検証
    expect(result.isProductionReady).toBe(true);
    expect(result.canRollback).toBe(true);
    expect(result.previousModelVersion).toBeDefined();
  });
});