import { validateSalesDataRequiredFields } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-1334
  test("営業システムの必須出力項目がバックオフィスシステムの入力要件に欠落している場合に不整合として記録される", () => {
    // 入力: バックオフィス入力要件（必須項目リスト）
    const backofficeRequiredFields = [
      "customerId",
      "customerName",
      "salesAmount",
      "invoiceDate",
    ];

    // 入力: 営業システムから送信されたデータ（customerId を意図的に省略）
    const salesSystemData = {
      // customerId は欠落
      customerName: "テスト顧客A",
      salesAmount: 100000,
      invoiceDate: "2024-01-15",
      recordId: "REC-20240115-001",
      timestamp: "2024-01-15T09:30:00Z",
    };

    // 実行: バックオフィスシステムの入力検証ロジック
    const validationResult = validateSalesDataRequiredFields(
      salesSystemData,
      backofficeRequiredFields
    );

    // 検証1: 必須項目欠落エラーが検出されていること
    expect(validationResult.isValid).toBe(false);

    // 検証2: 欠落している項目名が正しく記録されていること
    expect(validationResult.missingFields).toContain("customerId");
    expect(validationResult.missingFields.length).toBe(1);

    // 検証3: エラーログに欠落項目名が含まれていること
    expect(validationResult.errorLog.missingFieldNames).toEqual(["customerId"]);

    // 検証4: エラーログに営業システムのレコードIDが記録されていること
    expect(validationResult.errorLog.recordId).toBe("REC-20240115-001");

    // 検証5: エラーログに検出日時が記録されていること（タイムスタンプ形式）
    expect(validationResult.errorLog.detectionTimestamp).toBe(
      "2024-01-15T09:30:00Z"
    );

    // 検証6: エラーレベルが ERROR であること
    expect(validationResult.errorLog.errorLevel).toBe("ERROR");

    // 検証7: 該当レコードがバックオフィスシステムに登録されていないことを確認
    expect(validationResult.isRegisteredInBackoffice).toBe(false);

    // 検証8: エラーメッセージに業務的キーワード（必須項目）が含まれていること
    expect(validationResult.errorLog.message).toMatch(/必須項目/);

    // 検証9: 複数の必須項目が欠落しているケース
    const salesDataMultipleMissing = {
      customerName: "テスト顧客B",
      // customerId, salesAmount, invoiceDate はすべて欠落
      recordId: "REC-20240115-002",
      timestamp: "2024-01-15T10:00:00Z",
    };

    const multipleValidationResult = validateSalesDataRequiredFields(
      salesDataMultipleMissing,
      backofficeRequiredFields
    );

    expect(multipleValidationResult.isValid).toBe(false);
    expect(multipleValidationResult.missingFields.length).toBe(3);
    expect(multipleValidationResult.missingFields).toContain("customerId");
    expect(multipleValidationResult.missingFields).toContain("salesAmount");
    expect(multipleValidationResult.missingFields).toContain("invoiceDate");
    expect(multipleValidationResult.errorLog.errorLevel).toBe("ERROR");
    expect(multipleValidationResult.isRegisteredInBackoffice).toBe(false);

    // 検証10: すべての必須項目が揃っているハッピーパス
    const completeData = {
      customerId: "CUST-001",
      customerName: "テスト顧客C",
      salesAmount: 150000,
      invoiceDate: "2024-01-15",
      recordId: "REC-20240115-003",
      timestamp: "2024-01-15T11:00:00Z",
    };

    const successValidationResult = validateSalesDataRequiredFields(
      completeData,
      backofficeRequiredFields
    );

    expect(successValidationResult.isValid).toBe(true);
    expect(successValidationResult.missingFields.length).toBe(0);
    expect(successValidationResult.isRegisteredInBackoffice).toBe(true);
  });
});