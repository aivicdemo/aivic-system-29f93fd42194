import { aggregateMonthlyDeviationPatterns } from '../../src/logic/it-1-br-2-2-2-1';

describe('月次相場乖離パターン集計機能', () => {
  test('SCEN-1454: 査定データが存在しない月が含まれる場合、集計対象外として正常に処理できる', () => {
    // テストデータ: 過去12ヶ月のうち3ヶ月分の査定データが存在しない状態
    const monthlyAssessmentData = [
      {
        month: '2023-01',
        deviationCount: 25,
        avgDeviationRate: 8.5,
        patterns: [
          { type: 'underestimate', count: 10, rate: 40.0 },
          { type: 'overestimate', count: 12, rate: 48.0 },
          { type: 'standard', count: 3, rate: 12.0 }
        ]
      },
      {
        month: '2023-02',
        deviationCount: null,
        avgDeviationRate: null,
        patterns: []
      },
      {
        month: '2023-03',
        deviationCount: 32,
        avgDeviationRate: 7.2,
        patterns: [
          { type: 'underestimate', count: 14, rate: 43.75 },
          { type: 'overestimate', count: 15, rate: 46.875 },
          { type: 'standard', count: 3, rate: 9.375 }
        ]
      },
      {
        month: '2023-04',
        deviationCount: null,
        avgDeviationRate: null,
        patterns: []
      },
      {
        month: '2023-05',
        deviationCount: 28,
        avgDeviationRate: 6.9,
        patterns: [
          { type: 'underestimate', count: 11, rate: 39.286 },
          { type: 'overestimate', count: 14, rate: 50.0 },
          { type: 'standard', count: 3, rate: 10.714 }
        ]
      },
      {
        month: '2023-06',
        deviationCount: 30,
        avgDeviationRate: 8.1,
        patterns: [
          { type: 'underestimate', count: 13, rate: 43.333 },
          { type: 'overestimate', count: 14, rate: 46.667 },
          { type: 'standard', count: 3, rate: 10.0 }
        ]
      },
      {
        month: '2023-07',
        deviationCount: 26,
        avgDeviationRate: 7.5,
        patterns: [
          { type: 'underestimate', count: 10, rate: 38.462 },
          { type: 'overestimate', count: 13, rate: 50.0 },
          { type: 'standard', count: 3, rate: 11.538 }
        ]
      },
      {
        month: '2023-08',
        deviationCount: 29,
        avgDeviationRate: 8.3,
        patterns: [
          { type: 'underestimate', count: 12, rate: 41.379 },
          { type: 'overestimate', count: 14, rate: 48.276 },
          { type: 'standard', count: 3, rate: 10.345 }
        ]
      },
      {
        month: '2023-09',
        deviationCount: null,
        avgDeviationRate: null,
        patterns: []
      },
      {
        month: '2023-10',
        deviationCount: 31,
        avgDeviationRate: 7.8,
        patterns: [
          { type: 'underestimate', count: 13, rate: 41.935 },
          { type: 'overestimate', count: 15, rate: 48.387 },
          { type: 'standard', count: 3, rate: 9.678 }
        ]
      },
      {
        month: '2023-11',
        deviationCount: 27,
        avgDeviationRate: 7.1,
        patterns: [
          { type: 'underestimate', count: 10, rate: 37.037 },
          { type: 'overestimate', count: 14, rate: 51.852 },
          { type: 'standard', count: 3, rate: 11.111 }
        ]
      },
      {
        month: '2023-12',
        deviationCount: 33,
        avgDeviationRate: 8.7,
        patterns: [
          { type: 'underestimate', count: 14, rate: 42.424 },
          { type: 'overestimate', count: 16, rate: 48.485 },
          { type: 'standard', count: 3, rate: 9.091 }
        ]
      }
    ];

    const aggregationPeriodMonths = 12;

    // 実行
    const result = aggregateMonthlyDeviationPatterns({
      monthlyData: monthlyAssessmentData,
      aggregationPeriodMonths: aggregationPeriodMonths
    });

    // 期待値計算
    const validMonths = monthlyAssessmentData.filter(
      m => m.deviationCount !== null && m.deviationCount > 0
    );
    const invalidMonths = monthlyAssessmentData.filter(
      m => m.deviationCount === null || m.deviationCount === 0
    );

    const totalDeviationCount = validMonths.reduce(
      (sum, m) => sum + m.deviationCount,
      0
    );
    const totalUnderestimateCount = validMonths.reduce(
      (sum, m) => sum + m.patterns.find(p => p.type === 'underestimate')?.count || 0,
      0
    );
    const totalOverestimateCount = validMonths.reduce(
      (sum, m) => sum + m.patterns.find(p => p.type === 'overestimate')?.count || 0,
      0
    );
    const totalStandardCount = validMonths.reduce(
      (sum, m) => sum + m.patterns.find(p => p.type === 'standard')?.count || 0,
      0
    );

    const avgDeviationRate = parseFloat(
      (validMonths.reduce((sum, m) => sum + m.avgDeviationRate, 0) / validMonths.length).toFixed(2)
    );

    const underestimateRate = parseFloat(
      ((totalUnderestimateCount / totalDeviationCount) * 100).toFixed(2)
    );
    const overestimateRate = parseFloat(
      ((totalOverestimateCount / totalDeviationCount) * 100).toFixed(2)
    );
    const standardRate = parseFloat(
      ((totalStandardCount / totalDeviationCount) * 100).toFixed(2)
    );

    // 検証: 集計対象月数
    expect(result.aggregationSummary.targetMonthCount).toBe(9);

    // 検証: 対象外月数
    expect(result.aggregationSummary.excludedMonthCount).toBe(3);

    // 検証: 総デビエーション件数
    expect(result.aggregationSummary.totalDeviationCount).toBe(271);

    // 検証: 平均乖離率
    expect(result.aggregationSummary.overallAvgDeviationRate).toBe(7.78);

    // 検証: パターン別集計 - 過小見積もり
    expect(result.aggregationSummary.patterns.underestimate.count).toBe(117);
    expect(result.aggregationSummary.patterns.underestimate.rate).toBe(43.17);

    // 検証: パターン別集計 - 過大見積もり
    expect(result.aggregationSummary.patterns.overestimate.count).toBe(133);
    expect(result.aggregationSummary.patterns.overestimate.rate).toBe(49.07);

    // 検証: パターン別集計 - 標準
    expect(result.aggregationSummary.patterns.standard.count).toBe(21);
    expect(result.aggregationSummary.patterns.standard.rate).toBe(7.75);

    // 検証: 集計対象月リスト内容確認
    expect(result.includedMonths).toHaveLength(9);
    expect(result.includedMonths).toEqual([
      '2023-01',
      '2023-03',
      '2023-05',
      '2023-06',
      '2023-07',
      '2023-08',
      '2023-10',
      '2023-11',
      '2023-12'
    ]);

    // 検証: 集計対象外月リスト
    expect(result.excludedMonths).toHaveLength(3);
    expect(result.excludedMonths).toEqual(['2023-02', '2023-04', '2023-09']);

    // 検証: エラーフラグが false であることを確認
    expect(result.hasError).toBe(false);

    // 検証: エラーメッセージが空であることを確認
    expect(result.errorMessage).toBe('');

    // 検証: 処理ステータスが成功であることを確認
    expect(result.status).toBe('success');
  });
});