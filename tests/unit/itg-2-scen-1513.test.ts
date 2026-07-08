import { 
  analyzeDiscrepancyPatternComparison 
} from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  test("SCEN-1513: 改善前後乖離パターン比較分析 - 改善後データが1ヶ月の境界値ちょうど蓄積された場合に比較分析を実行", () => {
    // 改善前データ（2024-01-01 00:00:00 ～ 2024-02-01 00:00:00）
    const pre_improvement_data = [
      {
        assessment_id: "PRE_001",
        assessment_date: new Date("2024-01-05T09:30:00Z"),
        discrepancy_rate: 12.5,
        discrepancy_amount: 125000,
        pattern_category: "over_price",
        region: "region_A",
        work_type: "work_type_1",
        assessor_id: "ASS_001",
      },
      {
        assessment_id: "PRE_002",
        assessment_date: new Date("2024-01-10T14:15:00Z"),
        discrepancy_rate: 8.3,
        discrepancy_amount: 83000,
        pattern_category: "under_price",
        region: "region_B",
        work_type: "work_type_2",
        assessor_id: "ASS_002",
      },
      {
        assessment_id: "PRE_003",
        assessment_date: new Date("2024-01-15T11:00:00Z"),
        discrepancy_rate: -5.2,
        discrepancy_amount: -52000,
        pattern_category: "normal",
        region: "region_A",
        work_type: "work_type_1",
        assessor_id: "ASS_001",
      },
      {
        assessment_id: "PRE_004",
        assessment_date: new Date("2024-01-20T16:45:00Z"),
        discrepancy_rate: 15.7,
        discrepancy_amount: 157000,
        pattern_category: "over_price",
        region: "region_C",
        work_type: "work_type_3",
        assessor_id: "ASS_003",
      },
      {
        assessment_id: "PRE_005",
        assessment_date: new Date("2024-01-25T10:30:00Z"),
        discrepancy_rate: 3.1,
        discrepancy_amount: 31000,
        pattern_category: "normal",
        region: "region_B",
        work_type: "work_type_2",
        assessor_id: "ASS_002",
      },
    ];

    // 改善後データ（2024-01-01 00:00:00 ～ 2024-02-01 00:00:00、ちょうど1ヶ月）
    const post_improvement_data = [
      {
        assessment_id: "POST_001",
        assessment_date: new Date("2024-01-05T09:30:00Z"),
        discrepancy_rate: 7.2,
        discrepancy_amount: 72000,
        pattern_category: "normal",
        region: "region_A",
        work_type: "work_type_1",
        assessor_id: "ASS_001",
      },
      {
        assessment_id: "POST_002",
        assessment_date: new Date("2024-01-10T14:15:00Z"),
        discrepancy_rate: 4.1,
        discrepancy_amount: 41000,
        pattern_category: "normal",
        region: "region_B",
        work_type: "work_type_2",
        assessor_id: "ASS_002",
      },
      {
        assessment_id: "POST_003",
        assessment_date: new Date("2024-01-15T11:00:00Z"),
        discrepancy_rate: -2.0,
        discrepancy_amount: -20000,
        pattern_category: "normal",
        region: "region_A",
        work_type: "work_type_1",
        assessor_id: "ASS_001",
      },
      {
        assessment_id: "POST_004",
        assessment_date: new Date("2024-01-20T16:45:00Z"),
        discrepancy_rate: 9.3,
        discrepancy_amount: 93000,
        pattern_category: "over_price",
        region: "region_C",
        work_type: "work_type_3",
        assessor_id: "ASS_003",
      },
      {
        assessment_id: "POST_005",
        assessment_date: new Date("2024-01-25T10:30:00Z"),
        discrepancy_rate: 1.8,
        discrepancy_amount: 18000,
        pattern_category: "normal",
        region: "region_B",
        work_type: "work_type_2",
        assessor_id: "ASS_002",
      },
    ];

    const analysis_period_start = new Date("2024-01-01T00:00:00Z");
    const analysis_period_end = new Date("2024-02-01T00:00:00Z");

    // 改善前後の平均乖離率を計算（期待値）
    const pre_avg_discrepancy_rate = 
      (12.5 + 8.3 + (-5.2) + 15.7 + 3.1) / 5; // = 6.88
    const post_avg_discrepancy_rate = 
      (7.2 + 4.1 + (-2.0) + 9.3 + 1.8) / 5; // = 4.08

    // 改善率を計算（期待値）
    const improvement_rate = 
      ((pre_avg_discrepancy_rate - post_avg_discrepancy_rate) / pre_avg_discrepancy_rate) * 100; // ≈ 40.70%

    // 改善前のパターン分布
    const pre_pattern_distribution = {
      over_price: 2,     // PRE_001, PRE_004
      under_price: 1,    // PRE_002
      normal: 2,         // PRE_003, PRE_005
    };

    // 改善後のパターン分布
    const post_pattern_distribution = {
      over_price: 1,     // POST_004
      under_price: 0,
      normal: 4,         // POST_001, POST_002, POST_003, POST_005
    };

    const comparison_result = analyzeDiscrepancyPatternComparison({
      pre_improvement_assessments: pre_improvement_data,
      post_improvement_assessments: post_improvement_data,
      analysis_period_start,
      analysis_period_end,
    });

    // 1. 分析対象データ件数の検証
    expect(comparison_result.pre_improvement_count).toBe(5);
    expect(comparison_result.post_improvement_count).toBe(5);
    expect(comparison_result.total_comparison_records).toBe(10);

    // 2. 改善前後の平均乖離率が正常に計算されていることを検証
    expect(Math.abs(comparison_result.pre_avg_discrepancy_rate - 6.88)).toBeLessThan(0.01);
    expect(Math.abs(comparison_result.post_avg_discrepancy_rate - 4.08)).toBeLessThan(0.01);

    // 3. 改善率が正常に計算されていることを検証（期待値は約40.70%）
    expect(Math.abs(comparison_result.improvement_rate - 40.70)).toBeLessThan(0.5);

    // 4. パターン分布が正常に集計されていることを検証
    expect(comparison_result.pre_pattern_distribution).toEqual(pre_pattern_distribution);
    expect(comparison_result.post_pattern_distribution).toEqual(post_pattern_distribution);

    // 5. 改善前後のパターン比較が含まれていることを検証
    expect(comparison_result.pattern_comparison).toBeDefined();
    expect(comparison_result.pattern_comparison.over_price_reduction).toBe(1);  // 2 → 1
    expect(comparison_result.pattern_comparison.under_price_reduction).toBe(1);  // 1 → 0
    expect(comparison_result.pattern_comparison.normal_increase).toBe(2);        // 2 → 4

    // 6. 分析期間が正常に記録されていることを検証
    expect(comparison_result.analysis_start_time.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    expect(comparison_result.analysis_end_time.toISOString()).toBe("2024-02-01T00:00:00.000Z");

    // 7. 分析結果のシステム登録フラグが正常であることを検証
    expect(comparison_result.is_valid).toBe(true);
    expect(comparison_result.registered_to_system).toBe(true);
    expect(comparison_result.registration_timestamp).toBeDefined();
    expect(typeof comparison_result.registration_timestamp).toBe("object");

    // 8. 分析結果に異常値が含まれていないことを検証
    expect(comparison_result.pre_avg_discrepancy_rate).toBeGreaterThan(-100);
    expect(comparison_result.post_avg_discrepancy_rate).toBeGreaterThan(-100);
    expect(comparison_result.improvement_rate).toBeGreaterThanOrEqual(0);
    expect(comparison_result.improvement_rate).toBeLessThanOrEqual(100);

    // 9. 分析結果に地域別・工種別の分析データが含まれていることを検証
    expect(comparison_result.analysis_by_region).toBeDefined();
    expect(comparison_result.analysis_by_work_type).toBeDefined();
    expect(Object.keys(comparison_result.analysis_by_region).length).toBeGreaterThan(0);
    expect(Object.keys(comparison_result.analysis_by_work_type).length).toBeGreaterThan(0);

    // 10. 改善前後の最大乖離率・最小乖離率が正常に記録されていることを検証
    expect(comparison_result.pre_max_discrepancy_rate).toBe(15.7);
    expect(comparison_result.pre_min_discrepancy_rate).toBe(-5.2);
    expect(comparison_result.post_max_discrepancy_rate).toBe(9.3);
    expect(comparison_result.post_min_discrepancy_rate).toBe(-2.0);
  });
});