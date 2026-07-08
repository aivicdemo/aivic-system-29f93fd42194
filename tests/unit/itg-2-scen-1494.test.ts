import { executeModelRetrainingPipeline } from '../../src/logic/it-6-2-2-2';

describe('AI判定モデル再学習実行機能', () => {
  // SCEN-1494
  test('[normal] 改善計画に基づいてAI判定モデル再学習実行指示を出した場合、新学習データを用いてモデルが再学習され本番に反映される', async () => {
    const improvementPlanId = 'imp-plan-001';
    const currentModelVersion = 'v1.0.0';
    const newModelVersion = 'v1.0.1';
    const trainingDatasetId = 'training-ds-001';
    const trainingStartTime = new Date('2024-02-15T09:00:00Z');
    const trainingCompletionTime = new Date('2024-02-15T10:30:00Z');
    const totalTrainingTimeMs = 5400000;

    const improvementPlan = {
      improvementPlanId,
      status: '承認済み',
      targetPrecisionImprovement: 5,
      learningDataAdditions: [
        {
          dataType: '過去案件データ',
          regionCode: 'tokyo',
          workTypeCode: 'civil',
          addedRecordCount: 150,
        },
        {
          dataType: '物価本',
          versionNumber: '2024-02-01',
          effectiveDate: '2024-02-01',
        },
      ],
    };

    const newTrainingDataset = {
      datasetId: trainingDatasetId,
      totalRecordCount: 2500,
      trainingRecordCount: 2000,
      validationRecordCount: 350,
      testRecordCount: 150,
      dataQualityScore: 94,
      coverageByRegion: {
        tokyo: 45,
        osaka: 30,
        nagoya: 15,
        other: 10,
      },
      coverageByWorkType: {
        civil: 50,
        building: 35,
        mechanical: 15,
      },
    };

    const retrainingRequest = {
      improvementPlanId,
      currentModelVersion,
      datasetId: trainingDatasetId,
      requestedAt: trainingStartTime,
    };

    const retrainingExecutionResult = {
      success: true,
      executionId: 'exec-rt-001',
      requestId: retrainingRequest.improvementPlanId,
      previousModelVersion: currentModelVersion,
      newModelVersion,
      trainingStartedAt: trainingStartTime,
      trainingCompletedAt: trainingCompletionTime,
      trainingDurationMs: totalTrainingTimeMs,
      datasetUsed: newTrainingDataset,
      trainingMetrics: {
        finalTrainingLoss: 0.0342,
        finalValidationLoss: 0.0387,
        trainingAccuracy: 0.9678,
        validationAccuracy: 0.9612,
        testAccuracy: 0.9589,
      },
      modelCheckpointUri: 's3://model-storage/models/v1.0.1/checkpoint.pt',
      retrainingLogUri: 's3://logs/retraining/exec-rt-001.log',
    };

    const deploymentRequest = {
      modelVersion: newModelVersion,
      sourceCheckpointUri: retrainingExecutionResult.modelCheckpointUri,
      targetEnvironment: '本番',
      deployedAt: new Date('2024-02-15T11:00:00Z'),
    };

    const deploymentResult = {
      success: true,
      deploymentId: 'deploy-001',
      deployedModelVersion: newModelVersion,
      activeModelVersionInProduction: newModelVersion,
      deploymentCompletedAt: deploymentRequest.deployedAt,
      verificationStatus: '検証完了',
    };

    const testEstimateData = {
      estimateId: 'est-2024-0815',
      regionCode: 'tokyo',
      workTypeCode: 'civil',
      estimatedAmount: 5200000,
      estimatedQuantity: 125,
      estimatedUnitPrice: 41600,
    };

    const judgmentResult = {
      estimateId: testEstimateData.estimateId,
      modelVersion: newModelVersion,
      ocrReadingAccuracy: 0.9823,
      deviationRate: 3.2,
      deviationAmount: 166400,
      comparisonDataRecordCount: 87,
      referenceDataSource: '過去案件データ',
      referenceDataRegion: 'tokyo',
      referenceDataWorkType: 'civil',
      correctionFactorApplied: 1.0,
      judgmentResult: '承認',
      confidenceScore: 92,
      rootCauseAnalysis: '相場範囲内',
    };

    const result = await executeModelRetrainingPipeline({
      improvementPlan,
      newTrainingDataset,
      retrainingRequest,
      deploymentRequest,
      testEstimate: testEstimateData,
    });

    expect(result.retrainingPhase).toEqual({
      success: true,
      executionId: 'exec-rt-001',
      previousModelVersion: currentModelVersion,
      newModelVersion,
      trainingDurationMs: 5400000,
      trainingMetrics: {
        trainingAccuracy: 0.9678,
        validationAccuracy: 0.9612,
        testAccuracy: 0.9589,
      },
    });

    expect(result.deploymentPhase).toEqual({
      success: true,
      deploymentId: 'deploy-001',
      activeModelVersionInProduction: newModelVersion,
      verificationStatus: '検証完了',
    });

    expect(result.validationPhase).toEqual({
      estimateId: testEstimateData.estimateId,
      modelVersion: newModelVersion,
      deviationRate: 3.2,
      judgmentResult: '承認',
      confidenceScore: 92,
      ocrReadingAccuracy: 0.9823,
    });

    expect(result.overallStatus).toBe('完了');
    expect(result.improvementAchieved).toBe(true);
  });
});