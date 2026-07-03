import { describe, test, expect } from "@jest/globals";
import {
  detectAnomalousValues,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1033: [error] 営業データ自動検証ルール定義と異常検出 - 営業データの数値項目が許容範囲を超える場合、異常値として検出される
  test("許容範囲を超える数値項目が異常値として正しく検出される", () => {
    const validationRules = [
      {
        ruleId: "rule_001",
        fieldName: "売上金額",
        dataType: "number",
        minValue: 0,
        maxValue: 10000000,
        severity: "high",
      },
      {
        ruleId: "rule_002",
        fieldName: "アポ数",
        dataType: "number",
        minValue: 0,
        maxValue: 100,
        severity: "medium",
      },
    ];

    const salesData = [
      {
        recordId: "rec_001",
        customerId: "cust_001",
        salesAmount: 5000000,
        appointmentCount: 50,
        responseCount: 10,
      },
      {
        recordId: "rec_002",
        customerId: "cust_002",
        salesAmount: 15000000,
        appointmentCount: 150,
        responseCount: 25,
      },
      {
        recordId: "rec_003",
        customerId: "cust_003",
        salesAmount: 3000000,
        appointmentCount: 75,
        responseCount: 15,
      },
    ];

    const executionTimestamp = new Date("2024-01-15T10:30:00Z");

    const result = detectAnomalousValues({
      validationRules,
      salesData,
      executionTimestamp,
    });

    expect(result).toEqual({
      detectionResultId: expect.any(String),
      executionTimestamp: executionTimestamp.toISOString(),
      totalRecordsProcessed: 3,
      anomalyDetectedCount: 1,
      anomalies: [
        {
          recordId: "rec_002",
          customerId: "cust_002",
          anomalyDetails: [
            {
              fieldName: "売上金額",
              detectedValue: 15000000,
              minAllowedValue: 0,
              maxAllowedValue: 10000000,
              severity: "high",
              isOutOfRange: true,
            },
            {
              fieldName: "アポ数",
              detectedValue: 150,
              minAllowedValue: 0,
              maxAllowedValue: 100,
              severity: "medium",
              isOutOfRange: true,
            },
          ],
        },
      ],
      ruleDefinitionUsed: {
        ruleCount: 2,
        appliedRules: [
          {
            ruleId: "rule_001",
            fieldName: "売上金額",
            minValue: 0,
            maxValue: 10000000,
          },
          {
            ruleId: "rule_002",
            fieldName: "アポ数",
            minValue: 0,
            maxValue: 100,
          },
        ],
      },
      qualityCheckResult: {
        overallStatus: "FAILED",
        passedRecordCount: 2,
        failedRecordCount: 1,
      },
    });

    expect(result.anomalies[0].anomalyDetails).toHaveLength(2);
    expect(result.anomalies[0].anomalyDetails[0].fieldName).toBe("売上金額");
    expect(result.anomalies[0].anomalyDetails[0].detectedValue).toBe(
      15000000
    );
    expect(result.anomalies[0].anomalyDetails[0].maxAllowedValue).toBe(
      10000000
    );
    expect(result.anomalies[0].anomalyDetails[0].severity).toBe("high");
    expect(result.anomalies[0].anomalyDetails[0].isOutOfRange).toBe(true);

    expect(result.anomalies[0].anomalyDetails[1].fieldName).toBe("アポ数");
    expect(result.anomalies[0].anomalyDetails[1].detectedValue).toBe(150);
    expect(result.anomalies[0].anomalyDetails[1].maxAllowedValue).toBe(100);
    expect(result.anomalies[0].anomalyDetails[1].severity).toBe("medium");
    expect(result.anomalies[0].anomalyDetails[1].isOutOfRange).toBe(true);

    expect(result.ruleDefinitionUsed.ruleCount).toBe(2);
    expect(result.qualityCheckResult.passedRecordCount).toBe(2);
    expect(result.qualityCheckResult.failedRecordCount).toBe(1);
  });
});