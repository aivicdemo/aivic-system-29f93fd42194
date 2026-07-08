import { analyzePrecisionDecline } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1290: [normal] OCR精度・AI判定精度低下の原因特定と改善優先度決定
  test('OCR精度またはAI判定精度がしきい値以下のとき、精度低下の根本要因を特定し改善対策を優先度付けして出力する', () => {
    const input = {
      ocrAccuracy: 75.5,
      aiJudgmentAccuracy: 72.3,
      ocrAccuracyThreshold: 80,
      aiJudgmentAccuracyThreshold: 75,
      measurementDate: '2024-01-15T11:00:00Z',
      imageQualityScore: 65,
      trainingDataVolume: 450,
      trainingDataVolumeMinimum: 500,
      modelDriftIndicator: 0.18,
      inputDataAnomalyRate: 0.08,
      recordCount: 1200,
      evaluationPeriodDays: 30,
    };

    const result = analyzePrecisionDecline(input);

    expect(result).toBeDefined();
    expect(result.ocrPrecisionDeclineDetected).toBe(true);
    expect(result.aiJudgmentPrecisionDeclineDetected).toBe(true);
    expect(result.rootCauseAnalysis).toBeDefined();
    expect(result.rootCauseAnalysis.length).toBeGreaterThan(0);

    const rootCauses = result.rootCauseAnalysis;
    const rankedByPriority = rootCauses.sort((a, b) => b.priorityScore - a.priorityScore);

    expect(rankedByPriority[0].cause).toBe('trainingDataInsufficiency');
    expect(rankedByPriority[0].priorityScore).toBe(92);
    expect(rankedByPriority[0].priority).toBe('high');
    expect(rankedByPriority[0].detectionConfidence).toBe(0.95);
    expect(rankedByPriority[0].expectedPrecisionImprovement).toBe(6.5);
    expect(rankedByPriority[0].implementationDifficulty).toBe(2);
    expect(rankedByPriority[0].recommendedAction).toBe('追加学習データ件数を50件以上確保し、モデルを再学習してください。実装期間は3営業日を見込んでください。');
    expect(rankedByPriority[0].feasibilityScore).toBe(78);

    expect(rankedByPriority[1].cause).toBe('modelDrift');
    expect(rankedByPriority[1].priorityScore).toBe(68);
    expect(rankedByPriority[1].priority).toBe('high');
    expect(rankedByPriority[1].detectionConfidence).toBe(0.82);
    expect(rankedByPriority[1].expectedPrecisionImprovement).toBe(5.2);
    expect(rankedByPriority[1].implementationDifficulty).toBe(3);
    expect(rankedByPriority[1].recommendedAction).toBe('モデルの全パラメータを再学習してください。実装期間は5営業日を見込んでください。');
    expect(rankedByPriority[1].feasibilityScore).toBe(65);

    expect(rankedByPriority[2].cause).toBe('imageQualityDegradation');
    expect(rankedByPriority[2].priorityScore).toBe(58);
    expect(rankedByPriority[2].priority).toBe('medium');
    expect(rankedByPriority[2].detectionConfidence).toBe(0.75);
    expect(rankedByPriority[2].expectedPrecisionImprovement).toBe(3.8);
    expect(rankedByPriority[2].implementationDifficulty).toBe(2);
    expect(rankedByPriority[2].recommendedAction).toBe('OCR入力画像の品質基準を引き上げてください。スキャン解像度300dpi以上を推奨します。');
    expect(rankedByPriority[2].feasibilityScore).toBe(72);

    expect(rankedByPriority[3].cause).toBe('inputDataAnomaly');
    expect(rankedByPriority[3].priorityScore).toBe(42);
    expect(rankedByPriority[3].priority).toBe('medium');
    expect(rankedByPriority[3].detectionConfidence).toBe(0.68);
    expect(rankedByPriority[3].expectedPrecisionImprovement).toBe(2.1);
    expect(rankedByPriority[3].implementationDifficulty).toBe(1);
    expect(rankedByPriority[3].recommendedAction).toBe('入力データの妥当性チェック機能を強化し、異常値を自動検出・隔離してください。');
    expect(rankedByPriority[3].feasibilityScore).toBe(85);

    expect(result.aggregatedImprovementScore).toBe(17.6);
    expect(result.recommendedExecutionOrder).toEqual([
      'trainingDataInsufficiency',
      'modelDrift',
      'imageQualityDegradation',
      'inputDataAnomaly',
    ]);
    expect(result.estimatedTimeToRecoveryDays).toBe(11);
    expect(result.reportGeneratedAt).toBe('2024-01-15T11:00:00Z');
    expect(result.analysisCompleteFlag).toBe(true);
  });
});