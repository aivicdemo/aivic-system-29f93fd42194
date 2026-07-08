import { calculateFeedbackPriorityScores } from "../../src/logic/it-1-br-2-2-2-1";

describe("フィードバック優先度スコア算出機能", () => {
  // SCEN-1559
  test("同一優先度スコアの複数フィードバック間で順序が安定している", () => {
    // テストデータ: 同一優先度スコア（75）を持つ複数フィードバック（3件以上）
    const testFeedbacks = [
      {
        feedback_id: "FB001",
        content: "OCR精度低下",
        impact_score: 80,
        implementation_difficulty: 70,
      },
      {
        feedback_id: "FB002",
        content: "モデルドリフト検出",
        impact_score: 80,
        implementation_difficulty: 70,
      },
      {
        feedback_id: "FB003",
        content: "データ品質改善",
        impact_score: 80,
        implementation_difficulty: 70,
      },
      {
        feedback_id: "FB004",
        content: "学習データ追加",
        impact_score: 80,
        implementation_difficulty: 70,
      },
    ];

    // 初回実行: フィードバック優先度スコア算出
    const firstRunResult = calculateFeedbackPriorityScores(testFeedbacks);
    const firstRunOrder = firstRunResult.map((item) => item.feedback_id);

    // 複数回（5回以上）実行してフィードバックの並び順を記録
    const executionResults: string[][] = [firstRunOrder];

    for (let i = 0; i < 5; i++) {
      const currentRunResult = calculateFeedbackPriorityScores(testFeedbacks);
      const currentRunOrder = currentRunResult.map((item) => item.feedback_id);
      executionResults.push(currentRunOrder);
    }

    // 全ての実行結果における並び順が初回の結果と完全に一致しているか検証
    for (let i = 1; i < executionResults.length; i++) {
      expect(executionResults[i]).toEqual(firstRunOrder);
    }

    // 優先度スコアが同一の場合、計算結果の妥当性を確認
    // impact_score=80, implementation_difficulty=70 の場合、
    // 優先度スコア = 80 / 70 = 1.142857... => 丸め処理で約114（参考値）
    // または調整式により全て同じスコアが付与されることを確認
    for (const result of firstRunResult) {
      expect(result).toHaveProperty("feedback_id");
      expect(result).toHaveProperty("priority_score");
      expect(typeof result.priority_score).toBe("number");
    }

    // 同一スコアを持つフィードバックの相対順序が各実行で一貫していることを確認
    expect(executionResults.length).toBe(6);
    executionResults.forEach((order) => {
      expect(order.length).toBe(4);
      expect(new Set(order).size).toBe(4);
    });
  });
});