import { evaluateReferenceDataTrustworthiness } from "../../src/logic/it-6-3-1";

describe("参照データ適切性判定・信頼度可視化機能", () => {
  test("SCEN-735: 過去案件件数が0件のときに信頼度が低に判定される", () => {
    // 前提条件: 参照データの過去案件件数が0件
    const reference_data = {
      past_case_count: 0,
      region: "東京都",
      work_type: "土工事",
      time_period: "2024-01-01T00:00:00Z",
      price_book_version: "2024-01",
      average_price: 50000,
      deviation_rate: 0,
    };

    // 処理実行
    const result = evaluateReferenceDataTrustworthiness({
      past_case_count: reference_data.past_case_count,
      region: reference_data.region,
      work_type: reference_data.work_type,
      time_period: reference_data.time_period,
      price_book_version: reference_data.price_book_version,
    });

    // 期待結果: 信頼度が『低』に判定される
    expect(result.trustworthiness_level).toBe("低");

    // 期待結果: 信頼度スコアが定義された閾値(40以下)以下
    expect(result.trustworthiness_score).toBeLessThanOrEqual(40);

    // 期待結果: 信頼度スコアは0以上100以下の範囲
    expect(result.trustworthiness_score).toBeGreaterThanOrEqual(0);
    expect(result.trustworthiness_score).toBeLessThanOrEqual(100);

    // 期待結果: 信頼度が低い理由が記録される
    expect(result.reason).toMatch(/過去案件件数/);

    // 期待結果: 判定が記録される
    expect(result.evaluation_timestamp).toBeDefined();
    expect(typeof result.evaluation_timestamp).toBe("string");
  });
});