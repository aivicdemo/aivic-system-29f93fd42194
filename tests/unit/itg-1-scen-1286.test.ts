import { describe, test, expect } from "@jest/globals";
import {
  validateBillingAgainstContract,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-1286: 契約内容・割引基準との照合機能 - 請求情報が契約内容と不一致となり、修正対象として検出・記録される", () => {
    // Arrange: テストデータ準備
    const contractInfo = {
      contractId: "C-2024-001",
      contractAmount: 100000,
      discountRate: 10,
      effectiveAmount: 90000,
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    };

    const billingInfo = {
      billingId: "B-2024-001",
      contractId: "C-2024-001",
      billingAmount: 110000,
      discountApplied: 10000,
      finalAmount: 100000,
      billingDate: "2024-01-31",
    };

    // Act: 照合機能実行
    const result = validateBillingAgainstContract(contractInfo, billingInfo);

    // Assert: 不一致検出と修正対象記録の検証
    expect(result.isMatched).toBe(false);
    expect(result.mismatchDetected).toBe(true);
    expect(result.correctionRequired).toBe(true);
    expect(result.mismatchDetails).toEqual({
      contractId: "C-2024-001",
      expectedAmount: 90000,
      actualAmount: 100000,
      amountDifference: 10000,
      mismatchType: "金額差異",
      severity: "ERROR",
    });
    expect(result.detectedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.correctionRecord).toEqual({
      recordId: expect.any(String),
      contractId: "C-2024-001",
      billingId: "B-2024-001",
      expectedValue: 90000,
      actualValue: 100000,
      mismatchReason: "契約金額を超過",
      status: "未対応",
      createdAt: expect.any(String),
      requiresApproval: true,
    });
  });
});