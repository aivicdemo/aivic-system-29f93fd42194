import { describe, test, expect } from "@jest/globals";
import {
  getAllApplicableBillingRulesWithCalculationLogic,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 適用請求ルール・割引基準の明確化", () => {
  // SCEN-896: [normal] 適用請求ルール・割引基準の明確化 - 顧客別・サービス別に異なる複数の請求ルールが存在する場合、すべてのルールと計算ロジックが明確に返される
  test("should retrieve all applicable billing rules with calculation logic for multiple customers and services", () => {
    const input = {
      billingRules: [
        {
          ruleId: "BR001",
          customerId: "CUST_A",
          serviceId: "SVC_1",
          baseFeeJpy: 1000,
          discounts: [
            {
              discountId: "DISC_001",
              type: "quantity",
              discountRatePercent: 5,
              conditionMin: 10,
            },
          ],
          calculationOrder: [
            { step: 1, operation: "base_fee", value: 1000 },
            { step: 2, operation: "apply_discount", discountId: "DISC_001" },
          ],
        },
        {
          ruleId: "BR002",
          customerId: "CUST_A",
          serviceId: "SVC_2",
          baseFeeJpy: 2000,
          discounts: [
            {
              discountId: "DISC_002",
              type: "early_payment",
              discountRatePercent: 3,
              conditionDaysEarly: 7,
            },
            {
              discountId: "DISC_003",
              type: "volume",
              discountRatePercent: 10,
              conditionMin: 50,
            },
          ],
          calculationOrder: [
            { step: 1, operation: "base_fee", value: 2000 },
            { step: 2, operation: "apply_discount", discountId: "DISC_002" },
            { step: 3, operation: "apply_discount", discountId: "DISC_003" },
          ],
        },
        {
          ruleId: "BR003",
          customerId: "CUST_B",
          serviceId: "SVC_1",
          baseFeeJpy: 1500,
          discounts: [],
          calculationOrder: [
            { step: 1, operation: "base_fee", value: 1500 },
          ],
        },
        {
          ruleId: "BR004",
          customerId: "CUST_B",
          serviceId: "SVC_2",
          baseFeeJpy: 3000,
          discounts: [
            {
              discountId: "DISC_004",
              type: "tiered",
              tiers: [
                {
                  minQuantity: 0,
                  maxQuantity: 19,
                  discountRatePercent: 0,
                },
                {
                  minQuantity: 20,
                  maxQuantity: 49,
                  discountRatePercent: 5,
                },
                {
                  minQuantity: 50,
                  maxQuantity: 99,
                  discountRatePercent: 10,
                },
                {
                  minQuantity: 100,
                  maxQuantity: null,
                  discountRatePercent: 15,
                },
              ],
            },
          ],
          calculationOrder: [
            { step: 1, operation: "base_fee", value: 3000 },
            {
              step: 2,
              operation: "apply_tiered_discount",
              discountId: "DISC_004",
            },
          ],
        },
      ],
    };

    const result = getAllApplicableBillingRulesWithCalculationLogic(input);

    // Assert: すべてのルールが返される
    expect(result.billingRules).toHaveLength(4);

    // Assert: 各ルールが一意に識別できる
    const ruleIds = result.billingRules.map((rule) => rule.ruleId);
    const uniqueRuleIds = new Set(ruleIds);
    expect(uniqueRuleIds.size).toBe(4);

    // Assert: 顧客A-サービス1のルール1が含まれている
    const rule1 = result.billingRules.find((r) => r.ruleId === "BR001");
    expect(rule1).toBeDefined();
    expect(rule1?.customerId).toBe("CUST_A");
    expect(rule1?.serviceId).toBe("SVC_1");
    expect(rule1?.baseFeeJpy).toBe(1000);
    expect(rule1?.discounts).toHaveLength(1);
    expect(rule1?.discounts[0].type).toBe("quantity");
    expect(rule1?.discounts[0].discountRatePercent).toBe(5);
    expect(rule1?.calculationOrder).toHaveLength(2);
    expect(rule1?.calculationOrder[0].step).toBe(1);
    expect(rule1?.calculationOrder[0].operation).toBe("base_fee");
    expect(rule1?.calculationOrder[1].step).toBe(2);
    expect(rule1?.calculationOrder[1].operation).toBe("apply_discount");

    // Assert: 顧客A-サービス2のルール2と複数の割引条件が含まれている
    const rule2 = result.billingRules.find((r) => r.ruleId === "BR002");
    expect(rule2).toBeDefined();
    expect(rule2?.customerId).toBe("CUST_A");
    expect(rule2?.serviceId).toBe("SVC_2");
    expect(rule2?.baseFeeJpy).toBe(2000);
    expect(rule2?.discounts).toHaveLength(2);
    expect(rule2?.discounts[0].type).toBe("early_payment");
    expect(rule2?.discounts[0].discountRatePercent).toBe(3);
    expect(rule2?.discounts[1].type).toBe("volume");
    expect(rule2?.discounts[1].discountRatePercent).toBe(10);
    expect(rule2?.calculationOrder).toHaveLength(3);

    // Assert: 顧客B-サービス1のルール3が含まれている
    const rule3 = result.billingRules.find((r) => r.ruleId === "BR003");
    expect(rule3).toBeDefined();
    expect(rule3?.customerId).toBe("CUST_B");
    expect(rule3?.serviceId).toBe("SVC_1");
    expect(rule3?.baseFeeJpy).toBe(1500);
    expect(rule3?.discounts).toHaveLength(0);
    expect(rule3?.calculationOrder).toHaveLength(1);

    // Assert: 顧客B-サービス2のルール4と段階的割引の計算ロジックが含まれている
    const rule4 = result.billingRules.find((r) => r.ruleId === "BR004");
    expect(rule4).toBeDefined();
    expect(rule4?.customerId).toBe("CUST_B");
    expect(rule4?.serviceId).toBe("SVC_2");
    expect(rule4?.baseFeeJpy).toBe(3000);
    expect(rule4?.discounts).toHaveLength(1);
    expect(rule4?.discounts[0].type).toBe("tiered");
    expect(rule4?.discounts[0].tiers).toHaveLength(4);
    expect(rule4?.discounts[0].tiers[0].discountRatePercent).toBe(0);
    expect(rule4?.discounts[0].tiers[1].discountRatePercent).toBe(5);
    expect(rule4?.discounts[0].tiers[2].discountRatePercent).toBe(10);
    expect(rule4?.discounts[0].tiers[3].discountRatePercent).toBe(15);
    expect(rule4?.calculationOrder).toHaveLength(2);

    // Assert: 計算順序が正確に記載されている
    expect(rule1?.calculationOrder[0].step).toBe(1);
    expect(rule1?.calculationOrder[1].step).toBe(2);
    expect(rule2?.calculationOrder[0].step).toBe(1);
    expect(rule2?.calculationOrder[1].step).toBe(2);
    expect(rule2?.calculationOrder[2].step).toBe(3);

    // Assert: すべてのルールが網羅的に返却されている
    expect(result.totalRuleCount).toBe(4);
    expect(result.billingRules.every((rule) => rule.ruleId)).toBe(true);
    expect(result.billingRules.every((rule) => rule.customerId)).toBe(true);
    expect(result.billingRules.every((rule) => rule.serviceId)).toBe(true);
    expect(result.billingRules.every((rule) => rule.baseFeeJpy >= 0)).toBe(
      true
    );

    // Assert: ルール間に重複がない
    const customerServicePairs = result.billingRules.map(
      (rule) => `${rule.customerId}|${rule.serviceId}`
    );
    const uniquePairs = new Set(customerServicePairs);
    expect(uniquePairs.size).toBe(4);
  });
});