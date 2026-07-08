import { calculateAbilityDifferenceScore } from "../../src/logic/it-6-2-2-2";

describe("査定員別判定精度・乖離パターン分析ダッシュボード - 能力差定量指標", () => {
  test("SCEN-1071: 能力差スコアが0（同等）の境界値で正しく判定される", () => {
    // 前提: 2人の査定者の評価スコアが完全に同一
    const appraiser_a = {
      appraiser_id: "APR001",
      appraiser_name: "査定者A",
      accuracy_rate: 92.5,
      deviation_rate: 3.2,
      average_assessment_time: 18.5,
    };

    const appraiser_b = {
      appraiser_id: "APR002",
      appraiser_name: "査定者B",
      accuracy_rate: 92.5,
      deviation_rate: 3.2,
      average_assessment_time: 18.5,
    };

    // 実行: 能力差スコア計算処理を実行
    const result = calculateAbilityDifferenceScore(appraiser_a, appraiser_b);

    // 検証1: 能力差スコアが0（同等）と判定される
    expect(result.ability_difference_score).toBe(0);

    // 検証2: 能力レベルが「同等」と表示される
    expect(result.ability_level).toBe("同等");

    // 検証3: 補正係数が適用されない（補正係数 = 1.0）
    expect(result.correction_factor).toBe(1.0);

    // 検証4: レコードの必須フィールドが正しく保存される
    expect(result.appraiser_a_id).toBe("APR001");
    expect(result.appraiser_b_id).toBe("APR002");
    expect(result.comparison_date).toBeDefined();
    expect(typeof result.comparison_date).toBe("string");

    // 検証5: データ保存フラグが有効
    expect(result.is_saved).toBe(true);

    // 検証6: スコア計算の詳細データが正しく記録される
    expect(result.accuracy_difference).toBe(0);
    expect(result.deviation_difference).toBe(0);
    expect(result.time_difference).toBe(0);

    // 検証7: 能力差スコアが0の場合のシステム内部状態
    expect(result.requires_correction).toBe(false);
    expect(result.training_required).toBe(false);
  });
});