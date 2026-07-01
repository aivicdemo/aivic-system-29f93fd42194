import { validateReportGenerationParameters } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - レポート生成パラメータ検証", () => {
  test("SCEN-643: レポート生成パラメータ検証機能 - 営業データと契約条件が整合するパラメータで検証が成功する", () => {
    // 営業データサンプル
    const salesData = {
      customerName: "ABC物流",
      productCode: "PROD-001",
      salesAmount: 500000,
      salesDate: new Date("2024-01-15T09:00:00Z"),
    };

    // 契約条件パラメータ
    const contractParameters = {
      contractId: "CONTRACT-2024-001",
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      paymentTerms: "NET30",
      validatedAt: new Date("2024-01-15T11:00:00Z"),
    };

    // パラメータ検証機能を実行
    const validationResult = validateReportGenerationParameters(
      salesData,
      contractParameters
    );

    // 検証が成功していることを確認
    expect(validationResult.status).toBe("success");
    expect(validationResult.isValid).toBe(true);
    expect(validationResult.errors).toEqual([]);

    // 営業データが契約期間内であることを確認
    expect(validationResult.dataIntegrity).toBe(true);

    // 検証エラーが発生していないことを確認
    expect(validationResult.errorCount).toBe(0);

    // レポート生成が可能な状態であることを確認
    expect(validationResult.canGenerateReport).toBe(true);

    // 検証ログが記録されていることを確認
    expect(validationResult.validationLog).toBeDefined();
    expect(validationResult.validationLog.length).toBeGreaterThan(0);

    // 契約ID が正確に一致していることを確認
    expect(validationResult.matchedContractId).toBe("CONTRACT-2024-001");

    // 営業日付が契約期間内であることを確認
    expect(validationResult.dateInContractPeriod).toBe(true);

    // 売上金額が妥当な範囲内であることを確認
    expect(validationResult.amountInValidRange).toBe(true);

    // 検証完了タイムスタンプが記録されていることを確認
    expect(validationResult.completedAt).toBeDefined();
    expect(typeof validationResult.completedAt).toBe("object");
  });

  test("SCEN-643-ERR: レポート生成パラメータ検証機能 - 営業日付が契約期間外の場合、検証が失敗する", () => {
    const salesData = {
      customerName: "XYZ商社",
      productCode: "PROD-002",
      salesAmount: 300000,
      salesDate: new Date("2023-12-15T09:00:00Z"), // 契約期間外
    };

    const contractParameters = {
      contractId: "CONTRACT-2024-002",
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      paymentTerms: "NET30",
      validatedAt: new Date("2024-01-15T11:00:00Z"),
    };

    const validationResult = validateReportGenerationParameters(
      salesData,
      contractParameters
    );

    // 検証が失敗していることを確認
    expect(validationResult.status).toBe("failure");
    expect(validationResult.isValid).toBe(false);

    // 日付関連のエラーが記録されていることを確認
    expect(validationResult.errors).toContainEqual(
      expect.objectContaining({
        field: "salesDate",
        reason: expect.stringMatching(/契約期間/),
      })
    );

    // レポート生成が不可な状態であることを確認
    expect(validationResult.canGenerateReport).toBe(false);

    // 日付の範囲外フラグが立っていることを確認
    expect(validationResult.dateInContractPeriod).toBe(false);
  });

  test("SCEN-643-ERR: レポート生成パラメータ検証機能 - 売上金額が異常値の場合、検証が失敗する", () => {
    const salesData = {
      customerName: "大型企業",
      productCode: "PROD-003",
      salesAmount: 100000000, // 異常に大きい金額
      salesDate: new Date("2024-06-15T09:00:00Z"),
    };

    const contractParameters = {
      contractId: "CONTRACT-2024-003",
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      paymentTerms: "NET30",
      validatedAt: new Date("2024-06-15T11:00:00Z"),
    };

    const validationResult = validateReportGenerationParameters(
      salesData,
      contractParameters
    );

    // 検証が失敗していることを確認
    expect(validationResult.status).toBe("failure");
    expect(validationResult.isValid).toBe(false);

    // 金額関連のエラーが記録されていることを確認
    expect(validationResult.errors).toContainEqual(
      expect.objectContaining({
        field: "salesAmount",
        reason: expect.stringMatching(/異常値/),
      })
    );

    // 金額の有効範囲フラグが立っていないことを確認
    expect(validationResult.amountInValidRange).toBe(false);
  });

  test("SCEN-643-ERR: レポート生成パラメータ検証機能 - 契約IDが一致しない場合、検証が失敗する", () => {
    const salesData = {
      customerName: "非契約顧客",
      productCode: "PROD-004",
      salesAmount: 250000,
      salesDate: new Date("2024-03-15T09:00:00Z"),
    };

    const contractParameters = {
      contractId: "CONTRACT-2024-999", // 存在しない契約ID
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      paymentTerms: "NET30",
      validatedAt: new Date("2024-03-15T11:00:00Z"),
    };

    expect(() =>
      validateReportGenerationParameters(salesData, contractParameters)
    ).toThrow(/契約/);
  });

  test("SCEN-643-ERR: レポート生成パラメータ検証機能 - 必須項目が欠落している場合、検証が失敗する", () => {
    const incompleteData = {
      customerName: "テスト企業",
      productCode: "PROD-005",
      // salesAmount が欠落
      salesDate: new Date("2024-05-15T09:00:00Z"),
    };

    const contractParameters = {
      contractId: "CONTRACT-2024-005",
      contractStartDate: new Date("2024-01-01T00:00:00Z"),
      contractEndDate: new Date("2024-12-31T23:59:59Z"),
      paymentTerms: "NET30",
      validatedAt: new Date("2024-05-15T11:00:00Z"),
    };

    expect(() =>
      validateReportGenerationParameters(
        incompleteData as any,
        contractParameters
      )
    ).toThrow(/必須/);
  });
});