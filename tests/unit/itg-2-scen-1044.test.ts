import { applyUnifiedJudgmentLogic } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-1044: [normal] 統一判定ロジック適用機能 - 判定根拠が不明確な場合にシステムが全査定員に同一基準を提示できる
  test('判定根拠が不明確な案件に対して、システムが統一判定ロジックを適用し、全査定員に対して同一の判定基準が正確に提示される', () => {
    // 前提条件: 判定根拠が不明確な査定案件
    const unclearJudgmentCaseId = 'case_20240115_001';
    const assessmentItemId = 'item_market_deviation_rate';
    const assessmentItemId2 = 'item_reference_data_count';
    const assessmentItemId3 = 'item_correction_coefficient';

    // 統一判定ロジック適用の入力データ
    const applyLogicInput = {
      caseId: unclearJudgmentCaseId,
      quotationAmount: 5000000,
      workType: 'soil_excavation',
      region: 'tokyo',
      quotationDate: '2024-01-15',
      pastCaseCount: 45,
      physicalPriceBookVersion: '2024-01',
      assessorIds: ['assessor_001', 'assessor_002', 'assessor_003'],
    };

    // システムが統一判定ロジックを適用
    const unifiedLogicResult = applyUnifiedJudgmentLogic(applyLogicInput);

    // 期待結果 1: 生成された判定基準が構造化されている
    expect(unifiedLogicResult).toHaveProperty('logicId');
    expect(unifiedLogicResult.logicId).toMatch(/^logic_/);
    expect(typeof unifiedLogicResult.logicId).toBe('string');

    // 期待結果 2: 判定基準がすべての査定員に対して同一内容で提示される
    expect(unifiedLogicResult).toHaveProperty('unifiedCriteria');
    expect(Array.isArray(unifiedLogicResult.unifiedCriteria)).toBe(true);
    expect(unifiedLogicResult.unifiedCriteria.length).toBe(3);

    // 各査定員に対して同一基準が提示されることを検証
    const firstAssessorCriteria = unifiedLogicResult.unifiedCriteria[0];
    const secondAssessorCriteria = unifiedLogicResult.unifiedCriteria[1];
    const thirdAssessorCriteria = unifiedLogicResult.unifiedCriteria[2];

    // 期待結果 3: 同一の判定基準内容が全査定員に提示される
    expect(firstAssessorCriteria.assessorId).toBe('assessor_001');
    expect(secondAssessorCriteria.assessorId).toBe('assessor_002');
    expect(thirdAssessorCriteria.assessorId).toBe('assessor_003');

    // 各査定員の判定基準が同一であることを検証
    expect(firstAssessorCriteria.criteriaContent).toEqual(
      secondAssessorCriteria.criteriaContent
    );
    expect(secondAssessorCriteria.criteriaContent).toEqual(
      thirdAssessorCriteria.criteriaContent
    );

    // 期待結果 4: 判定基準の詳細内容が正確に定義されている
    const criteriaContent = firstAssessorCriteria.criteriaContent;
    expect(criteriaContent).toHaveProperty('evaluationItems');
    expect(Array.isArray(criteriaContent.evaluationItems)).toBe(true);
    expect(criteriaContent.evaluationItems.length).toBe(3);

    // 評価項目 1: 相場乖離率
    const deviationRateItem = criteriaContent.evaluationItems.find(
      (item: any) => item.itemId === assessmentItemId
    );
    expect(deviationRateItem).toBeDefined();
    expect(deviationRateItem.itemName).toBe('相場乖離率');
    expect(deviationRateItem.weight).toBe(0.4);
    expect(deviationRateItem.lowerThreshold).toBe(-15);
    expect(deviationRateItem.upperThreshold).toBe(15);

    // 評価項目 2: 参照データ件数
    const referenceDataItem = criteriaContent.evaluationItems.find(
      (item: any) => item.itemId === assessmentItemId2
    );
    expect(referenceDataItem).toBeDefined();
    expect(referenceDataItem.itemName).toBe('参照データ件数');
    expect(referenceDataItem.weight).toBe(0.35);
    expect(referenceDataItem.minimumRequiredCount).toBe(30);

    // 評価項目 3: 補正係数
    const correctionCoefficientItem = criteriaContent.evaluationItems.find(
      (item: any) => item.itemId === assessmentItemId3
    );
    expect(correctionCoefficientItem).toBeDefined();
    expect(correctionCoefficientItem.itemName).toBe('補正係数');
    expect(correctionCoefficientItem.weight).toBe(0.25);
    expect(correctionCoefficientItem.applicableRegions).toContain('tokyo');
    expect(correctionCoefficientItem.applicableWorkTypes).toContain(
      'soil_excavation'
    );

    // 期待結果 5: 統一判定基準が全査定員に対して同一の評価項目と重み付けで構成されている
    expect(firstAssessorCriteria.criteriaContent.totalWeight).toBe(1.0);
    expect(secondAssessorCriteria.criteriaContent.totalWeight).toBe(1.0);
    expect(thirdAssessorCriteria.criteriaContent.totalWeight).toBe(1.0);

    // 期待結果 6: 閾値が明確に定義された状態で表示される
    expect(criteriaContent).toHaveProperty('decisionThresholds');
    expect(criteriaContent.decisionThresholds).toHaveProperty('acceptableRange');
    expect(criteriaContent.decisionThresholds.acceptableRange.lower).toBe(0.85);
    expect(criteriaContent.decisionThresholds.acceptableRange.upper).toBe(1.15);

    expect(criteriaContent.decisionThresholds).toHaveProperty(
      'warningThreshold'
    );
    expect(criteriaContent.decisionThresholds.warningThreshold).toBe(0.2);

    // 期待結果 7: ロジック適用の実行内容が記録されている
    expect(unifiedLogicResult).toHaveProperty('applicationHistory');
    expect(unifiedLogicResult.applicationHistory.appliedAt).toBe(
      '2024-01-15T09:00:00Z'
    );
    expect(unifiedLogicResult.applicationHistory.appliedBy).toBe('system');
    expect(unifiedLogicResult.applicationHistory.caseId).toBe(
      unclearJudgmentCaseId
    );

    // 期待結果 8: ロジック適用により複数査定員が同じ判定基準でアクセス可能
    expect(unifiedLogicResult.isAccessibleToAllAssessors).toBe(true);
    expect(unifiedLogicResult.unifiedCriteria.every(
      (criteria: any) => criteria.accessLevel === 'visible'
    )).toBe(true);

    // 期待結果 9: ロジック適用の検証ステータスが正常
    expect(unifiedLogicResult).toHaveProperty('validationStatus');
    expect(unifiedLogicResult.validationStatus.isValid).toBe(true);
    expect(unifiedLogicResult.validationStatus.consistencyScore).toBe(100);
    expect(unifiedLogicResult.validationStatus.allAssessorsReceiveSameCriteria).toBe(
      true
    );
  });
});