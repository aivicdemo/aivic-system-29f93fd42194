import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  determineApprovalFlow,
  validateBillingAmount,
  checkValidationRules,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("請求額異常値判定・承認フロー自動決定", () => {
  // SCEN-895
  test("異常値なしで検証ルール準拠時は即時承認フローが選択される", () => {
    // テストデータ: 正常範囲内の請求データ
    const billingData = {
      customerId: "CUST001",
      serviceId: "SVC001",
      amount: 150000,
      previousMonthAmount: 140000,
      minBillingAmount: 10000,
      maxBillingAmount: 500000,
      contractDiscountRate: 0.1,
      appliedDiscount: 15000,
      contractStartDate: "2024-01-01",
      contractEndDate: "2025-12-31",
      billingPeriod: "2024-02",
      requiredFields: {
        customerId: true,
        serviceId: true,
        amount: true,
        billingPeriod: true,
      },
    };

    // ステップ1: 請求額異常値判定
    const abnormalityResult = validateBillingAmount(billingData);
    expect(abnormalityResult).toEqual({
      hasAbnormality: false,
      issues: [],
    });

    // ステップ2: 検証ルール適用
    const validationResult = checkValidationRules(billingData);
    expect(validationResult).toEqual({
      allRulesPassed: true,
      violations: [],
      validatedFields: {
        customerId: { passed: true, rule: "required" },
        serviceId: { passed: true, rule: "required" },
        amount: { passed: true, rule: "rangeCheck" },
        billingPeriod: { passed: true, rule: "formatCheck" },
      },
    });

    // ステップ3: 承認フロー自動決定
    const approvalFlowResult = determineApprovalFlow({
      hasAbnormality: abnormalityResult.hasAbnormality,
      allRulesPassed: validationResult.allRulesPassed,
      customerId: billingData.customerId,
      amount: billingData.amount,
    });

    // ステップ4: 即時承認フロー選択を検証
    expect(approvalFlowResult.flowType).toBe("即時承認フロー");
    expect(approvalFlowResult.status).toBe("承認待ちなし");
    expect(approvalFlowResult.requiresManualReview).toBe(false);
    expect(approvalFlowResult.message).toBe(
      "異常値なし・ルール準拠のため即時承認フローが選択されました"
    );

    // ステップ5: メタデータ検証
    expect(approvalFlowResult.appliedAt).toBeDefined();
    expect(approvalFlowResult.appliedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});