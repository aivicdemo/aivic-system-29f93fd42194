import { describe, test, expect } from "@jest/globals";
import { verifyUnifiedJudgmentLogicExecutability } from "../../src/logic/it-6-2-2-2";

describe("統一判定ロジック実行可能性確認機能", () => {
  // SCEN-930
  test("判定基準の有効期限が切れている場合に警告と共に実行可能性が確認される", () => {
    const now = new Date("2024-06-15T10:00:00Z");
    const expiredDate = new Date("2024-06-10T23:59:59Z");

    const unifiedJudgmentLogic = {
      logicId: "logic_001",
      logicName: "統一判定ロジックA",
      effectiveStartDate: new Date("2024-01-01T00:00:00Z"),
      effectiveEndDate: expiredDate,
      judgmentCriteria: [
        {
          criteriaId: "crit_001",
          itemName: "工事金額",
          lowerBound: 100000,
          upperBound: 5000000,
          allowableDeviationRate: 0.15,
          validityStatus: "expired",
        },
      ],
      appliedRegions: ["東京都", "神奈川県"],
      appliedConstructionTypes: ["新築工事", "改修工事"],
    };

    const result = verifyUnifiedJudgmentLogicExecutability(
      unifiedJudgmentLogic,
      now
    );

    expect(result.hasWarning).toBe(true);
    expect(result.warningMessage).toMatch(/有効期限/);
    expect(result.isExecutable).toBe(true);
    expect(result.judgmentCriteriaDetails[0].validityStatus).toBe("expired");
    expect(result.executionSummary).toEqual({
      logicId: "logic_001",
      executePermitted: true,
      warningCount: 1,
      affectedCriteriaCount: 1,
    });
  });
});