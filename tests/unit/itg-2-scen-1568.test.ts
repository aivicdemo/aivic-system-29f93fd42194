import { generateStageDeploymentSchedule } from "../../src/logic/it-6-2-1-1";

describe("段階的展開スケジュール生成機能", () => {
  test("SCEN-1568: 展開期間が6ヶ月と12ヶ月の境界値で学習データ量が正しく計算される", () => {
    // ========== 6ヶ月シナリオの準備と実行 ==========
    const input_6months = {
      initial_deployment_period_months: 6,
      initial_departments_count: 1,
      target_total_departments_count: 10,
      initial_30_person_accuracy_rate: 0.92,
      initial_30_person_ocr_accuracy: 0.95,
      initial_30_person_ai_judgment_accuracy: 0.90,
      historical_case_data_base_volume: 5000,
      price_book_base_volume: 3000,
      regional_coverage_rate: 0.8,
      work_type_coverage_rate: 0.75,
      seasonal_data_coverage_rate: 0.7,
      target_accuracy_rate: 0.90,
      minimum_sample_size_per_region: 100,
      minimum_sample_size_per_worktype: 80,
      minimum_sample_size_per_season: 60,
    };

    const result_6months = generateStageDeploymentSchedule(input_6months);

    // 6ヶ月シナリオの検証
    expect(result_6months.deployment_period_months).toBe(6);
    expect(result_6months.total_stages).toBe(2);
    expect(result_6months.stages).toBeDefined();
    expect(Array.isArray(result_6months.stages)).toBe(true);
    expect(result_6months.stages.length).toBe(2);

    // 第1段階（0-3ヶ月）の検証
    const stage1_6months = result_6months.stages[0];
    expect(stage1_6months.stage_number).toBe(1);
    expect(stage1_6months.stage_period_months).toBe(3);
    expect(stage1_6months.target_departments_in_stage).toBe(3);
    expect(stage1_6months.required_historical_case_data_volume).toBe(7500);
    expect(stage1_6months.required_price_book_volume).toBe(4500);
    expect(stage1_6months.cumulative_historical_case_data_volume).toBe(7500);
    expect(stage1_6months.cumulative_price_book_volume).toBe(4500);

    // 第2段階（3-6ヶ月）の検証
    const stage2_6months = result_6months.stages[1];
    expect(stage2_6months.stage_number).toBe(2);
    expect(stage2_6months.stage_period_months).toBe(3);
    expect(stage2_6months.target_departments_in_stage).toBe(7);
    expect(stage2_6months.required_historical_case_data_volume).toBe(10500);
    expect(stage2_6months.required_price_book_volume).toBe(6300);
    expect(stage2_6months.cumulative_historical_case_data_volume).toBe(18000);
    expect(stage2_6months.cumulative_price_book_volume).toBe(10800);

    // 6ヶ月シナリオの合計値検証
    expect(result_6months.total_required_historical_case_data_volume).toBe(18000);
    expect(result_6months.total_required_price_book_volume).toBe(10800);

    // ========== 12ヶ月シナリオの準備と実行 ==========
    const input_12months = {
      initial_deployment_period_months: 12,
      initial_departments_count: 1,
      target_total_departments_count: 10,
      initial_30_person_accuracy_rate: 0.92,
      initial_30_person_ocr_accuracy: 0.95,
      initial_30_person_ai_judgment_accuracy: 0.90,
      historical_case_data_base_volume: 5000,
      price_book_base_volume: 3000,
      regional_coverage_rate: 0.8,
      work_type_coverage_rate: 0.75,
      seasonal_data_coverage_rate: 0.7,
      target_accuracy_rate: 0.90,
      minimum_sample_size_per_region: 100,
      minimum_sample_size_per_worktype: 80,
      minimum_sample_size_per_season: 60,
    };

    const result_12months = generateStageDeploymentSchedule(input_12months);

    // 12ヶ月シナリオの検証
    expect(result_12months.deployment_period_months).toBe(12);
    expect(result_12months.total_stages).toBe(4);
    expect(result_12months.stages).toBeDefined();
    expect(Array.isArray(result_12months.stages)).toBe(true);
    expect(result_12months.stages.length).toBe(4);

    // 第1段階（0-3ヶ月）の検証
    const stage1_12months = result_12months.stages[0];
    expect(stage1_12months.stage_number).toBe(1);
    expect(stage1_12months.stage_period_months).toBe(3);
    expect(stage1_12months.target_departments_in_stage).toBe(2);
    expect(stage1_12months.required_historical_case_data_volume).toBe(5000);
    expect(stage1_12months.required_price_book_volume).toBe(3000);
    expect(stage1_12months.cumulative_historical_case_data_volume).toBe(5000);
    expect(stage1_12months.cumulative_price_book_volume).toBe(3000);

    // 第2段階（3-6ヶ月）の検証
    const stage2_12months = result_12months.stages[1];
    expect(stage2_12months.stage_number).toBe(2);
    expect(stage2_12months.stage_period_months).toBe(3);
    expect(stage2_12months.target_departments_in_stage).toBe(3);
    expect(stage2_12months.required_historical_case_data_volume).toBe(7500);
    expect(stage2_12months.required_price_book_volume).toBe(4500);
    expect(stage2_12months.cumulative_historical_case_data_volume).toBe(12500);
    expect(stage2_12months.cumulative_price_book_volume).toBe(7500);

    // 第3段階（6-9ヶ月）の検証
    const stage3_12months = result_12months.stages[2];
    expect(stage3_12months.stage_number).toBe(3);
    expect(stage3_12months.stage_period_months).toBe(3);
    expect(stage3_12months.target_departments_in_stage).toBe(2);
    expect(stage3_12months.required_historical_case_data_volume).toBe(5000);
    expect(stage3_12months.required_price_book_volume).toBe(3000);
    expect(stage3_12months.cumulative_historical_case_data_volume).toBe(17500);
    expect(stage3_12months.cumulative_price_book_volume).toBe(10500);

    // 第4段階（9-12ヶ月）の検証
    const stage4_12months = result_12months.stages[3];
    expect(stage4_12months.stage_number).toBe(4);
    expect(stage4_12months.stage_period_months).toBe(3);
    expect(stage4_12months.target_departments_in_stage).toBe(3);
    expect(stage4_12months.required_historical_case_data_volume).toBe(7500);
    expect(stage4_12months.required_price_book_volume).toBe(4500);
    expect(stage4_12months.cumulative_historical_case_data_volume).toBe(25000);
    expect(stage4_12months.cumulative_price_book_volume).toBe(15000);

    // 12ヶ月シナリオの合計値検証
    expect(result_12months.total_required_historical_case_data_volume).toBe(25000);
    expect(result_12months.total_required_price_book_volume).toBe(15000);

    // ========== 6ヶ月と12ヶ月の境界値比較検証 ==========
    expect(result_6months.total_stages).not.toBe(result_12months.total_stages);
    expect(result_6months.total_required_historical_case_data_volume).not.toBe(
      result_12months.total_required_historical_case_data_volume
    );
    expect(result_6months.total_required_price_book_volume).not.toBe(
      result_12months.total_required_price_book_volume
    );

    // 6ヶ月シナリオはステージ数が2、12ヶ月シナリオはステージ数が4であること
    expect(result_6months.total_stages).toBe(2);
    expect(result_12months.total_stages).toBe(4);

    // 12ヶ月の総学習データ量が6ヶ月の総学習データ量より多いこと
    expect(result_12months.total_required_historical_case_data_volume).toBeGreaterThan(
      result_6months.total_required_historical_case_data_volume
    );
    expect(result_12months.total_required_price_book_volume).toBeGreaterThan(
      result_6months.total_required_price_book_volume
    );

    // ========== 各段階での学習データ量の累積検証 ==========
    // 6ヶ月シナリオ：各段階の累積値が単調増加していることを確認
    for (let i = 1; i < result_6months.stages.length; i++) {
      const prev_cumulative_case = result_6months.stages[i - 1].cumulative_historical_case_data_volume;
      const curr_cumulative_case = result_6months.stages[i].cumulative_historical_case_data_volume;
      expect(curr_cumulative_case).toBeGreaterThanOrEqual(prev_cumulative_case);

      const prev_cumulative_price = result_6months.stages[i - 1].cumulative_price_book_volume;
      const curr_cumulative_price = result_6months.stages[i].cumulative_price_book_volume;
      expect(curr_cumulative_price).toBeGreaterThanOrEqual(prev_cumulative_price);
    }

    // 12ヶ月シナリオ：各段階の累積値が単調増加していることを確認
    for (let i = 1; i < result_12months.stages.length; i++) {
      const prev_cumulative_case = result_12months.stages[i - 1].cumulative_historical_case_data_volume;
      const curr_cumulative_case = result_12months.stages[i].cumulative_historical_case_data_volume;
      expect(curr_cumulative_case).toBeGreaterThanOrEqual(prev_cumulative_case);

      const prev_cumulative_price = result_12months.stages[i - 1].cumulative_price_book_volume;
      const curr_cumulative_price = result_12months.stages[i].cumulative_price_book_volume;
      expect(curr_cumulative_price).toBeGreaterThanOrEqual(prev_cumulative_price);
    }

    // 最終段階の累積値が総計値と一致することを確認
    expect(result_6months.stages[result_6months.stages.length - 1].cumulative_historical_case_data_volume).toBe(
      result_6months.total_required_historical_case_data_volume
    );
    expect(result_6months.stages[result_6months.stages.length - 1].cumulative_price_book_volume).toBe(
      result_6months.total_required_price_book_volume
    );

    expect(result_12months.stages[result_12months.stages.length - 1].cumulative_historical_case_data_volume).toBe(
      result_12months.total_required_historical_case_data_volume
    );
    expect(result_12months.stages[result_12months.stages.length - 1].cumulative_price_book_volume).toBe(
      result_12months.total_required_price_book_volume
    );
  });
});