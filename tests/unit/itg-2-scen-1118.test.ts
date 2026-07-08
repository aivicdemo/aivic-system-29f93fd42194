import { analyzePrecisionDegradationAndGenerateRecommendations } from '../../src/logic/it-6-2-2-2';

describe('モデル更新前後精度計測・比較 - 精度低下診断と改善提案自動生成', () => {
  test('SCEN-1118: 精度低下時に根本原因を診断し改善提案を自動生成できる', () => {
    // === 前提条件 ===
    // モデルバージョン v1.0 (前回) と v1.1 (現在) の精度を比較
    // 精度低下が検出: OCR精度 92% → 87% (-5%), AI判定精度 88% → 81% (-7%)

    const previousModelMetrics = {
      modelVersion: 'v1.0',
      measurementDate: new Date('2024-01-01T09:00:00Z'),
      ocrAccuracy: 92,
      aiJudgmentAccuracy: 88,
      processingTimeMs: 1200,
      sampleSize: 500,
      dataDistribution: {
        regionCoverage: { hokkaido: 12, tokyo: 45, osaka: 28, other: 15 },
        constructionTypeCoverage: { building: 40, civil: 35, equipment: 25 },
        priceRangeCoverage: { low: 30, medium: 50, high: 20 }
      },
      featureImportance: {
        unitPrice: 0.35,
        quantity: 0.28,
        laborCost: 0.22,
        materialCost: 0.15
      }
    };

    const currentModelMetrics = {
      modelVersion: 'v1.1',
      measurementDate: new Date('2024-02-01T09:00:00Z'),
      ocrAccuracy: 87,
      aiJudgmentAccuracy: 81,
      processingTimeMs: 1150,
      sampleSize: 480,
      dataDistribution: {
        regionCoverage: { hokkaido: 8, tokyo: 50, osaka: 25, other: 17 },
        constructionTypeCoverage: { building: 45, civil: 30, equipment: 25 },
        priceRangeCoverage: { low: 35, medium: 48, high: 17 }
      },
      featureImportance: {
        unitPrice: 0.32,
        quantity: 0.25,
        laborCost: 0.26,
        materialCost: 0.17
      }
    };

    // === 実行 ===
    const result = analyzePrecisionDegradationAndGenerateRecommendations({
      previousModel: previousModelMetrics,
      currentModel: currentModelMetrics,
      degradationThresholdPercent: 3,
      minRecommendationConfidenceLevel: 0.7
    });

    // === 検証: 精度低下度が正確に計算されていること ===
    expect(result.precisionDegradation.ocrAccuracyDegradationPercent).toBe(-5);
    expect(result.precisionDegradation.aiJudgmentAccuracyDegradationPercent).toBe(-7);
    expect(result.precisionDegradation.totalDegradationPercent).toBe(-6);
    expect(result.precisionDegradation.isDegraded).toBe(true);

    // === 検証: 根本原因が診断されていること ===
    // データ分布の変化: hokkaido カバレッジが 12% → 8% に減少 (-4pp)
    expect(result.rootCauseDiagnosis).toBeDefined();
    expect(result.rootCauseDiagnosis.length).toBeGreaterThan(0);

    const dataDistributionCause = result.rootCauseDiagnosis.find(
      (cause) => cause.category === 'dataDistributionShift'
    );
    expect(dataDistributionCause).toBeDefined();
    expect(dataDistributionCause?.confidenceScore).toBeGreaterThanOrEqual(0.7);
    expect(dataDistributionCause?.description).toMatch(/地域別カバレッジ|hokkaido/);

    // 特徴量重要度の変化: materialCost が 0.15 → 0.17 に上昇 (+0.02)
    const featureImportanceChange = result.rootCauseDiagnosis.find(
      (cause) => cause.category === 'featureImportanceShift'
    );
    expect(featureImportanceChange).toBeDefined();
    expect(featureImportanceChange?.confidenceScore).toBeGreaterThanOrEqual(0.7);
    expect(featureImportanceChange?.description).toMatch(/特徴量|materialCost|重要度/);

    // === 検証: 改善提案が優先度付きで自動生成されていること ===
    expect(result.improvementRecommendations).toBeDefined();
    expect(result.improvementRecommendations.length).toBeGreaterThan(0);

    // 提案は優先度スコアの降順でソートされていること
    for (let i = 0; i < result.improvementRecommendations.length - 1; i++) {
      expect(result.improvementRecommendations[i].priorityScore).toBeGreaterThanOrEqual(
        result.improvementRecommendations[i + 1].priorityScore
      );
    }

    // === 検証: 最優先の改善提案を確認 ===
    const topRecommendation = result.improvementRecommendations[0];
    expect(topRecommendation.priorityScore).toBeGreaterThan(0);
    expect(topRecommendation.priorityScore).toBeLessThanOrEqual(100);
    expect(topRecommendation.recommendation).toBeDefined();
    expect(topRecommendation.recommendation.length).toBeGreaterThan(0);

    // 提案の種類: 再学習推奨 / ハイパーパラメータ調整 / 特徴量エンジニアリング / データ品質改善
    const validRecommendationTypes = [
      'retraining',
      'hyperparameterTuning',
      'featureEngineering',
      'dataQualityImprovement',
      'dataAugmentation'
    ];
    expect(validRecommendationTypes).toContain(topRecommendation.type);

    // === 検証: 提案の実行可能性 ===
    expect(topRecommendation.estimatedImplementationDaysDuration).toBeGreaterThan(0);
    expect(topRecommendation.estimatedImplementationDaysDuration).toBeLessThanOrEqual(30);
    expect(topRecommendation.expectedImprovementPercent).toBeGreaterThan(0);
    expect(topRecommendation.expectedImprovementPercent).toBeLessThanOrEqual(15);

    // === 検証: 複数の改善提案が生成されていること ===
    expect(result.improvementRecommendations.length).toBeGreaterThanOrEqual(2);

    // 提案 1: データ分布シフト対応 (hokkaido データ補充)
    const dataAugmentationRecommendation = result.improvementRecommendations.find(
      (rec) => rec.type === 'dataAugmentation' || rec.type === 'dataQualityImprovement'
    );
    expect(dataAugmentationRecommendation).toBeDefined();
    expect(dataAugmentationRecommendation?.description).toMatch(/hokkaido|地域|カバレッジ/);

    // 提案 2: 特徴量エンジニアリング (materialCost の重要度調整)
    const featureEngineeringRecommendation = result.improvementRecommendations.find(
      (rec) => rec.type === 'featureEngineering'
    );
    expect(featureEngineeringRecommendation).toBeDefined();
    expect(featureEngineeringRecommendation?.description).toMatch(/特徴量|materialCost/);

    // === 検証: レポート形式でのエクスポート対応 ===
    expect(result.reportExportFormat).toBeDefined();
    expect(result.reportExportFormat.markdownReport).toBeDefined();
    expect(result.reportExportFormat.markdownReport.length).toBeGreaterThan(0);
    expect(result.reportExportFormat.markdownReport).toMatch(/精度低下|診断|改善提案/);

    expect(result.reportExportFormat.jsonReport).toBeDefined();
    expect(typeof result.reportExportFormat.jsonReport).toBe('object');

    // === 検証: タイムスタンプと実行ID ===
    expect(result.executionId).toBeDefined();
    expect(result.executionId.length).toBeGreaterThan(0);
    expect(result.executionTimestamp).toBeDefined();

    // === 検証: 精度低下がしきい値を超過したことを検出 ===
    // しきい値: 3% 超過で警告, 実際: -6% なので警告発生
    expect(result.precisionDegradation.totalDegradationPercent).toBeLessThan(
      -previousModelMetrics.ocrAccuracy * 0.03 / 100
    );

    // === 検証: 改善提案の実行可能性レベルが付与されていること ===
    const allRecommendations = result.improvementRecommendations;
    allRecommendations.forEach((recommendation) => {
      expect(['高', '中', '低']).toContain(recommendation.feasibilityLevel);
      expect(recommendation.implementationSteps).toBeDefined();
      expect(Array.isArray(recommendation.implementationSteps)).toBe(true);
      expect(recommendation.implementationSteps.length).toBeGreaterThan(0);
    });

    // === 検証: 診断確信度スコアがすべて閾値以上 ===
    result.rootCauseDiagnosis.forEach((diagnosis) => {
      expect(diagnosis.confidenceScore).toBeGreaterThanOrEqual(0.7);
      expect(diagnosis.confidenceScore).toBeLessThanOrEqual(1.0);
    });

    // === 検証: 返却値の構造が完全であること ===
    expect(result).toHaveProperty('precisionDegradation');
    expect(result).toHaveProperty('rootCauseDiagnosis');
    expect(result).toHaveProperty('improvementRecommendations');
    expect(result).toHaveProperty('reportExportFormat');
    expect(result).toHaveProperty('executionId');
    expect(result).toHaveProperty('executionTimestamp');

    // === 検証: レポート内に具体的な数値が含まれていること ===
    expect(result.reportExportFormat.markdownReport).toMatch(/87/); // 現在の OCR精度
    expect(result.reportExportFormat.markdownReport).toMatch(/92/); // 前回の OCR精度
    expect(result.reportExportFormat.markdownReport).toMatch(/-5/); // 低下率
  });
});