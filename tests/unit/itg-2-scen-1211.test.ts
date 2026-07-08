import { describe, test, expect } from "@jest/globals";
import { generateAlternativeImprovementOptions } from "../../src/logic/it-6-2-1-1";

describe("改善提案却下時代替案自動生成機能", () => {
  // SCEN-1211
  test("却下理由に基づいて実行可能な代替改善オプションを自動生成する", () => {
    const rejectionInput = {
      rejectionReason: "コスト超過",
      rejectionDetail: "現在の予算を30%超えている",
      currentBudget: 1000000,
      proposedCost: 1300000,
      improvementType: "data_quality",
      targetMetric: "OCR精度",
      currentPerformance: 75,
    };

    const result = generateAlternativeImprovementOptions(rejectionInput);

    // 代替案が複数件生成されていることを確認
    expect(result.alternativeOptions).toBeDefined();
    expect(Array.isArray(result.alternativeOptions)).toBe(true);
    expect(result.alternativeOptions.length).toBeGreaterThanOrEqual(2);

    // 各代替案の基本構造を検証
    result.alternativeOptions.forEach((option: any) => {
      // 実行可能性フラグがすべてtrueであることを確認
      expect(option.isExecutable).toBe(true);

      // 優先度スコアが範囲内であることを確認
      expect(option.priorityScore).toBeGreaterThanOrEqual(0);
      expect(option.priorityScore).toBeLessThanOrEqual(100);

      // 推定コストが予算制約内であることを確認
      expect(option.estimatedCost).toBeLessThanOrEqual(1000000);

      // 実装期間が定義されていることを確認
      expect(option.implementationDays).toBeGreaterThan(0);
      expect(typeof option.implementationDays).toBe("number");

      // 効果が定義されていることを確認
      expect(option.expectedImprovement).toBeGreaterThan(0);
      expect(option.expectedImprovement).toBeLessThanOrEqual(100);
    });

    // コスト超過への対応状況を確認
    const costAlignedOptions = result.alternativeOptions.filter(
      (opt: any) =>
        opt.focusArea === "cost_optimization" ||
        opt.description.includes("段階的") ||
        opt.description.includes("優先度")
    );
    expect(costAlignedOptions.length).toBeGreaterThanOrEqual(1);

    // 生成された代替案の詳細情報を検証
    const firstOption = result.alternativeOptions[0];
    expect(firstOption.optionId).toBeDefined();
    expect(typeof firstOption.optionId).toBe("string");
    expect(firstOption.optionName).toBeDefined();
    expect(typeof firstOption.optionName).toBe("string");
    expect(firstOption.description).toBeDefined();
    expect(typeof firstOption.description).toBe("string");
    expect(firstOption.focusArea).toBeDefined();

    // 優先度スコアが降順でソートされていることを確認
    for (let i = 0; i < result.alternativeOptions.length - 1; i++) {
      expect(
        result.alternativeOptions[i].priorityScore
      ).toBeGreaterThanOrEqual(result.alternativeOptions[i + 1].priorityScore);
    }

    // メタデータの確認
    expect(result.generatedAt).toBeDefined();
    expect(result.rejectionReasonAnalysis).toBeDefined();
    expect(result.rejectionReasonAnalysis.reason).toBe("コスト超過");
    expect(result.rejectionReasonAnalysis.budgetExcessRate).toBe(30);

    // 代替案の合計が予算内に収まることを確認
    const totalAlternativeCost = result.alternativeOptions.reduce(
      (sum: number, opt: any) => sum + opt.estimatedCost,
      0
    );
    expect(totalAlternativeCost).toBeLessThanOrEqual(1000000 * 1.5);

    // 各代替案のコストが合理的な範囲内であることを確認
    result.alternativeOptions.forEach((option: any) => {
      const costReductionRate = (
        ((1300000 - option.estimatedCost) / 1300000) *
        100
      ).toFixed(1);
      expect(parseFloat(costReductionRate as string)).toBeGreaterThan(0);
    });

    // 却下理由分析結果の検証
    expect(result.rejectionReasonAnalysis.constraintType).toBe(
      "budget_constraint"
    );
    expect(result.rejectionReasonAnalysis.availableBudget).toBe(1000000);
    expect(result.rejectionReasonAnalysis.excessAmount).toBe(300000);
  });
});