import { generateOperationManual } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1547
  test("運用マニュアル初版の自動生成 - 精度低下時の対応手順が複数パターン存在する場合、すべてのパターンが構造化されたマニュアルに記載される", () => {
    const accuracyDegradationPatterns = [
      {
        patternId: "A",
        patternName: "OCR精度急低下パターン",
        triggerCondition: {
          accuracyDropRate: -15,
          causificationClassification: "データ品質低下",
          occurrenceFrequency: "高頻度",
        },
        responseSteps: [
          "OCR読取結果の詳細ログを確認",
          "学習データの品質指標を計測",
          "データ追加更新の優先度を決定",
        ],
        decisionPoint: "OCR精度が基準値以下の場合、即座にデータ追加実行",
      },
      {
        patternId: "B",
        patternName: "AI判定精度段階的低下パターン",
        triggerCondition: {
          accuracyDropRate: -8,
          causificationClassification: "モデルドリフト",
          occurrenceFrequency: "中頻度",
        },
        responseSteps: [
          "過去案件データの季節変動を確認",
          "物価本の更新状況を検証",
          "モデル再学習の必要性を判定",
        ],
        decisionPoint: "複数指標が同時に低下した場合、再学習を実行",
      },
      {
        patternId: "C",
        patternName: "フォーマット変化対応パターン",
        triggerCondition: {
          accuracyDropRate: -5,
          causificationClassification: "フォーマット変化",
          occurrenceFrequency: "低頻度",
        },
        responseSteps: [
          "見積書フォーマット変更の有無を確認",
          "OCRモデルのカスタマイズ範囲を特定",
          "追加学習データの準備期間を見積もり",
        ],
        decisionPoint: "フォーマット変化検知時、カスタマイズ優先度を自動判定",
      },
    ];

    const generatedManual = generateOperationManual({
      accuracyDegradationPatterns: accuracyDegradationPatterns,
      organizationUnit: "査定部",
      generationTimestamp: new Date("2024-12-15T09:00:00Z"),
    });

    expect(generatedManual).toBeDefined();
    expect(generatedManual.manualVersion).toBe("1.0");
    expect(generatedManual.generationTimestamp).toBe("2024-12-15T09:00:00Z");

    // マニュアル構造の検証
    expect(generatedManual.structure).toBeDefined();
    expect(generatedManual.structure.sections).toBeDefined();
    expect(Array.isArray(generatedManual.structure.sections)).toBe(true);

    // 精度低下時対応セクションの存在確認
    const accuracyDegradationSection = generatedManual.structure.sections.find(
      (section: any) => section.sectionId === "accuracy_degradation_response"
    );
    expect(accuracyDegradationSection).toBeDefined();
    expect(accuracyDegradationSection.hierarchyLevel).toBe(1);

    // 対応パターンの存在確認
    expect(accuracyDegradationSection.patterns).toBeDefined();
    expect(Array.isArray(accuracyDegradationSection.patterns)).toBe(true);
    expect(accuracyDegradationSection.patterns.length).toBe(3);

    // パターンA の検証
    const patternA = accuracyDegradationSection.patterns.find(
      (p: any) => p.patternId === "A"
    );
    expect(patternA).toBeDefined();
    expect(patternA.patternName).toBe("OCR精度急低下パターン");
    expect(patternA.triggerCondition.accuracyDropRate).toBe(-15);
    expect(patternA.triggerCondition.causificationClassification).toBe(
      "データ品質低下"
    );
    expect(patternA.triggerCondition.occurrenceFrequency).toBe("高頻度");
    expect(Array.isArray(patternA.responseSteps)).toBe(true);
    expect(patternA.responseSteps.length).toBe(3);
    expect(patternA.responseSteps[0]).toBe("OCR読取結果の詳細ログを確認");
    expect(patternA.responseSteps[1]).toBe("学習データの品質指標を計測");
    expect(patternA.responseSteps[2]).toBe("データ追加更新の優先度を決定");
    expect(patternA.decisionPoint).toBe(
      "OCR精度が基準値以下の場合、即座にデータ追加実行"
    );

    // パターンB の検証
    const patternB = accuracyDegradationSection.patterns.find(
      (p: any) => p.patternId === "B"
    );
    expect(patternB).toBeDefined();
    expect(patternB.patternName).toBe("AI判定精度段階的低下パターン");
    expect(patternB.triggerCondition.accuracyDropRate).toBe(-8);
    expect(patternB.triggerCondition.causificationClassification).toBe(
      "モデルドリフト"
    );
    expect(patternB.triggerCondition.occurrenceFrequency).toBe("中頻度");
    expect(Array.isArray(patternB.responseSteps)).toBe(true);
    expect(patternB.responseSteps.length).toBe(3);
    expect(patternB.responseSteps[0]).toBe(
      "過去案件データの季節変動を確認"
    );
    expect(patternB.responseSteps[1]).toBe("物価本の更新状況を検証");
    expect(patternB.responseSteps[2]).toBe("モデル再学習の必要性を判定");
    expect(patternB.decisionPoint).toBe(
      "複数指標が同時に低下した場合、再学習を実行"
    );

    // パターンC の検証
    const patternC = accuracyDegradationSection.patterns.find(
      (p: any) => p.patternId === "C"
    );
    expect(patternC).toBeDefined();
    expect(patternC.patternName).toBe("フォーマット変化対応パターン");
    expect(patternC.triggerCondition.accuracyDropRate).toBe(-5);
    expect(patternC.triggerCondition.causificationClassification).toBe(
      "フォーマット変化"
    );
    expect(patternC.triggerCondition.occurrenceFrequency).toBe("低頻度");
    expect(Array.isArray(patternC.responseSteps)).toBe(true);
    expect(patternC.responseSteps.length).toBe(3);
    expect(patternC.responseSteps[0]).toBe(
      "見積書フォーマット変更の有無を確認"
    );
    expect(patternC.responseSteps[1]).toBe(
      "OCRモデルのカスタマイズ範囲を特定"
    );
    expect(patternC.responseSteps[2]).toBe(
      "追加学習データの準備期間を見積もり"
    );
    expect(patternC.decisionPoint).toBe(
      "フォーマット変化検知時、カスタマイズ優先度を自動判定"
    );

    // パターン間の重複・漏れチェック
    const patternIds = accuracyDegradationSection.patterns.map(
      (p: any) => p.patternId
    );
    expect(patternIds).toEqual(["A", "B", "C"]);
    expect(new Set(patternIds).size).toBe(3);

    // 階層構造の検証
    accuracyDegradationSection.patterns.forEach((pattern: any) => {
      expect(pattern.hierarchyLevel).toBe(2);
      expect(pattern.parentSectionId).toBe("accuracy_degradation_response");
    });

    // 各パターンが完全な情報を持つ検証
    accuracyDegradationSection.patterns.forEach((pattern: any) => {
      expect(pattern.patternId).toBeDefined();
      expect(pattern.patternName).toBeDefined();
      expect(pattern.triggerCondition).toBeDefined();
      expect(pattern.triggerCondition.accuracyDropRate).toBeDefined();
      expect(pattern.triggerCondition.causificationClassification).toBeDefined();
      expect(pattern.triggerCondition.occurrenceFrequency).toBeDefined();
      expect(pattern.responseSteps).toBeDefined();
      expect(pattern.responseSteps.length).toBeGreaterThan(0);
      expect(pattern.decisionPoint).toBeDefined();
    });

    // マニュアルの全体構造
    expect(generatedManual.metadata).toBeDefined();
    expect(generatedManual.metadata.organizationUnit).toBe("査定部");
    expect(generatedManual.metadata.totalPatterns).toBe(3);
    expect(generatedManual.metadata.completeness).toBe(100);
  });
});