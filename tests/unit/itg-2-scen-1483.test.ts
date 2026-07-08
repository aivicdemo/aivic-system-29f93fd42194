import { validateImprovementPlan } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  test("SCEN-1483: 改善計画の実装期限が今日の場合、検証が通過し承認ステータスが『検証完了』となる", () => {
    // Arrange: 改善計画オブジェクトを作成
    const today = new Date("2025-01-15T00:00:00Z");
    const improvementPlan = {
      planId: "IMP-001",
      planName: "OCR精度向上計画",
      targetPrecision: 95.5,
      implementationDeadline: today,
      createdAt: new Date("2025-01-10T09:00:00Z"),
      createdBy: "admin_user",
      priority: "high" as const,
      dataAdditionScope: "地域別・工種別",
      estimatedCost: 500000,
      relatedLogicVersion: "v2.1",
    };

    // Act: 改善計画妥当性自動検証を実行
    const validationResult = validateImprovementPlan(improvementPlan, today);

    // Assert: 検証が通過し、承認ステータスが「検証完了」となることを確認
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.approvalStatus).toBe("検証完了");
    expect(validationResult.validationPassedAt).toEqual(today);
    expect(validationResult.errors).toEqual([]);
  });
});