import { aggregateDivergenceReasonData } from '../../src/logic/it-6-3-1';

describe('判定根拠表示・ダッシュボード統合機能 - 相場乖離の根拠データが複数件存在する場合にすべてダッシュボードに集約表示される', () => {
  // SCEN-1048
  test('相場乖離の根拠データが複数件（3件以上）存在する場合、ダッシュボード上にすべてが集約表示され、各根拠データの詳細情報が正確に表示されることを確認する', () => {
    const divergenceReasonData = [
      {
        reasonId: 'reason_001',
        caseId: 'case_2024_001',
        divergenceRate: 8.5,
        divergenceAmount: 125000,
        referenceDataCount: 5,
        referenceSource: '過去案件データ',
        correctionCoefficient: 1.05,
        divergenceReason: '地域別補正係数の適用',
        assessmentAmountDifference: 12500,
        createdAt: '2024-01-15T09:30:00Z',
        createdBy: 'assessor_user_001'
      },
      {
        reasonId: 'reason_002',
        caseId: 'case_2024_001',
        divergenceRate: 5.2,
        divergenceAmount: 78000,
        referenceDataCount: 3,
        referenceSource: '物価本データ',
        correctionCoefficient: 1.02,
        divergenceReason: '時期別相場変動',
        assessmentAmountDifference: 7800,
        createdAt: '2024-01-15T09:35:00Z',
        createdBy: 'assessor_user_001'
      },
      {
        reasonId: 'reason_003',
        caseId: 'case_2024_001',
        divergenceRate: 3.1,
        divergenceAmount: 46500,
        referenceDataCount: 4,
        referenceSource: '過去案件データ',
        correctionCoefficient: 1.01,
        divergenceReason: '工種別単価差分',
        assessmentAmountDifference: 4650,
        createdAt: '2024-01-15T09:40:00Z',
        createdBy: 'assessor_user_001'
      }
    ];

    const aggregatedResult = aggregateDivergenceReasonData(divergenceReasonData);

    expect(aggregatedResult).toBeDefined();
    expect(aggregatedResult.totalReasonCount).toBe(3);
    expect(aggregatedResult.uniqueReasonIds.length).toBe(3);
    expect(aggregatedResult.uniqueReasonIds).toContain('reason_001');
    expect(aggregatedResult.uniqueReasonIds).toContain('reason_002');
    expect(aggregatedResult.uniqueReasonIds).toContain('reason_003');

    expect(aggregatedResult.combinedDivergenceRate).toBe(16.8);
    expect(aggregatedResult.combinedDivergenceAmount).toBe(249500);
    expect(aggregatedResult.totalReferenceDataCount).toBe(12);
    expect(aggregatedResult.totalAssessmentAmountDifference).toBe(24950);

    expect(aggregatedResult.reasons.length).toBe(3);

    const reason1 = aggregatedResult.reasons.find((r) => r.reasonId === 'reason_001');
    expect(reason1).toBeDefined();
    expect(reason1.divergenceRate).toBe(8.5);
    expect(reason1.divergenceAmount).toBe(125000);
    expect(reason1.referenceDataCount).toBe(5);
    expect(reason1.referenceSource).toBe('過去案件データ');
    expect(reason1.correctionCoefficient).toBe(1.05);
    expect(reason1.divergenceReason).toBe('地域別補正係数の適用');
    expect(reason1.assessmentAmountDifference).toBe(12500);
    expect(reason1.createdAt).toBe('2024-01-15T09:30:00Z');
    expect(reason1.createdBy).toBe('assessor_user_001');

    const reason2 = aggregatedResult.reasons.find((r) => r.reasonId === 'reason_002');
    expect(reason2).toBeDefined();
    expect(reason2.divergenceRate).toBe(5.2);
    expect(reason2.divergenceAmount).toBe(78000);
    expect(reason2.referenceDataCount).toBe(3);
    expect(reason2.referenceSource).toBe('物価本データ');
    expect(reason2.correctionCoefficient).toBe(1.02);
    expect(reason2.divergenceReason).toBe('時期別相場変動');
    expect(reason2.assessmentAmountDifference).toBe(7800);
    expect(reason2.createdAt).toBe('2024-01-15T09:35:00Z');
    expect(reason2.createdBy).toBe('assessor_user_001');

    const reason3 = aggregatedResult.reasons.find((r) => r.reasonId === 'reason_003');
    expect(reason3).toBeDefined();
    expect(reason3.divergenceRate).toBe(3.1);
    expect(reason3.divergenceAmount).toBe(46500);
    expect(reason3.referenceDataCount).toBe(4);
    expect(reason3.referenceSource).toBe('過去案件データ');
    expect(reason3.correctionCoefficient).toBe(1.01);
    expect(reason3.divergenceReason).toBe('工種別単価差分');
    expect(reason3.assessmentAmountDifference).toBe(4650);
    expect(reason3.createdAt).toBe('2024-01-15T09:40:00Z');
    expect(reason3.createdBy).toBe('assessor_user_001');

    expect(aggregatedResult.hasDuplicates).toBe(false);
    expect(aggregatedResult.hasGaps).toBe(false);
    expect(aggregatedResult.allReasonsPresent).toBe(true);

    const reasonIds = aggregatedResult.reasons.map((r) => r.reasonId);
    const uniqueIds = new Set(reasonIds);
    expect(uniqueIds.size).toBe(3);
  });
});