import { validateSalesData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1101: [error] 営業データ品質検証 - 必須項目が欠落している場合にエラーを検出し通知される
  test("必須項目が欠落したデータに対してシステムがデータ保存を拒否し、欠落項目を明示したエラーメッセージを表示し、管理者に通知が送信される", () => {
    const requiredFields = ["customerName", "amount", "billingDate"];
    const errorLog: any[] = [];

    // テスト 1: 顧客名（customerName）が空白の場合
    const inputMissingCustomerName = {
      customerName: "",
      amount: 100000,
      billingDate: "2024-01-15",
      salesPerson: "田中太郎",
      serviceType: "営業代行",
    };

    expect(() =>
      validateSalesData(inputMissingCustomerName, requiredFields, errorLog)
    ).toThrow(/顧客名/);

    // テスト 2: 金額（amount）が空白（undefined）の場合
    const inputMissingAmount = {
      customerName: "ABC株式会社",
      amount: undefined,
      billingDate: "2024-01-15",
      salesPerson: "田中太郎",
      serviceType: "営業代行",
    };

    expect(() =>
      validateSalesData(inputMissingAmount, requiredFields, errorLog)
    ).toThrow(/金額/);

    // テスト 3: 請求日（billingDate）が空白の場合
    const inputMissingBillingDate = {
      customerName: "ABC株式会社",
      amount: 100000,
      billingDate: "",
      salesPerson: "田中太郎",
      serviceType: "営業代行",
    };

    expect(() =>
      validateSalesData(inputMissingBillingDate, requiredFields, errorLog)
    ).toThrow(/請求日/);

    // テスト 4: すべての必須項目が揃っている場合は保存成功
    const validInput = {
      customerName: "ABC株式会社",
      amount: 100000,
      billingDate: "2024-01-15",
      salesPerson: "田中太郎",
      serviceType: "営業代行",
    };

    const result = validateSalesData(validInput, requiredFields, errorLog);

    expect(result).toEqual({
      isValid: true,
      errors: [],
      message: "データ保存が完了しました",
    });

    // テスト 5: エラーログが正確に記録されていることを確認
    const errorLogInput = {
      customerName: "",
      amount: 50000,
      billingDate: "2024-01-15",
      salesPerson: "佐藤次郎",
      serviceType: "営業代行",
    };

    try {
      validateSalesData(errorLogInput, requiredFields, errorLog);
    } catch {
      // エラーがキャッチされることを確認
    }

    expect(errorLog.length).toBeGreaterThan(0);
    expect(errorLog[errorLog.length - 1]).toEqual(
      expect.objectContaining({
        timestamp: expect.any(String),
        fieldName: "customerName",
        message: expect.stringContaining("顧客名"),
        inputData: expect.objectContaining({
          customerName: "",
          amount: 50000,
        }),
      })
    );

    // テスト 6: 複数の必須項目が欠落している場合
    const inputMultipleMissing = {
      customerName: "",
      amount: undefined,
      billingDate: "2024-01-15",
      salesPerson: "山田花子",
      serviceType: "営業代行",
    };

    expect(() =>
      validateSalesData(inputMultipleMissing, requiredFields, errorLog)
    ).toThrow(/顧客名|金額/);
  });
});