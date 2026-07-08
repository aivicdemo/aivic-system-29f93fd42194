import { aggregateInitialOperationData } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-1531
  test("データ期間が3ヶ月未満の場合に不完全データ警告を出力する", () => {
    const start_date = new Date("2024-01-01T00:00:00Z");
    const end_date = new Date("2024-01-31T23:59:59Z");
    const assessor_results = [
      {
        assessor_id: "A001",
        assessment_date: new Date("2024-01-15T10:00:00Z"),
        judgement_result: "承認",
        variance_rate: 5.2,
        variance_amount: 50000,
        reference_data_count: 12,
      },
      {
        assessor_id: "A002",
        assessment_date: new Date("2024-01-20T14:30:00Z"),
        judgement_result: "修正指示",
        variance_rate: 8.7,
        variance_amount: 120000,
        reference_data_count: 8,
      },
    ];

    const result = aggregateInitialOperationData({
      start_date,
      end_date,
      assessor_results,
    });

    expect(result.warning_message).toBe(
      "データ期間が3ヶ月未満のため、集計結果が不完全である可能性があります"
    );
    expect(result.warning_level).toBe("error");
    expect(result.is_incomplete_data).toBe(true);
    expect(result.data_period_days).toBe(30);
    expect(result.minimum_required_days).toBe(90);
  });
});