import { calculateConstraintPriority } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能", () => {
  // SCEN-1210
  test("複数の制約要因が競合する場合に優先度を正しく算出する", () => {
    // 制約要因A: 優先度3、影響度高
    const constraintA = {
      id: "constraint_A",
      priorityLevel: 3,
      impactLevel: "high",
      description: "学習データ不足",
    };

    // 制約要因B: 優先度1、影響度中
    const constraintB = {
      id: "constraint_B",
      priorityLevel: 1,
      impactLevel: "medium",
      description: "物価本更新遅延",
    };

    // 制約要因C: 優先度2、影響度高
    const constraintC = {
      id: "constraint_C",
      priorityLevel: 2,
      impactLevel: "high",
      description: "見積フォーマット変化",
    };

    const constraints = [constraintA, constraintB, constraintC];

    const result = calculateConstraintPriority(constraints);

    // 結果構造の検証
    expect(result).toHaveProperty("constraintScores");
    expect(result).toHaveProperty("totalPriorityScore");
    expect(result).toHaveProperty("priorityOrder");

    // 制約要因ごとのスコア配分を検証
    expect(result.constraintScores).toHaveProperty("constraint_A");
    expect(result.constraintScores).toHaveProperty("constraint_B");
    expect(result.constraintScores).toHaveProperty("constraint_C");

    // 影響度が高い制約要因（AとC）のスコアが、中程度（B）より高いことを検証
    const scoreA = result.constraintScores.constraint_A;
    const scoreB = result.constraintScores.constraint_B;
    const scoreC = result.constraintScores.constraint_C;

    expect(scoreA).toBeGreaterThan(scoreB);
    expect(scoreC).toBeGreaterThan(scoreB);

    // 同一影響度内（AとC）では数値優先度に基づき制約要因Aが優先される
    // 制約要因A（優先度3）> 制約要因C（優先度2）
    expect(scoreA).toBeGreaterThan(scoreC);

    // 総合優先度スコアが数値であることを検証
    expect(typeof result.totalPriorityScore).toBe("number");
    expect(result.totalPriorityScore).toBeGreaterThan(0);

    // 優先度の順序が『制約要因A > 制約要因C > 制約要因B』となっていることを確認
    expect(result.priorityOrder).toEqual([
      "constraint_A",
      "constraint_C",
      "constraint_B",
    ]);

    // 優先度順序とスコアの一貫性を検証
    const orderedIds = result.priorityOrder;
    for (let i = 0; i < orderedIds.length - 1; i++) {
      const currentScore = result.constraintScores[orderedIds[i]];
      const nextScore = result.constraintScores[orderedIds[i + 1]];
      expect(currentScore).toBeGreaterThanOrEqual(nextScore);
    }

    // 期待される具体的なスコア値を検証（アルゴリズム例：影響度×優先度レベル）
    // 影響度高=100, 中=50; 優先度レベル N => スコア = 影響度 × (4 - 優先度レベル)
    // 制約要因A: 100 × (4 - 3) = 100 × 1 = 100
    // 制約要因C: 100 × (4 - 2) = 100 × 2 = 200
    // 制約要因B: 50 × (4 - 1) = 50 × 3 = 150
    expect(scoreA).toBe(100);
    expect(scoreC).toBe(200);
    expect(scoreB).toBe(150);

    // 総合優先度スコアは3つのスコアの合計
    expect(result.totalPriorityScore).toBe(450);
  });
});