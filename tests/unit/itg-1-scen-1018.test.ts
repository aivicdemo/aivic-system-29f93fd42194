import { describe, test, expect } from "@jest/globals";
import {
  validateBillingLogicAndDiscountBasis,
  BillingValidationResult,
  BillingValidationError,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1018: [error] 請求ロジック・割引基準・例外パターンの文書化と体制確保 - 手順書が存在しない状態で例外ケースが発生したときにエラーが返却される
  test("should return error object when procedure document is missing and exception case is triggered", () => {
    // 手順書が存在しない状態（procedureDocumentExists = false）
    const inputData = {
      procedureDocumentExists: false,
      discountBasisDocumentExists: false,
      exceptionCaseInput: {
        discountCode: "INVALID_CODE_12345",
        billingAmount: -5000,
        customerId: "CUST_NONEXISTENT",
        serviceType: "premium",
        applicationDate: "2024-01-15",
      },
    };

    // 例外ケース処理を実行してエラーを期待
    const result = validateBillingLogicAndDiscountBasis(inputData);

    // エラーオブジェクトが返却されることを確認
    expect(result).toBeDefined();
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBeDefined();
    expect(result.errorMessage).toBeDefined();

    // エラータイプが明記されていることを確認
    expect(result.errorType).toBe("PROCEDURE_DOCUMENT_MISSING");

    // エラーメッセージに手順書不在に関する情報が含まれることを確認
    expect(result.errorMessage).toMatch(/手順書/);

    // 具体的なエラー情報の検証
    expect(result.errorCode).toBe("ERR_BILLING_001");
    expect(result.missingDocuments).toEqual([
      "procedureDocument",
      "discountBasisDocument",
    ]);

    // 例外ケース詳細が記録されることを確認
    expect(result.failedExceptionCase).toBeDefined();
    expect(result.failedExceptionCase.discountCode).toBe("INVALID_CODE_12345");
    expect(result.failedExceptionCase.billingAmount).toBe(-5000);
    expect(result.failedExceptionCase.customerId).toBe("CUST_NONEXISTENT");

    // 処理可能なエラーであることを確認
    expect(result.isRecoverable).toBe(false);
    expect(result.recommendedAction).toBe("UPDATE_PROCEDURE_DOCUMENTS");
  });
});