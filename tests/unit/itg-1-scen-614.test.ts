import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・異常検出", () => {
  // SCEN-614: [error] 営業データ品質検証・異常検出 - 営業データの数値項目が定義済みの値の範囲外である場合、異常値として検出され代表に通知される
  test("範囲外の売上金額を異常値として検出し、アラート通知を送信する", () => {
    // 期待値: 売上金額の許容範囲は 0 ～ 10,000,000 円
    const minSalesAmount = 0;
    const maxSalesAmount = 10000000;

    // テストケース1: 負の売上金額（範囲外）
    const invalidNegativeSalesData = {
      salesDataId: "SD001",
      customerId: "CUST001",
      serviceId: "SVC001",
      salesAmount: -50000,
      appointmentCount: 5,
      contractCount: 2,
      recordedAt: new Date("2024-01-15T10:00:00Z"),
    };

    const resultNegative = validateSalesDataQuality(
      invalidNegativeSalesData,
      {
        minValue: minSalesAmount,
        maxValue: maxSalesAmount,
        fieldName: "salesAmount",
      }
    );

    // 異常値検出の確認
    expect(resultNegative.isValid).toBe(false);
    expect(resultNegative.anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "salesAmount",
          detectedValue: -50000,
          minAllowed: minSalesAmount,
          maxAllowed: maxSalesAmount,
          anomalyType: "out_of_range",
        }),
      ])
    );

    // アラート通知の確認
    expect(resultNegative.notification).toBeDefined();
    expect(resultNegative.notification.notificationType).toBe(
      "anomaly_alert"
    );
    expect(resultNegative.notification.recipientRole).toBe("representative");
    expect(resultNegative.notification.content).toContain("salesAmount");
    expect(resultNegative.notification.content).toContain("-50000");
    expect(resultNegative.notification.anomalyCount).toBe(1);

    // 通知ログレコードの確認
    expect(resultNegative.notificationLog).toBeDefined();
    expect(resultNegative.notificationLog.notificationId).toMatch(/^NL-/);
    expect(resultNegative.notificationLog.salesDataId).toBe("SD001");
    expect(resultNegative.notificationLog.detectedAt).toEqual(
      expect.any(Date)
    );
    expect(resultNegative.notificationLog.status).toBe("sent");
    expect(resultNegative.notificationLog.anomalyDetails).toHaveLength(1);
    expect(resultNegative.notificationLog.anomalyDetails[0]).toEqual(
      expect.objectContaining({
        fieldName: "salesAmount",
        detectedValue: -50000,
        reasonCode: "value_below_minimum",
      })
    );

    // テストケース2: 上限を超える売上金額（範囲外）
    const invalidExcessiveSalesData = {
      salesDataId: "SD002",
      customerId: "CUST002",
      serviceId: "SVC001",
      salesAmount: 15000000,
      appointmentCount: 10,
      contractCount: 5,
      recordedAt: new Date("2024-01-15T11:00:00Z"),
    };

    const resultExcessive = validateSalesDataQuality(
      invalidExcessiveSalesData,
      {
        minValue: minSalesAmount,
        maxValue: maxSalesAmount,
        fieldName: "salesAmount",
      }
    );

    expect(resultExcessive.isValid).toBe(false);
    expect(resultExcessive.anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "salesAmount",
          detectedValue: 15000000,
          minAllowed: minSalesAmount,
          maxAllowed: maxSalesAmount,
          anomalyType: "out_of_range",
        }),
      ])
    );

    expect(resultExcessive.notification.anomalyCount).toBe(1);
    expect(resultExcessive.notificationLog.anomalyDetails[0]).toEqual(
      expect.objectContaining({
        fieldName: "salesAmount",
        detectedValue: 15000000,
        reasonCode: "value_above_maximum",
      })
    );

    // テストケース3: 許容範囲内の売上金額（正常）
    const validSalesData = {
      salesDataId: "SD003",
      customerId: "CUST003",
      serviceId: "SVC001",
      salesAmount: 5000000,
      appointmentCount: 8,
      contractCount: 3,
      recordedAt: new Date("2024-01-15T12:00:00Z"),
    };

    const resultValid = validateSalesDataQuality(validSalesData, {
      minValue: minSalesAmount,
      maxValue: maxSalesAmount,
      fieldName: "salesAmount",
    });

    expect(resultValid.isValid).toBe(true);
    expect(resultValid.anomalies).toHaveLength(0);
    expect(resultValid.notification).toBeNull();
    expect(resultValid.notificationLog).toBeNull();

    // テストケース4: 境界値（下限 0 円）
    const boundaryMinSalesData = {
      salesDataId: "SD004",
      customerId: "CUST004",
      serviceId: "SVC001",
      salesAmount: 0,
      appointmentCount: 0,
      contractCount: 0,
      recordedAt: new Date("2024-01-15T13:00:00Z"),
    };

    const resultBoundaryMin = validateSalesDataQuality(
      boundaryMinSalesData,
      {
        minValue: minSalesAmount,
        maxValue: maxSalesAmount,
        fieldName: "salesAmount",
      }
    );

    expect(resultBoundaryMin.isValid).toBe(true);
    expect(resultBoundaryMin.anomalies).toHaveLength(0);

    // テストケース5: 境界値（上限 10,000,000 円）
    const boundaryMaxSalesData = {
      salesDataId: "SD005",
      customerId: "CUST005",
      serviceId: "SVC001",
      salesAmount: 10000000,
      appointmentCount: 100,
      contractCount: 50,
      recordedAt: new Date("2024-01-15T14:00:00Z"),
    };

    const resultBoundaryMax = validateSalesDataQuality(
      boundaryMaxSalesData,
      {
        minValue: minSalesAmount,
        maxValue: maxSalesAmount,
        fieldName: "salesAmount",
      }
    );

    expect(resultBoundaryMax.isValid).toBe(true);
    expect(resultBoundaryMax.anomalies).toHaveLength(0);

    // テストケース6: 複数の異常値を含むデータ
    const multipleAnomaliesSalesData = {
      salesDataId: "SD006",
      customerId: "CUST006",
      serviceId: "SVC001",
      salesAmount: -100000,
      appointmentCount: -5,
      contractCount: 200,
      recordedAt: new Date("2024-01-15T15:00:00Z"),
    };

    const resultMultipleAnomalies = validateSalesDataQuality(
      multipleAnomaliesSalesData,
      {
        minValue: minSalesAmount,
        maxValue: maxSalesAmount,
        fieldName: "salesAmount",
      }
    );

    expect(resultMultipleAnomalies.isValid).toBe(false);
    expect(resultMultipleAnomalies.anomalies.length).toBeGreaterThanOrEqual(1);
    expect(resultMultipleAnomalies.notification.anomalyCount).toBeGreaterThanOrEqual(
      1
    );
    expect(resultMultipleAnomalies.notificationLog.status).toBe("sent");
  });
});