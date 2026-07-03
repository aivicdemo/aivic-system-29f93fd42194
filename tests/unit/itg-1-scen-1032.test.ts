import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesData,
  ValidationRule,
  ValidationResult,
  ValidationError,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1032: [error] 営業データ自動検証ルール定義と異常検出 - 営業データから必須項目が欠落している場合、検証エラーとして検出される
  test("SCEN-1032: 必須項目欠落時に検証エラーを正常に検出し、エラーメッセージに欠落項目名・対象レコード番号・エラー内容を表示、エラーレベルをErrorに分類、後続ステップをブロック", () => {
    // Arrange: 必須項目（顧客名、商品ID、売上金額、売上日）を指定した検証ルールを定義
    const validationRules: ValidationRule[] = [
      {
        ruleId: "rule-001",
        fieldName: "customerName",
        fieldLabel: "顧客名",
        required: true,
        dataType: "string",
        minLength: 1,
        errorLevel: "Error",
      },
      {
        ruleId: "rule-002",
        fieldName: "productId",
        fieldLabel: "商品ID",
        required: true,
        dataType: "string",
        pattern: "^[A-Z0-9]{6}$",
        errorLevel: "Error",
      },
      {
        ruleId: "rule-003",
        fieldName: "salesAmount",
        fieldLabel: "売上金額",
        required: true,
        dataType: "number",
        minValue: 0,
        errorLevel: "Error",
      },
      {
        ruleId: "rule-004",
        fieldName: "salesDate",
        fieldLabel: "売上日",
        required: true,
        dataType: "string",
        pattern: "^\\d{4}-\\d{2}-\\d{2}$",
        errorLevel: "Error",
      },
    ];

    // 必須項目の1つ以上が欠落した営業データ（レコード1: 顧客名欠落、レコード2: 商品ID欠落、レコード3: 売上金額欠落）
    const salesDataWithMissingFields = [
      {
        // レコード1: 顧客名(customerName)欠落
        recordNumber: 1,
        productId: "PROD01",
        salesAmount: 50000,
        salesDate: "2024-01-15",
      },
      {
        // レコード2: 商品ID(productId)欠落
        recordNumber: 2,
        customerName: "顧客A",
        salesAmount: 75000,
        salesDate: "2024-01-16",
      },
      {
        // レコード3: 売上金額(salesAmount)欠落
        recordNumber: 3,
        customerName: "顧客B",
        productId: "PROD02",
        salesDate: "2024-01-17",
      },
      {
        // レコード4: 売上日(salesDate)欠落
        recordNumber: 4,
        customerName: "顧客C",
        productId: "PROD03",
        salesAmount: 100000,
      },
    ];

    // Act: 自動検証処理を実行
    const validationResult: ValidationResult = validateSalesData(
      salesDataWithMissingFields,
      validationRules
    );

    // Assert: 検証結果を確認
    // 1. 検証が失敗していることを確認（isValid = false）
    expect(validationResult.isValid).toBe(false);

    // 2. エラー数が正確であることを確認（4レコード × 各1欠落 = 4エラー）
    expect(validationResult.errors.length).toBe(4);

    // 3. レコード1のエラー：顧客名欠落
    const record1Error: ValidationError = validationResult.errors.find(
      (err: ValidationError) => err.recordNumber === 1
    )!;
    expect(record1Error).toBeDefined();
    expect(record1Error.fieldName).toBe("customerName");
    expect(record1Error.fieldLabel).toBe("顧客名");
    expect(record1Error.errorMessage).toContain("顧客名");
    expect(record1Error.errorMessage).toContain("必須項目");
    expect(record1Error.errorLevel).toBe("Error");

    // 4. レコード2のエラー：商品ID欠落
    const record2Error: ValidationError = validationResult.errors.find(
      (err: ValidationError) => err.recordNumber === 2
    )!;
    expect(record2Error).toBeDefined();
    expect(record2Error.fieldName).toBe("productId");
    expect(record2Error.fieldLabel).toBe("商品ID");
    expect(record2Error.errorMessage).toContain("商品ID");
    expect(record2Error.errorMessage).toContain("必須項目");
    expect(record2Error.errorLevel).toBe("Error");

    // 5. レコード3のエラー：売上金額欠落
    const record3Error: ValidationError = validationResult.errors.find(
      (err: ValidationError) => err.recordNumber === 3
    )!;
    expect(record3Error).toBeDefined();
    expect(record3Error.fieldName).toBe("salesAmount");
    expect(record3Error.fieldLabel).toBe("売上金額");
    expect(record3Error.errorMessage).toContain("売上金額");
    expect(record3Error.errorMessage).toContain("必須項目");
    expect(record3Error.errorLevel).toBe("Error");

    // 6. レコード4のエラー：売上日欠落
    const record4Error: ValidationError = validationResult.errors.find(
      (err: ValidationError) => err.recordNumber === 4
    )!;
    expect(record4Error).toBeDefined();
    expect(record4Error.fieldName).toBe("salesDate");
    expect(record4Error.fieldLabel).toBe("売上日");
    expect(record4Error.errorMessage).toContain("売上日");
    expect(record4Error.errorMessage).toContain("必須項目");
    expect(record4Error.errorLevel).toBe("Error");

    // 7. すべてのエラーレベルが『Error』として分類されていることを確認
    validationResult.errors.forEach((error: ValidationError) => {
      expect(error.errorLevel).toBe("Error");
    });

    // 8. 後続ステップのブロックフラグが有効であることを確認
    expect(validationResult.shouldBlockSubsequentSteps).toBe(true);

    // 9. エラーサマリーが正しく生成されていることを確認
    expect(validationResult.errorSummary).toContain("4");
    expect(validationResult.errorSummary).toContain("必須項目");

    // 10. すべてのエラーが記録番号と欠落項目名を含むことを確認
    validationResult.errors.forEach((error: ValidationError) => {
      expect(error.recordNumber).toBeGreaterThan(0);
      expect(error.recordNumber).toBeLessThanOrEqual(4);
      expect(error.fieldLabel).toBeTruthy();
      expect(error.fieldLabel.length).toBeGreaterThan(0);
    });
  });
});