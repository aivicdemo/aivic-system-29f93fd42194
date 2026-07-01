import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateDiscountRuleConsistency,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 割引基準確認・統一", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-956: 割引基準に矛盾がある場合、エラーが検出され、手動確認が必要と通知される
  test("割引基準に矛盾がある場合、エラーが検出され、手動確認ステータスと詳細情報が返される", () => {
    const contractId = "CONTRACT-001";
    const discountRules = [
      {
        ruleId: "RULE-A",
        contractId: contractId,
        serviceType: "SERVICE_A",
        discountType: "RATE",
        discountValue: 10,
        applicableCondition: "sales_count >= 10",
        effectiveDate: "2024-01-01",
        expiryDate: "2024-12-31",
      },
      {
        ruleId: "RULE-B",
        contractId: contractId,
        serviceType: "SERVICE_A",
        discountType: "RATE",
        discountValue: 15,
        applicableCondition: "sales_count >= 10",
        effectiveDate: "2024-01-01",
        expiryDate: "2024-12-31",
      },
    ];

    const result = validateDiscountRuleConsistency({
      contractId: contractId,
      discountRules: discountRules,
    });

    expect(result.isConsistent).toBe(false);
    expect(result.status).toBe("MANUAL_REVIEW_REQUIRED");
    expect(result.errorCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      errorType: "CONFLICTING_DISCOUNT_RATES",
      ruleIds: expect.arrayContaining(["RULE-A", "RULE-B"]),
      conflictDescription: expect.stringMatching(/割引率/),
      affectedService: "SERVICE_A",
      details: expect.objectContaining({
        rule1: expect.objectContaining({
          ruleId: "RULE-A",
          discountValue: 10,
        }),
        rule2: expect.objectContaining({
          ruleId: "RULE-B",
          discountValue: 15,
        }),
      }),
    });

    expect(result.notificationRequired).toBe(true);
    expect(result.notificationDetails).toMatchObject({
      recipientType: "ADMIN",
      priority: "HIGH",
      message: expect.stringMatching(/矛盾/),
    });

    expect(result.recordedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});