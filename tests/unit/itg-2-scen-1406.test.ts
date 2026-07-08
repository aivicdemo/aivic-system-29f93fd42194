import { calculateOCRErrorPriority } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  test("SCEN-1406: 読取誤り優先度判定機能 - 影響件数が多い誤り傾向が単件誤りより優先度が高く判定される", () => {
    // テストデータ準備：影響件数が多い誤り傾向
    const high_impact_error_pattern = {
      error_pattern_id: "ERR_OCR_001",
      error_type: "OCR誤認識パターン",
      affected_item_count: 50,
      error_classification: "format_variance",
      region_code: "tokyo",
      construction_type_code: "structural",
      season_code: "Q1",
    };

    // テストデータ準備：単件誤り
    const single_error = {
      error_pattern_id: "ERR_SINGLE_001",
      error_type: "単件誤り",
      affected_item_count: 1,
      error_classification: "data_quality",
      region_code: "osaka",
      construction_type_code: "finishing",
      season_code: "Q2",
    };

    // 読取誤り優先度判定機能を呼び出す
    const high_impact_priority = calculateOCRErrorPriority(
      high_impact_error_pattern
    );
    const single_error_priority = calculateOCRErrorPriority(single_error);

    // 返却された優先度値を比較し、影響件数が多い誤り傾向の優先度が単件誤りの優先度より高い（数値が小さい）ことを検証
    expect(high_impact_priority).toBeLessThan(single_error_priority);

    // 影響件数50件以上の誤り傾向がpriority値1以下となることを検証
    expect(high_impact_priority).toBeLessThanOrEqual(1);

    // 単件誤りのpriority値が2以上であることを検証
    expect(single_error_priority).toBeGreaterThanOrEqual(2);

    // 具体的な優先度値の検証
    expect(high_impact_priority).toBe(1);
    expect(single_error_priority).toBe(3);
  });
});