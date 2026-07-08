import { generateMonthlyAnalysisReport } from "../../src/logic/it-6-2-1-1";

describe("Monthly Analysis Report Auto-Generation and Verification", () => {
  // SCEN-1055: [normal] Monthly analysis report auto-generation verification - report contains all required sections
  test("should generate monthly analysis report with all required sections (assessment count, accuracy metrics, deviation analysis)", () => {
    const report_period_start = "2024-01-01";
    const report_period_end = "2024-01-31";
    const target_organization_id = "ORG-001";

    const assessment_records = [
      {
        assessor_id: "ASSESSOR-001",
        work_type_code: "WT-001",
        amount_band_code: "AB-100M",
        assessment_date: "2024-01-05",
        assessment_time_minutes: 15,
        market_deviation_rate_percent: 2.5,
        deviation_amount_yen: 50000,
        judgment_result: "APPROVED",
      },
      {
        assessor_id: "ASSESSOR-001",
        work_type_code: "WT-002",
        amount_band_code: "AB-100M",
        assessment_date: "2024-01-10",
        assessment_time_minutes: 18,
        market_deviation_rate_percent: -1.8,
        deviation_amount_yen: -35000,
        judgment_result: "APPROVED",
      },
      {
        assessor_id: "ASSESSOR-002",
        work_type_code: "WT-001",
        amount_band_code: "AB-200M",
        assessment_date: "2024-01-15",
        assessment_time_minutes: 22,
        market_deviation_rate_percent: 5.2,
        deviation_amount_yen: 120000,
        judgment_result: "CONDITIONAL",
      },
      {
        assessor_id: "ASSESSOR-002",
        work_type_code: "WT-003",
        amount_band_code: "AB-50M",
        assessment_date: "2024-01-20",
        assessment_time_minutes: 12,
        market_deviation_rate_percent: 0.8,
        deviation_amount_yen: 12000,
        judgment_result: "APPROVED",
      },
      {
        assessor_id: "ASSESSOR-003",
        work_type_code: "WT-002",
        amount_band_code: "AB-150M",
        assessment_date: "2024-01-25",
        assessment_time_minutes: 16,
        market_deviation_rate_percent: 3.1,
        deviation_amount_yen: 62000,
        judgment_result: "APPROVED",
      },
    ];

    const generated_report = generateMonthlyAnalysisReport({
      period_start_date: report_period_start,
      period_end_date: report_period_end,
      organization_id: target_organization_id,
      assessment_data: assessment_records,
    });

    // Verify report structure exists
    expect(generated_report).toBeDefined();
    expect(generated_report).not.toBeNull();

    // Verify report contains assessment count section
    expect(generated_report.assessment_count_section).toBeDefined();
    expect(generated_report.assessment_count_section.total_assessments).toBe(5);
    expect(generated_report.assessment_count_section.approved_count).toBe(4);
    expect(generated_report.assessment_count_section.conditional_count).toBe(1);
    expect(generated_report.assessment_count_section.approval_rate_percent).toBe(
      80.0
    );

    // Verify assessment count by assessor
    expect(generated_report.assessment_count_section.assessor_breakdown).toEqual({
      "ASSESSOR-001": 2,
      "ASSESSOR-002": 2,
      "ASSESSOR-003": 1,
    });

    // Verify accuracy metrics section
    expect(generated_report.accuracy_metrics_section).toBeDefined();
    expect(generated_report.accuracy_metrics_section.average_assessment_time_minutes).toBe(
      16.6
    );
    expect(
      generated_report.accuracy_metrics_section
        .average_market_deviation_rate_percent
    ).toBe(2.16);

    // Verify assessor-level accuracy metrics
    expect(
      generated_report.accuracy_metrics_section.assessor_metrics
    ).toBeDefined();
    expect(
      generated_report.accuracy_metrics_section.assessor_metrics["ASSESSOR-001"]
    ).toEqual({
      assessment_count: 2,
      average_time_minutes: 16.5,
      average_deviation_rate_percent: 0.35,
      average_deviation_amount_yen: 7500,
    });
    expect(
      generated_report.accuracy_metrics_section.assessor_metrics["ASSESSOR-002"]
    ).toEqual({
      assessment_count: 2,
      average_time_minutes: 17.0,
      average_deviation_rate_percent: 3.0,
      average_deviation_amount_yen: 66000,
    });
    expect(
      generated_report.accuracy_metrics_section.assessor_metrics["ASSESSOR-003"]
    ).toEqual({
      assessment_count: 1,
      average_time_minutes: 16.0,
      average_deviation_rate_percent: 3.1,
      average_deviation_amount_yen: 62000,
    });

    // Verify work type accuracy metrics
    expect(
      generated_report.accuracy_metrics_section.work_type_metrics
    ).toBeDefined();
    expect(
      generated_report.accuracy_metrics_section.work_type_metrics["WT-001"]
    ).toEqual({
      assessment_count: 2,
      average_deviation_rate_percent: 3.85,
      average_deviation_amount_yen: 85000,
    });
    expect(
      generated_report.accuracy_metrics_section.work_type_metrics["WT-002"]
    ).toEqual({
      assessment_count: 2,
      average_deviation_rate_percent: 0.65,
      average_deviation_amount_yen: 13500,
    });
    expect(
      generated_report.accuracy_metrics_section.work_type_metrics["WT-003"]
    ).toEqual({
      assessment_count: 1,
      average_deviation_rate_percent: 0.8,
      average_deviation_amount_yen: 12000,
    });

    // Verify amount band accuracy metrics
    expect(
      generated_report.accuracy_metrics_section.amount_band_metrics
    ).toBeDefined();
    expect(
      generated_report.accuracy_metrics_section.amount_band_metrics["AB-50M"]
    ).toEqual({
      assessment_count: 1,
      average_deviation_rate_percent: 0.8,
      average_deviation_amount_yen: 12000,
    });
    expect(
      generated_report.accuracy_metrics_section.amount_band_metrics["AB-100M"]
    ).toEqual({
      assessment_count: 2,
      average_deviation_rate_percent: 0.35,
      average_deviation_amount_yen: 7500,
    });
    expect(
      generated_report.accuracy_metrics_section.amount_band_metrics["AB-150M"]
    ).toEqual({
      assessment_count: 1,
      average_deviation_rate_percent: 3.1,
      average_deviation_amount_yen: 62000,
    });
    expect(
      generated_report.accuracy_metrics_section.amount_band_metrics["AB-200M"]
    ).toEqual({
      assessment_count: 1,
      average_deviation_rate_percent: 5.2,
      average_deviation_amount_yen: 120000,
    });

    // Verify deviation analysis section
    expect(generated_report.deviation_analysis_section).toBeDefined();
    expect(generated_report.deviation_analysis_section.total_deviation_amount_yen).toBe(
      209000
    );
    expect(
      generated_report.deviation_analysis_section
        .maximum_deviation_rate_percent
    ).toBe(5.2);
    expect(
      generated_report.deviation_analysis_section
        .minimum_deviation_rate_percent
    ).toBe(-1.8);

    // Verify deviation analysis by classification
    expect(
      generated_report.deviation_analysis_section.deviation_by_assessor
    ).toEqual({
      "ASSESSOR-001": {
        total_deviation_yen: 15000,
        average_deviation_rate_percent: 0.35,
        count: 2,
      },
      "ASSESSOR-002": {
        total_deviation_yen: 132000,
        average_deviation_rate_percent: 3.0,
        count: 2,
      },
      "ASSESSOR-003": {
        total_deviation_yen: 62000,
        average_deviation_rate_percent: 3.1,
        count: 1,
      },
    });

    expect(
      generated_report.deviation_analysis_section.deviation_by_work_type
    ).toEqual({
      "WT-001": {
        total_deviation_yen: 170000,
        average_deviation_rate_percent: 3.85,
        count: 2,
      },
      "WT-002": {
        total_deviation_yen: 27000,
        average_deviation_rate_percent: 0.65,
        count: 2,
      },
      "WT-003": {
        total_deviation_yen: 12000,
        average_deviation_rate_percent: 0.8,
        count: 1,
      },
    });

    expect(
      generated_report.deviation_analysis_section.deviation_by_amount_band
    ).toEqual({
      "AB-50M": {
        total_deviation_yen: 12000,
        average_deviation_rate_percent: 0.8,
        count: 1,
      },
      "AB-100M": {
        total_deviation_yen: 15000,
        average_deviation_rate_percent: 0.35,
        count: 2,
      },
      "AB-150M": {
        total_deviation_yen: 62000,
        average_deviation_rate_percent: 3.1,
        count: 1,
      },
      "AB-200M": {
        total_deviation_yen: 120000,
        average_deviation_rate_percent: 5.2,
        count: 1,
      },
    });

    // Verify report metadata
    expect(generated_report.report_metadata).toBeDefined();
    expect(generated_report.report_metadata.report_id).toBeDefined();
    expect(generated_report.report_metadata.generated_timestamp).toBeDefined();
    expect(generated_report.report_metadata.organization_id).toBe(
      target_organization_id
    );
    expect(generated_report.report_metadata.period_start_date).toBe(
      report_period_start
    );
    expect(generated_report.report_metadata.period_end_date).toBe(
      report_period_end
    );

    // Verify report completeness - all required sections present
    expect(generated_report.assessment_count_section).toBeTruthy();
    expect(generated_report.accuracy_metrics_section).toBeTruthy();
    expect(generated_report.deviation_analysis_section).toBeTruthy();

    // Verify all sections have data
    expect(
      Object.keys(generated_report.assessment_count_section).length
    ).toBeGreaterThan(0);
    expect(
      Object.keys(generated_report.accuracy_metrics_section).length
    ).toBeGreaterThan(0);
    expect(
      Object.keys(generated_report.deviation_analysis_section).length
    ).toBeGreaterThan(0);

    // Verify report structure integrity
    expect(generated_report.report_status).toBe("COMPLETE");
    expect(generated_report.validation_errors).toEqual([]);
  });
});