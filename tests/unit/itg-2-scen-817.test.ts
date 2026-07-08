import { aggregateAssessorVarianceAndMarketDeviation } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-817: [edge] 相場判定ロジック地域別・季節別適用機能 - 最小サンプル数のちょうど境界値に達した場合、代替ロジックが適切に選択される
  test("最小サンプル数の境界値（100件）でロジック判定が正確に動作する", () => {
    // 準備: テストデータセット
    // 地域A・冬季で、サンプル数がちょうど100件（最小サンプル数の境界値）になるシナリオ
    const assessorJudgments = [
      // 査定員1による判定結果（工種X、金額帯Y、地域A、冬季）- 50件
      ...Array.from({ length: 50 }, (_, i) => ({
        assessor_id: "A001",
        judgment_type: "approve",
        market_deviation_rate: 2.5,
        market_deviation_amount: 12500,
        reference_data_count: 85,
        applied_logic: "normal",
        record_id: `j_a1_${i}`,
      })),
      // 査定員2による判定結果（工種X、金額帯Y、地域A、冬季）- 50件
      ...Array.from({ length: 50 }, (_, i) => ({
        assessor_id: "A002",
        judgment_type: "approve",
        market_deviation_rate: 3.1,
        market_deviation_amount: 15500,
        reference_data_count: 82,
        applied_logic: "normal",
        record_id: `j_a2_${i}`,
      })),
    ];

    const params = {
      assessor_judgments: assessorJudgments,
      region_code: "region_A",
      season_code: "winter",
      min_sample_threshold: 100,
      fallback_logic_threshold: 100,
    };

    // 実行
    const result = aggregateAssessorVarianceAndMarketDeviation(params);

    // 検証: サンプル数がちょうど最小サンプル数（100件）に達した場合の動作確認
    // 1. サンプル数がちょうど100件で、境界値判定がパス（正規ロジック適用）
    expect(result.total_sample_count).toBe(100);
    expect(result.meets_minimum_threshold).toBe(true);

    // 2. 正規ロジックが適用されたことを確認（代替ロジックへの切り替わりなし）
    expect(result.applied_logic_type).toBe("normal");

    // 3. 査定員別判定ばらつき率の計算検証
    // 査定員1の平均乖離率: 2.5%
    // 査定員2の平均乖離率: 3.1%
    // ばらつき率（標準偏差）= sqrt(((2.5 - 2.8)^2 + (3.1 - 2.8)^2) / 2)
    //                    = sqrt((0.09 + 0.09) / 2)
    //                    = sqrt(0.09) = 0.3
    const expected_variance_rate = 0.3;
    expect(result.assessor_variance_rate).toBeCloseTo(expected_variance_rate, 1);

    // 4. 相場乖離傾向の集計検証
    // 平均乖離率 = (2.5 + 3.1) / 2 = 2.8%
    // 平均乖離額 = (12500 + 15500) / 2 = 14000円
    expect(result.average_market_deviation_rate).toBeCloseTo(2.8, 1);
    expect(result.average_market_deviation_amount).toBe(14000);

    // 5. 参照データ件数の平均値確認
    // (85 + 82) / 2 = 83.5
    expect(result.average_reference_data_count).toBeCloseTo(83.5, 1);

    // 6. 査定員別の一致度スコアの計算検証
    // 2名の査定員の判定が全件一致 → 一致度100%
    expect(result.assessor_consensus_score).toBe(100);

    // 7. 代替ロジック選択の記録確認（代替ロジックは不選択）
    expect(result.fallback_logic_triggered).toBe(false);
    expect(result.fallback_reason).toBe(null);

    // 8. 判定根拠の信頼度スコア確認
    // サンプル数100件で最小閾値を満たし、参照データ件数も十分 → 信頼度高
    // 計算式: (min_sample_count / threshold) * 100 = (100 / 100) * 100 = 100
    expect(result.judgment_confidence_score).toBe(100);

    // 9. 警告フラグの確認
    // ばらつき率0.3%は許容範囲内 → 警告なし
    expect(result.variance_warning_flag).toBe(false);

    // 10. 処理完了ステータスの確認
    expect(result.processing_status).toBe("completed");
    expect(result.execution_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});