import { validateReportDataReconciliation } from "../../src/logic/it-1781935279444-2-2-1";

describe("レポート数値とソースデータの照合機能", () => {
  test("SCEN-1172: ソースデータが存在しない場合、照合処理でエラーを返す", () => {
    // Arrange: ソースデータが存在しないレポート照合要件
    const reconciliationRequest = {
      reportId: "RPT-202501-001",
      reportValues: {
        appointmentCount: 15,
        contractCount: 3,
        customerReaction: "positive",
      },
      sourceDataId: "SRC-DATA-999", // 存在しないソースデータID
      customerId: "CUST-001",
      serviceId: "SRV-001",
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
    };

    // Act & Assert: ソースデータが見つからない場合のエラー
    expect(() => {
      validateReportDataReconciliation(reconciliationRequest);
    }).toThrow(/ソースデータが見つかりません/);
  });

  test("SCEN-1172: 削除済みのソースデータを参照する場合、照合処理でエラーを返す", () => {
    // Arrange: 削除済みソースデータを参照するレポート
    const reconciliationRequest = {
      reportId: "RPT-202501-002",
      reportValues: {
        appointmentCount: 20,
        contractCount: 5,
        customerReaction: "neutral",
      },
      sourceDataId: "SRC-DATA-DELETED",
      customerId: "CUST-002",
      serviceId: "SRV-002",
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
      isDeleted: true,
    };

    // Act & Assert: 削除済みソースデータの参照エラー
    expect(() => {
      validateReportDataReconciliation(reconciliationRequest);
    }).toThrow(/参照先のソースデータが存在しません/);
  });

  test("SCEN-1172: エラーレスポンスがエラーコードとメッセージを含む", () => {
    // Arrange: 無効なソースデータIDを持つ照合要件
    const reconciliationRequest = {
      reportId: "RPT-202501-003",
      reportValues: {
        appointmentCount: 10,
        contractCount: 2,
        customerReaction: "negative",
      },
      sourceDataId: null, // nullソースデータID
      customerId: "CUST-003",
      serviceId: "SRV-003",
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
    };

    // Act & Assert: nullソースデータのエラー検証
    let errorThrown = false;
    let errorMessage = "";

    try {
      validateReportDataReconciliation(reconciliationRequest);
    } catch (error) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }

    expect(errorThrown).toBe(true);
    expect(errorMessage).toMatch(/ソースデータ/);
    expect(errorMessage).toMatch(/ERR-DATA-001|存在しません/);
  });

  test("SCEN-1172: ソースデータが存在する場合、照合処理は成功し、差分を検出", () => {
    // Arrange: 有効なソースデータを持つ照合要件
    const reconciliationRequest = {
      reportId: "RPT-202501-004",
      reportValues: {
        appointmentCount: 15,
        contractCount: 3,
        customerReaction: "positive",
      },
      sourceDataId: "SRC-DATA-VALID-001",
      sourceData: {
        appointmentCount: 15,
        contractCount: 3,
        customerReaction: "positive",
      },
      customerId: "CUST-004",
      serviceId: "SRV-004",
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
    };

    // Act: 照合処理を実行
    const result = validateReportDataReconciliation(reconciliationRequest);

    // Assert: 照合成功、差分なし
    expect(result).toEqual({
      isValid: true,
      hasDiscrepancy: false,
      discrepancies: [],
      sourceDataFound: true,
      reconciliationStatus: "PASSED",
    });
  });

  test("SCEN-1172: ソースデータと値が異なる場合、差分を検出して報告", () => {
    // Arrange: ソースデータとレポート値が異なるケース
    const reconciliationRequest = {
      reportId: "RPT-202501-005",
      reportValues: {
        appointmentCount: 15,
        contractCount: 3,
        customerReaction: "positive",
      },
      sourceDataId: "SRC-DATA-VALID-002",
      sourceData: {
        appointmentCount: 12,
        contractCount: 2,
        customerReaction: "neutral",
      },
      customerId: "CUST-005",
      serviceId: "SRV-005",
      periodStart: "2025-01-01",
      periodEnd: "2025-01-31",
    };

    // Act: 照合処理を実行
    const result = validateReportDataReconciliation(reconciliationRequest);

    // Assert: 差分を検出
    expect(result).toEqual({
      isValid: false,
      hasDiscrepancy: true,
      discrepancies: [
        {
          field: "appointmentCount",
          reportValue: 15,
          sourceValue: 12,
          difference: 3,
        },
        {
          field: "contractCount",
          reportValue: 3,
          sourceValue: 2,
          difference: 1,
        },
        {
          field: "customerReaction",
          reportValue: "positive",
          sourceValue: "neutral",
          isMismatch: true,
        },
      ],
      sourceDataFound: true,
      reconciliationStatus: "FAILED_DISCREPANCY",
    });
  });
});