import { calculatePriorityRanking } from "../../src/logic/it-6-2-2-2";

describe("改善施策優先度判定機能", () => {
  test("SCEN-1200: 効果予測スコア・実装難度スコア・リスク評価スコアから総合優先度ランキングが生成される", () => {
    // テストデータ: 複数の改善施策（3件以上）を登録
    const improvementMeasures = [
      {
        measureId: "M001",
        name: "学習データ追加（地域別）",
        effectPredictionScore: 85,
        implementationDifficultyScore: 40,
        riskEvaluationScore: 20,
      },
      {
        measureId: "M002",
        name: "OCRモデル再学習",
        effectPredictionScore: 70,
        implementationDifficultyScore: 65,
        riskEvaluationScore: 35,
      },
      {
        measureId: "M003",
        name: "判定ロジックパラメータ調整",
        effectPredictionScore: 60,
        implementationDifficultyScore: 25,
        riskEvaluationScore: 15,
      },
      {
        measureId: "M004",
        name: "物価本データ更新",
        effectPredictionScore: 75,
        implementationDifficultyScore: 30,
        riskEvaluationScore: 10,
      },
    ];

    // 総合優先度ランキング生成ロジックを実行
    // 総合優先度スコア = 効果予測スコア × 0.5 - 実装難度スコア × 0.3 - リスク評価スコア × 0.2
    const rankingResult = calculatePriorityRanking(improvementMeasures);

    // 計算検証:
    // M001: 85 * 0.5 - 40 * 0.3 - 20 * 0.2 = 42.5 - 12 - 4 = 26.5
    // M002: 70 * 0.5 - 65 * 0.3 - 35 * 0.2 = 35 - 19.5 - 7 = 8.5
    // M003: 60 * 0.5 - 25 * 0.3 - 15 * 0.2 = 30 - 7.5 - 3 = 19.5
    // M004: 75 * 0.5 - 30 * 0.3 - 10 * 0.2 = 37.5 - 9 - 2 = 26.5
    // 期待される降順: M001(26.5), M004(26.5), M003(19.5), M002(8.5)

    // ランキング結果が存在することを確認
    expect(rankingResult).toBeDefined();
    expect(Array.isArray(rankingResult.ranking)).toBe(true);

    // ランキング結果の件数が4件であることを確認
    expect(rankingResult.ranking.length).toBe(4);

    // 1位: M001（優先度スコア26.5）
    expect(rankingResult.ranking[0].rank).toBe(1);
    expect(rankingResult.ranking[0].measureId).toBe("M001");
    expect(rankingResult.ranking[0].totalPriorityScore).toBe(26.5);

    // 2位: M004（優先度スコア26.5、同一スコアだが登録順による）
    expect(rankingResult.ranking[1].rank).toBe(2);
    expect(rankingResult.ranking[1].measureId).toBe("M004");
    expect(rankingResult.ranking[1].totalPriorityScore).toBe(26.5);

    // 3位: M003（優先度スコア19.5）
    expect(rankingResult.ranking[2].rank).toBe(3);
    expect(rankingResult.ranking[2].measureId).toBe("M003");
    expect(rankingResult.ranking[2].totalPriorityScore).toBe(19.5);

    // 4位: M002（優先度スコア8.5）
    expect(rankingResult.ranking[3].rank).toBe(4);
    expect(rankingResult.ranking[3].measureId).toBe("M002");
    expect(rankingResult.ranking[3].totalPriorityScore).toBe(8.5);

    // ランキングが降順（優先度の高い順）で並んでいることを確認
    expect(rankingResult.ranking[0].totalPriorityScore).toBeGreaterThanOrEqual(
      rankingResult.ranking[1].totalPriorityScore
    );
    expect(rankingResult.ranking[1].totalPriorityScore).toBeGreaterThanOrEqual(
      rankingResult.ranking[2].totalPriorityScore
    );
    expect(rankingResult.ranking[2].totalPriorityScore).toBeGreaterThanOrEqual(
      rankingResult.ranking[3].totalPriorityScore
    );

    // 各施策の総合優先度スコアが正しい計算式で算出されていることを確認
    for (const rankedMeasure of rankingResult.ranking) {
      const originalMeasure = improvementMeasures.find(
        (m) => m.measureId === rankedMeasure.measureId
      );
      if (originalMeasure) {
        const expectedScore =
          originalMeasure.effectPredictionScore * 0.5 -
          originalMeasure.implementationDifficultyScore * 0.3 -
          originalMeasure.riskEvaluationScore * 0.2;
        expect(rankedMeasure.totalPriorityScore).toBe(expectedScore);
      }
    }

    // 複数施策でスコアが同一（M001とM004の26.5）の場合の順序が一貫していることを確認
    const samePriorityMeasures = rankingResult.ranking.filter(
      (m) => m.totalPriorityScore === 26.5
    );
    expect(samePriorityMeasures.length).toBe(2);
    expect(samePriorityMeasures[0].measureId).toBe("M001");
    expect(samePriorityMeasures[1].measureId).toBe("M004");

    // 全体的なランキング順序の一貫性を確認
    expect(rankingResult.ranking.map((r) => r.measureId)).toEqual([
      "M001",
      "M004",
      "M003",
      "M002",
    ]);

    // ランキング生成完了ステータスを確認
    expect(rankingResult.status).toBe("completed");
  });
});