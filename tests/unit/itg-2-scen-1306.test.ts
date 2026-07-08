import { describe, test, expect } from "@jest/globals";
import { calculateJudgmentVarianceRate } from "../../src/logic/it-1-br-6-2-1";

describe("判定ばらつき率の自動集計・分析", () => {
  // SCEN-1306
  test("5名の査定員の判定結果が完全に一致する場合、判定ばらつき率は0%で算出される", () => {
    const assessment_records = [
      {
        assessor_id: "A001",
        case_id: "CASE-20240115-001",
        judgment_result: "approved",
        judgment_timestamp: "2024-01-15T10:30:00Z",
      },
      {
        assessor_id: "A002",
        case_id: "CASE-20240115-001",
        judgment_result: "approved",
        judgment_timestamp: "2024-01-15T10:32:00Z",
      },
      {
        assessor_id: "A003",
        case_id: "CASE-20240115-001",
        judgment_result: "approved",
        judgment_timestamp: "2024-01-15T10:35:00Z",
      },
      {
        assessor_id: "A004",
        case_id: "CASE-20240115-001",
        judgment_result: "approved",
        judgment_timestamp: "2024-01-15T10:38:00Z",
      },
      {
        assessor_id: "A005",
        case_id: "CASE-20240115-001",
        judgment_result: "approved",
        judgment_timestamp: "2024-01-15T10:40:00Z",
      },
    ];

    const result = calculateJudgmentVarianceRate({
      assessment_records: assessment_records,
      case_id: "CASE-20240115-001",
    });

    expect(result.variance_rate_percent).toBe(0);
    expect(result.judgment_result_counts).toEqual({
      approved: 5,
      rejected: 0,
      conditional: 0,
    });
    expect(result.concordance_score).toBe(100);
    expect(result.total_assessors).toBe(5);
  });
});