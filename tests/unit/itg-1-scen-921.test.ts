import { evaluateStaffCompetencyWithDefaultFallback } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-921: 習熟度基準が定義されていない場合、デフォルト基準を適用または判定保留を返す", () => {
    // === ケース 1: デフォルト基準の自動適用 ===
    const result_with_default = evaluateStaffCompetencyWithDefaultFallback({
      staffId: "STAFF-001",
      competencyStandards: undefined,
      performanceData: {
        tasksCompleted: 5,
        averageQualityScore: 0.85,
        timeToCompletionMinutes: 120,
      },
    });

    // デフォルト基準が適用されたことを確認
    expect(result_with_default.status).toBe("default_applied");
    expect(result_with_default.competencyLevel).toBe("intermediate");
    expect(result_with_default.notificationMessage).toMatch(/デフォルト基準/);

    // === ケース 2: 習熟度基準が明示的に null で渡される場合 ===
    const result_null_standards = evaluateStaffCompetencyWithDefaultFallback({
      staffId: "STAFF-002",
      competencyStandards: null,
      performanceData: {
        tasksCompleted: 3,
        averageQualityScore: 0.65,
        timeToCompletionMinutes: 180,
      },
    });

    // デフォルト基準が適用される
    expect(result_null_standards.status).toBe("default_applied");
    expect(result_null_standards.competencyLevel).toBe("junior");
    expect(result_null_standards.defaultStandardApplied).toBe(true);

    // === ケース 3: 判定保留の場合（エラー返却） ===
    const result_error = evaluateStaffCompetencyWithDefaultFallback({
      staffId: "STAFF-003",
      competencyStandards: undefined,
      performanceData: null,
      requireStrictValidation: true,
    });

    // エラー状態が返される
    expect(result_error.status).toBe("on_hold");
    expect(result_error.errorMessage).toMatch(/習熟度基準が定義されていません/);
    expect(result_error.requiresAdminNotification).toBe(true);

    // === ケース 4: カスタム基準が定義されている場合（デフォルト適用なし） ===
    const custom_standards = {
      juniorThreshold: 0.6,
      intermediateThreshold: 0.8,
      seniorThreshold: 0.9,
    };

    const result_custom = evaluateStaffCompetencyWithDefaultFallback({
      staffId: "STAFF-004",
      competencyStandards: custom_standards,
      performanceData: {
        tasksCompleted: 8,
        averageQualityScore: 0.88,
        timeToCompletionMinutes: 100,
      },
    });

    // カスタム基準が適用される（デフォルト適用ではない）
    expect(result_custom.status).toBe("evaluated");
    expect(result_custom.competencyLevel).toBe("intermediate");
    expect(result_custom.defaultStandardApplied).toBe(false);

    // === ケース 5: デフォルト基準の具体的な数値検証 ===
    const result_numeric = evaluateStaffCompetencyWithDefaultFallback({
      staffId: "STAFF-005",
      competencyStandards: undefined,
      performanceData: {
        tasksCompleted: 10,
        averageQualityScore: 0.92,
        timeToCompletionMinutes: 95,
      },
    });

    // デフォルト基準での高レベル判定
    expect(result_numeric.status).toBe("default_applied");
    expect(result_numeric.competencyLevel).toBe("senior");
    expect(result_numeric.score).toBe(0.92);

    // === ケース 6: 通知メッセージの検証 ===
    const result_notification = evaluateStaffCompetencyWithDefaultFallback({
      staffId: "STAFF-006",
      competencyStandards: undefined,
      performanceData: {
        tasksCompleted: 2,
        averageQualityScore: 0.5,
        timeToCompletionMinutes: 200,
      },
    });

    expect(result_notification.notificationMessage).toMatch(/管理者/);
    expect(result_notification.notificationMessage.length).toBeGreaterThan(0);

    // === ケース 7: 判定保留時のユーザー案内 ===
    expect(result_error.userGuidance).toMatch(/基準設定画面/);
    expect(result_error.userGuidance).toMatch(/管理者への連絡/);
  });
});