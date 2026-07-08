import { aggregateDailyAssessmentMetrics } from "../../src/logic/it-6-2-1-1";

describe("月次査定業務実績の集計・ダッシュボード表示機能", () => {
  // SCEN-757
  test("月末営業日に査定件数・平均処理時間・査定員別生産性・繁忙度指数が正確に集計される", () => {
    // テストデータ準備: 当月の査定実績
    const assessmentRecords = [
      {
        assessmentId: "ASS001",
        assessorId: "ASSESSOR001",
        assessmentDate: "2024-01-31",
        processingTimeMinutes: 40,
        workType: "建築工事",
        amountBand: "1000万～2000万",
        quotationAmount: 1500,
        deviationRate: 3.2,
        status: "completed",
      },
      {
        assessmentId: "ASS002",
        assessorId: "ASSESSOR002",
        assessmentDate: "2024-01-31",
        processingTimeMinutes: 50,
        workType: "土木工事",
        amountBand: "2000万～3000万",
        quotationAmount: 2500,
        deviationRate: 5.1,
        status: "completed",
      },
      {
        assessmentId: "ASS003",
        assessorId: "ASSESSOR003",
        assessmentDate: "2024-01-31",
        processingTimeMinutes: 45,
        workType: "建築工事",
        amountBand: "500万～1000万",
        quotationAmount: 800,
        deviationRate: 2.8,
        status: "completed",
      },
      {
        assessmentId: "ASS004",
        assessorId: "ASSESSOR001",
        assessmentDate: "2024-01-31",
        processingTimeMinutes: 42,
        workType: "設備工事",
        amountBand: "1000万～2000万",
        quotationAmount: 1200,
        deviationRate: 4.5,
        status: "completed",
      },
      {
        assessmentId: "ASS005",
        assessorId: "ASSESSOR004",
        assessmentDate: "2024-01-31",
        processingTimeMinutes: 48,
        workType: "建築工事",
        amountBand: "3000万以上",
        quotationAmount: 4000,
        deviationRate: 6.2,
        status: "completed",
      },
    ];

    // 100件分の追加テストレコード（シナリオ要件: 100件）
    const additionalRecords = Array.from({ length: 95 }, (_, index) => ({
      assessmentId: `ASS${String(index + 6).padStart(3, "0")}`,
      assessorId: `ASSESSOR${String((index % 5) + 1).padStart(3, "0")}`,
      assessmentDate: "2024-01-31",
      processingTimeMinutes: 40 + Math.floor(Math.random() * 20),
      workType: index % 3 === 0 ? "建築工事" : index % 3 === 1 ? "土木工事" : "設備工事",
      amountBand:
        index % 4 === 0
          ? "500万～1000万"
          : index % 4 === 1
            ? "1000万～2000万"
            : index % 4 === 2
              ? "2000万～3000万"
              : "3000万以上",
      quotationAmount: 500000 + Math.random() * 9500000,
      deviationRate: 1.5 + Math.random() * 8.0,
      status: "completed",
    }));

    const allRecords = [...assessmentRecords, ...additionalRecords];

    // 集計対象期間の指定（月末営業日）
    const aggregationPeriod = {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      businessDayOnly: true,
    };

    // 集計実行
    const aggregationResult = aggregateDailyAssessmentMetrics(
      allRecords,
      aggregationPeriod
    );

    // 期待値の計算
    const expectedTotalCount = 100;
    const expectedAverageProcessingTime = 45; // 45分（期待値）
    const assessorCount = 5;

    // 査定件数の検証
    expect(aggregationResult.totalAssessmentCount).toBe(expectedTotalCount);

    // 平均処理時間の検証
    expect(Math.round(aggregationResult.averageProcessingTimeMinutes)).toBe(
      expectedAverageProcessingTime
    );

    // 査定員別生産性の検証
    expect(aggregationResult.assessorProductivity).toBeDefined();
    expect(Object.keys(aggregationResult.assessorProductivity).length).toBe(
      assessorCount
    );

    // 各査定員の生産性データが存在することを確認
    Object.values(aggregationResult.assessorProductivity).forEach(
      (productivity: any) => {
        expect(productivity.assessmentCount).toBeGreaterThan(0);
        expect(productivity.averageProcessingTime).toBeGreaterThan(0);
        expect(productivity.productivityIndex).toBeGreaterThanOrEqual(0);
      }
    );

    // 繁忙度指数の検証
    expect(aggregationResult.congestionIndex).toBeDefined();
    expect(aggregationResult.congestionIndex).toBeGreaterThanOrEqual(0);
    expect(aggregationResult.congestionIndex).toBeLessThanOrEqual(100);

    // ダッシュボード表示用データの構造検証
    expect(aggregationResult.dashboardData).toBeDefined();
    expect(aggregationResult.dashboardData.chartData).toBeDefined();
    expect(aggregationResult.dashboardData.summaryMetrics).toBeDefined();

    // チャートデータの検証
    expect(
      aggregationResult.dashboardData.chartData.dailyAssessmentCount
    ).toBeDefined();
    expect(
      aggregationResult.dashboardData.chartData.assessorProductivityChart
    ).toBeDefined();
    expect(
      aggregationResult.dashboardData.chartData.workTypeDistribution
    ).toBeDefined();

    // サマリーメトリクスの検証
    const summaryMetrics = aggregationResult.dashboardData.summaryMetrics;
    expect(summaryMetrics.totalCount).toBe(expectedTotalCount);
    expect(Math.round(summaryMetrics.averageTime)).toBe(
      expectedAverageProcessingTime
    );
    expect(summaryMetrics.assessorCount).toBe(assessorCount);
    expect(summaryMetrics.congestionLevel).toMatch(/通常期|準繁忙期|繁忙期/);

    // 工種別集計データの検証
    expect(aggregationResult.byWorkType).toBeDefined();
    expect(
      aggregationResult.byWorkType["建築工事"].totalCount
    ).toBeGreaterThan(0);
    expect(
      aggregationResult.byWorkType["建築工事"].averageProcessingTime
    ).toBeGreaterThan(0);

    // 金額帯別集計データの検証
    expect(aggregationResult.byAmountBand).toBeDefined();
    expect(Object.keys(aggregationResult.byAmountBand).length).toBeGreaterThan(
      0
    );

    // 集計タイムスタンプの検証
    expect(aggregationResult.aggregatedAt).toBeDefined();
    expect(new Date(aggregationResult.aggregatedAt).getTime()).toBeLessThanOrEqual(
      Date.now()
    );

    // データ品質フラグの検証
    expect(aggregationResult.dataQuality).toBeDefined();
    expect(aggregationResult.dataQuality.completeRecordCount).toBe(
      expectedTotalCount
    );
    expect(aggregationResult.dataQuality.incompleteRecordCount).toBe(0);
    expect(aggregationResult.dataQuality.dataCompleteness).toBe(100);
  });
});