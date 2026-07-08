import { calculatePriceAccuracy } from "../../src/logic/it-6-2-1-1";

describe("相場判定精度検証機能 - 修正後システムの合格判定記録", () => {
  test("SCEN-1433: 相場判定精度が合格基準を超過した見積書について合格判定が記録される", () => {
    // ===== 前提: 修正後システムで処理した見積書を準備
    // 合格基準値: 85%（査定部署の運用基準で設定）
    const PASS_THRESHOLD = 85;

    // 修正後システムの処理結果: 相場判定精度 92% で合格基準超過
    const estimated_quote_amount = 10500000; // 見積書の金額（円）
    const market_reference_amount = 10200000; // 過去案件データ・物価本による相場参照金額（円）
    const reference_data_count = 47; // 参照した過去案件件数
    const price_book_version = "2024-01"; // 物価本バージョン
    const correction_coefficient = 1.03; // 地域・季節補正係数
    const system_version = "v2.1_revised"; // 修正後システムバージョン
    const processing_timestamp = "2024-02-15T10:30:45Z"; // 処理日時

    // ===== 相場判定精度を計算
    // 精度計算式: (1 - |見積金額 - 相場参照金額| / 相場参照金額) * 100
    // = (1 - |10500000 - 10200000| / 10200000) * 100
    // = (1 - 300000 / 10200000) * 100
    // = (1 - 0.02941176) * 100
    // = 0.97058824 * 100
    // = 97.058824%
    // 四捨五入で精度スコア = 97%（実装では小数点以下第2位で丸める）
    const result = calculatePriceAccuracy({
      estimated_quote_amount,
      market_reference_amount,
      reference_data_count,
      price_book_version,
      correction_coefficient,
      system_version,
      processing_timestamp,
    });

    // ===== 合格基準の確認
    // 期待精度スコア: 97%
    const expected_accuracy_score = 97;
    expect(result.accuracy_score).toBe(expected_accuracy_score);

    // ===== 合格基準を超過していることを検証
    // 精度スコア 97% >= 合格基準 85%
    expect(result.accuracy_score).toBeGreaterThanOrEqual(PASS_THRESHOLD);

    // ===== 合格判定のステータスが「合格」であることを検証
    // 期待値: "PASS"
    expect(result.judgment_status).toBe("PASS");

    // ===== 判定実行日時が正確に記録されていることを検証
    // 入力した processing_timestamp がそのまま記録されること
    expect(result.judgment_timestamp).toBe(processing_timestamp);

    // ===== 相場判定精度スコアが合格基準値以上で記録されていることを検証
    // 期待値: 97 >= 85
    expect(result.accuracy_score).toBeGreaterThanOrEqual(PASS_THRESHOLD);

    // ===== 修正後システムの処理であることを示すフラグが適切に設定されていることを検証
    // システムバージョンが修正後バージョン（v2.1_revised）であることを確認
    expect(result.system_version).toBe(system_version);

    // ===== 記録内容の統合検証
    // 合格判定レコード全体の構造と内容を検証
    expect(result).toEqual({
      accuracy_score: 97,
      judgment_status: "PASS",
      judgment_timestamp: "2024-02-15T10:30:45Z",
      system_version: "v2.1_revised",
      reference_data_count: 47,
      price_book_version: "2024-01",
      correction_coefficient: 1.03,
      deviation_amount: 300000, // |見積 - 相場参照| = 300,000円
      deviation_rate: 2.94, // (300000 / 10200000) * 100 = 2.94%
    });

    // ===== 追加検証: 判定ステータスが「合格」フラグとして適切に記録されること
    expect(result.judgment_status).toMatch(/^(PASS|CONDITIONAL_PASS)$/);
    expect(result.judgment_status).toBe("PASS");

    // ===== 追加検証: タイムスタンプが ISO 8601 形式で正確に記録されること
    expect(new Date(result.judgment_timestamp)).toEqual(
      new Date("2024-02-15T10:30:45Z")
    );
  });
});