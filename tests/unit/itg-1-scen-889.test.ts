import { detectAnomalousValueInSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-889: [error] 営業データ異常値の自動検出 - 営業データの値が許容範囲を超える場合、チェック結果『警告』と超過値の詳細が返される
  test("should return warning status with overage details when sales data exceeds acceptable range", () => {
    const salesDataInput = {
      customerId: "C001",
      serviceId: "S001",
      appointmentCount: 15,
      contractAmount: 1500000,
      discountRate: 35,
      targetAmountMin: 100000,
      targetAmountMax: 1000000,
      discountRateMax: 30,
    };

    const result = detectAnomalousValueInSalesData(salesDataInput);

    expect(result.status).toBe("warning");
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);

    const contractAmountWarning = result.warnings.find(
      (w: any) => w.fieldName === "contractAmount"
    );
    expect(contractAmountWarning).toBeDefined();
    expect(contractAmountWarning.fieldName).toBe("contractAmount");
    expect(contractAmountWarning.allowableRange).toEqual({
      min: 100000,
      max: 1000000,
    });
    expect(contractAmountWarning.actualValue).toBe(1500000);
    expect(contractAmountWarning.overageAmount).toBe(500000);
    expect(contractAmountWarning.severity).toBe("高");

    const discountRateWarning = result.warnings.find(
      (w: any) => w.fieldName === "discountRate"
    );
    expect(discountRateWarning).toBeDefined();
    expect(discountRateWarning.fieldName).toBe("discountRate");
    expect(discountRateWarning.allowableRange).toEqual({
      min: 0,
      max: 30,
    });
    expect(discountRateWarning.actualValue).toBe(35);
    expect(discountRateWarning.overageAmount).toBe(5);
    expect(discountRateWarning.severity).toBe("中");

    expect(result.checkTimestamp).toBeDefined();
    expect(typeof result.checkTimestamp).toBe("string");
    expect(result.hasErrors).toBe(false);
  });
});