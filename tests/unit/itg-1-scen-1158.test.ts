import { detectAnomaliesAndContradictions } from "../../src/logic/it-1781935279444-2-2-1";

describe("レポート内異常値・矛盾検出", () => {
  // SCEN-1158
  test("異常値が1件も含まれていないレポートに対して、配信可能判定が下される", () => {
    // Arrange: 異常値を含まないレポートデータを準備
    const reportData = {
      reportId: "RPT-2024-01-001",
      generatedAt: "2024-01-15T09:00:00Z",
      customerId: "CUST-001",
      customerName: "顧客A企業",
      serviceName: "営業代行サービス",
      period: "2024-01",
      metrics: {
        appointmentCount: 45,
        appointmentCountPreviousMonth: 40,
        appointmentCountChangeRate: 12.5,
        contractCount: 12,
        contractCountPreviousMonth: 10,
        contractCountChangeRate: 20.0,
        customerReactionScore: 85,
        billingAmount: 450000,
        billingAmountPreviousMonth: 400000,
        billingAmountChangeRate: 12.5,
      },
      items: [
        {
          itemId: "ITEM-001",
          itemName: "初回アポイント",
          value: 25,
          unit: "件",
          dataType: "integer",
          isValid: true,
        },
        {
          itemId: "ITEM-002",
          itemName: "成約実績",
          value: 12,
          unit: "件",
          dataType: "integer",
          isValid: true,
        },
        {
          itemId: "ITEM-003",
          itemName: "顧客満足度スコア",
          value: 85,
          unit: "ポイント",
          dataType: "integer",
          isValid: true,
        },
        {
          itemId: "ITEM-004",
          itemName: "請求額",
          value: 450000,
          unit: "円",
          dataType: "number",
          isValid: true,
        },
      ],
    };

    // Act: レポート内異常値・矛盾検出機能を実行
    const detectionResult = detectAnomaliesAndContradictions(reportData);

    // Assert: 異常値が検出されないことを確認
    expect(detectionResult.anomalyCount).toBe(0);
    expect(detectionResult.detectedAnomalies).toEqual([]);
    expect(detectionResult.contradictionCount).toBe(0);
    expect(detectionResult.detectedContradictions).toEqual([]);

    // Assert: 配信可能判定がtrueであることを確認
    expect(detectionResult.isDistributable).toBe(true);
    expect(detectionResult.distributionReadiness).toBe("配信可能");
  });
});