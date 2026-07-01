import { describe, test, expect } from "@jest/globals";
import { validateSalesDataWithRuleDefinition } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-1322: ボーダーラインの金額（閾値と同一）がルール判定される", () => {
    // Setup: 検証ルール定義
    const ruleDefinition = {
      ruleId: "rule_amount_threshold_001",
      ruleName: "金額閾値異常検出ルール",
      targetField: "amount",
      conditionType: "greaterThanOrEqual",
      thresholdValue: 10000,
      anomalyFlagName: "amount_anomaly_flag",
      description: "金額が閾値以上の場合、異常フラグを立てる",
    };

    // Test data: 金額がボーダーライン値（10,000円）と完全に一致
    const salesDataAtBoundary = {
      dataId: "sales_001",
      customerId: "cust_001",
      amount: 10000,
      date: "2024-01-15",
      description: "営業成果データ（ボーダーライン値）",
    };

    // Test data: 金額が閾値を下回る
    const salesDataBelowThreshold = {
      dataId: "sales_002",
      customerId: "cust_001",
      amount: 9999,
      date: "2024-01-15",
      description: "営業成果データ（閾値以下）",
    };

    // Test data: 金額が閾値を上回る
    const salesDataAboveThreshold = {
      dataId: "sales_003",
      customerId: "cust_001",
      amount: 10001,
      date: "2024-01-15",
      description: "営業成果データ（閾値以上）",
    };

    // Execute: 自動検証プロセスを実行
    const resultAtBoundary = validateSalesDataWithRuleDefinition(
      ruleDefinition,
      salesDataAtBoundary
    );

    const resultBelowThreshold = validateSalesDataWithRuleDefinition(
      ruleDefinition,
      salesDataBelowThreshold
    );

    const resultAboveThreshold = validateSalesDataWithRuleDefinition(
      ruleDefinition,
      salesDataAboveThreshold
    );

    // Verify: ボーダーライン値（10,000円）で異常フラグが立てられること
    expect(resultAtBoundary).toEqual({
      dataId: "sales_001",
      isValid: false,
      anomalyDetected: true,
      anomalyFlagName: "amount_anomaly_flag",
      ruleId: "rule_amount_threshold_001",
      violatedCondition: "greaterThanOrEqual",
      detectedValue: 10000,
      thresholdValue: 10000,
      validationLog: {
        timestamp: expect.any(String),
        ruleName: "金額閾値異常検出ルール",
        targetField: "amount",
        actualValue: 10000,
        condition: "金額が閾値以上の場合、異常フラグを立てる",
        judgmentResult: "異常フラグ立て",
        reason: "金額がボーダーライン値と完全に一致し、条件を満たす",
      },
    });

    // Verify: 閾値以下（9,999円）では異常フラグが立たないこと
    expect(resultBelowThreshold).toEqual({
      dataId: "sales_002",
      isValid: true,
      anomalyDetected: false,
      anomalyFlagName: "amount_anomaly_flag",
      ruleId: "rule_amount_threshold_001",
      violatedCondition: null,
      detectedValue: 9999,
      thresholdValue: 10000,
      validationLog: {
        timestamp: expect.any(String),
        ruleName: "金額閾値異常検出ルール",
        targetField: "amount",
        actualValue: 9999,
        condition: "金額が閾値以上の場合、異常フラグを立てる",
        judgmentResult: "正常",
        reason: "金額が閾値を下回っているため条件を満たさない",
      },
    });

    // Verify: 閾値以上（10,001円）でも異常フラグが立てられること
    expect(resultAboveThreshold).toEqual({
      dataId: "sales_003",
      isValid: false,
      anomalyDetected: true,
      anomalyFlagName: "amount_anomaly_flag",
      ruleId: "rule_amount_threshold_001",
      violatedCondition: "greaterThanOrEqual",
      detectedValue: 10001,
      thresholdValue: 10000,
      validationLog: {
        timestamp: expect.any(String),
        ruleName: "金額閾値異常検出ルール",
        targetField: "amount",
        actualValue: 10001,
        condition: "金額が閾値以上の場合、異常フラグを立てる",
        judgmentResult: "異常フラグ立て",
        reason: "金額が閾値を上回っており、条件を満たす",
      },
    });

    // Verify: 検証ログに判定結果が正しく記録されていること
    expect(resultAtBoundary.validationLog.judgmentResult).toBe("異常フラグ立て");
    expect(resultBelowThreshold.validationLog.judgmentResult).toBe("正常");
    expect(resultAboveThreshold.validationLog.judgmentResult).toBe(
      "異常フラグ立て"
    );

    // Verify: ボーダーラインでの境界値判定が正確であること
    expect(resultAtBoundary.detectedValue).toBe(
      resultAtBoundary.thresholdValue
    );
    expect(resultAtBoundary.anomalyDetected).toBe(true);
    expect(resultAtBoundary.isValid).toBe(false);
  });
});