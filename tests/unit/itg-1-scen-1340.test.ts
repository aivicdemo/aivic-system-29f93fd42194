import { describe, test, expect } from "@jest/globals";
import {
  validateSalesDataFormat,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証", () => {
  // SCEN-1340: [error] 営業データの完全性・正確性自動検証 - データ形式が不正な項目が誤りとして検出される
  test("should detect all format errors in sales data and return FAILED validation result", () => {
    const invalidSalesData = {
      phone: "090-ABCD-1234",
      email: "user.example.com",
      amount: "¥1,000.99.50",
      date: "2024-02-30",
      postalCode: "1234",
    };

    const result = validateSalesDataFormat(invalidSalesData);

    expect(result.validationStatus).toBe("FAILED");
    expect(result.errors).toHaveLength(5);

    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "phone",
          errorType: "phoneFormat",
          message: expect.stringContaining("電話番号"),
          lineNumber: expect.any(Number),
        }),
        expect.objectContaining({
          fieldName: "email",
          errorType: "emailFormat",
          message: expect.stringContaining("メールアドレス"),
          lineNumber: expect.any(Number),
        }),
        expect.objectContaining({
          fieldName: "amount",
          errorType: "amountFormat",
          message: expect.stringContaining("金額"),
          lineNumber: expect.any(Number),
        }),
        expect.objectContaining({
          fieldName: "date",
          errorType: "dateFormat",
          message: expect.stringContaining("日付"),
          lineNumber: expect.any(Number),
        }),
        expect.objectContaining({
          fieldName: "postalCode",
          errorType: "postalCodeFormat",
          message: expect.stringContaining("郵便番号"),
          lineNumber: expect.any(Number),
        }),
      ])
    );

    expect(result.errorLog).toContain("電話番号形式エラー");
    expect(result.errorLog).toContain("メールアドレス形式エラー");
    expect(result.errorLog).toContain("金額形式エラー");
    expect(result.errorLog).toContain("日付形式エラー");
    expect(result.errorLog).toContain("郵便番号形式エラー");
    expect(result.errorLog).toContain("090-ABCD-1234");
    expect(result.errorLog).toContain("user.example.com");
    expect(result.errorLog).toContain("¥1,000.99.50");
    expect(result.errorLog).toContain("2024-02-30");
    expect(result.errorLog).toContain("1234");
  });
});