import { identifyPrecisionDeclineRootCause } from '../../src/logic/it-6-2-2-1';

describe('精度低下時の原因特定と対応方法の自動判定', () => {
  // SCEN-1543
  test('複数の精度低下要因が同時に検出された場合、優先度に基づいて対応フローが順序付けされる', () => {
    // テストデータ: 複数の精度低下要因を同時にシミュレート
    const precisionDeclineInput = {
      dataQualityScore: 65, // 低下（70未満）
      modelAccuracyScore: 68, // 低下（70未満）
      inputAnomalyDetectionRate: 15, // 異常値検出率15%（通常3%～5%）
      externalFactorImpactFlag: true, // 外部要因の影響あり
      ocrPrecisionRate: 72, // OCR精度72%（基準80%未満）
      aiJudgmentPrecisionRate: 68, // AI判定精度68%（基準70%未満）
      measurementTimestamp: new Date('2024-12-15T09:30:00Z'),
      analysisRegion: 'KANTO',
      constructionType: 'CONCRETE_WORK',
    };

    // 査定品質管理・標準化システムに複数要因を入力し、原因特定と対応方法の自動判定を実行
    const result = identifyPrecisionDeclineRootCause(precisionDeclineInput);

    // 検出された精度低下要因の一覧を取得
    expect(result.detectedFactors).toBeDefined();
    expect(Array.isArray(result.detectedFactors)).toBe(true);
    expect(result.detectedFactors.length).toBeGreaterThanOrEqual(3);

    // 検出された要因を確認
    const detectedFactorTypes = result.detectedFactors.map((f) => f.factorType);
    expect(detectedFactorTypes).toContain('DATA_QUALITY_DECLINE');
    expect(detectedFactorTypes).toContain('MODEL_ACCURACY_DECLINE');
    expect(detectedFactorTypes).toContain('INPUT_ANOMALY_DETECTED');
    expect(detectedFactorTypes).toContain('EXTERNAL_FACTOR_IMPACT');

    // 各要因に割り当てられた優先度レベルを確認
    result.detectedFactors.forEach((factor) => {
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(factor.priorityLevel);
      expect(factor.priorityScore).toBeGreaterThanOrEqual(0);
      expect(factor.priorityScore).toBeLessThanOrEqual(100);
    });

    // 優先度に基づいて順序付けされた対応フロー（推奨アクション）の一覧を取得
    expect(result.recommendedActions).toBeDefined();
    expect(Array.isArray(result.recommendedActions)).toBe(true);
    expect(result.recommendedActions.length).toBeGreaterThanOrEqual(3);

    // 対応フローが優先度の高い順（高 → 中 → 低）に正しく並んでいることを検証
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    for (let i = 0; i < result.recommendedActions.length - 1; i++) {
      const currentAction = result.recommendedActions[i];
      const nextAction = result.recommendedActions[i + 1];
      const currentPriority = priorityOrder[currentAction.relatedFactor.priorityLevel];
      const nextPriority = priorityOrder[nextAction.relatedFactor.priorityLevel];
      expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
    }

    // 各対応フローが対応する要因と正しく紐付いていることを確認
    result.recommendedActions.forEach((action) => {
      expect(action.relatedFactor).toBeDefined();
      expect(action.relatedFactor.factorType).toBeDefined();
      expect(action.actionType).toBeDefined();
      expect(['LEARNING_DATA_UPDATE', 'MODEL_RETRAINING', 'PARAMETER_ADJUSTMENT', 'DATA_QUALITY_IMPROVEMENT']).toContain(
        action.actionType
      );
      expect(action.estimatedImpactScore).toBeGreaterThanOrEqual(0);
      expect(action.estimatedImpactScore).toBeLessThanOrEqual(100);
      expect(action.implementationDifficulty).toBeGreaterThanOrEqual(0);
      expect(action.implementationDifficulty).toBeLessThanOrEqual(100);
    });

    // 優先度が同一の複数要因が存在する場合、セカンダリソート条件（システム定義）に基づいて順序付けされていることを検証
    const groupedByPriority: { [key: string]: typeof result.recommendedActions } = {};
    result.recommendedActions.forEach((action) => {
      const level = action.relatedFactor.priorityLevel;
      if (!groupedByPriority[level]) {
        groupedByPriority[level] = [];
      }
      groupedByPriority[level].push(action);
    });

    // 同一優先度グループ内でセカンダリソート検証（影響度スコアの高い順）
    Object.values(groupedByPriority).forEach((group) => {
      for (let i = 0; i < group.length - 1; i++) {
        const current = group[i];
        const next = group[i + 1];
        // 同一優先度内では影響度スコアで降順ソート
        expect(current.estimatedImpactScore).toBeGreaterThanOrEqual(next.estimatedImpactScore);
      }
    });

    // 複数の精度低下要因すべてが正確に識別されたことを確認
    expect(result.detectedFactors.length).toBe(4);

    // 優先度レベルが適切に割り当てられたことを確認（具体値での検証）
    const highPriorityFactors = result.detectedFactors.filter((f) => f.priorityLevel === 'HIGH');
    expect(highPriorityFactors.length).toBeGreaterThanOrEqual(1);

    // 対応フローが優先度の高い順に正しく順序付けされた状態で返却されたことを確認
    expect(result.recommendedActions[0].relatedFactor.priorityLevel).toBe('HIGH');

    // セカンダリソート条件が適用された一貫性の検証
    result.recommendedActions.forEach((action, index) => {
      if (index > 0) {
        const prevAction = result.recommendedActions[index - 1];
        const prevPriority = priorityOrder[prevAction.relatedFactor.priorityLevel];
        const currentPriority = priorityOrder[action.relatedFactor.priorityLevel];

        if (prevPriority === currentPriority) {
          // 同一優先度の場合、影響度スコアが降順
          expect(prevAction.estimatedImpactScore).toBeGreaterThanOrEqual(action.estimatedImpactScore);
        }
      }
    });

    // 返却値の構造が完全であることを確認
    expect(result.analysisStatus).toBe('COMPLETED');
    expect(result.analysisTimestamp).toBeDefined();
    expect(typeof result.totalFactorsDetected).toBe('number');
    expect(result.totalFactorsDetected).toBe(4);
    expect(typeof result.recommendedActionsCount).toBe('number');
    expect(result.recommendedActionsCount).toBe(result.recommendedActions.length);
  });
});