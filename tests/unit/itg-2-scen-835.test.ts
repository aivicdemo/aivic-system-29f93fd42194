import { aggregateJudgmentAccuracy } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-835
  test('過去案件データ・物価本との照合結果が数値・グラフで正常に可視化される', () => {
    const pastCaseDataset = [
      {
        caseId: 'CASE-001',
        workType: '鉄筋工事',
        region: '東京',
        estimatedAmount: 1000000,
        actualAmount: 980000,
        season: '春',
        recordDate: '2024-01-15'
      },
      {
        caseId: 'CASE-002',
        workType: '鉄筋工事',
        region: '東京',
        estimatedAmount: 1200000,
        actualAmount: 1180000,
        season: '春',
        recordDate: '2024-02-10'
      },
      {
        caseId: 'CASE-003',
        workType: '型枠工事',
        region: '大阪',
        estimatedAmount: 800000,
        actualAmount: 750000,
        season: '夏',
        recordDate: '2024-01-20'
      }
    ];

    const commodityMasterData = [
      {
        itemId: 'ITEM-001',
        itemName: '異形棒鋼',
        standardPrice: 95000,
        priceDate: '2024-01-01',
        region: '東京'
      },
      {
        itemId: 'ITEM-002',
        itemName: '型枠用合板',
        standardPrice: 45000,
        priceDate: '2024-01-01',
        region: '大阪'
      }
    ];

    const assessorId = 'ASSESSOR-001';
    const workTypeFilter = '鉄筋工事';
    const amountRangeMin = 900000;
    const amountRangeMax = 1300000;

    const result = aggregateJudgmentAccuracy({
      pastCaseDataset,
      commodityMasterData,
      assessorId,
      workTypeFilter,
      amountRangeMin,
      amountRangeMax
    });

    expect(result).toBeDefined();
    expect(result.numericalData).toBeDefined();
    expect(result.graphData).toBeDefined();
    expect(result.visualizationStatus).toBe('正常');

    expect(result.numericalData.deviationRate).toBe(-1.67);
    expect(result.numericalData.deviationAmount).toBe(-20000);
    expect(result.numericalData.referenceCaseCount).toBe(2);
    expect(result.numericalData.averageDeviationPercentage).toBeCloseTo(-1.67, 1);

    expect(result.graphData.dataPoints).toHaveLength(2);
    expect(result.graphData.dataPoints[0]).toEqual({
      caseId: 'CASE-001',
      deviationRate: -2.0,
      deviationAmount: -20000,
      deviationCategory: '許容範囲'
    });
    expect(result.graphData.dataPoints[1]).toEqual({
      caseId: 'CASE-002',
      deviationRate: -1.67,
      deviationAmount: -20000,
      deviationCategory: '許容範囲'
    });

    expect(result.graphData.xAxisLabel).toBe('過去案件');
    expect(result.graphData.yAxisLabel).toBe('乖離率(%)');
    expect(result.graphData.legend).toEqual(['許容範囲', '要注意', '警告']);
    expect(result.graphData.colorMapping).toEqual({
      '許容範囲': '#4CAF50',
      '要注意': '#FFC107',
      '警告': '#F44336'
    });

    expect(result.graphData.scalingThresholds).toEqual({
      minDeviation: -3.0,
      maxDeviation: 1.0
    });

    expect(result.dataConsistency).toBe(true);
    expect(result.graphNumericalAlignment).toBe(true);

    expect(Array.isArray(result.graphData.dataPoints)).toBe(true);
    expect(result.numericalData.deviationRate).not.toEqual(
      result.numericalData.deviationAmount
    );
    expect(result.graphData.dataPoints.every((p) => typeof p.deviationRate === 'number')).toBe(
      true
    );

    const multipleExecutionResults = [];
    for (let i = 0; i < 3; i++) {
      const iterResult = aggregateJudgmentAccuracy({
        pastCaseDataset,
        commodityMasterData,
        assessorId: `ASSESSOR-00${i + 1}`,
        workTypeFilter: '鉄筋工事',
        amountRangeMin: 900000,
        amountRangeMax: 1300000
      });
      multipleExecutionResults.push(iterResult);
    }

    expect(multipleExecutionResults).toHaveLength(3);
    multipleExecutionResults.forEach((r) => {
      expect(r.visualizationStatus).toBe('正常');
      expect(r.numericalData).toBeDefined();
      expect(r.graphData).toBeDefined();
    });

    expect(result.graphData.dataPoints.every((p) => p.deviationCategory !== null)).toBe(true);
    expect(['許容範囲', '要注意', '警告'].includes(result.graphData.dataPoints[0].deviationCategory)).toBe(true);

    expect(result.numericalData.referenceCaseCount).toBeGreaterThan(0);
    expect(
      result.numericalData.referenceCaseCount <=
        pastCaseDataset.filter((c) => c.workType === workTypeFilter).length
    ).toBe(true);

    expect(
      result.numericalData.averageDeviationPercentage >=
        result.graphData.scalingThresholds.minDeviation &&
        result.numericalData.averageDeviationPercentage <=
          result.graphData.scalingThresholds.maxDeviation
    ).toBe(true);
  });
});