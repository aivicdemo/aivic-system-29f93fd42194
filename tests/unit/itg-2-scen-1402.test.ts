import { analyzeReadingErrorTrends } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  test("SCEN-1402: 読取誤り件数がゼロの場合、空のパターンセットが返される", () => {
    // Arrange: 読取誤り傾向分析機能の初期化
    const errorDataset = {
      errors: [] as Array<{
        item_name: string;
        error_type: string;
        region: string;
        work_type: string;
        occurred_date: string;
      }>,
    };

    // Act: 読取誤り件数がゼロの状態でデータセットを設定し、分析機能を実行
    const result = analyzeReadingErrorTrends(errorDataset);

    // Assert: 戻り値のパターンセットが空であることを確認
    expect(result).toEqual({
      patterns: [],
      total_error_count: 0,
      pattern_set_size: 0,
    });

    // Assert: 戻り値の型がセット型（またはコレクション型）であることを検証
    expect(Array.isArray(result.patterns)).toBe(true);
    expect(typeof result.pattern_set_size).toBe("number");
    expect(result.pattern_set_size).toBe(0);

    // Assert: 戻り値がnullではなく、空のセット構造となっていることを確認
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
    expect(result.patterns.length).toBe(0);
  });
});