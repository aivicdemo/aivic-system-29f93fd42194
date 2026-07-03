import { detectAnomaliesInSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-1251: 複数の異常が同時に検出された場合、優先度順にソートして通知する", () => {
    // Arrange: 複数の異常値を含む営業データレコードを準備
    const salesDataWithMultipleAnomalies = {
      customer_name: "", // 異常1: 必須項目が空白（優先度：高）
      amount: -50000, // 異常2: 金額がマイナス値（優先度：高）
      billing_date: new Date("2099-12-31").toISOString(), // 異常3: 請求日が未来日（優先度：中）
      service_type: "standard", // 正常
      contact_date: new Date("2024-01-15").toISOString(), // 正常
      deal_status: "confirmed", // 正常
    };

    // Act: 異常検出機能を実行
    const detectedAnomalies = detectAnomaliesInSalesData(salesDataWithMultipleAnomalies);

    // Assert: 複数の異常が同時に検出されることを確認
    expect(detectedAnomalies).toBeDefined();
    expect(Array.isArray(detectedAnomalies)).toBe(true);
    expect(detectedAnomalies.length).toBe(3);

    // Assert: 検出された異常が優先度順（高 → 中 → 低）にソートされていることを検証
    expect(detectedAnomalies[0].priority_level).toBe("high");
    expect(detectedAnomalies[1].priority_level).toBe("high");
    expect(detectedAnomalies[2].priority_level).toBe("medium");

    // Assert: ソート順序の検証（重大度順）
    const priorityOrder = ["high", "high", "medium"];
    detectedAnomalies.forEach((anomaly, index) => {
      expect(anomaly.priority_level).toBe(priorityOrder[index]);
    });

    // Assert: 異常の詳細内容と優先度が正しく対応していることを確認
    const anomalyDetails = detectedAnomalies.map((a) => ({
      field_name: a.field_name,
      anomaly_type: a.anomaly_type,
      priority_level: a.priority_level,
    }));

    expect(anomalyDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "customer_name",
          anomaly_type: "missing_required_field",
          priority_level: "high",
        }),
        expect.objectContaining({
          field_name: "amount",
          anomaly_type: "invalid_value_range",
          priority_level: "high",
        }),
        expect.objectContaining({
          field_name: "billing_date",
          anomaly_type: "future_date_detected",
          priority_level: "medium",
        }),
      ])
    );

    // Assert: 通知内容に優先度レベルが明示されていることを検証
    detectedAnomalies.forEach((anomaly) => {
      expect(anomaly).toHaveProperty("priority_level");
      expect(["high", "medium", "low"]).toContain(anomaly.priority_level);
    });

    // Assert: 通知メッセージが生成されていることを確認
    expect(detectedAnomalies[0]).toHaveProperty("notification_message");
    expect(detectedAnomalies[0].notification_message).toMatch(/customer_name/);
    expect(detectedAnomalies[1].notification_message).toMatch(/amount/);
    expect(detectedAnomalies[2].notification_message).toMatch(/billing_date/);

    // Assert: 異常の件数と順序が期待値と一致することをアサーション
    expect(detectedAnomalies).toHaveLength(3);
    expect(detectedAnomalies[0].field_name).toBe("customer_name");
    expect(detectedAnomalies[1].field_name).toBe("amount");
    expect(detectedAnomalies[2].field_name).toBe("billing_date");

    // Assert: 通知オブジェクト全体の構造を検証
    detectedAnomalies.forEach((anomaly) => {
      expect(anomaly).toHaveProperty("field_name");
      expect(anomaly).toHaveProperty("anomaly_type");
      expect(anomaly).toHaveProperty("priority_level");
      expect(anomaly).toHaveProperty("notification_message");
      expect(typeof anomaly.field_name).toBe("string");
      expect(typeof anomaly.anomaly_type).toBe("string");
      expect(typeof anomaly.priority_level).toBe("string");
      expect(typeof anomaly.notification_message).toBe("string");
    });
  });
});