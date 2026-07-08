import { calculateMonthlyVarianceAndTrendAnalysis } from "../../src/logic/it-6-2-2-1";

describe("月次判定ばらつき率・相場乖離傾向集計機能", () => {
  test("SCEN-857: 月次の査定員ごとの判定ばらつき率と相場乖離傾向が自動集計され、ダッシュボードに表示される", () => {
    // 前置条件: 前月のデータが完全に入力・確定されている
    const month = "2024-01";
    const assessorDataset = [
      {
        assessor_id: "ASS001",
        assessor_name: "査定員A",
        judgment_results: [
          {
            case_id: "CASE001",
            quote_amount: 1000000,
            auto_judgment_amount: 950000,
            assessor_judgment_amount: 980000,
            deviation_rate: -2,
          },
          {
            case_id: "CASE002",
            quote_amount: 2000000,
            auto_judgment_amount: 1950000,
            assessor_judgment_amount: 1950000,
            deviation_rate: 0,
          },
          {
            case_id: "CASE003",
            quote_amount: 1500000,
            auto_judgment_amount: 1480000,
            assessor_judgment_amount: 1500000,
            deviation_rate: 1.35,
          },
        ],
      },
      {
        assessor_id: "ASS002",
        assessor_name: "査定員B",
        judgment_results: [
          {
            case_id: "CASE004",
            quote_amount: 1200000,
            auto_judgment_amount: 1150000,
            assessor_judgment_amount: 1180000,
            deviation_rate: 2.61,
          },
          {
            case_id: "CASE005",
            quote_amount: 1800000,
            auto_judgment_amount: 1780000,
            assessor_judgment_amount: 1750000,
            deviation_rate: -1.69,
          },
          {
            case_id: "CASE006",
            quote_amount: 2200000,
            auto_judgment_amount: 2150000,
            assessor_judgment_amount: 2200000,
            deviation_rate: 2.33,
          },
        ],
      },
      {
        assessor_id: "ASS003",
        assessor_name: "査定員C",
        judgment_results: [
          {
            case_id: "CASE007",
            quote_amount: 900000,
            auto_judgment_amount: 880000,
            assessor_judgment_amount: 900000,
            deviation_rate: 2.27,
          },
          {
            case_id: "CASE008",
            quote_amount: 1600000,
            auto_judgment_amount: 1580000,
            assessor_judgment_amount: 1600000,
            deviation_rate: 1.27,
          },
        ],
      },
    ];

    // 集計処理を実行
    const result = calculateMonthlyVarianceAndTrendAnalysis({
      month: month,
      assessor_dataset: assessorDataset,
    });

    // 期待結果の検証: 集計データが正確に計算されていることを確認

    // 1. 結果オブジェクトの構造と基本属性
    expect(result).toHaveProperty("aggregation_month");
    expect(result).toHaveProperty("aggregation_date");
    expect(result).toHaveProperty("assessor_metrics");
    expect(result).toHaveProperty("overall_statistics");

    // 2. 集計月が正確であること
    expect(result.aggregation_month).toBe("2024-01");

    // 3. 集計日付が当月の月初であること（固定値）
    expect(result.aggregation_date).toBe("2024-01-01");

    // 4. 査定員ごとの判定ばらつき率が正確に計算されていることを検証

    // 査定員A: 判定ばらつき率 = 標準偏差(|-2|, |0|, |1.35|) / 平均(|-2|, |0|, |1.35|)
    // = 標準偏差(2, 0, 1.35) / 平均(2, 0, 1.35)
    // 平均 = (2 + 0 + 1.35) / 3 = 1.1167
    // 分散 = ((2-1.1167)² + (0-1.1167)² + (1.35-1.1167)²) / 3
    //      = (0.7847 + 1.2469 + 0.0544) / 3 = 0.6953
    // 標準偏差 = sqrt(0.6953) = 0.8339
    // ばらつき率 = 0.8339 / 1.1167 = 74.67
    const assessorAVariance = result.assessor_metrics.find(
      (m: any) => m.assessor_id === "ASS001"
    );
    expect(assessorAVariance).toBeDefined();
    expect(assessorAVariance.assessor_name).toBe("査定員A");
    expect(assessorAVariance.judgment_variance_rate).toBeCloseTo(74.67, 1);

    // 査定員B: 判定ばらつき率
    // = 標準偏差(|2.61|, |-1.69|, |2.33|) / 平均(|2.61|, |-1.69|, |2.33|)
    // = 標準偏差(2.61, 1.69, 2.33) / 平均(2.61, 1.69, 2.33)
    // 平均 = (2.61 + 1.69 + 2.33) / 3 = 2.21
    // 分散 = ((2.61-2.21)² + (1.69-2.21)² + (2.33-2.21)²) / 3
    //      = (0.16 + 0.2704 + 0.0144) / 3 = 0.1516
    // 標準偏差 = sqrt(0.1516) = 0.3893
    // ばらつき率 = 0.3893 / 2.21 = 17.61
    const assessorBVariance = result.assessor_metrics.find(
      (m: any) => m.assessor_id === "ASS002"
    );
    expect(assessorBVariance).toBeDefined();
    expect(assessorBVariance.assessor_name).toBe("査定員B");
    expect(assessorBVariance.judgment_variance_rate).toBeCloseTo(17.61, 1);

    // 査定員C: 判定ばらつき率
    // = 標準偏差(|2.27|, |1.27|) / 平均(|2.27|, |1.27|)
    // = 標準偏差(2.27, 1.27) / 平均(2.27, 1.27)
    // 平均 = (2.27 + 1.27) / 2 = 1.77
    // 分散 = ((2.27-1.77)² + (1.27-1.77)²) / 2
    //      = (0.25 + 0.25) / 2 = 0.25
    // 標準偏差 = sqrt(0.25) = 0.5
    // ばらつき率 = 0.5 / 1.77 = 28.25
    const assessorCVariance = result.assessor_metrics.find(
      (m: any) => m.assessor_id === "ASS003"
    );
    expect(assessorCVariance).toBeDefined();
    expect(assessorCVariance.assessor_name).toBe("査定員C");
    expect(assessorCVariance.judgment_variance_rate).toBeCloseTo(28.25, 1);

    // 5. 査定員ごとの相場乖離傾向が正確に集計されていることを検証

    // 査定員A: 相場乖離傾向（過小・標準・過大の分類）
    // |-2|=2, |0|=0, |1.35|=1.35
    // 過小（< 0.5%）: 0件
    // 標準（0.5% ≤ x ≤ 2%）: 2件（0%は標準に含む、1.35%）
    // 過大（> 2%）: 1件（2%）
    expect(assessorAVariance.deviation_pattern).toEqual({
      underprice_count: 0,
      standard_count: 2,
      overprice_count: 1,
    });

    // 査定員B: 相場乖離傾向
    // |2.61|, |-1.69|, |2.33|
    // 過小（< 0.5%）: 0件
    // 標準（0.5% ≤ x ≤ 2%）: 1件（1.69%）
    // 過大（> 2%）: 2件（2.61%, 2.33%）
    expect(assessorBVariance.deviation_pattern).toEqual({
      underprice_count: 0,
      standard_count: 1,
      overprice_count: 2,
    });

    // 査定員C: 相場乖離傾向
    // |2.27|, |1.27|
    // 過小（< 0.5%）: 0件
    // 標準（0.5% ≤ x ≤ 2%）: 1件（1.27%）
    // 過大（> 2%）: 1件（2.27%）
    expect(assessorCVariance.deviation_pattern).toEqual({
      underprice_count: 0,
      standard_count: 1,
      overprice_count: 1,
    });

    // 6. 全体統計が正確に集計されていることを検証
    expect(result.overall_statistics).toHaveProperty("total_assessors");
    expect(result.overall_statistics).toHaveProperty(
      "average_variance_rate"
    );
    expect(result.overall_statistics).toHaveProperty(
      "median_variance_rate"
    );
    expect(result.overall_statistics).toHaveProperty(
      "max_variance_rate"
    );
    expect(result.overall_statistics).toHaveProperty(
      "min_variance_rate"
    );

    // 全体統計: 総査定員数 = 3
    expect(result.overall_statistics.total_assessors).toBe(3);

    // 平均ばらつき率 = (74.67 + 17.61 + 28.25) / 3 = 40.18
    expect(result.overall_statistics.average_variance_rate).toBeCloseTo(
      40.18,
      1
    );

    // 中央値ばらつき率 = ソート後(17.61, 28.25, 74.67)の中央値 = 28.25
    expect(result.overall_statistics.median_variance_rate).toBeCloseTo(28.25, 1);

    // 最大ばらつき率 = 74.67
    expect(result.overall_statistics.max_variance_rate).toBeCloseTo(74.67, 1);

    // 最小ばらつき率 = 17.61
    expect(result.overall_statistics.min_variance_rate).toBeCloseTo(17.61, 1);

    // 7. 複数査定員のデータが過不足なく含まれていること
    expect(result.assessor_metrics).toHaveLength(3);
    const assessorIds = result.assessor_metrics.map(
      (m: any) => m.assessor_id
    );
    expect(assessorIds).toEqual(["ASS001", "ASS002", "ASS003"]);

    // 8. 各査定員のデータが完全かつ正確であること
    result.assessor_metrics.forEach((metric: any) => {
      expect(metric).toHaveProperty("assessor_id");
      expect(metric).toHaveProperty("assessor_name");
      expect(metric).toHaveProperty("judgment_variance_rate");
      expect(metric).toHaveProperty("deviation_pattern");
      expect(metric).toHaveProperty("case_count");
      expect(metric.judgment_variance_rate).toBeGreaterThanOrEqual(0);
      expect(metric.case_count).toBeGreaterThan(0);
    });

    // 9. ケース数が正確に集計されていること
    expect(assessorAVariance.case_count).toBe(3);
    expect(assessorBVariance.case_count).toBe(3);
    expect(assessorCVariance.case_count).toBe(2);

    // 10. グラフ表示用のデータが包含されていること
    expect(result).toHaveProperty("chart_data");
    expect(result.chart_data).toHaveProperty("variance_rate_series");
    expect(result.chart_data).toHaveProperty("deviation_pattern_series");

    // グラフデータの整合性: variance_rate_series が各査定員のばらつき率を含む
    expect(result.chart_data.variance_rate_series).toHaveLength(3);
    const seriesValues = result.chart_data.variance_rate_series.map(
      (s: any) => s.value
    );
    expect(seriesValues).toContain(74.67 as any);
    expect(seriesValues).toContain(17.61 as any);
    expect(seriesValues).toContain(28.25 as any);
  });
});