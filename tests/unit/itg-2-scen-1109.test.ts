import { aggregateMonthlyAssessmentMetrics } from '../../src/logic/it-6-2-1-1';

describe('月次査定結果分析・集計機能 - 集計対象月の査定データが1件以下の場合', () => {
  // SCEN-1109
  test('集計対象月の査定データが1件以下の場合に平均値算出エラーを適切に処理する', () => {
    const monthKey = '2024-01';

    // 0件のケース
    const resultWithZeroRecords = aggregateMonthlyAssessmentMetrics({
      assessmentRecords: [],
      targetMonth: monthKey,
    });

    expect(resultWithZeroRecords.success).toBe(false);
    expect(resultWithZeroRecords.errorMessage).toMatch(/集計対象データが不足/);
    expect(resultWithZeroRecords.errorCode).toBe('INSUFFICIENT_DATA');
    expect(resultWithZeroRecords.systemStatus).toBe('stable');
    expect(resultWithZeroRecords.canRetry).toBe(true);

    // 1件のケース
    const singleRecord = {
      assessmentId: 'ASS-001',
      assessorId: 'ASSR-001',
      assessorName: '査定者A',
      assessmentDate: '2024-01-15',
      constructionType: '建築一式',
      budgetRange: '1000-5000万',
      quotationAmount: 3500,
      marketPrice: 3400,
      deviationRate: 2.94,
      deviationAmount: 100,
      processingTimeMinutes: 25,
      accuracyScore: 95,
    };

    const resultWithOneRecord = aggregateMonthlyAssessmentMetrics({
      assessmentRecords: [singleRecord],
      targetMonth: monthKey,
    });

    expect(resultWithOneRecord.success).toBe(false);
    expect(resultWithOneRecord.errorMessage).toMatch(/最低2件以上/);
    expect(resultWithOneRecord.errorCode).toBe('INSUFFICIENT_DATA');
    expect(resultWithOneRecord.systemStatus).toBe('stable');
    expect(resultWithOneRecord.canRetry).toBe(true);

    // 2件以上のケース（正常系）
    const recordsSet = [
      {
        assessmentId: 'ASS-001',
        assessorId: 'ASSR-001',
        assessorName: '査定者A',
        assessmentDate: '2024-01-10',
        constructionType: '建築一式',
        budgetRange: '1000-5000万',
        quotationAmount: 3500,
        marketPrice: 3400,
        deviationRate: 2.94,
        deviationAmount: 100,
        processingTimeMinutes: 25,
        accuracyScore: 95,
      },
      {
        assessmentId: 'ASS-002',
        assessorId: 'ASSR-001',
        assessorName: '査定者A',
        assessmentDate: '2024-01-12',
        constructionType: '建築一式',
        budgetRange: '1000-5000万',
        quotationAmount: 4200,
        marketPrice: 4000,
        deviationRate: 5.0,
        deviationAmount: 200,
        processingTimeMinutes: 30,
        accuracyScore: 92,
      },
      {
        assessmentId: 'ASS-003',
        assessorId: 'ASSR-002',
        assessorName: '査定者B',
        assessmentDate: '2024-01-15',
        constructionType: '土木工事',
        budgetRange: '5000-10000万',
        quotationAmount: 7500,
        marketPrice: 7200,
        deviationRate: 4.17,
        deviationAmount: 300,
        processingTimeMinutes: 35,
        accuracyScore: 88,
      },
    ];

    const resultWithValidData = aggregateMonthlyAssessmentMetrics({
      assessmentRecords: recordsSet,
      targetMonth: monthKey,
    });

    expect(resultWithValidData.success).toBe(true);
    expect(resultWithValidData.errorMessage).toBeNull();
    expect(resultWithValidData.errorCode).toBeNull();
    expect(resultWithValidData.systemStatus).toBe('stable');
    expect(resultWithValidData.canRetry).toBe(false);

    // 集計結果の検証
    expect(resultWithValidData.aggregatedMetrics).toBeDefined();
    expect(resultWithValidData.aggregatedMetrics!.totalAssessmentCount).toBe(3);
    expect(resultWithValidData.aggregatedMetrics!.averageProcessingTimeMinutes).toBe(
      (25 + 30 + 35) / 3
    );
    expect(resultWithValidData.aggregatedMetrics!.averageDeviationRate).toBe(
      (2.94 + 5.0 + 4.17) / 3
    );
    expect(resultWithValidData.aggregatedMetrics!.averageAccuracyScore).toBe(
      (95 + 92 + 88) / 3
    );

    // 査定者別集計
    expect(resultWithValidData.aggregatedMetrics!.byAssessor).toBeDefined();
    expect(resultWithValidData.aggregatedMetrics!.byAssessor!.length).toBe(2);
    const assessor1 = resultWithValidData.aggregatedMetrics!.byAssessor!.find(
      (a) => a.assessorId === 'ASSR-001'
    );
    expect(assessor1).toBeDefined();
    expect(assessor1!.count).toBe(2);
    expect(assessor1!.averageProcessingTimeMinutes).toBe((25 + 30) / 2);
    expect(assessor1!.averageAccuracyScore).toBe((95 + 92) / 2);

    // 工種別集計
    expect(resultWithValidData.aggregatedMetrics!.byConstructionType).toBeDefined();
    expect(resultWithValidData.aggregatedMetrics!.byConstructionType!.length).toBe(2);
    const constructionType1 = resultWithValidData.aggregatedMetrics!.byConstructionType!.find(
      (c) => c.constructionType === '建築一式'
    );
    expect(constructionType1).toBeDefined();
    expect(constructionType1!.count).toBe(2);
    expect(constructionType1!.averageDeviationRate).toBe((2.94 + 5.0) / 2);

    // 金額帯別集計
    expect(resultWithValidData.aggregatedMetrics!.byBudgetRange).toBeDefined();
    expect(resultWithValidData.aggregatedMetrics!.byBudgetRange!.length).toBe(2);
    const budgetRange1 = resultWithValidData.aggregatedMetrics!.byBudgetRange!.find(
      (b) => b.budgetRange === '1000-5000万'
    );
    expect(budgetRange1).toBeDefined();
    expect(budgetRange1!.count).toBe(2);
    expect(budgetRange1!.averageAccuracyScore).toBe((95 + 92) / 2);

    // ログ記録が行われたことを確認（メタデータ）
    expect(resultWithValidData.processingTimestamp).toBeDefined();
    expect(resultWithValidData.logRecorded).toBe(true);
  });
});