import { recordImprovementFeedback } from "../../src/logic/it-6-3-1";

describe("改善効果検証フィードバック記録機能", () => {
  // SCEN-1158
  test("改善効果検証期間がちょうど1週間（7日）の場合、フィードバックを有効として記録する", () => {
    const start_date = new Date("2024-01-01T00:00:00Z");
    const end_date = new Date("2024-01-08T00:00:00Z");
    const verification_period_days = 7;
    const feedback_content = "改善効果が確認できました。相場乖離率が平均5%低下しました。";
    const is_valid = true;

    const result = recordImprovementFeedback({
      start_date: start_date,
      end_date: end_date,
      verification_period_days: verification_period_days,
      feedback_content: feedback_content,
    });

    expect(result).toEqual({
      feedback_id: expect.any(String),
      start_date: start_date,
      end_date: end_date,
      verification_period_days: 7,
      feedback_content: feedback_content,
      is_valid: is_valid,
      status: "enabled",
      recorded_at: expect.any(Date),
    });

    expect(result.status).toBe("enabled");
    expect(result.is_valid).toBe(true);
    expect(result.verification_period_days).toBe(7);
  });
});