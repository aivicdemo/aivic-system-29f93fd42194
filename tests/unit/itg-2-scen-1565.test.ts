import { generateCustomizationGuideline } from "../../src/logic/it-6-2-2-1";

describe("導入ガイドカスタマイズ提案機能", () => {
  // SCEN-1565
  test("低複雑度・高学習データ状態と高複雑度・低学習データ状態で導入期間が正反対に判定される", () => {
    // 低複雑度・高学習データ状態のプロジェクト条件を準備
    const lowComplexityHighDataScenario = {
      departmentBusinessComplexity: 2,
      existingQuotationFormatTypes: 1,
      existingPastCaseDataRecords: 5000,
      existingPriceBookCoverage: 95,
      targetDepartmentComplexity: 2,
      targetBusinessUnitCount: 3,
    };

    // 低複雑度・高学習データ状態で導入ガイドカスタマイズ提案機能を実行
    const lowComplexityResult = generateCustomizationGuideline(
      lowComplexityHighDataScenario
    );

    // 返却された導入期間を記録（低複雑度・高学習データでは短期間が期待される）
    const lowComplexityImplementationDays =
      lowComplexityResult.estimatedImplementationDays;

    // 高複雑度・低学習データ状態のプロジェクト条件を準備
    const highComplexityLowDataScenario = {
      departmentBusinessComplexity: 8,
      existingQuotationFormatTypes: 5,
      existingPastCaseDataRecords: 500,
      existingPriceBookCoverage: 40,
      targetDepartmentComplexity: 8,
      targetBusinessUnitCount: 10,
    };

    // 高複雑度・低学習データ状態で導入ガイドカスタマイズ提案機能を実行
    const highComplexityResult = generateCustomizationGuideline(
      highComplexityLowDataScenario
    );

    // 返却された導入期間を記録（高複雑度・低学習データでは長期間が期待される）
    const highComplexityImplementationDays =
      highComplexityResult.estimatedImplementationDays;

    // 低複雑度・高学習データ状態の導入期間と高複雑度・低学習データ状態の導入期間が正反対であることを検証
    expect(lowComplexityImplementationDays).toBeLessThan(
      highComplexityImplementationDays
    );

    // 低複雑度・高学習データ状態では短期間（30日以下）が提案されることを確認
    expect(lowComplexityImplementationDays).toBeLessThanOrEqual(30);

    // 高複雑度・低学習データ状態では長期間（60日以上）が提案されることを確認
    expect(highComplexityImplementationDays).toBeGreaterThanOrEqual(60);

    // 複雑度と学習データ量の組み合わせが逆転した場合、導入期間の提案値も逆転することを検証
    const periodRatio =
      highComplexityImplementationDays / lowComplexityImplementationDays;
    expect(periodRatio).toBeGreaterThan(1.5);

    // ガイドラインレベルの検証（低複雑度では基本ガイド、高複雑度ではカスタム化ガイド）
    expect(lowComplexityResult.guidanceLevel).toBe("basic");
    expect(highComplexityResult.guidanceLevel).toBe("customized");

    // 優先カスタマイズ項目数の検証（低複雑度では少数、高複雑度では多数）
    expect(lowComplexityResult.priorityCustomizationItemCount).toBeLessThan(
      highComplexityResult.priorityCustomizationItemCount
    );
  });
});