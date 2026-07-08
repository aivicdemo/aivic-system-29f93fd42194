import { calculatePrecisionImprovement } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1432: [edge] 修正前後精度改善度計測・可視化機能 - 修正後精度が修正前より低下した場合にマイナスの改善度が正常に計測される
  test("should calculate negative improvement degree when post-correction precision is lower than pre-correction precision", () => {
    // 【前提】修正前精度が85%、修正後精度が78%の査定データを準備
    const pre_correction_precision = 85;
    const post_correction_precision = 78;

    // 【実行】改善度計測を実行（修正後精度 - 修正前精度 = 78% - 85% = -7%）
    const improvement_degree = calculatePrecisionImprovement({
      precisionBefore: pre_correction_precision,
      precisionAfter: post_correction_precision,
    });

    // 【期待値】改善度がマイナス値（-7%）として正常に計測される
    expect(improvement_degree.improvement_rate_percent).toBe(-7);

    // 【期待値】改善度の判定ステータスが「低下」として記録される
    expect(improvement_degree.status).toBe("degradation");

    // 【期待値】改善度の可視化インジケータが警告色（赤色）を示す
    expect(improvement_degree.visualization_indicator_color).toBe("red");

    // 【期待値】改善度の履歴ログにマイナス値の記録が正常に保存される
    expect(improvement_degree.recorded_improvement_rate).toBe(-7);

    // 【期待値】記録タイムスタンプが ISO 8601 形式で保存される
    expect(improvement_degree.recorded_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 【期待値】改善度が「マイナス方向」を示すフラグが true
    expect(improvement_degree.is_negative_improvement).toBe(true);

    // 【期待値】改善度の変化量が正確に計算される
    expect(improvement_degree.precision_delta).toBe(-7);
  });
});