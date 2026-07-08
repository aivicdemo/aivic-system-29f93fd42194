import { calculateAssessorProcessingCapacityIndex } from "../../src/logic/it-6-2-1-1";

describe("査定員別処理能力指標自動算出機能", () => {
  // SCEN-948
  test("複数査定員の処理能力指数が正確に計算され、繁忙期必要人員数の基礎データが提供される", () => {
    // テストデータ準備: 3名以上の査定員データ
    const assessorPerformanceData = [
      {
        assessor_id: "A001",
        assessor_name: "査定員A",
        period_start_date: "2024-01-01",
        period_end_date: "2024-01-31",
        total_processed_count: 120,
        average_processing_time_minutes: 25,
        quality_score: 92,
      },
      {
        assessor_id: "A002",
        assessor_name: "査定員B",
        period_start_date: "2024-01-01",
        period_end_date: "2024-01-31",
        total_processed_count: 95,
        average_processing_time_minutes: 32,
        quality_score: 88,
      },
      {
        assessor_id: "A003",
        assessor_name: "査定員C",
        period_start_date: "2024-01-01",
        period_end_date: "2024-01-31",
        total_processed_count: 140,
        average_processing_time_minutes: 21,
        quality_score: 95,
      },
    ];

    // 処理能力指数計算用パラメータ
    const calculation_params = {
      monthly_normal_workload: 500,
      monthly_busy_workload: 750,
      workload_threshold_high: 700,
      workload_threshold_medium: 550,
      quality_weight: 0.3,
      processing_count_weight: 0.4,
      time_efficiency_weight: 0.3,
    };

    // 関数実行
    const result = calculateAssessorProcessingCapacityIndex(
      assessorPerformanceData,
      calculation_params
    );

    // === 処理能力指数の計算式検証 ===
    // 処理能力指数 = (処理件数 × 品質スコア ÷ 平均処理時間) × 正規化係数
    // 正規化係数により、すべての指数が0～100の範囲に収まる

    // 査定員Aの期待処理能力指数計算:
    // 非正規化値 = (120 × 92 ÷ 25) = 441.6
    // 最大可能値（基準: 160件 × 100スコア ÷ 15分） = 1066.67
    // 正規化処理能力指数 = (441.6 ÷ 1066.67) × 100 ≈ 41.4
    expect(result.capacity_index_results).toBeDefined();
    expect(result.capacity_index_results.length).toBe(3);

    const assessor_a_result = result.capacity_index_results.find(
      (r: { assessor_id: string }) => r.assessor_id === "A001"
    );
    expect(assessor_a_result).toBeDefined();
    expect(assessor_a_result.processing_capacity_index).toBe(41);
    expect(assessor_a_result.total_processed_count).toBe(120);
    expect(assessor_a_result.average_processing_time_minutes).toBe(25);
    expect(assessor_a_result.quality_score).toBe(92);

    // 査定員Bの期待処理能力指数計算:
    // 非正規化値 = (95 × 88 ÷ 32) = 260.625
    // 正規化処理能力指数 = (260.625 ÷ 1066.67) × 100 ≈ 24.4
    const assessor_b_result = result.capacity_index_results.find(
      (r: { assessor_id: string }) => r.assessor_id === "A002"
    );
    expect(assessor_b_result).toBeDefined();
    expect(assessor_b_result.processing_capacity_index).toBe(24);
    expect(assessor_b_result.total_processed_count).toBe(95);
    expect(assessor_b_result.average_processing_time_minutes).toBe(32);
    expect(assessor_b_result.quality_score).toBe(88);

    // 査定員Cの期待処理能力指数計算:
    // 非正規化値 = (140 × 95 ÷ 21) = 633.33
    // 正規化処理能力指数 = (633.33 ÷ 1066.67) × 100 ≈ 59.4
    const assessor_c_result = result.capacity_index_results.find(
      (r: { assessor_id: string }) => r.assessor_id === "A003"
    );
    expect(assessor_c_result).toBeDefined();
    expect(assessor_c_result.processing_capacity_index).toBe(59);
    expect(assessor_c_result.total_processed_count).toBe(140);
    expect(assessor_c_result.average_processing_time_minutes).toBe(21);
    expect(assessor_c_result.quality_score).toBe(95);

    // === 繁忙期必要人員数計算検証 ===
    // 必要人員数 = 月次業務量 ÷ 1査定員当たりの平均処理能力（件数）
    // 査定員の平均処理件数 = (120 + 95 + 140) ÷ 3 = 118.33件
    // 通常期必要人員 = 500 ÷ 118.33 ≈ 4.2人（5人）
    // 繁忙期必要人員 = 750 ÷ 118.33 ≈ 6.3人（7人）

    expect(result.required_personnel_analysis).toBeDefined();
    expect(result.required_personnel_analysis.average_capacity_per_assessor).toBe(
      118
    );
    expect(result.required_personnel_analysis.required_personnel_normal_period).toBe(
      5
    );
    expect(result.required_personnel_analysis.required_personnel_busy_period).toBe(
      7
    );
    expect(
      result.required_personnel_analysis.additional_support_required
    ).toBe(true);
    expect(result.required_personnel_analysis.additional_personnel_count).toBe(
      2
    );

    // === 繁忙度レベル判定検証 ===
    // 月次通常業務量500件 → 通常期と判定
    expect(result.busy_level_assessment).toBeDefined();
    expect(result.busy_level_assessment.current_workload).toBe(500);
    expect(result.busy_level_assessment.busy_level).toBe("通常期");
    expect(result.busy_level_assessment.workload_ratio_to_busy_threshold).toBe(
      0.67
    );

    // === エクスポート用データ形式検証 ===
    expect(result.export_data).toBeDefined();
    expect(result.export_data.format).toBe("csv");
    expect(result.export_data.rows).toBeDefined();
    expect(result.export_data.rows.length).toBe(4); // ヘッダ1行 + データ3行

    // CSVヘッダ行検証
    const csv_header = result.export_data.rows[0];
    expect(csv_header).toContain("査定員ID");
    expect(csv_header).toContain("査定員名");
    expect(csv_header).toContain("処理件数");
    expect(csv_header).toContain("平均処理時間（分）");
    expect(csv_header).toContain("品質スコア");
    expect(csv_header).toContain("処理能力指数");

    // CSVデータ行検証
    const csv_data_rows = result.export_data.rows.slice(1);
    expect(csv_data_rows[0]).toContain("A001");
    expect(csv_data_rows[0]).toContain("査定員A");
    expect(csv_data_rows[0]).toContain("120");
    expect(csv_data_rows[0]).toContain("25");
    expect(csv_data_rows[0]).toContain("92");
    expect(csv_data_rows[0]).toContain("41");

    expect(csv_data_rows[1]).toContain("A002");
    expect(csv_data_rows[1]).toContain("査定員B");
    expect(csv_data_rows[1]).toContain("95");
    expect(csv_data_rows[1]).toContain("32");
    expect(csv_data_rows[1]).toContain("88");
    expect(csv_data_rows[1]).toContain("24");

    expect(csv_data_rows[2]).toContain("A003");
    expect(csv_data_rows[2]).toContain("査定員C");
    expect(csv_data_rows[2]).toContain("140");
    expect(csv_data_rows[2]).toContain("21");
    expect(csv_data_rows[2]).toContain("95");
    expect(csv_data_rows[2]).toContain("59");

    // === 全体メタデータ検証 ===
    expect(result.metadata).toBeDefined();
    expect(result.metadata.calculation_timestamp).toBeDefined();
    expect(result.metadata.calculation_period_start).toBe("2024-01-01");
    expect(result.metadata.calculation_period_end).toBe("2024-01-31");
    expect(result.metadata.total_assessors).toBe(3);
    expect(result.metadata.calculation_status).toBe("completed");

    // === データ品質保証フラグ検証 ===
    expect(result.data_quality_assurance).toBeDefined();
    expect(result.data_quality_assurance.all_required_fields_present).toBe(true);
    expect(result.data_quality_assurance.all_values_within_valid_range).toBe(
      true
    );
    expect(result.data_quality_assurance.no_duplicate_records).toBe(true);
    expect(result.data_quality_assurance.calculation_validation_passed).toBe(
      true
    );
  });
});