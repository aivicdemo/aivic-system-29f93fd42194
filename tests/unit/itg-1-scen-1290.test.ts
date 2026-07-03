import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateInvoiceZeroAmount,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("SCEN-1290: 請求金額ゼロの妥当性自動検証", () => {
  let mockValidationResults: Array<{
    invoiceId: string;
    amount: number;
    validationStatus: string;
    validationMessage: string;
    validatedAt: string;
    warningLevel: string;
  }> = [];

  beforeEach(() => {
    mockValidationResults = [];
  });

  afterEach(() => {
    mockValidationResults = [];
  });

  test("SCEN-1290", () => {
    // 初期状態: テスト環境を初期化
    const invoiceId = "INV-2024-001";
    const customerId = "CUST-123";
    const serviceId = "SVC-456";
    const invoiceAmount = 0;
    const invoiceDate = "2024-01-15T10:00:00Z";
    const createdAt = "2024-01-15T09:30:00Z";

    // 請求金額がゼロ（0円）のデータレコードを作成
    const zeroAmountInvoiceRecord = {
      invoiceId: invoiceId,
      customerId: customerId,
      serviceId: serviceId,
      amount: invoiceAmount,
      invoiceDate: invoiceDate,
      createdAt: createdAt,
      contractId: "CONTRACT-789",
      billingCycle: "2024-01",
    };

    // 妥当性自動検証機能を実行
    const validationResult = validateInvoiceZeroAmount(
      zeroAmountInvoiceRecord
    );

    // 検証プロセスがゼロ金額のレコードを処理することを確認
    expect(validationResult).toBeDefined();
    expect(validationResult.processedInvoiceId).toBe(invoiceId);
    expect(validationResult.processedAmount).toBe(0);

    // 検証結果に警告またはエラーステータスが適切に設定されていることを確認
    expect(validationResult.validationStatus).toMatch(/warning|error/i);
    expect(
      ["WARNING", "ERROR"].includes(validationResult.validationStatus)
    ).toBe(true);

    // 検証結果に詳細メッセージが含まれることを確認
    expect(validationResult.validationMessage).toBeDefined();
    expect(validationResult.validationMessage.length).toBeGreaterThan(0);
    expect(validationResult.validationMessage).toMatch(/金額|ゼロ|0/);

    // 検証結果のタイムスタンプが正確に記録されていることを検証
    const validatedTimestamp = new Date(
      validationResult.validatedAt
    ).getTime();
    const beforeTimestamp = new Date("2024-01-15T09:00:00Z").getTime();
    const afterTimestamp = new Date("2024-01-15T11:00:00Z").getTime();
    expect(validatedTimestamp).toBeGreaterThanOrEqual(beforeTimestamp);
    expect(validatedTimestamp).toBeLessThanOrEqual(afterTimestamp);

    // 検証結果の詳細情報が記録されていることを確認
    expect(validationResult.validationDetail).toBeDefined();
    expect(validationResult.validationDetail.customerId).toBe(customerId);
    expect(validationResult.validationDetail.serviceId).toBe(serviceId);
    expect(validationResult.validationDetail.invoiceAmount).toBe(0);

    // 検証結果がデータベースに記録されるシミュレーション
    mockValidationResults.push({
      invoiceId: validationResult.processedInvoiceId,
      amount: validationResult.processedAmount,
      validationStatus: validationResult.validationStatus,
      validationMessage: validationResult.validationMessage,
      validatedAt: validationResult.validatedAt,
      warningLevel: validationResult.validationStatus === "WARNING" ? "WARN" : "ERR",
    });

    // 検証結果ログを確認し、ゼロ金額レコードに対する検証結果が記録されているか検査
    expect(mockValidationResults.length).toBe(1);
    const recordedResult = mockValidationResults[0];
    expect(recordedResult.invoiceId).toBe(invoiceId);
    expect(recordedResult.amount).toBe(0);
    expect(["WARNING", "ERROR"].includes(recordedResult.validationStatus)).toBe(
      true
    );

    // 検証結果の永続化確認（タイムスタンプと詳細情報）
    expect(recordedResult.validatedAt).toBe(validationResult.validatedAt);
    expect(recordedResult.validationMessage).toBe(
      validationResult.validationMessage
    );

    // 複数の検証条件チェック
    expect(validationResult.isPersisted).toBe(true);
    expect(validationResult.processingDurationMs).toBeGreaterThan(0);
    expect(validationResult.processingDurationMs).toBeLessThan(5000);
  });
});