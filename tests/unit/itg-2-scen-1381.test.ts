import { identifyCustomizationScopeForFormatDifference } from "../../src/logic/it-6-2-1-1";

describe("精度低下原因の分析・カスタマイズ範囲特定機能", () => {
  // SCEN-1381
  test("フォーマット差異が主要因の場合、カスタマイズ必要範囲が正しく特定される", () => {
    // 分析対象データセット：フォーマット差異が存在する査定データ
    const analysisInput = {
      sourceFormatFields: [
        "工事名",
        "金額",
        "数量",
        "単価",
        "作業内容",
        "見積日",
      ],
      targetFormatFields: [
        "工事名称",
        "見積金額",
        "施工数量",
        "単価（円/単位）",
        "作業説明",
        "見積作成日",
      ],
      ocrAccuracyBeforeAnalysis: 92.5,
      ocrAccuracyAfterFormatDifference: 78.3,
      estimatedDeclinePercentage: 14.2,
      affectedAssessmentItems: [
        { itemName: "金額", currentFormat: "数値（6桁）", targetFormat: "数値（8桁含む通貨記号）", impactScore: 28 },
        { itemName: "数量", currentFormat: "整数", targetFormat: "小数第2位", impactScore: 22 },
        { itemName: "見積日", currentFormat: "YYYY/MM/DD", targetFormat: "YYYY年MM月DD日", impactScore: 15 },
        { itemName: "作業内容", currentFormat: "1行", targetFormat: "複数行可", impactScore: 18 },
      ],
      rootCauseClassification: "フォーマット差異",
      formatMismatchCount: 4,
      totalCheckedFields: 6,
    };

    // カスタマイズ必要範囲特定機能を実行
    const customizationResult = identifyCustomizationScopeForFormatDifference(
      analysisInput
    );

    // 期待結果1：主要因がフォーマット差異として特定される
    expect(customizationResult.primaryRootCause).toBe("フォーマット差異");
    expect(customizationResult.rootCauseConfidenceScore).toBe(85);

    // 期待結果2：精度低下度が正確に計算される
    expect(customizationResult.accuracyDeclinePercentage).toBe(14.2);
    expect(customizationResult.estimatedRecoveryAfterCustomization).toBe(89.5);

    // 期待結果3：カスタマイズ必要範囲が正確に特定される
    expect(customizationResult.customizationScope.length).toBe(4);
    expect(customizationResult.customizationScope[0]).toEqual({
      fieldName: "金額",
      currentFormatSpec: "数値（6桁）",
      targetFormatSpec: "数値（8桁含む通貨記号）",
      customizationAction: "OCRモデル調整",
      conversionLogicRequired: true,
      validationRuleRequired: true,
      impactLevel: "High",
      estimatedImplementationDays: 3,
    });

    expect(customizationResult.customizationScope[1]).toEqual({
      fieldName: "数量",
      currentFormatSpec: "整数",
      targetFormatSpec: "小数第2位",
      customizationAction: "変換ロジック修正",
      conversionLogicRequired: true,
      validationRuleRequired: true,
      impactLevel: "High",
      estimatedImplementationDays: 2,
    });

    expect(customizationResult.customizationScope[2]).toEqual({
      fieldName: "見積日",
      currentFormatSpec: "YYYY/MM/DD",
      targetFormatSpec: "YYYY年MM月DD日",
      customizationAction: "日付変換ロジック追加",
      conversionLogicRequired: true,
      validationRuleRequired: false,
      impactLevel: "Medium",
      estimatedImplementationDays: 1,
    });

    expect(customizationResult.customizationScope[3]).toEqual({
      fieldName: "作業内容",
      currentFormatSpec: "1行",
      targetFormatSpec: "複数行可",
      customizationAction: "テキスト処理ロジック拡張",
      conversionLogicRequired: true,
      validationRuleRequired: true,
      impactLevel: "Medium",
      estimatedImplementationDays: 2,
    });

    // 期待結果4：推奨修正内容が含まれる
    expect(customizationResult.recommendedModifications.length).toBeGreaterThan(0);
    expect(customizationResult.recommendedModifications[0]).toEqual({
      sequenceNumber: 1,
      targetField: "金額",
      currentBehavior: "6桁数値のみ読取",
      recommendedBehavior: "8桁数値＋通貨記号に対応",
      priority: 1,
      estimatedEffectOnAccuracy: 5.2,
    });

    // 期待結果5：範囲外の機能への不要なカスタマイズが提案されていない
    const nonFormatRelatedCustomizations = customizationResult.customizationScope.filter(
      (scope) =>
        scope.fieldName !== "金額" &&
        scope.fieldName !== "数量" &&
        scope.fieldName !== "見積日" &&
        scope.fieldName !== "作業内容"
    );
    expect(nonFormatRelatedCustomizations.length).toBe(0);

    // 期待結果6：総カスタマイズ工数が正確に計算される
    expect(customizationResult.totalEstimatedImplementationDays).toBe(8);

    // 期待結果7：カスタマイズ実行可能性が判定される
    expect(customizationResult.implementationFeasibility).toBe("実行可能");
    expect(customizationResult.implementationRiskLevel).toBe("Low");

    // 期待結果8：詳細な分析レポートが生成される
    expect(customizationResult.analysisReport).toBeDefined();
    expect(customizationResult.analysisReport.formatMismatchCount).toBe(4);
    expect(customizationResult.analysisReport.formatMismatchPercentage).toBe(66.67);
    expect(customizationResult.analysisReport.affectedAssessmentItems).toEqual([
      "金額",
      "数量",
      "見積日",
      "作業内容",
    ]);

    // 期待結果9：影響度スコアが正確に計算される
    const totalImpactScore = analysisInput.affectedAssessmentItems.reduce(
      (sum, item) => sum + item.impactScore,
      0
    );
    expect(customizationResult.totalImpactScore).toBe(totalImpactScore);
    expect(customizationResult.impactScorePercentage).toBe(
      parseFloat(((totalImpactScore / 100) * 100).toFixed(2))
    );

    // 期待結果10：実装スケジュール提案が含まれる
    expect(customizationResult.implementationSchedule).toBeDefined();
    expect(customizationResult.implementationSchedule.phaseCount).toBe(2);
    expect(customizationResult.implementationSchedule.phase1Name).toBe("高優先度項目（金額・数量）");
    expect(customizationResult.implementationSchedule.phase1Days).toBe(5);
    expect(customizationResult.implementationSchedule.phase2Name).toBe("中優先度項目（見積日・作業内容）");
    expect(customizationResult.implementationSchedule.phase2Days).toBe(3);

    // 期待結果11：テスト計画の詳細が含まれる
    expect(customizationResult.testingPlan).toBeDefined();
    expect(customizationResult.testingPlan.unitTestCaseCount).toBe(12);
    expect(customizationResult.testingPlan.integrationTestCaseCount).toBe(8);
    expect(customizationResult.testingPlan.regressionTestCaseCount).toBe(6);

    // 期待結果12：バリデーション結果が含まれる
    expect(customizationResult.validationResults).toBeDefined();
    expect(customizationResult.validationResults.allRequiredFieldsCovered).toBe(true);
    expect(customizationResult.validationResults.noUnnecessaryCustomizations).toBe(true);
    expect(customizationResult.validationResults.isReadyForImplementation).toBe(true);

    // 期待結果13：後続フェーズへの遷移判定が正確に実行される
    expect(customizationResult.canProceedToImplementation).toBe(true);
    expect(customizationResult.nextStepRecommendation).toBe("カスタマイズ実装フェーズへ進行");
  });
});