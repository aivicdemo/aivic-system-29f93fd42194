import { aggregateJudgmentAccuracyByAssessor } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-815: 地域別・季節別・工種別の最小サンプル数要件を満たすデータのみが参照され、判定が正常に実行される", () => {
    // テストデータセット: 最小サンプル数以上を満たす地域別・季節別・工種別データ
    const qualifying_dataset = [
      {
        assessor_id: "A001",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-15",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2500000,
        deviation_rate: 0.05,
        sample_count: 12,
      },
      {
        assessor_id: "A001",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-16",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2600000,
        deviation_rate: 0.04,
        sample_count: 12,
      },
      {
        assessor_id: "A001",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-17",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2400000,
        deviation_rate: 0.06,
        sample_count: 12,
      },
      {
        assessor_id: "A001",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-18",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2700000,
        deviation_rate: 0.08,
        sample_count: 12,
      },
      {
        assessor_id: "A001",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-19",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2300000,
        deviation_rate: 0.03,
        sample_count: 12,
      },
      {
        assessor_id: "A002",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-15",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2450000,
        deviation_rate: 0.02,
        sample_count: 12,
      },
      {
        assessor_id: "A002",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-16",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2550000,
        deviation_rate: 0.01,
        sample_count: 12,
      },
      {
        assessor_id: "A002",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-17",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2350000,
        deviation_rate: 0.07,
        sample_count: 12,
      },
      {
        assessor_id: "A002",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-18",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2650000,
        deviation_rate: 0.09,
        sample_count: 12,
      },
      {
        assessor_id: "A002",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-19",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2200000,
        deviation_rate: 0.04,
        sample_count: 12,
      },
      {
        assessor_id: "A003",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-15",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2500000,
        deviation_rate: 0.06,
        sample_count: 12,
      },
      {
        assessor_id: "A003",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Tokyo",
        season: "spring",
        judgment_date: "2024-01-16",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2300000,
        deviation_rate: 0.05,
        sample_count: 12,
      },
    ];

    // テストデータセット: 最小サンプル数未満のデータ（除外されるべき）
    const non_qualifying_dataset = [
      {
        assessor_id: "A004",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Osaka",
        season: "summer",
        judgment_date: "2024-02-15",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2500000,
        deviation_rate: 0.15,
        sample_count: 3,
      },
      {
        assessor_id: "A004",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Osaka",
        season: "summer",
        judgment_date: "2024-02-16",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2600000,
        deviation_rate: 0.12,
        sample_count: 3,
      },
      {
        assessor_id: "A004",
        work_type: "excavation",
        amount_band: "10M-50M",
        region: "Osaka",
        season: "summer",
        judgment_date: "2024-02-17",
        market_range_min: 1000000,
        market_range_max: 5000000,
        estimated_amount: 2400000,
        deviation_rate: 0.18,
        sample_count: 3,
      },
    ];

    // 結合データセット: 最小サンプル数要件以上と未満を混在
    const combined_dataset = [...qualifying_dataset, ...non_qualifying_dataset];

    // 関数呼び出し
    const result = aggregateJudgmentAccuracyByAssessor({
      judgment_records: combined_dataset,
      min_sample_threshold: 10,
      target_region: "Tokyo",
      target_season: "spring",
      target_work_type: "excavation",
      target_amount_band: "10M-50M",
    });

    // 検証1: 結果が存在し、構造が正しい
    expect(result).toBeDefined();
    expect(result).toHaveProperty("assessor_metrics");
    expect(result).toHaveProperty("data_quality_check");
    expect(result).toHaveProperty("excluded_data_count");
    expect(result).toHaveProperty("applied_sample_count");

    // 検証2: 除外データ数が正確
    // non_qualifying_dataset の 3 件は sample_count が 3（10 未満）のため除外される
    expect(result.excluded_data_count).toBe(3);

    // 検証3: 適用されたサンプル数が正確
    // qualifying_dataset の 12 件がすべて適用される（sample_count = 12 >= 10）
    expect(result.applied_sample_count).toBe(12);

    // 検証4: 査定員別精度指標の計算が正確
    // A001: 5 件、偏差率平均 = (0.05 + 0.04 + 0.06 + 0.08 + 0.03) / 5 = 0.052
    // A002: 5 件、偏差率平均 = (0.02 + 0.01 + 0.07 + 0.09 + 0.04) / 5 = 0.046
    // A003: 2 件、偏差率平均 = (0.06 + 0.05) / 2 = 0.055
    expect(result.assessor_metrics).toHaveLength(3);

    const a001_metric = result.assessor_metrics.find(
      (m) => m.assessor_id === "A001"
    );
    expect(a001_metric).toBeDefined();
    expect(a001_metric!.judgment_count).toBe(5);
    expect(a001_metric!.average_deviation_rate).toBeCloseTo(0.052, 3);
    expect(a001_metric!.min_sample_met).toBe(true);

    const a002_metric = result.assessor_metrics.find(
      (m) => m.assessor_id === "A002"
    );
    expect(a002_metric).toBeDefined();
    expect(a002_metric!.judgment_count).toBe(5);
    expect(a002_metric!.average_deviation_rate).toBeCloseTo(0.046, 3);
    expect(a002_metric!.min_sample_met).toBe(true);

    const a003_metric = result.assessor_metrics.find(
      (m) => m.assessor_id === "A003"
    );
    expect(a003_metric).toBeDefined();
    expect(a003_metric!.judgment_count).toBe(2);
    expect(a003_metric!.average_deviation_rate).toBeCloseTo(0.055, 3);
    expect(a003_metric!.min_sample_met).toBe(true);

    // 検証5: A004 は除外されているため、metrics に含まれない
    const a004_metric = result.assessor_metrics.find(
      (m) => m.assessor_id === "A004"
    );
    expect(a004_metric).toBeUndefined();

    // 検証6: データ品質チェック
    expect(result.data_quality_check).toHaveProperty(
      "sample_count_below_threshold"
    );
    expect(result.data_quality_check.sample_count_below_threshold).toBe(3);

    // 検証7: 最小サンプル数要件が適用されたことを確認
    expect(result.data_quality_check).toHaveProperty("min_threshold_applied");
    expect(result.data_quality_check.min_threshold_applied).toBe(10);

    // 検証8: 参照フィルタリング情報
    expect(result).toHaveProperty("filter_criteria");
    expect(result.filter_criteria.region).toBe("Tokyo");
    expect(result.filter_criteria.season).toBe("spring");
    expect(result.filter_criteria.work_type).toBe("excavation");
    expect(result.filter_criteria.amount_band).toBe("10M-50M");
  });
});