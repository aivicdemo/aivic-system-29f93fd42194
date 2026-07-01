import { validateAndFilterBillingRecords } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求額算出・検証教育プロセス - 異常請求額検出・排除", () => {
  test("SCEN-998: 請求額が0円または負数となる異常ケースが検出・排除される", () => {
    // Arrange: テストデータの準備
    const billingRecordsInput = [
      {
        billingRecordId: "BR-001",
        customerId: "C-100",
        serviceId: "S-A",
        billingAmount: 50000,
        month: "2024-01",
        status: "pending",
      },
      {
        billingRecordId: "BR-002",
        customerId: "C-101",
        serviceId: "S-B",
        billingAmount: 0,
        month: "2024-01",
        status: "pending",
      },
      {
        billingRecordId: "BR-003",
        customerId: "C-102",
        serviceId: "S-C",
        billingAmount: 75000,
        month: "2024-01",
        status: "pending",
      },
      {
        billingRecordId: "BR-004",
        customerId: "C-103",
        serviceId: "S-D",
        billingAmount: -1000,
        month: "2024-01",
        status: "pending",
      },
      {
        billingRecordId: "BR-005",
        customerId: "C-104",
        serviceId: "S-E",
        billingAmount: 125000,
        month: "2024-01",
        status: "pending",
      },
    ];

    // Act: 請求額算出・検証教育プロセス実行
    const result = validateAndFilterBillingRecords(billingRecordsInput);

    // Assert: 異常ケースが検出されたことを確認
    expect(result.validRecords).toHaveLength(3);
    expect(result.validRecords[0].billingRecordId).toBe("BR-001");
    expect(result.validRecords[0].billingAmount).toBe(50000);
    expect(result.validRecords[1].billingRecordId).toBe("BR-003");
    expect(result.validRecords[1].billingAmount).toBe(75000);
    expect(result.validRecords[2].billingRecordId).toBe("BR-005");
    expect(result.validRecords[2].billingAmount).toBe(125000);

    // Assert: 異常レコード（0円）が検出されたことを確認
    expect(result.anomalousRecords).toHaveLength(2);
    const zeroRecord = result.anomalousRecords.find(
      (r) => r.billingRecordId === "BR-002"
    );
    expect(zeroRecord).toBeDefined();
    expect(zeroRecord?.billingAmount).toBe(0);
    expect(zeroRecord?.reason).toMatch(/ゼロ円|0円/);

    // Assert: 異常レコード（負数）が検出されたことを確認
    const negativeRecord = result.anomalousRecords.find(
      (r) => r.billingRecordId === "BR-004"
    );
    expect(negativeRecord).toBeDefined();
    expect(negativeRecord?.billingAmount).toBe(-1000);
    expect(negativeRecord?.reason).toMatch(/負数|マイナス/);

    // Assert: 排除されたレコードが監査ログに記録されていることを確認
    expect(result.auditLog).toHaveLength(2);
    const auditEntry1 = result.auditLog.find(
      (log) => log.recordId === "BR-002"
    );
    expect(auditEntry1?.action).toBe("removed");
    expect(auditEntry1?.reason).toMatch(/ゼロ円|0円/);
    expect(auditEntry1?.timestamp).toBeDefined();

    const auditEntry2 = result.auditLog.find(
      (log) => log.recordId === "BR-004"
    );
    expect(auditEntry2?.action).toBe("removed");
    expect(auditEntry2?.reason).toMatch(/負数|マイナス/);
    expect(auditEntry2?.timestamp).toBeDefined();

    // Assert: 結果サマリーの検証
    expect(result.summary.totalInput).toBe(5);
    expect(result.summary.validCount).toBe(3);
    expect(result.summary.anomalousCount).toBe(2);
    expect(result.summary.totalValidAmount).toBe(250000);
  });
});