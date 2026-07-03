import {
  detectAnomaliesAndMissingData,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("異常値・欠落データ自動検出", () => {
  test("SCEN-1107: [normal] データが完全で異常がない場合に通知が生成されない", () => {
    // GIVEN: テスト用の完全で正常なデータセット
    const validSalesData = {
      salesDataId: "SD-20240115-001",
      customerId: "CUST-001",
      serviceId: "SVC-APPOINTMENT",
      appointmentCount: 5,
      contractCount: 2,
      customerFeedback: "positive",
      transactionDate: "2024-01-15",
      amount: 50000,
      status: "completed",
      createdBy: "sales-rep-001",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    };

    // WHEN: 異常値・欠落データ自動検出機能を実行
    const result = detectAnomaliesAndMissingData(validSalesData);

    // THEN: 検出結果を確認
    expect(result).toEqual({
      status: "success",
      hasAnomalies: false,
      hasMissingData: false,
      notifications: [],
      detailedResults: {
        missingFields: [],
        invalidFormats: [],
        anomalousValues: [],
        valueRangeViolations: [],
      },
      processedAt: expect.any(String),
    });

    // AND: 通知が生成されていないことを検証
    expect(result.notifications.length).toBe(0);

    // AND: 処理ステータスが成功（success）であることを確認
    expect(result.status).toBe("success");

    // AND: 詳細検出結果がすべて空であることを確認
    expect(result.detailedResults.missingFields.length).toBe(0);
    expect(result.detailedResults.invalidFormats.length).toBe(0);
    expect(result.detailedResults.anomalousValues.length).toBe(0);
    expect(result.detailedResults.valueRangeViolations.length).toBe(0);
  });
});