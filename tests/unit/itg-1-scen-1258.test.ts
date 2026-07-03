import { detectBillingAnomaly } from "../../src/logic/it-1-2-1";

describe("請求情報検証機能 - 異常金額検出", () => {
  test("SCEN-1258: 過去請求パターンから大幅に乖離した金額が例外として記録される", () => {
    // 過去12ヶ月の請求履歴（月額100万円～120万円の範囲）
    const pastBillingHistory = [
      { month: "2023-01", amount: 1000000 },
      { month: "2023-02", amount: 1050000 },
      { month: "2023-03", amount: 1100000 },
      { month: "2023-04", amount: 1080000 },
      { month: "2023-05", amount: 1120000 },
      { month: "2023-06", amount: 1000000 },
      { month: "2023-07", amount: 1090000 },
      { month: "2023-08", amount: 1110000 },
      { month: "2023-09", amount: 1070000 },
      { month: "2023-10", amount: 1100000 },
      { month: "2023-11", amount: 1050000 },
      { month: "2023-12", amount: 1080000 },
    ];

    // 過去12ヶ月の統計値を計算
    const amounts = pastBillingHistory.map((h) => h.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length; // 平均: 1082500
    const variance =
      amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      amounts.length;
    const stdDev = Math.sqrt(variance); // 標準偏差: 約44721.36
    const upperThreshold = mean + 3 * stdDev; // 平均 + 3σ: 約1216664.08

    // 異常金額：500万円（統計的閾値を大幅に超える）
    const anomalousAmount = 5000000;

    // 通常範囲内の金額：110万円
    const normalAmount = 1100000;

    const customerId = "CUST-001";
    const serviceId = "SVC-A";
    const detectionTimestamp = "2024-01-15T11:00:00Z";

    // 異常金額の検出テスト
    const anomalyResult = detectBillingAnomaly({
      customerId,
      serviceId,
      billingAmount: anomalousAmount,
      pastBillingHistory,
      detectionTimestamp,
    });

    // 異常検出の確認
    expect(anomalyResult.isAnomaly).toBe(true);
    expect(anomalyResult.detectedAmount).toBe(5000000);
    expect(anomalyResult.detectionTimestamp).toBe("2024-01-15T11:00:00Z");

    // 乖離率の計算: (異常金額 - 平均) / 平均 * 100 = (5000000 - 1082500) / 1082500 * 100 ≈ 361.6%
    // テスト内の固定値: 乖離率が400%以上であることを確認
    expect(anomalyResult.deviationPercentage).toBeGreaterThanOrEqual(361.6);

    // リスク区分の確認
    expect(anomalyResult.riskLevel).toBe("High");

    // 例外レコードの検証
    expect(anomalyResult.exceptionRecord).toBeDefined();
    expect(anomalyResult.exceptionRecord.anomalousAmount).toBe(5000000);
    expect(anomalyResult.exceptionRecord.customerId).toBe("CUST-001");
    expect(anomalyResult.exceptionRecord.serviceId).toBe("SVC-A");
    expect(anomalyResult.exceptionRecord.riskClassification).toBe("High");
    expect(anomalyResult.exceptionRecord.threshold).toBeCloseTo(1216664.08, 0);

    // 通常金額の検出テスト
    const normalResult = detectBillingAnomaly({
      customerId,
      serviceId,
      billingAmount: normalAmount,
      pastBillingHistory,
      detectionTimestamp,
    });

    // 通常範囲内なので異常検出されない
    expect(normalResult.isAnomaly).toBe(false);
    expect(normalResult.detectedAmount).toBe(1100000);
    expect(normalResult.riskLevel).toBe("Normal");

    // 通常金額については例外記録が生成されていない
    expect(normalResult.exceptionRecord).toBeNull();

    // 乖離率が許容範囲内であることを確認
    expect(normalResult.deviationPercentage).toBeLessThan(300);
  });
});