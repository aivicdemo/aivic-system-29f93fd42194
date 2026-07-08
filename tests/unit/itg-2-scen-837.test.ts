import { aggregateAssessmentAccuracyByDimensions } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-837: [edge] AI-OCR読取項目と学習データの相場乖離可視化 - 照合データ件数がゼロから複数件への遷移時に、グラフが正常に更新される
  test('照合データ件数ゼロから複数件への遷移時にグラフが段階的に正常に更新される', () => {
    // 初期状態：照合データ件数がゼロ
    const initialInput = {
      assessorId: 'assessor_001',
      constructionType: 'type_A',
      amountBand: 'band_1M_5M',
      comparisonDataSet: [] as Array<{
        estimateAmount: number;
        marketAmount: number;
        deviationRate: number;
        referenceDataCount: number;
        comparisonDate: string;
      }>,
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
    };

    const initialResult = aggregateAssessmentAccuracyByDimensions(initialInput);

    // 初期状態の検証：照合データ件数ゼロ、グラフデータも空
    expect(initialResult.comparisonDataCount).toBe(0);
    expect(initialResult.graphData).toEqual([]);
    expect(initialResult.graphState).toBe('empty');
    expect(initialResult.yAxisMax).toBeNull();
    expect(initialResult.yAxisMin).toBeNull();

    // 照合データを1件追加
    const singleDataInput = {
      assessorId: 'assessor_001',
      constructionType: 'type_A',
      amountBand: 'band_1M_5M',
      comparisonDataSet: [
        {
          estimateAmount: 2500000,
          marketAmount: 2450000,
          deviationRate: 2.04,
          referenceDataCount: 15,
          comparisonDate: '2024-01-15',
        },
      ],
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
    };

    const singleDataResult = aggregateAssessmentAccuracyByDimensions(singleDataInput);

    // 1件データの検証
    expect(singleDataResult.comparisonDataCount).toBe(1);
    expect(singleDataResult.graphData).toHaveLength(1);
    expect(singleDataResult.graphData[0]).toEqual({
      date: '2024-01-15',
      deviationRate: 2.04,
      referenceDataCount: 15,
    });
    expect(singleDataResult.graphState).toBe('rendered');
    expect(singleDataResult.yAxisMax).toBe(2.04);
    expect(singleDataResult.yAxisMin).toBe(2.04);

    // 照合データをさらに複数件追加（合計5件以上）
    const multiDataInput = {
      assessorId: 'assessor_001',
      constructionType: 'type_A',
      amountBand: 'band_1M_5M',
      comparisonDataSet: [
        {
          estimateAmount: 2500000,
          marketAmount: 2450000,
          deviationRate: 2.04,
          referenceDataCount: 15,
          comparisonDate: '2024-01-15',
        },
        {
          estimateAmount: 3200000,
          marketAmount: 3100000,
          deviationRate: 3.23,
          referenceDataCount: 22,
          comparisonDate: '2024-01-18',
        },
        {
          estimateAmount: 1800000,
          marketAmount: 1850000,
          deviationRate: -2.70,
          referenceDataCount: 18,
          comparisonDate: '2024-01-20',
        },
        {
          estimateAmount: 4100000,
          marketAmount: 3950000,
          deviationRate: 3.80,
          referenceDataCount: 25,
          comparisonDate: '2024-01-22',
        },
        {
          estimateAmount: 2200000,
          marketAmount: 2300000,
          deviationRate: -4.35,
          referenceDataCount: 20,
          comparisonDate: '2024-01-25',
        },
        {
          estimateAmount: 3500000,
          marketAmount: 3380000,
          deviationRate: 3.55,
          referenceDataCount: 28,
          comparisonDate: '2024-01-28',
        },
      ],
      period: {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      },
    };

    const multiDataResult = aggregateAssessmentAccuracyByDimensions(multiDataInput);

    // 複数件データの検証
    expect(multiDataResult.comparisonDataCount).toBe(6);
    expect(multiDataResult.graphData).toHaveLength(6);

    // グラフデータが全てのデータポイントを反映
    expect(multiDataResult.graphData[0]).toEqual({
      date: '2024-01-15',
      deviationRate: 2.04,
      referenceDataCount: 15,
    });
    expect(multiDataResult.graphData[1]).toEqual({
      date: '2024-01-18',
      deviationRate: 3.23,
      referenceDataCount: 22,
    });
    expect(multiDataResult.graphData[2]).toEqual({
      date: '2024-01-20',
      deviationRate: -2.70,
      referenceDataCount: 18,
    });
    expect(multiDataResult.graphData[3]).toEqual({
      date: '2024-01-22',
      deviationRate: 3.80,
      referenceDataCount: 25,
    });
    expect(multiDataResult.graphData[4]).toEqual({
      date: '2024-01-25',
      deviationRate: -4.35,
      referenceDataCount: 20,
    });
    expect(multiDataResult.graphData[5]).toEqual({
      date: '2024-01-28',
      deviationRate: 3.55,
      referenceDataCount: 28,
    });

    // Y軸スケールが追加データに応じて自動調整
    expect(multiDataResult.yAxisMax).toBe(3.80);
    expect(multiDataResult.yAxisMin).toBe(-4.35);
    expect(multiDataResult.graphState).toBe('rendered');

    // グラフの凡例が正しく表示
    expect(multiDataResult.legend).toEqual({
      deviationRateLabel: '相場乖離率(%)',
      referenceDataCountLabel: '参照データ件数',
    });

    // パフォーマンス指標：レンダリング時間が許容範囲内
    expect(multiDataResult.renderingTimeMs).toBeLessThan(100);

    // メタデータの検証
    expect(multiDataResult.metadata).toEqual({
      assessorId: 'assessor_001',
      constructionType: 'type_A',
      amountBand: 'band_1M_5M',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      aggregatedAt: expect.any(String),
    });

    // グラフの統計情報
    expect(multiDataResult.statistics).toEqual({
      averageDeviationRate: expect.any(Number),
      maxDeviationRate: 3.80,
      minDeviationRate: -4.35,
      deviationStdDev: expect.any(Number),
      averageReferenceDataCount: expect.closeTo(21.33, 0.01),
    });

    // 具体値で統計検証
    const expectedAverageDev = (2.04 + 3.23 - 2.70 + 3.80 - 4.35 + 3.55) / 6;
    expect(multiDataResult.statistics.averageDeviationRate).toBeCloseTo(expectedAverageDev, 2);

    const expectedAverageRefCount = (15 + 22 + 18 + 25 + 20 + 28) / 6;
    expect(multiDataResult.statistics.averageReferenceDataCount).toBeCloseTo(expectedAverageRefCount, 2);
  });
});