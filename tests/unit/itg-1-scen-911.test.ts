import { evaluateImprovementItemPriority } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - 改善項目優先度判定", () => {
  test("SCEN-911: 記録された例外ケースと判断基準に対して優先度ルールを適用し、改善対象項目が正しく選別される", () => {
    // テストデータ: 複数の例外ケース（データ欠落、形式エラー、不整合など）を含む営業データセット
    const exceptionCases = [
      {
        id: "exc_001",
        type: "data_missing",
        description: "顧客名欠落",
        occurrenceCount: 12,
        affectedRecordCount: 45,
        severity: "high",
      },
      {
        id: "exc_002",
        type: "format_error",
        description: "日付形式不正",
        occurrenceCount: 8,
        affectedRecordCount: 23,
        severity: "medium",
      },
      {
        id: "exc_003",
        type: "data_inconsistency",
        description: "成約数と金額の矛盾",
        occurrenceCount: 5,
        affectedRecordCount: 15,
        severity: "high",
      },
      {
        id: "exc_004",
        type: "data_missing",
        description: "サービス種別欠落",
        occurrenceCount: 3,
        affectedRecordCount: 8,
        severity: "low",
      },
      {
        id: "exc_005",
        type: "format_error",
        description: "金額フォーマット不正",
        occurrenceCount: 6,
        affectedRecordCount: 18,
        severity: "medium",
      },
    ];

    // 判断基準（発生頻度、影響度、改善難易度など）
    const evaluationCriteria = {
      occurrenceWeight: 0.35,
      affectedRecordsWeight: 0.35,
      severityWeight: 0.3,
      severityScores: {
        high: 10,
        medium: 6,
        low: 2,
      },
      improvementDifficultyMap: {
        data_missing: 0.6,
        format_error: 0.4,
        data_inconsistency: 0.8,
      },
    };

    // 優先度ルールエンジンが正しく動作することを検証
    const result = evaluateImprovementItemPriority(
      exceptionCases,
      evaluationCriteria
    );

    // 期待結果: 選別された改善対象項目のリストを取得
    expect(result).toBeDefined();
    expect(result.selectedItems).toBeDefined();
    expect(Array.isArray(result.selectedItems)).toBe(true);

    // 各改善対象項目に割り当てられた優先度スコア（HIGH/MEDIUM/LOW等）が正確であることを確認
    const exc001Result = result.selectedItems.find(
      (item: any) => item.id === "exc_001"
    );
    expect(exc001Result).toBeDefined();
    expect(exc001Result.priorityScore).toBeGreaterThan(0);
    expect(exc001Result.priorityLevel).toBe("HIGH");

    const exc002Result = result.selectedItems.find(
      (item: any) => item.id === "exc_002"
    );
    expect(exc002Result).toBeDefined();
    expect(exc002Result.priorityScore).toBeGreaterThan(0);
    expect(exc002Result.priorityLevel).toBe("MEDIUM");

    const exc003Result = result.selectedItems.find(
      (item: any) => item.id === "exc_003"
    );
    expect(exc003Result).toBeDefined();
    expect(exc003Result.priorityScore).toBeGreaterThan(0);
    expect(exc003Result.priorityLevel).toBe("HIGH");

    const exc004Result = result.selectedItems.find(
      (item: any) => item.id === "exc_004"
    );
    expect(exc004Result).toBeDefined();
    expect(exc004Result.priorityScore).toBeGreaterThan(0);
    expect(exc004Result.priorityLevel).toBe("LOW");

    const exc005Result = result.selectedItems.find(
      (item: any) => item.id === "exc_005"
    );
    expect(exc005Result).toBeDefined();
    expect(exc005Result.priorityScore).toBeGreaterThan(0);
    expect(exc005Result.priorityLevel).toBe("MEDIUM");

    // 優先度ルール適用前後での改善対象項目の順序が正しくソートされていることを検証
    const priorityOrder = result.selectedItems.map((item: any) => item.id);
    const expectedHighPriorityItems = ["exc_001", "exc_003"];
    const expectedMediumPriorityItems = ["exc_002", "exc_005"];
    const expectedLowPriorityItems = ["exc_004"];

    // HIGH優先度項目が最初に来ていることを確認
    const highPriorityIndices = expectedHighPriorityItems.map((id: string) =>
      priorityOrder.indexOf(id)
    );
    expect(highPriorityIndices[0]).toBeLessThan(
      priorityOrder.indexOf("exc_002")
    );
    expect(highPriorityIndices[0]).toBeLessThan(
      priorityOrder.indexOf("exc_004")
    );

    // MEDIUM優先度項目がその次に来ていることを確認
    const mediumPriorityIndices = expectedMediumPriorityItems.map(
      (id: string) => priorityOrder.indexOf(id)
    );
    expect(mediumPriorityIndices[0]).toBeLessThan(
      priorityOrder.indexOf("exc_004")
    );

    // 複数の優先度判定ロジックが組み合わされた場合の結果整合性を確認
    const totalPriorityScore = result.selectedItems.reduce(
      (sum: number, item: any) => sum + item.priorityScore,
      0
    );
    expect(totalPriorityScore).toBeGreaterThan(0);

    // 選別されたリストと期待される改善対象項目リストが完全に一致
    expect(result.selectedItems.length).toBe(5);
    expect(result.selectedItems.every((item: any) => item.id)).toBe(true);
    expect(result.selectedItems.every((item: any) => item.priorityLevel)).toBe(
      true
    );
    expect(result.selectedItems.every((item: any) => item.priorityScore > 0)).toBe(
      true
    );

    // 各項目に割り当てられた優先度スコアが要件通りであること
    expect(exc001Result.priorityScore).toBeCloseTo(8.5, 1);
    expect(exc002Result.priorityScore).toBeCloseTo(5.6, 1);
    expect(exc003Result.priorityScore).toBeCloseTo(9.2, 1);
    expect(exc004Result.priorityScore).toBeCloseTo(2.1, 1);
    expect(exc005Result.priorityScore).toBeCloseTo(5.2, 1);

    // 全例外ケースが評価されていることを確認
    const evaluatedIds = result.selectedItems.map((item: any) => item.id);
    expect(evaluatedIds).toContain("exc_001");
    expect(evaluatedIds).toContain("exc_002");
    expect(evaluatedIds).toContain("exc_003");
    expect(evaluatedIds).toContain("exc_004");
    expect(evaluatedIds).toContain("exc_005");

    // 処理完了情報の確認
    expect(result.processingStatus).toBe("completed");
    expect(result.totalCasesEvaluated).toBe(5);
    expect(result.totalSelectedItems).toBe(5);
  });
});