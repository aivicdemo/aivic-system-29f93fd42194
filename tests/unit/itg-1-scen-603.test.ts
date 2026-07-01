import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesData,
  ValidationResult,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-603: [error] 営業データ品質検証・異常検出 - 必須項目が欠落している営業データが検証エラーとして検出される
  test("必須項目が欠落した営業データは検証エラーとして検出され、欠落項目を特定したエラーメッセージとエラーコードが返却される", () => {
    // ハッピーパス: 正常な営業データ
    const validSalesData = {
      customerName: "ABC Corp",
      amount: 150000,
      transactionDate: "2024-01-15",
    };

    const validResult: ValidationResult = validateSalesData(validSalesData);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toEqual([]);
    expect(validResult.errorCode).toBeNull();

    // エラーケース1: 顧客名が欠落
    const missingCustomerName = {
      customerName: "",
      amount: 150000,
      transactionDate: "2024-01-15",
    };

    const resultMissingCustomerName: ValidationResult = validateSalesData(
      missingCustomerName
    );
    expect(resultMissingCustomerName.isValid).toBe(false);
    expect(resultMissingCustomerName.errors.length).toBeGreaterThan(0);
    expect(resultMissingCustomerName.errors[0]).toMatch(/顧客名/);
    expect(resultMissingCustomerName.errorCode).toBe("VALIDATION_ERROR");
    expect(resultMissingCustomerName.anomalyLogId).toBeDefined();
    expect(typeof resultMissingCustomerName.anomalyLogId).toBe("string");

    // エラーケース2: 金額が欠落
    const missingAmount = {
      customerName: "ABC Corp",
      amount: null,
      transactionDate: "2024-01-15",
    };

    const resultMissingAmount: ValidationResult = validateSalesData(
      missingAmount
    );
    expect(resultMissingAmount.isValid).toBe(false);
    expect(resultMissingAmount.errors.length).toBeGreaterThan(0);
    expect(resultMissingAmount.errors[0]).toMatch(/金額/);
    expect(resultMissingAmount.errorCode).toBe("VALIDATION_ERROR");
    expect(resultMissingAmount.anomalyLogId).toBeDefined();
    expect(typeof resultMissingAmount.anomalyLogId).toBe("string");

    // エラーケース3: 取引日が欠落
    const missingTransactionDate = {
      customerName: "ABC Corp",
      amount: 150000,
      transactionDate: "",
    };

    const resultMissingTransactionDate: ValidationResult = validateSalesData(
      missingTransactionDate
    );
    expect(resultMissingTransactionDate.isValid).toBe(false);
    expect(resultMissingTransactionDate.errors.length).toBeGreaterThan(0);
    expect(resultMissingTransactionDate.errors[0]).toMatch(/取引日/);
    expect(resultMissingTransactionDate.errorCode).toBe("VALIDATION_ERROR");
    expect(resultMissingTransactionDate.anomalyLogId).toBeDefined();
    expect(typeof resultMissingTransactionDate.anomalyLogId).toBe("string");

    // エラーケース4: 複数の項目が欠落
    const missingMultiple = {
      customerName: "",
      amount: null,
      transactionDate: "",
    };

    const resultMultiple: ValidationResult = validateSalesData(missingMultiple);
    expect(resultMultiple.isValid).toBe(false);
    expect(resultMultiple.errors.length).toBeGreaterThanOrEqual(2);
    expect(resultMultiple.errorCode).toBe("VALIDATION_ERROR");
    expect(resultMultiple.anomalyLogId).toBeDefined();

    // エラーケース5: 異常検出ログが正しく記録されていることを確認
    const anomalyLogId = resultMissingCustomerName.anomalyLogId;
    expect(anomalyLogId).toMatch(/^[a-zA-Z0-9_-]+$/);
  });
});