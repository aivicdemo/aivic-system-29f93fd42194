import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesDataQuality,
  SalesDataValidationRequest,
  SalesDataValidationResult,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 異常値検出", () => {
  // SCEN-966: [normal] 営業データ品質検証機能 - 異常値（負の数値、範囲外の値）を検出してアラートを返す
  test("負の数値と範囲外の値を含む営業データから複数のアラートが正しく返される", () => {
    // Arrange
    const testData: SalesDataValidationRequest = {
      salesRecords: [
        {
          recordId: "record_001",
          customerId: "cust_001",
          salesAmount: -10000,
          discountRate: 150,
          appointmentCount: 5,
          contractCount: 2,
          serviceType: "service_A",
          recordDate: "2024-01-15",
        },
      ],
      validationRules: {
        salesAmountRange: { min: 0, max: 1000000 },
        discountRateRange: { min: 0, max: 100 },
        appointmentCountRange: { min: 0, max: 10000 },
        contractCountRange: { min: 0, max: 10000 },
      },
    };

    // Act
    const result: SalesDataValidationResult =
      validateSalesDataQuality(testData);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.alerts).toHaveLength(2);

    // 負の数値アラート検証
    const negativeAmountAlert = result.alerts.find(
      (alert) => alert.field === "salesAmount" && alert.recordId === "record_001"
    );
    expect(negativeAmountAlert).toBeDefined();
    expect(negativeAmountAlert?.alertType).toBe("anomalyValue");
    expect(negativeAmountAlert?.detectedValue).toBe(-10000);
    expect(negativeAmountAlert?.allowableRange).toEqual({ min: 0, max: 1000000 });
    expect(negativeAmountAlert?.message).toMatch(/売上金額/);
    expect(negativeAmountAlert?.severity).toBe("error");

    // 範囲外の値アラート検証
    const outOfRangeAlert = result.alerts.find(
      (alert) => alert.field === "discountRate" && alert.recordId === "record_001"
    );
    expect(outOfRangeAlert).toBeDefined();
    expect(outOfRangeAlert?.alertType).toBe("anomalyValue");
    expect(outOfRangeAlert?.detectedValue).toBe(150);
    expect(outOfRangeAlert?.allowableRange).toEqual({ min: 0, max: 100 });
    expect(outOfRangeAlert?.message).toMatch(/割引率/);
    expect(outOfRangeAlert?.severity).toBe("error");
  });
});