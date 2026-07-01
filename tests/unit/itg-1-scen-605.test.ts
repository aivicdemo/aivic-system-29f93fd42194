import { describe, test, expect } from "@jest/globals";

// Import the logic function for sales data quality validation
import {
  validateSalesDataQuality,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・異常検出", () => {
  test("SCEN-605: 負の売上金額が異常値として検出される", () => {
    // テストデータ: 負の売上金額を含むレコード
    const testRecords = [
      {
        recordId: "REC001",
        customerId: "CUST001",
        saleAmount: -50000,
        appointmentCount: 5,
        closedDealsCount: 2,
        serviceType: "TypeA",
      },
      {
        recordId: "REC002",
        customerId: "CUST002",
        saleAmount: 150000,
        appointmentCount: 3,
        closedDealsCount: 1,
        serviceType: "TypeB",
      },
      {
        recordId: "REC003",
        customerId: "CUST003",
        saleAmount: 0,
        appointmentCount: 0,
        closedDealsCount: 0,
        serviceType: "TypeA",
      },
    ];

    // 売上金額の検証ルール: 0以上であること
    const validationRules = [
      {
        fieldName: "saleAmount",
        minValue: 0,
        maxValue: 10000000,
        dataType: "number",
        isRequired: true,
      },
    ];

    // 検証ロジックを実行
    const validationResult = validateSalesDataQuality(
      testRecords,
      validationRules
    );

    // 異常値リストを確認
    expect(validationResult.hasErrors).toBe(true);
    expect(validationResult.errors).toHaveLength(1);

    // 異常値の詳細情報を検証
    const detectedError = validationResult.errors[0];
    expect(detectedError.recordId).toBe("REC001");
    expect(detectedError.fieldName).toBe("saleAmount");
    expect(detectedError.errorCode).toBe("OUT_OF_RANGE");
    expect(detectedError.detectedValue).toBe(-50000);
    expect(detectedError.reason).toMatch(/値が許容範囲外|負の値/);

    // 負の売上金額が異常値リストに含まれていることを確認
    const hasNegativeSaleAmountError = validationResult.errors.some(
      (error: { fieldName: string; detectedValue: number }) =>
        error.fieldName === "saleAmount" && error.detectedValue < 0
    );
    expect(hasNegativeSaleAmountError).toBe(true);

    // その他の正常なレコード（REC002, REC003）は異常値として検出されていないことを確認
    const normalRecordErrors = validationResult.errors.filter(
      (error: { recordId: string }) =>
        error.recordId === "REC002" || error.recordId === "REC003"
    );
    expect(normalRecordErrors).toHaveLength(0);

    // 総エラー数が1件であることを確認
    expect(validationResult.totalErrors).toBe(1);
    expect(validationResult.totalRecordsValidated).toBe(3);
  });
});