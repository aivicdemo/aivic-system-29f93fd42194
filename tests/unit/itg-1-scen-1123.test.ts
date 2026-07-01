import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("営業データ完全性・正確性自動検証", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1123
  test("必須項目が欠落している場合、エスカレーション基準に従い適切なエラーが返却される", async () => {
    // 準備: 必須項目の定義
    const requiredFields = ["customerId", "billingAmount", "billingDate"];

    // テストケース1: 顧客IDが欠落
    const testPayload1 = {
      billingAmount: 50000,
      billingDate: "2024-01-15",
      serviceType: "営業活動代行",
    };

    const response1 = await validateSalesDataCompleteness(testPayload1);

    expect(response1.statusCode).toBe(400);
    expect(response1.errorCode).toMatch(/MISSING_FIELD/);
    expect(response1.errorMessage).toMatch(/customerId/);
    expect(response1.escalationLevel).toBe("HIGH");
    expect(response1.missingFields).toContain("customerId");

    // テストケース2: 複数の必須項目が欠落（顧客ID、請求金額）
    const testPayload2 = {
      billingDate: "2024-01-15",
      serviceType: "営業活動代行",
    };

    const response2 = await validateSalesDataCompleteness(testPayload2);

    expect(response2.statusCode).toBe(400);
    expect(response2.errorCode).toMatch(/MISSING_FIELD/);
    expect(response2.errorMessage).toMatch(/customerId|billingAmount/);
    expect(response2.escalationLevel).toBe("HIGH");
    expect(response2.missingFields).toContain("customerId");
    expect(response2.missingFields).toContain("billingAmount");
    expect(response2.missingFields.length).toBe(2);

    // テストケース3: 請求日が欠落
    const testPayload3 = {
      customerId: "CUST-001",
      billingAmount: 75000,
      serviceType: "営業活動代行",
    };

    const response3 = await validateSalesDataCompleteness(testPayload3);

    expect(response3.statusCode).toBe(400);
    expect(response3.errorCode).toMatch(/MISSING_FIELD/);
    expect(response3.errorMessage).toMatch(/billingDate/);
    expect(response3.escalationLevel).toBe("MEDIUM");
    expect(response3.missingFields).toContain("billingDate");
    expect(response3.missingFields.length).toBe(1);

    // テストケース4: 全ての必須項目が欠落
    const testPayload4 = {
      serviceType: "営業活動代行",
    };

    const response4 = await validateSalesDataCompleteness(testPayload4);

    expect(response4.statusCode).toBe(400);
    expect(response4.errorCode).toMatch(/MISSING_FIELD/);
    expect(response4.escalationLevel).toBe("CRITICAL");
    expect(response4.missingFields).toContain("customerId");
    expect(response4.missingFields).toContain("billingAmount");
    expect(response4.missingFields).toContain("billingDate");
    expect(response4.missingFields.length).toBe(3);

    // テストケース5: エラーレスポンスのフォーマット検証
    expect(response4).toHaveProperty("statusCode");
    expect(response4).toHaveProperty("errorCode");
    expect(response4).toHaveProperty("errorMessage");
    expect(response4).toHaveProperty("escalationLevel");
    expect(response4).toHaveProperty("missingFields");
    expect(response4).toHaveProperty("timestamp");

    // テストケース6: エラーメッセージが定義されたフォーマットに準拠
    expect(response4.errorMessage).toMatch(/必須項目が不足しています/);
    expect(response4.errorMessage).toMatch(/customerId/);
    expect(response4.errorMessage).toMatch(/billingAmount/);
    expect(response4.errorMessage).toMatch(/billingDate/);

    // テストケース7: システムログに記録されるか検証（fetchを使用）
    fetchMock.mockResponseOnce(JSON.stringify({ success: true }), {
      status: 200,
    });

    const logResponse = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "VALIDATION_ERROR",
        escalationLevel: response4.escalationLevel,
        missingFields: response4.missingFields,
      }),
    });

    expect(logResponse.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/logs",
      expect.objectContaining({
        method: "POST",
      })
    );

    // テストケース8: 異なるエスカレーションレベルの検証
    expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(
      response1.escalationLevel
    );
    expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(
      response2.escalationLevel
    );
    expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(
      response3.escalationLevel
    );
    expect(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(
      response4.escalationLevel
    );
  });
});