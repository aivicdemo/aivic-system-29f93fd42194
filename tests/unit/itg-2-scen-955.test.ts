import { calculateMonthlyForecastAndRequiredHeadcount } from "../../src/logic/it-6-2-1-1";

describe("翌月繁忙度予測・必要人員数自動計算", () => {
  test("SCEN-955: 過去12ヶ月のデータから繁忙度パターンを識別して翌月の必要人員数を予測する", () => {
    // Arrange: 過去12ヶ月のデータを準備
    const past_12_months_data = [
      { month: "2023-01", assessment_count: 450, avg_processing_time_minutes: 28 },
      { month: "2023-02", assessment_count: 480, avg_processing_time_minutes: 29 },
      { month: "2023-03", assessment_count: 520, avg_processing_time_minutes: 30 },
      { month: "2023-04", assessment_count: 510, avg_processing_time_minutes: 29 },
      { month: "2023-05", assessment_count: 530, avg_processing_time_minutes: 31 },
      { month: "2023-06", assessment_count: 890, avg_processing_time_minutes: 32 },
      { month: "2023-07", assessment_count: 920, avg_processing_time_minutes: 33 },
      { month: "2023-08", assessment_count: 910, avg_processing_time_minutes: 33 },
      { month: "2023-09", assessment_count: 650, avg_processing_time_minutes: 30 },
      { month: "2023-10", assessment_count: 620, avg_processing_time_minutes: 30 },
      { month: "2023-11", assessment_count: 750, avg_processing_time_minutes: 31 },
      { month: "2023-12", assessment_count: 880, avg_processing_time_minutes: 32 },
    ];

    const current_assessor_count = 30;
    const target_monthly_capacity_per_assessor_minutes = 10800; // 30 * 60 * 6 working days * 1 hour average

    const input_payload = {
      monthly_data: past_12_months_data,
      current_assessor_count: current_assessor_count,
      target_monthly_capacity_per_assessor_minutes: target_monthly_capacity_per_assessor_minutes,
      target_forecast_month: "2024-01",
    };

    // Act
    const result = calculateMonthlyForecastAndRequiredHeadcount(input_payload);

    // Assert: 繁忙度パターンの識別
    expect(result).toHaveProperty("identified_patterns");
    expect(result.identified_patterns).toHaveProperty("seasonality_detected");
    expect(result.identified_patterns.seasonality_detected).toBe(true);
    expect(result.identified_patterns).toHaveProperty("peak_months");
    expect(result.identified_patterns.peak_months).toEqual(["2023-06", "2023-07", "2023-08", "2023-12"]);
    expect(result.identified_patterns).toHaveProperty("low_months");
    expect(result.identified_patterns.low_months).toEqual(["2023-01", "2023-02", "2023-04"]);

    // Assert: 翌月の繁忙度予測
    expect(result).toHaveProperty("forecast_results");
    expect(result.forecast_results).toHaveProperty("predicted_assessment_count");
    expect(result.forecast_results.predicted_assessment_count).toBe(520);
    expect(result.forecast_results).toHaveProperty("forecasted_busyness_level");
    expect(result.forecast_results.forecasted_busyness_level).toBe("MEDIUM");
    expect(result.forecast_results).toHaveProperty("busyness_level_description");
    expect(result.forecast_results.busyness_level_description).toBe("中繁忙期");

    // Assert: 必要人員数の自動計算
    expect(result).toHaveProperty("required_headcount_analysis");
    expect(result.required_headcount_analysis).toHaveProperty("required_headcount");
    expect(result.required_headcount_analysis.required_headcount).toBe(30);
    expect(result.required_headcount_analysis).toHaveProperty("additional_support_required");
    expect(result.required_headcount_analysis.additional_support_required).toBe(false);
    expect(result.required_headcount_analysis).toHaveProperty("support_headcount");
    expect(result.required_headcount_analysis.support_headcount).toBe(0);

    // Assert: 計算根拠の明確性
    expect(result).toHaveProperty("calculation_basis");
    expect(result.calculation_basis).toHaveProperty("formula_used");
    expect(result.calculation_basis.formula_used).toBe(
      "required_headcount = CEILING(predicted_assessment_count * avg_processing_time_minutes / target_monthly_capacity_per_assessor_minutes)"
    );
    expect(result.calculation_basis).toHaveProperty("intermediate_values");
    expect(result.calculation_basis.intermediate_values).toHaveProperty("total_required_minutes");
    expect(result.calculation_basis.intermediate_values.total_required_minutes).toBe(16120);
    expect(result.calculation_basis.intermediate_values).toHaveProperty("capacity_per_assessor_minutes");
    expect(result.calculation_basis.intermediate_values.capacity_per_assessor_minutes).toBe(10800);

    // Assert: パターン分析結果の参照可能性
    expect(result).toHaveProperty("pattern_analysis_details");
    expect(result.pattern_analysis_details).toHaveProperty("monthly_average_assessment_count");
    expect(result.pattern_analysis_details.monthly_average_assessment_count).toBe(706);
    expect(result.pattern_analysis_details).toHaveProperty("monthly_average_processing_time_minutes");
    expect(result.pattern_analysis_details.monthly_average_processing_time_minutes).toBe(30);
    expect(result.pattern_analysis_details).toHaveProperty("peak_season_average_count");
    expect(result.pattern_analysis_details.peak_season_average_count).toBe(900);
    expect(result.pattern_analysis_details).toHaveProperty("low_season_average_count");
    expect(result.pattern_analysis_details.low_season_average_count).toBe(477);
    expect(result.pattern_analysis_details).toHaveProperty("seasonality_ratio");
    expect(result.pattern_analysis_details.seasonality_ratio).toBe(1.89);

    // Assert: レポート出力可能性
    expect(result).toHaveProperty("export_report_data");
    expect(result.export_report_data).toHaveProperty("report_title");
    expect(result.export_report_data.report_title).toBe("翌月繁忙度予測・必要人員配置レポート");
    expect(result.export_report_data).toHaveProperty("report_date_iso");
    expect(result.export_report_data.report_date_iso).toMatch(/\d{4}-\d{2}-\d{2}T/);
    expect(result.export_report_data).toHaveProperty("forecast_month");
    expect(result.export_report_data.forecast_month).toBe("2024-01");
    expect(result.export_report_data).toHaveProperty("exportable_formats");
    expect(result.export_report_data.exportable_formats).toEqual(["CSV", "PDF", "XLSX"]);

    // Assert: 結果の整合性確認
    expect(result).toHaveProperty("validation_status");
    expect(result.validation_status).toBe("VALID");
    expect(result).toHaveProperty("confidence_score");
    expect(result.confidence_score).toBe(0.92);
  });
});