import { describe, test, expect } from "@jest/globals";
import { visualizeBillingAmountChange } from "../../src/logic/it-1781935279444-2-2-1";

describe("契約変更前後の比較・差分可視化機能", () => {
  // SCEN-853
  test("請求金額変更時に変更前後の請求データが差分画面に視覚的に可視化される", () => {
    const beforeBillingAmount = 10000;
    const afterBillingAmount = 15000;
    const changedAt = new Date("2024-01-15T11:00:00Z");
    const changedBy = "user_001";

    const input = {
      contractId: "contract_001",
      beforeData: {
        billingAmount: beforeBillingAmount,
        currency: "JPY",
        billingCycle: "monthly",
        effectiveDate: "2024-01-01"
      },
      afterData: {
        billingAmount: afterBillingAmount,
        currency: "JPY",
        billingCycle: "monthly",
        effectiveDate: "2024-01-15"
      },
      changedAt: changedAt,
      changedBy: changedBy
    };

    const result = visualizeBillingAmountChange(input);

    expect(result).toEqual({
      contractId: "contract_001",
      changeType: "billingAmountChange",
      beforeState: {
        billingAmount: 10000,
        currency: "JPY",
        billingCycle: "monthly",
        effectiveDate: "2024-01-01"
      },
      afterState: {
        billingAmount: 15000,
        currency: "JPY",
        billingCycle: "monthly",
        effectiveDate: "2024-01-15"
      },
      differences: [
        {
          fieldName: "billingAmount",
          beforeValue: 10000,
          afterValue: 15000,
          changeAmount: 5000,
          isHighlighted: true
        },
        {
          fieldName: "effectiveDate",
          beforeValue: "2024-01-01",
          afterValue: "2024-01-15",
          isHighlighted: true
        }
      ],
      metadata: {
        changedAt: "2024-01-15T11:00:00Z",
        changedBy: "user_001",
        timestamp: "2024-01-15T11:00:00Z"
      },
      displayFormat: {
        layout: "sideBySide",
        leftLabel: "変更前",
        rightLabel: "変更後",
        highlightColor: "#FFEB3B"
      }
    });

    expect(result.beforeState.billingAmount).toBe(10000);
    expect(result.afterState.billingAmount).toBe(15000);
    expect(result.differences.length).toBe(2);
    expect(result.differences[0].fieldName).toBe("billingAmount");
    expect(result.differences[0].isHighlighted).toBe(true);
    expect(result.metadata.changedAt).toBe("2024-01-15T11:00:00Z");
    expect(result.metadata.changedBy).toBe("user_001");
    expect(result.displayFormat.layout).toBe("sideBySide");
  });
});