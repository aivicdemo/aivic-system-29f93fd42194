import { calculateAssessorProductivityMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1276: 査定員別生産性指標自動計算機能 - 月次実績データから平均処理時間・1日あたり処理件数・生産性指標が正確に計算される", () => {
    // 入力: 月次実績データ（査定員A、B、C）
    const monthly_results = [
      {
        assessor_id: "A001",
        assessor_name: "査定員A",
        total_processing_time_minutes: 1200, // 総処理時間（分）
        total_processed_cases: 40, // 総処理件数
        working_days: 20, // 稼働日数
      },
      {
        assessor_id: "B001",
        assessor_name: "査定員B",
        total_processing_time_minutes: 900, // 総処理時間（分）
        total_processed_cases: 45, // 総処理件数
        working_days: 20, // 稼働日数
      },
      {
        assessor_id: "C001",
        assessor_name: "査定員C",
        total_processing_time_minutes: 1000, // 総処理時間（分）
        total_processed_cases: 35, // 総処理件数
        working_days: 20, // 稼働日数
      },
    ];

    const processing_efficiency_coefficient = 1.05; // 処理効率係数
    const previous_month_results = [
      {
        assessor_id: "A001",
        previous_productivity_index: 2.0, // 前月生産性指標
      },
      {
        assessor_id: "B001",
        previous_productivity_index: 2.35, // 前月生産性指標
      },
      {
        assessor_id: "C001",
        previous_productivity_index: 1.75, // 前月生産性指標
      },
    ];

    // 実行: 査定員別生産性指標自動計算機能
    const result = calculateAssessorProductivityMetrics(
      monthly_results,
      processing_efficiency_coefficient,
      previous_month_results
    );

    // 期待値の計算
    // 査定員A:
    // - 平均処理時間 = 1200分 ÷ 40件 = 30分/件
    const expected_assessor_a_avg_processing_time = 30;
    // - 1日あたり処理件数 = 40件 ÷ 20日 = 2件/日
    const expected_assessor_a_daily_cases = 2;
    // - 生産性指標 = 2件/日 × 1.05 = 2.1
    const expected_assessor_a_productivity_index = 2.1;

    // 査定員B:
    // - 平均処理時間 = 900分 ÷ 45件 = 20分/件
    const expected_assessor_b_avg_processing_time = 20;
    // - 1日あたり処理件数 = 45件 ÷ 20日 = 2.25件/日
    const expected_assessor_b_daily_cases = 2.25;
    // - 生産性指標 = 2.25件/日 × 1.05 = 2.3625
    const expected_assessor_b_productivity_index = 2.3625;

    // 査定員C:
    // - 平均処理時間 = 1000分 ÷ 35件 = 28.571...分/件（小数第3位で丸め）
    const expected_assessor_c_avg_processing_time = 28.57;
    // - 1日あたり処理件数 = 35件 ÷ 20日 = 1.75件/日
    const expected_assessor_c_daily_cases = 1.75;
    // - 生産性指標 = 1.75件/日 × 1.05 = 1.8375
    const expected_assessor_c_productivity_index = 1.8375;

    // 検証: 各査定員の平均処理時間が正確であることを検証
    expect(result.metrics[0].assessor_id).toBe("A001");
    expect(result.metrics[0].assessor_name).toBe("査定員A");
    expect(result.metrics[0].avg_processing_time_minutes).toBe(
      expected_assessor_a_avg_processing_time
    );

    expect(result.metrics[1].assessor_id).toBe("B001");
    expect(result.metrics[1].assessor_name).toBe("査定員B");
    expect(result.metrics[1].avg_processing_time_minutes).toBe(
      expected_assessor_b_avg_processing_time
    );

    expect(result.metrics[2].assessor_id).toBe("C001");
    expect(result.metrics[2].assessor_name).toBe("査定員C");
    expect(result.metrics[2].avg_processing_time_minutes).toBeCloseTo(
      expected_assessor_c_avg_processing_time,
      2
    );

    // 検証: 各査定員の1日あたり処理件数が正確であることを検証
    expect(result.metrics[0].daily_cases).toBe(expected_assessor_a_daily_cases);
    expect(result.metrics[1].daily_cases).toBe(expected_assessor_b_daily_cases);
    expect(result.metrics[2].daily_cases).toBe(expected_assessor_c_daily_cases);

    // 検証: 各査定員の生産性指標が正確であることを検証
    expect(result.metrics[0].productivity_index).toBe(
      expected_assessor_a_productivity_index
    );
    expect(result.metrics[1].productivity_index).toBeCloseTo(
      expected_assessor_b_productivity_index,
      4
    );
    expect(result.metrics[2].productivity_index).toBeCloseTo(
      expected_assessor_c_productivity_index,
      4
    );

    // 検証: 計算値が前月実績と比較して妥当な範囲内であることを検証
    // 許容範囲: 前月実績の±30%（異常値判定の基準）
    const assessor_a_min = 2.0 * 0.7; // 1.4
    const assessor_a_max = 2.0 * 1.3; // 2.6
    expect(result.metrics[0].productivity_index).toBeGreaterThanOrEqual(
      assessor_a_min
    );
    expect(result.metrics[0].productivity_index).toBeLessThanOrEqual(
      assessor_a_max
    );

    const assessor_b_min = 2.35 * 0.7; // 1.645
    const assessor_b_max = 2.35 * 1.3; // 3.055
    expect(result.metrics[1].productivity_index).toBeGreaterThanOrEqual(
      assessor_b_min
    );
    expect(result.metrics[1].productivity_index).toBeLessThanOrEqual(
      assessor_b_max
    );

    const assessor_c_min = 1.75 * 0.7; // 1.225
    const assessor_c_max = 1.75 * 1.3; // 2.275
    expect(result.metrics[2].productivity_index).toBeGreaterThanOrEqual(
      assessor_c_min
    );
    expect(result.metrics[2].productivity_index).toBeLessThanOrEqual(
      assessor_c_max
    );

    // 検証: 計算結果が保存され、画面表示用に返されていることを検証
    expect(result.success).toBe(true);
    expect(result.metrics.length).toBe(3);
    expect(result.saved_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});