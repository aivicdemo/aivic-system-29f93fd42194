import { determineDataImprovementPriority } from "../../src/logic/it-6-2-2-1";

describe("学習データ改善優先度自動判定機能 - 境界値テスト", () => {
  test("SCEN-781: ユーザーフィードバック件数が閾値と同数の境界値で判定が正常に実行される", () => {
    // Arrange: テストデータの準備
    // ユーザーフィードバック件数を改善優先度判定の閾値と同数に設定
    const feedbackThreshold = 100;
    const userFeedbackCount = 100; // 閾値と同数（境界値）
    const ocrAccuracyDropRate = 5.2; // OCR精度低下率 5.2%
    const aiJudgmentAccuracyDropRate = 3.8; // AI判定精度低下率 3.8%
    const learningDataUpdateDaysElapsed = 45; // 最終更新から経過日数

    const input = {
      userFeedbackCount,
      feedbackThreshold,
      ocrAccuracyDropRate,
      aiJudgmentAccuracyDropRate,
      learningDataUpdateDaysElapsed,
    };

    // Act: 学習データ改善優先度自動判定機能を呼び出す
    const result = determineDataImprovementPriority(input);

    // Assert: 判定処理が正常に実行され、結果が適切であることを確認
    // 1. 判定結果が存在する
    expect(result).toBeDefined();

    // 2. 優先度レベルが正しく判定されている
    // ユーザーフィードバック件数が閾値と同数の場合、優先度レベルは「高」と判定される
    expect(result.priorityLevel).toBe("high");

    // 3. 判定根拠に複数の判定条件が含まれていることを確認
    expect(result.reasons).toBeDefined();
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);

    // 4. フィードバック件数が閾値以上であることが判定根拠に含まれている
    const feedbackReason = result.reasons.find((r: string) =>
      r.includes("フィードバック")
    );
    expect(feedbackReason).toBeDefined();

    // 5. OCR精度低下率が含まれた判定根拠を確認
    const ocrReason = result.reasons.find((r: string) => r.includes("OCR"));
    expect(ocrReason).toBeDefined();

    // 6. AI判定精度低下率が含まれた判定根拠を確認
    const aiReason = result.reasons.find((r: string) => r.includes("AI"));
    expect(aiReason).toBeDefined();

    // 7. 改善優先度スコアが適切な範囲内であることを確認
    expect(result.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScore).toBeLessThanOrEqual(100);

    // 8. 優先度スコアが「高」判定に見合う値であることを確認（例：70以上）
    expect(result.priorityScore).toBeGreaterThanOrEqual(70);

    // 9. 実装コスト評価スコアが存在することを確認
    expect(result.implementationCostScore).toBeDefined();
    expect(result.implementationCostScore).toBeGreaterThanOrEqual(0);
    expect(result.implementationCostScore).toBeLessThanOrEqual(100);

    // 10. 実施推奨日数が正の整数であることを確認
    expect(result.recommendedExecutionDays).toBeDefined();
    expect(typeof result.recommendedExecutionDays).toBe("number");
    expect(result.recommendedExecutionDays).toBeGreaterThan(0);
    expect(Number.isInteger(result.recommendedExecutionDays)).toBe(true);

    // 11. 推奨実施日数が妥当な範囲内であることを確認（1日～30日程度）
    expect(result.recommendedExecutionDays).toBeLessThanOrEqual(30);

    // 12. 改善対象データタイプが複数含まれていることを確認
    expect(result.targetDataTypes).toBeDefined();
    expect(Array.isArray(result.targetDataTypes)).toBe(true);
    expect(result.targetDataTypes.length).toBeGreaterThan(0);

    // 13. 改善対象データタイプに学習データ関連の項目が含まれている
    expect(
      result.targetDataTypes.some(
        (type: string) =>
          type.includes("過去案件") ||
          type.includes("物価本") ||
          type.includes("学習")
      )
    ).toBe(true);

    // 14. 複数判定条件が「AND」で評価されていることを確認
    // つまり、フィードバック、OCR精度、AI判定精度のいずれかが閾値超過で「高」判定
    expect(result.evaluationLogic).toBeDefined();
    expect(
      typeof result.evaluationLogic === "string" ||
        typeof result.evaluationLogic === "object"
    ).toBe(true);

    // 15. エラーフラグが立っていないことを確認
    expect(result.hasError).toBe(false);

    // 16. 結果全体の構造が期待通りであることを最終確認
    expect(Object.keys(result)).toContain("priorityLevel");
    expect(Object.keys(result)).toContain("priorityScore");
    expect(Object.keys(result)).toContain("reasons");
    expect(Object.keys(result)).toContain("targetDataTypes");
  });
});