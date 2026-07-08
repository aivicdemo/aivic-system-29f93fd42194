import { aggregateDashboardMetrics } from '../../src/logic/it-6-2-1-1';

describe('経営ダッシュボード表示データの自動集計', () => {
  // SCEN-1320
  test('月次実績データから処理時間短縮率、品質均一化、稼働率が正確に集計され、ダッシュボード用に成形される', () => {
    // 前月のベースラインデータ
    const previousMonthData = {
      totalProcessingTimeMinutes: 12000,
      averageQualityScore: 85.5,
      operatingMinutes: 8800,
    };

    // 当月の査定案件データ
    const currentMonthCaseData = [
      {
        caseId: 'CASE001',
        processingTimeMinutes: 25,
        qualityScore: 88,
        operatingMinutes: 480,
      },
      {
        caseId: 'CASE002',
        processingTimeMinutes: 22,
        qualityScore: 87,
        operatingMinutes: 480,
      },
      {
        caseId: 'CASE003',
        processingTimeMinutes: 28,
        qualityScore: 90,
        operatingMinutes: 480,
      },
      {
        caseId: 'CASE004',
        processingTimeMinutes: 24,
        qualityScore: 86,
        operatingMinutes: 480,
      },
      {
        caseId: 'CASE005',
        processingTimeMinutes: 26,
        qualityScore: 89,
        operatingMinutes: 480,
      },
      {
        caseId: 'CASE006',
        processingTimeMinutes: 23,
        qualityScore: 85,
        operatingMinutes: 480,
      },
      {
        caseId: 'CASE007',
        processingTimeMinutes: 27,
        qualityScore: 88,
        operatingMinutes: 480,
      },
      {
        caseId: 'CASE008',
        processingTimeMinutes: 25,
        qualityScore: 87,
        operatingMinutes: 480,
      },
      {
        caseId: 'CASE009',
        processingTimeMinutes: 24,
        qualityScore: 91,
        operatingMinutes: 480,
      },
      {
        caseId: 'CASE010',
        processingTimeMinutes: 26,
        qualityScore: 86,
        operatingMinutes: 480,
      },
    ];

    // 関数を実行
    const result = aggregateDashboardMetrics(
      previousMonthData,
      currentMonthCaseData
    );

    // 当月の合計処理時間: 25+22+28+24+26+23+27+25+24+26 = 250分
    // 当月の平均処理時間: 250 / 10 = 25分
    // 処理時間短縮率 = (前月平均 - 当月平均) / 前月平均 × 100
    //                = (12000/480 - 25) / (12000/480) × 100
    //                = (25 - 25) / 25 × 100 = 0%
    const expectedProcessingTimeReductionRate = 0;

    // 品質スコア: 88, 87, 90, 86, 89, 85, 88, 87, 91, 86
    // 平均: 877 / 10 = 87.7
    // 分散: ((88-87.7)² + (87-87.7)² + (90-87.7)² + (86-87.7)² + (89-87.7)² + (85-87.7)² + (88-87.7)² + (87-87.7)² + (91-87.7)² + (86-87.7)²) / 10
    //     = (0.09 + 0.49 + 5.29 + 2.89 + 1.69 + 7.29 + 0.09 + 0.49 + 10.89 + 2.89) / 10
    //     = 32.1 / 10 = 3.21
    // 標準偏差: √3.21 ≈ 1.792
    // 品質均一化指数 = 100 - (標準偏差 / 平均 × 100) = 100 - (1.792 / 87.7 × 100) ≈ 97.96
    const expectedQualityUniformityIndex = 97.96;

    // 稼働率 = 当月稼働分数 / 営業時間 × 100
    // 当月稼働分数: 480 × 10 = 4800分
    // 営業時間: 480分 × 20営業日 = 9600分（標準）
    // または入力された稼働分数を使用
    // 稼働率 = 4800 / 9600 × 100 = 50%
    const expectedOperatingRate = 50;

    // 結果の検証
    expect(result).toEqual({
      processingTimeReductionRate: expectedProcessingTimeReductionRate,
      qualityUniformityIndex: expect.closeTo(
        expectedQualityUniformityIndex,
        0.01
      ),
      operatingRate: expectedOperatingRate,
      dashboardFormat: {
        metrics: [
          {
            label: '処理時間短縮率',
            value: expectedProcessingTimeReductionRate,
            unit: '%',
            precision: 1,
          },
          {
            label: '品質均一化指数',
            value: expect.closeTo(expectedQualityUniformityIndex, 0.01),
            unit: 'ポイント',
            precision: 2,
          },
          {
            label: 'システム稼働率',
            value: expectedOperatingRate,
            unit: '%',
            precision: 1,
          },
        ],
        aggregatedAt: expect.any(String),
        period: 'MONTHLY',
      },
    });

    // 処理時間短縮率が正確に計算されているか
    expect(result.processingTimeReductionRate).toBe(
      expectedProcessingTimeReductionRate
    );

    // 品質均一化指数が正確に計算されているか
    expect(result.qualityUniformityIndex).toBeCloseTo(
      expectedQualityUniformityIndex,
      1
    );

    // 稼働率が正確に計算されているか
    expect(result.operatingRate).toBe(expectedOperatingRate);

    // ダッシュボード形式で成形されているか
    expect(result.dashboardFormat).toBeDefined();
    expect(result.dashboardFormat.metrics).toHaveLength(3);
    expect(result.dashboardFormat.period).toBe('MONTHLY');
    expect(result.dashboardFormat.aggregatedAt).toBeDefined();

    // 各メトリクスが正しい単位で表記されているか
    expect(result.dashboardFormat.metrics[0]).toEqual({
      label: '処理時間短縮率',
      value: expectedProcessingTimeReductionRate,
      unit: '%',
      precision: 1,
    });

    expect(result.dashboardFormat.metrics[1]).toMatchObject({
      label: '品質均一化指数',
      unit: 'ポイント',
      precision: 2,
    });

    expect(result.dashboardFormat.metrics[2]).toEqual({
      label: 'システム稼働率',
      value: expectedOperatingRate,
      unit: '%',
      precision: 1,
    });

    // 集計処理が正常に完了している
    expect(result).toBeDefined();
    expect(Object.keys(result)).toContain('processingTimeReductionRate');
    expect(Object.keys(result)).toContain('qualityUniformityIndex');
    expect(Object.keys(result)).toContain('operatingRate');
    expect(Object.keys(result)).toContain('dashboardFormat');
  });
});