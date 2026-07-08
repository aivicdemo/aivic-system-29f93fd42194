import { aggregateDashboardMetricsByMonth } from "../../src/logic/it-6-2-1-1";

describe("経営ダッシュボード表示データの自動集計", () => {
  test("SCEN-1321: [normal] 複数月の実績データが提供された場合、月別の指標が正確に集計・時系列化される", () => {
    // 過去3ヶ月分（前々月、前月、当月）の査定実績データを準備
    const assessment_data_month_3_ago = [
      {
        assessment_date: "2024-10-01",
        assessor_id: "A001",
        quotation_amount: 1000000,
        assessment_completion_flag: 1,
        construction_type: "建築",
        amount_band: "1M-5M",
        processing_time_minutes: 30,
      },
      {
        assessment_date: "2024-10-02",
        assessor_id: "A002",
        quotation_amount: 2000000,
        assessment_completion_flag: 1,
        construction_type: "土木",
        amount_band: "5M-10M",
        processing_time_minutes: 35,
      },
      {
        assessment_date: "2024-10-05",
        assessor_id: "A001",
        quotation_amount: 1500000,
        assessment_completion_flag: 0,
        construction_type: "建築",
        amount_band: "1M-5M",
        processing_time_minutes: 25,
      },
    ];

    const assessment_data_month_2_ago = [
      {
        assessment_date: "2024-11-01",
        assessor_id: "A001",
        quotation_amount: 3000000,
        assessment_completion_flag: 1,
        construction_type: "建築",
        amount_band: "5M-10M",
        processing_time_minutes: 40,
      },
      {
        assessment_date: "2024-11-03",
        assessor_id: "A002",
        quotation_amount: 1800000,
        assessment_completion_flag: 1,
        construction_type: "土木",
        amount_band: "1M-5M",
        processing_time_minutes: 28,
      },
      {
        assessment_date: "2024-11-08",
        assessor_id: "A003",
        quotation_amount: 2500000,
        assessment_completion_flag: 1,
        construction_type: "その他",
        amount_band: "5M-10M",
        processing_time_minutes: 32,
      },
    ];

    const assessment_data_current_month = [
      {
        assessment_date: "2024-12-01",
        assessor_id: "A001",
        quotation_amount: 2200000,
        assessment_completion_flag: 1,
        construction_type: "建築",
        amount_band: "1M-5M",
        processing_time_minutes: 29,
      },
      {
        assessment_date: "2024-12-02",
        assessor_id: "A002",
        quotation_amount: 4000000,
        assessment_completion_flag: 1,
        construction_type: "土木",
        amount_band: "10M-50M",
        processing_time_minutes: 45,
      },
      {
        assessment_date: "2024-12-04",
        assessor_id: "A003",
        quotation_amount: 1200000,
        assessment_completion_flag: 1,
        construction_type: "その他",
        amount_band: "1M-5M",
        processing_time_minutes: 26,
      },
      {
        assessment_date: "2024-12-05",
        assessor_id: "A001",
        quotation_amount: 5000000,
        assessment_completion_flag: 0,
        construction_type: "建築",
        amount_band: "10M-50M",
        processing_time_minutes: 50,
      },
    ];

    const all_assessment_records = [
      ...assessment_data_month_3_ago,
      ...assessment_data_month_2_ago,
      ...assessment_data_current_month,
    ];

    // 経営ダッシュボード表示用のデータ集計API呼び出し
    const aggregated_result = aggregateDashboardMetricsByMonth(
      all_assessment_records
    );

    // 返却されたデータが月別に分類されていることを確認
    expect(aggregated_result).toBeDefined();
    expect(Array.isArray(aggregated_result)).toBe(true);
    expect(aggregated_result.length).toBe(3);

    // 月別インデックス確認: 2024-10, 2024-11, 2024-12
    const month_keys = aggregated_result.map((entry) => entry.month);
    expect(month_keys).toEqual(["2024-10", "2024-11", "2024-12"]);

    // 各月の指標値が正確に計算されていることを検証
    // 前々月（2024-10）: 3件中完了2件
    const october_data = aggregated_result[0];
    expect(october_data.month).toBe("2024-10");
    expect(october_data.total_assessment_count).toBe(3);
    expect(october_data.completed_assessment_count).toBe(2);
    expect(october_data.assessment_completion_rate).toBe(
      (2 / 3) * 100
    );
    expect(october_data.average_quotation_amount).toBe(1500000); // (1000000 + 2000000 + 1500000) / 3
    expect(october_data.average_processing_time_minutes).toBe(
      30
    ); // (30 + 35 + 25) / 3

    // 前月（2024-11）: 3件中完了3件
    const november_data = aggregated_result[1];
    expect(november_data.month).toBe("2024-11");
    expect(november_data.total_assessment_count).toBe(3);
    expect(november_data.completed_assessment_count).toBe(3);
    expect(november_data.assessment_completion_rate).toBe(100);
    expect(november_data.average_quotation_amount).toBe(2433333.33); // (3000000 + 1800000 + 2500000) / 3 = 7300000 / 3
    expect(november_data.average_processing_time_minutes).toBe(
      33.33
    ); // (40 + 28 + 32) / 3

    // 当月（2024-12）: 4件中完了3件
    const december_data = aggregated_result[2];
    expect(december_data.month).toBe("2024-12");
    expect(december_data.total_assessment_count).toBe(4);
    expect(december_data.completed_assessment_count).toBe(3);
    expect(december_data.assessment_completion_rate).toBe(75);
    expect(december_data.average_quotation_amount).toBe(3100000); // (2200000 + 4000000 + 1200000 + 5000000) / 4
    expect(december_data.average_processing_time_minutes).toBe(
      37.5
    ); // (29 + 45 + 26 + 50) / 4

    // 時系列データが昇順（古い月から新しい月）で並んでいることを確認
    expect(month_keys[0]).toBe("2024-10");
    expect(month_keys[1]).toBe("2024-11");
    expect(month_keys[2]).toBe("2024-12");
    // 日付文字列比較で昇順確認
    for (let i = 0; i < month_keys.length - 1; i++) {
      expect(month_keys[i] <= month_keys[i + 1]).toBe(true);
    }

    // データに重複や欠落がないことを検証
    const unique_months = new Set(month_keys);
    expect(unique_months.size).toBe(3); // 重複なし
    expect(aggregated_result.every((entry) => entry.month)).toBe(true); // 全データにmonthフィールド存在
    expect(
      aggregated_result.every((entry) => entry.total_assessment_count !== undefined)
    ).toBe(true);
    expect(
      aggregated_result.every((entry) => entry.completed_assessment_count !== undefined)
    ).toBe(true);
    expect(
      aggregated_result.every((entry) => entry.assessment_completion_rate !== undefined)
    ).toBe(true);
    expect(
      aggregated_result.every((entry) => entry.average_quotation_amount !== undefined)
    ).toBe(true);
    expect(
      aggregated_result.every((entry) => entry.average_processing_time_minutes !== undefined)
    ).toBe(true);

    // 複数月データを複数回集計して、結果の一貫性を確認
    const aggregated_result_run_2 = aggregateDashboardMetricsByMonth(
      all_assessment_records
    );
    const aggregated_result_run_3 = aggregateDashboardMetricsByMonth(
      all_assessment_records
    );

    expect(JSON.stringify(aggregated_result)).toBe(
      JSON.stringify(aggregated_result_run_2)
    );
    expect(JSON.stringify(aggregated_result)).toBe(
      JSON.stringify(aggregated_result_run_3)
    );

    // 構造の一致確認
    expect(aggregated_result_run_2.length).toBe(3);
    expect(aggregated_result_run_3.length).toBe(3);

    // 各回の結果が完全に同一であることを項目ごと確認
    for (let i = 0; i < aggregated_result.length; i++) {
      expect(aggregated_result_run_2[i].month).toBe(aggregated_result[i].month);
      expect(aggregated_result_run_2[i].total_assessment_count).toBe(
        aggregated_result[i].total_assessment_count
      );
      expect(aggregated_result_run_2[i].completed_assessment_count).toBe(
        aggregated_result[i].completed_assessment_count
      );
      expect(aggregated_result_run_2[i].assessment_completion_rate).toBe(
        aggregated_result[i].assessment_completion_rate
      );
      expect(aggregated_result_run_2[i].average_quotation_amount).toBe(
        aggregated_result[i].average_quotation_amount
      );
      expect(aggregated_result_run_2[i].average_processing_time_minutes).toBe(
        aggregated_result[i].average_processing_time_minutes
      );

      expect(aggregated_result_run_3[i].month).toBe(aggregated_result[i].month);
      expect(aggregated_result_run_3[i].total_assessment_count).toBe(
        aggregated_result[i].total_assessment_count
      );
      expect(aggregated_result_run_3[i].completed_assessment_count).toBe(
        aggregated_result[i].completed_assessment_count
      );
      expect(aggregated_result_run_3[i].assessment_completion_rate).toBe(
        aggregated_result[i].assessment_completion_rate
      );
      expect(aggregated_result_run_3[i].average_quotation_amount).toBe(
        aggregated_result[i].average_quotation_amount
      );
      expect(aggregated_result_run_3[i].average_processing_time_minutes).toBe(
        aggregated_result[i].average_processing_time_minutes
      );
    }
  });
});