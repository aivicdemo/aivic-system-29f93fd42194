import { extractQuantitativeExpectations } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  test("SCEN-1319: 初期実績データ件数がサンプルサイズ最小値未満の場合、判定不可エラーを検出", () => {
    // Arrange
    const minimum_sample_size = 30;
    const initial_data_count = 29; // 最小値未満
    const initial_performance_data = Array.from({ length: initial_data_count }, (_, i) => ({
      assessment_id: `ASS-${i + 1}`,
      processing_time_minutes: 15 + Math.random() * 5,
      quality_score: 85 + Math.random() * 10,
      ocr_accuracy: 92 + Math.random() * 5,
      assessment_date: new Date("2024-01-15T10:00:00Z")
    }));

    // Act & Assert
    expect(() => {
      extractQuantitativeExpectations({
        initial_performance_data,
        minimum_sample_size
      });
    }).toThrow(/データ件数/);
  });
});