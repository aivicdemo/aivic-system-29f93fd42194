import { aggregateMonthlyAssessmentPrecision } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1275: [edge] 月次実績データ自動検証機能 - 0件の査定実績で統合データセットが生成される場合、空の有効なデータセットが返却される
  test("0件の査定実績で統合データセットが生成される場合、空の有効なデータセットが返却される", () => {
    // 入力: 0件の査定実績を含む統合データセット
    const input_assessments = [];
    const input_month = "2024-01";
    const input_construction_types = ["建築工事", "土木工事", "設備工事"];
    const input_amount_bands = [
      { band_id: "band_1", min: 0, max: 1000000 },
      { band_id: "band_2", min: 1000000, max: 10000000 },
      { band_id: "band_3", min: 10000000, max: 100000000 }
    ];

    // 実行
    const result = aggregateMonthlyAssessmentPrecision({
      assessments: input_assessments,
      month: input_month,
      construction_types: input_construction_types,
      amount_bands: input_amount_bands
    });

    // 期待結果の検証

    // (1) スキーマは正しく定義されている
    expect(result).toHaveProperty("schema");
    expect(result.schema).toEqual({
      assessor_id: "string",
      assessor_name: "string",
      construction_type: "string",
      amount_band_id: "string",
      precision_rate: "number",
      deviation_rate: "number",
      assessment_count: "number",
      average_time_minutes: "number",
      uniformity_index: "number"
    });

    // (2) レコード件数は0件である
    expect(result).toHaveProperty("records");
    expect(Array.isArray(result.records)).toBe(true);
    expect(result.records.length).toBe(0);

    // (3) 必須フィールド定義は保持されている
    expect(result).toHaveProperty("required_fields");
    expect(result.required_fields).toEqual([
      "assessor_id",
      "assessor_name",
      "construction_type",
      "amount_band_id",
      "precision_rate",
      "deviation_rate",
      "assessment_count",
      "average_time_minutes",
      "uniformity_index"
    ]);

    // (4) エラーは発生しない
    expect(result).toHaveProperty("error");
    expect(result.error).toBeNull();

    // 追加検証: メタデータの正合性
    expect(result).toHaveProperty("metadata");
    expect(result.metadata).toEqual({
      month: "2024-01",
      total_record_count: 0,
      construction_types_count: 3,
      amount_bands_count: 3,
      generated_at: expect.any(String)
    });

    // 総合判定: 返却されたデータセットが有効な空データセットであることを確認
    expect(result.is_valid).toBe(true);
  });
});