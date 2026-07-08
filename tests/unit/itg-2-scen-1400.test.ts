import { analyzeReadingErrorTrend } from "../../src/logic/it-6-2-2-1";

describe("査定品質管理・標準化システム - 読取誤り傾向分析", () => {
  // SCEN-1400
  test("読取誤り傾向分析機能 - 誤りの影響を受けた見積件数と誤り金額の累計が正確に計算される", () => {
    const error_records = [
      {
        id: "err_001",
        estimate_id: "est_001",
        error_amount: 10000,
        error_classification: "OCR_ACCURACY",
        affected_estimate_count: 1,
        error_date: new Date("2024-06-15T09:00:00Z"),
      },
      {
        id: "err_002",
        estimate_id: "est_002",
        error_amount: 50000,
        error_classification: "FORMAT_MISMATCH",
        affected_estimate_count: 1,
        error_date: new Date("2024-06-16T10:30:00Z"),
      },
      {
        id: "err_003",
        estimate_id: "est_003",
        error_amount: 30000,
        error_classification: "OCR_ACCURACY",
        affected_estimate_count: 1,
        error_date: new Date("2024-06-17T14:15:00Z"),
      },
    ];

    const result = analyzeReadingErrorTrend(error_records);

    expect(result.total_affected_estimate_count).toBe(3);
    expect(result.total_error_amount).toBe(90000);

    expect(result.classification_summary).toEqual([
      {
        classification: "OCR_ACCURACY",
        count: 2,
        total_amount: 40000,
      },
      {
        classification: "FORMAT_MISMATCH",
        count: 1,
        total_amount: 50000,
      },
    ]);

    expect(result.export_data).toEqual({
      total_affected_estimate_count: 3,
      total_error_amount: 90000,
      classification_summary: [
        {
          classification: "OCR_ACCURACY",
          count: 2,
          total_amount: 40000,
        },
        {
          classification: "FORMAT_MISMATCH",
          count: 1,
          total_amount: 50000,
        },
      ],
    });

    expect(result.export_data.total_affected_estimate_count).toBe(
      result.total_affected_estimate_count
    );
    expect(result.export_data.total_error_amount).toBe(
      result.total_error_amount
    );
  });
});