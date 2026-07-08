import { aggregateAssessmentAccuracyIndicators } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1104: 月次分析サイクル完了判定機能 - 月次分析の全プロセスが5営業日以内に完了した場合、完了状態が正常に判定される", () => {
    // 開始日: 2024年1月8日（月曜日 - 営業日1）
    const cycle_start_date = new Date("2024-01-08T09:00:00Z");

    // プロセス完了タイムスタンプ（営業日カウント: 月火水木金）
    // 営業日1（1月8日月）: データ収集完了
    const data_collection_completed_at = new Date("2024-01-08T15:30:00Z");

    // 営業日2（1月9日火）: データ検証完了
    const data_validation_completed_at = new Date("2024-01-09T14:20:00Z");

    // 営業日3（1月10日水）: 品質チェック完了
    const quality_check_completed_at = new Date("2024-01-10T16:45:00Z");

    // 営業日4（1月11日木）: 標準化プロセス完了
    const standardization_completed_at = new Date("2024-01-11T13:15:00Z");

    // 営業日5（1月12日金）: 最終承認完了
    const final_approval_completed_at = new Date("2024-01-12T11:00:00Z");

    // 月次分析対象期間
    const analysis_period_start = new Date("2024-01-01T00:00:00Z");
    const analysis_period_end = new Date("2024-01-31T23:59:59Z");

    // 査定担当者別の判定精度データ
    const assessor_accuracy_data = [
      {
        assessor_id: "A001",
        assessor_name: "新人_太郎",
        total_assessments: 24,
        correct_assessments: 18,
        avg_assessment_time_minutes: 45,
        deviation_pattern_count: 6,
        accuracy_rate: 75.0,
        deviation_rate: 25.0,
      },
      {
        assessor_id: "A002",
        assessor_name: "経験者_花子",
        total_assessments: 28,
        correct_assessments: 27,
        avg_assessment_time_minutes: 28,
        deviation_pattern_count: 1,
        accuracy_rate: 96.43,
        deviation_rate: 3.57,
      },
    ];

    // 工種別の判定精度データ
    const work_type_accuracy_data = [
      {
        work_type_code: "W001",
        work_type_name: "土工事",
        total_assessments: 18,
        correct_assessments: 17,
        accuracy_rate: 94.44,
      },
      {
        work_type_code: "W002",
        work_type_name: "鉄骨工事",
        total_assessments: 16,
        correct_assessments: 14,
        accuracy_rate: 87.5,
      },
      {
        work_type_code: "W003",
        work_type_name: "仕上げ工事",
        total_assessments: 18,
        correct_assessments: 14,
        accuracy_rate: 77.78,
      },
    ];

    // 金額帯別の判定精度データ
    const price_band_accuracy_data = [
      {
        price_band_code: "P001",
        price_band_name: "100万円未満",
        price_range_min: 0,
        price_range_max: 1000000,
        total_assessments: 12,
        correct_assessments: 11,
        accuracy_rate: 91.67,
      },
      {
        price_band_code: "P002",
        price_band_name: "100万円～500万円",
        price_range_min: 1000000,
        price_range_max: 5000000,
        total_assessments: 22,
        correct_assessments: 20,
        accuracy_rate: 90.91,
      },
      {
        price_band_code: "P003",
        price_band_name: "500万円以上",
        price_range_min: 5000000,
        price_range_max: null,
        total_assessments: 18,
        correct_assessments: 14,
        accuracy_rate: 77.78,
      },
    ];

    // 月次分析サイクル完了判定の入力パラメータ
    const cycle_completion_check_params = {
      cycle_start_date: cycle_start_date,
      data_collection_completed_at: data_collection_completed_at,
      data_validation_completed_at: data_validation_completed_at,
      quality_check_completed_at: quality_check_completed_at,
      standardization_completed_at: standardization_completed_at,
      final_approval_completed_at: final_approval_completed_at,
      business_days_threshold: 5,
    };

    // 関数を実行
    const result = aggregateAssessmentAccuracyIndicators({
      analysis_period_start: analysis_period_start,
      analysis_period_end: analysis_period_end,
      assessor_accuracy_data: assessor_accuracy_data,
      work_type_accuracy_data: work_type_accuracy_data,
      price_band_accuracy_data: price_band_accuracy_data,
      cycle_completion_check: cycle_completion_check_params,
    });

    // ========== 検証: 月次分析サイクル完了判定 ==========
    // 完了状態が「正常」であることを確認
    expect(result.cycle_completion_status).toBe("completed");
    expect(result.cycle_status_detail).toBe("正常");

    // 最終承認完了日時が開始日から5営業日以内であることを確認
    const business_days_elapsed = Math.ceil(
      (result.final_approval_completed_at.getTime() -
        result.cycle_start_date.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(business_days_elapsed).toBeLessThanOrEqual(7); // 実カレンダー日数が7日以内

    // ========== 検証: 査定担当者別判定精度指標 ==========
    expect(result.aggregated_assessor_metrics.length).toBe(2);

    // 新人太郎の指標検証
    const assessor_a001 = result.aggregated_assessor_metrics.find(
      (m) => m.assessor_id === "A001"
    );
    expect(assessor_a001).toBeDefined();
    expect(assessor_a001.accuracy_rate).toBe(75.0);
    expect(assessor_a001.deviation_rate).toBe(25.0);
    expect(assessor_a001.avg_assessment_time_minutes).toBe(45);
    expect(assessor_a001.ability_level_classification).toBe("新人");

    // 経験者花子の指標検証
    const assessor_a002 = result.aggregated_assessor_metrics.find(
      (m) => m.assessor_id === "A002"
    );
    expect(assessor_a002).toBeDefined();
    expect(assessor_a002.accuracy_rate).toBe(96.43);
    expect(assessor_a002.deviation_rate).toBe(3.57);
    expect(assessor_a002.avg_assessment_time_minutes).toBe(28);
    expect(assessor_a002.ability_level_classification).toBe("経験者");

    // 新人と経験者の能力差を定量化
    const ability_gap_accuracy = assessor_a002.accuracy_rate - assessor_a001.accuracy_rate;
    expect(ability_gap_accuracy).toBe(21.43);

    const ability_gap_time = assessor_a001.avg_assessment_time_minutes - assessor_a002.avg_assessment_time_minutes;
    expect(ability_gap_time).toBe(17);

    // ========== 検証: 工種別判定精度指標 ==========
    expect(result.aggregated_work_type_metrics.length).toBe(3);

    // 土工事の精度検証
    const work_type_w001 = result.aggregated_work_type_metrics.find(
      (m) => m.work_type_code === "W001"
    );
    expect(work_type_w001).toBeDefined();
    expect(work_type_w001.accuracy_rate).toBe(94.44);
    expect(work_type_w001.total_assessments).toBe(18);

    // 鉄骨工事の精度検証
    const work_type_w002 = result.aggregated_work_type_metrics.find(
      (m) => m.work_type_code === "W002"
    );
    expect(work_type_w002).toBeDefined();
    expect(work_type_w002.accuracy_rate).toBe(87.5);
    expect(work_type_w002.total_assessments).toBe(16);

    // 仕上げ工事の精度検証
    const work_type_w003 = result.aggregated_work_type_metrics.find(
      (m) => m.work_type_code === "W003"
    );
    expect(work_type_w003).toBeDefined();
    expect(work_type_w003.accuracy_rate).toBe(77.78);
    expect(work_type_w003.total_assessments).toBe(18);

    // 工種別の能力差を検出（土工事が最も精度が高い）
    const max_work_type_accuracy = Math.max(
      work_type_w001.accuracy_rate,
      work_type_w002.accuracy_rate,
      work_type_w003.accuracy_rate
    );
    const min_work_type_accuracy = Math.min(
      work_type_w001.accuracy_rate,
      work_type_w002.accuracy_rate,
      work_type_w003.accuracy_rate
    );
    const work_type_accuracy_gap = max_work_type_accuracy - min_work_type_accuracy;
    expect(work_type_accuracy_gap).toBe(16.66);

    // ========== 検証: 金額帯別判定精度指標 ==========
    expect(result.aggregated_price_band_metrics.length).toBe(3);

    // 100万円未満の精度検証
    const price_band_p001 = result.aggregated_price_band_metrics.find(
      (m) => m.price_band_code === "P001"
    );
    expect(price_band_p001).toBeDefined();
    expect(price_band_p001.accuracy_rate).toBe(91.67);
    expect(price_band_p001.total_assessments).toBe(12);

    // 100万円～500万円の精度検証
    const price_band_p002 = result.aggregated_price_band_metrics.find(
      (m) => m.price_band_code === "P002"
    );
    expect(price_band_p002).toBeDefined();
    expect(price_band_p002.accuracy_rate).toBe(90.91);
    expect(price_band_p002.total_assessments).toBe(22);

    // 500万円以上の精度検証
    const price_band_p003 = result.aggregated_price_band_metrics.find(
      (m) => m.price_band_code === "P003"
    );
    expect(price_band_p003).toBeDefined();
    expect(price_band_p003.accuracy_rate).toBe(77.78);
    expect(price_band_p003.total_assessments).toBe(18);

    // 金額帯別の能力差を検出（小額案件が最も精度が高い）
    const max_price_band_accuracy = Math.max(
      price_band_p001.accuracy_rate,
      price_band_p002.accuracy_rate,
      price_band_p003.accuracy_rate
    );
    const min_price_band_accuracy = Math.min(
      price_band_p001.accuracy_rate,
      price_band_p002.accuracy_rate,
      price_band_p003.accuracy_rate
    );
    const price_band_accuracy_gap = max_price_band_accuracy - min_price_band_accuracy;
    expect(price_band_accuracy_gap).toBe(13.89);

    // ========== 検証: 全体月次統計 ==========
    expect(result.monthly_summary.total_assessments).toBe(52);
    expect(result.monthly_summary.total_correct_assessments).toBe(45);
    expect(result.monthly_summary.overall_accuracy_rate).toBeCloseTo(86.54, 1);
    expect(result.monthly_summary.analysis_period_start).toEqual(analysis_period_start);
    expect(result.monthly_summary.analysis_period_end).toEqual(analysis_period_end);

    // ========== 検証: 標準化と品質管理指標 ==========
    // 判定ばらつき率（最大精度 - 最小精度）を計算
    const accuracy_variation_rate = max_work_type_accuracy - min_work_type_accuracy;
    expect(accuracy_variation_rate).toBe(16.66); // 工種別の偏差

    // 品質均一化指標（100 - ばらつき率）
    const quality_uniformity_index = 100 - accuracy_variation_rate;
    expect(quality_uniformity_index).toBeCloseTo(83.34, 1);

    // ========== 検証: 能力差の定量化 ==========
    const ability_quantification = {
      assessor_accuracy_gap: ability_gap_accuracy,
      assessor_time_gap: ability_gap_time,
      work_type_accuracy_gap: work_type_accuracy_gap,
      price_band_accuracy_gap: price_band_accuracy_gap,
    };

    expect(ability_quantification.assessor_accuracy_gap).toBe(21.43);
    expect(ability_quantification.assessor_time_gap).toBe(17);
    expect(ability_quantification.work_type_accuracy_gap).toBe(16.66);
    expect(ability_quantification.price_band_accuracy_gap).toBe(13.89);

    // ========== 検証: 可視化用ダッシュボードデータ ==========
    expect(result.dashboard_visualization_data).toBeDefined();
    expect(result.dashboard_visualization_data.assessor_accuracy_chart).toBeDefined();
    expect(result.dashboard_visualization_data.work_type_accuracy_chart).toBeDefined();
    expect(result.dashboard_visualization_data.price_band_accuracy_chart).toBeDefined();

    // グラフデータの集計値検証
    expect(result.dashboard_visualization_data.assessor_accuracy_chart.data_points).toBe(2);
    expect(result.dashboard_visualization_data.work_type_accuracy_chart.data_points).toBe(3);
    expect(result.dashboard_visualization_data.price_band_accuracy_chart.data_points).toBe(3);

    // ========== 検証: 分析サイクル完了状態の最終確認 ==========
    expect(result.is_cycle_completion_within_sla).toBe(true);
    expect(result.business_days_required).toBeLessThanOrEqual(5);
    expect(result.cycle_status_detail).toBe("正常");
  });
});