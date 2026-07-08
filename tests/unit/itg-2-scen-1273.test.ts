import { validateMonthlyPerformanceData } from "../../src/logic/it-6-2-1-1";

describe("Monthly Performance Data Auto-Validation", () => {
  test("SCEN-1273: validates monthly performance data and identifies incomplete assessor records", () => {
    const input_assessor_complete = {
      assessor_id: "ASS_003",
      assessor_name: "査定員C",
      month: "2024-01",
      total_cases: 45,
      avg_processing_time_minutes: 12.5,
      accuracy_rate: 94.2,
      uniformity_score: 91.5,
    };

    const input_assessor_incomplete_a = {
      assessor_id: "ASS_001",
      assessor_name: "査定員A",
      month: "2024-01",
      total_cases: null,
      avg_processing_time_minutes: 13.2,
      accuracy_rate: 89.5,
      uniformity_score: null,
    };

    const input_assessor_incomplete_b = {
      assessor_id: "ASS_002",
      assessor_name: "査定員B",
      month: "2024-01",
      total_cases: 38,
      avg_processing_time_minutes: null,
      accuracy_rate: null,
      uniformity_score: 87.3,
    };

    const monthly_data = {
      period: "2024-01",
      assessment_records: [
        input_assessor_incomplete_a,
        input_assessor_incomplete_b,
        input_assessor_complete,
      ],
    };

    const result = validateMonthlyPerformanceData(monthly_data);

    expect(result).toEqual({
      validation_status: "warning",
      is_valid: false,
      total_records_checked: 3,
      complete_records_count: 1,
      incomplete_records_count: 2,
      warnings: [
        {
          assessor_id: "ASS_001",
          assessor_name: "査定員A",
          missing_fields: ["total_cases", "uniformity_score"],
          record_status: "incomplete",
        },
        {
          assessor_id: "ASS_002",
          assessor_name: "査定員B",
          missing_fields: [
            "avg_processing_time_minutes",
            "accuracy_rate",
          ],
          record_status: "incomplete",
        },
      ],
      clean_records: [
        {
          assessor_id: "ASS_003",
          assessor_name: "査定員C",
          month: "2024-01",
          total_cases: 45,
          avg_processing_time_minutes: 12.5,
          accuracy_rate: 94.2,
          uniformity_score: 91.5,
        },
      ],
      validation_timestamp: expect.any(String),
      message:
        "2 of 3 records have missing required fields. Please review and complete.",
    });

    expect(result.validation_status).toBe("warning");
    expect(result.is_valid).toBe(false);
    expect(result.incomplete_records_count).toBe(2);
    expect(result.complete_records_count).toBe(1);
    expect(result.warnings).toHaveLength(2);
    expect(result.warnings[0].assessor_id).toBe("ASS_001");
    expect(result.warnings[0].missing_fields).toContain("total_cases");
    expect(result.warnings[0].missing_fields).toContain("uniformity_score");
    expect(result.warnings[1].assessor_id).toBe("ASS_002");
    expect(result.warnings[1].missing_fields).toContain(
      "avg_processing_time_minutes"
    );
    expect(result.warnings[1].missing_fields).toContain("accuracy_rate");
    expect(result.clean_records).toHaveLength(1);
    expect(result.clean_records[0].assessor_name).toBe("査定員C");
  });
});