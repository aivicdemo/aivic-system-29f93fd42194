import { calculateAssessorPrecisionMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1279: [normal] 査定員別判定精度指標自動計測機能 - 相場乖離率・判定ばらつき率・査定時間が月次実績から正確に計測される
  test("査定員別判定精度指標が月次実績から自動的かつ正確に計測される", () => {
    // 過去1ヶ月の査定データ
    const assessmentData = [
      {
        assessor_id: "assessor_001",
        assessment_date: "2024-01-15T10:00:00Z",
        assessment_end_time: "2024-01-15T10:30:00Z",
        product_id: "product_A",
        assessment_price: 1050000,
        market_price: 1000000,
        product_category: "工種_A",
        price_band: "金額帯_1M",
      },
      {
        assessor_id: "assessor_001",
        assessment_date: "2024-01-15T11:00:00Z",
        assessment_end_time: "2024-01-15T11:25:00Z",
        product_id: "product_B",
        assessment_price: 2090000,
        market_price: 2000000,
        product_category: "工種_A",
        price_band: "金額帯_2M",
      },
      {
        assessor_id: "assessor_002",
        assessment_date: "2024-01-15T10:00:00Z",
        assessment_end_time: "2024-01-15T10:40:00Z",
        product_id: "product_A",
        assessment_price: 1000000,
        market_price: 1000000,
        product_category: "工種_A",
        price_band: "金額帯_1M",
      },
      {
        assessor_id: "assessor_002",
        assessment_date: "2024-01-15T11:00:00Z",
        assessment_end_time: "2024-01-15T11:20:00Z",
        product_id: "product_B",
        assessment_price: 2100000,
        market_price: 2000000,
        product_category: "工種_A",
        price_band: "金額帯_2M",
      },
      {
        assessor_id: "assessor_003",
        assessment_date: "2024-01-15T10:00:00Z",
        assessment_end_time: "2024-01-15T10:35:00Z",
        product_id: "product_A",
        assessment_price: 990000,
        market_price: 1000000,
        product_category: "工種_A",
        price_band: "金額帯_1M",
      },
    ];

    // 関数呼び出し
    const result = calculateAssessorPrecisionMetrics(assessmentData);

    // 相場乖離率の計測ロジック検証
    // assessor_001 - product_A: |1050000 - 1000000| / 1000000 * 100 = 5.0%
    // assessor_001 - product_B: |2090000 - 2000000| / 2000000 * 100 = 4.5%
    // assessor_001 平均乖離率: (5.0 + 4.5) / 2 = 4.75%
    expect(result.assessor_metrics[0].assessor_id).toBe("assessor_001");
    expect(result.assessor_metrics[0].divergence_rate).toBeCloseTo(4.75, 2);

    // assessor_002 - product_A: |1000000 - 1000000| / 1000000 * 100 = 0.0%
    // assessor_002 - product_B: |2100000 - 2000000| / 2000000 * 100 = 5.0%
    // assessor_002 平均乖離率: (0.0 + 5.0) / 2 = 2.5%
    expect(result.assessor_metrics[1].assessor_id).toBe("assessor_002");
    expect(result.assessor_metrics[1].divergence_rate).toBeCloseTo(2.5, 2);

    // assessor_003 - product_A: |990000 - 1000000| / 1000000 * 100 = 1.0%
    expect(result.assessor_metrics[2].assessor_id).toBe("assessor_003");
    expect(result.assessor_metrics[2].divergence_rate).toBeCloseTo(1.0, 2);

    // 判定ばらつき率の計測ロジック検証
    // product_A の査定員間の価格差: assessor_001=1050000, assessor_002=1000000, assessor_003=990000
    // 平均: (1050000 + 1000000 + 990000) / 3 = 1013333.33
    // 分散: ((1050000-1013333.33)^2 + (1000000-1013333.33)^2 + (990000-1013333.33)^2) / 3
    //     = (1344444444.44 + 177777777.78 + 544444444.44) / 3 = 688888888.89
    // 標準偏差: sqrt(688888888.89) = 26243.39
    // 判定ばらつき率: 26243.39 / 1013333.33 * 100 = 2.589%
    const product_a_variance = result.product_metrics.find(
      (p) => p.product_id === "product_A"
    );
    expect(product_a_variance).toBeDefined();
    expect(product_a_variance!.variation_rate).toBeCloseTo(2.59, 1);

    // 査定時間の計測ロジック検証
    // assessor_001 - product_A: 10:30 - 10:00 = 30分
    // assessor_001 - product_B: 11:25 - 11:00 = 25分
    // assessor_001 平均査定時間: (30 + 25) / 2 = 27.5分
    expect(result.assessor_metrics[0].average_assessment_time_minutes).toBeCloseTo(27.5, 1);

    // assessor_002 - product_A: 10:40 - 10:00 = 40分
    // assessor_002 - product_B: 11:20 - 11:00 = 20分
    // assessor_002 平均査定時間: (40 + 20) / 2 = 30分
    expect(result.assessor_metrics[1].average_assessment_time_minutes).toBeCloseTo(30.0, 1);

    // assessor_003 - product_A: 10:35 - 10:00 = 35分
    expect(result.assessor_metrics[2].average_assessment_time_minutes).toBeCloseTo(35.0, 1);

    // 月次実績として各指標が集計・表示されていることを確認
    expect(result.monthly_summary).toBeDefined();
    expect(result.monthly_summary.total_assessments).toBe(5);
    expect(result.monthly_summary.total_assessors).toBe(3);
    expect(result.monthly_summary.reporting_period_start).toBe("2024-01-01");
    expect(result.monthly_summary.reporting_period_end).toBe("2024-01-31");

    // 複数の査定員データが個別に計測されていることを確認
    expect(result.assessor_metrics).toHaveLength(3);
    expect(result.assessor_metrics[0].assessor_id).toBe("assessor_001");
    expect(result.assessor_metrics[1].assessor_id).toBe("assessor_002");
    expect(result.assessor_metrics[2].assessor_id).toBe("assessor_003");

    // 各査定員の指標が個별 값으로 계산되었는지 검증
    result.assessor_metrics.forEach((metric) => {
      expect(metric.divergence_rate).toBeGreaterThanOrEqual(0);
      expect(metric.average_assessment_time_minutes).toBeGreaterThan(0);
      expect(metric.assessment_count).toBeGreaterThan(0);
    });

    // 計測結果がエクスポート可能なフォーマットであることを確認
    expect(result.export_formats).toBeDefined();
    expect(result.export_formats).toContain("CSV");
    expect(result.export_formats).toContain("PDF");

    // エクスポート用データが構造化されていることを確認
    expect(result.csv_export_data).toBeDefined();
    expect(result.csv_export_data.headers).toContain("assessor_id");
    expect(result.csv_export_data.headers).toContain("divergence_rate");
    expect(result.csv_export_data.headers).toContain("variation_rate");
    expect(result.csv_export_data.headers).toContain("average_assessment_time_minutes");
    expect(result.csv_export_data.rows).toHaveLength(3);

    // システム計測値と手動検証値の一致確認
    // 手動検測 - assessor_001の平均乖離率: 4.75%
    // システム出力: 4.75%
    const assessor_001_metric = result.assessor_metrics.find(
      (m) => m.assessor_id === "assessor_001"
    );
    expect(assessor_001_metric!.divergence_rate).toBe(4.75);

    // 手動検측 - 전체 평균 查定 시간
    const total_avg_time =
      (27.5 + 30.0 + 35.0) / 3;
    expect(result.monthly_summary.average_assessment_time_minutes).toBeCloseTo(total_avg_time, 1);

    // 工種別・金額帯別の指標が個별로 계산되었는지 검증
    expect(result.category_metrics).toBeDefined();
    expect(result.category_metrics).toHaveLength(1);
    expect(result.category_metrics[0].product_category).toBe("工種_A");
    expect(result.category_metrics[0].average_divergence_rate).toBe(4.75 + 2.5 + 1.0) / 3;

    expect(result.price_band_metrics).toBeDefined();
    const band_1m = result.price_band_metrics.find(
      (b) => b.price_band === "金額帯_1M"
    );
    expect(band_1m).toBeDefined();
    const band_1m_divergence = ((5.0 + 0.0 + 1.0) / 3);
    expect(band_1m!.average_divergence_rate).toBeCloseTo(band_1m_divergence, 2);
  });
});