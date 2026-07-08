import { determinePriorityForLearningDataImprovement } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1468: [normal] 改善優先度決定機能 - 学習データ偏り・季節対応・過去案件欠落の診断結果から改善優先度が正確に決定される
  test("should determine improvement priority correctly from diagnostic results with weighted scoring", () => {
    // Arrange: テストデータ準備
    const diagnosticInput = {
      learningDataBiasScore: 0.85,
      seasonalResponseRatio: 0.42,
      pastProjectDataMissingRate: 0.68,
    };

    // Act: 改善優先度決定機能を実行
    const result = determinePriorityForLearningDataImprovement(diagnosticInput);

    // Assert: 優先度順序の検証
    // 第1優先度 = 学習データ偏り（スコア: 0.85）
    // 第2優先度 = 過去案件欠落（欠落率: 0.68）
    // 第3優先度 = 季節対応（対応度: 0.42）
    expect(result.primaryPriority.category).toBe("learningDataBias");
    expect(result.primaryPriority.priorityScore).toBe(0.85);
    expect(result.primaryPriority.recommendedActions).toContain(
      "過去案件データの再分類と重複排除を実施"
    );
    expect(result.primaryPriority.recommendedActions).toContain(
      "地域・工種別の偏りを補正する追加学習データを調達"
    );

    expect(result.secondaryPriority.category).toBe("pastProjectDataMissing");
    expect(result.secondaryPriority.priorityScore).toBe(0.68);
    expect(result.secondaryPriority.recommendedActions).toContain(
      "欠落している地域・工種・時期の案件データを補充"
    );
    expect(result.secondaryPriority.recommendedActions).toContain(
      "物価本の新版公開に対応したデータ取得"
    );

    expect(result.tertiaryPriority.category).toBe("seasonalResponse");
    expect(result.tertiaryPriority.priorityScore).toBe(0.42);
    expect(result.tertiaryPriority.recommendedActions).toContain(
      "季節変動パターンの学習データを充実"
    );
    expect(result.tertiaryPriority.recommendedActions).toContain(
      "季節別の補正係数を更新・最適化"
    );

    // 重み付け計算ロジックの検証
    // 学習データ偏り（スコア 0.85）: 重み 0.45 → 0.3825
    // 過去案件欠落（欠落率 0.68）: 重み 0.35 → 0.238
    // 季節対応（対応度 0.42）: 重み 0.20 → 0.084
    // 総合スコア: 0.3825 + 0.238 + 0.084 = 0.7045
    expect(result.aggregatePriorityScore).toBe(0.7045);

    // 改善施策の統合的な推奨内容の検証
    expect(result.integratedRecommendations).toBeDefined();
    expect(result.integratedRecommendations.length).toBeGreaterThan(0);
    expect(result.integratedRecommendations[0]).toContain("学習データ偏り");

    // 優先度スコアが降順に並んでいることを確認
    expect(result.primaryPriority.priorityScore).toBeGreaterThan(
      result.secondaryPriority.priorityScore
    );
    expect(result.secondaryPriority.priorityScore).toBeGreaterThan(
      result.tertiaryPriority.priorityScore
    );

    // 各優先度に対応する改善施策が正確に紐付けられていることを確認
    expect(result.improvementActionMapping).toBeDefined();
    expect(result.improvementActionMapping.learningDataBias).toBeDefined();
    expect(result.improvementActionMapping.pastProjectDataMissing).toBeDefined();
    expect(result.improvementActionMapping.seasonalResponse).toBeDefined();

    // 改善計画のタイムラインが定義されていることを確認
    expect(result.implementationTimeline).toBeDefined();
    expect(result.implementationTimeline.primaryPriorityWeeks).toBe(2);
    expect(result.implementationTimeline.secondaryPriorityWeeks).toBe(3);
    expect(result.implementationTimeline.tertiaryPriorityWeeks).toBe(2);
  });
});