import { validateReportGenerationParameters } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - レポート生成パラメータ検証", () => {
  test("SCEN-645: 存在しない顧客IDがパラメータに指定された場合に検証失敗となる", () => {
    // テスト環境の初期化
    const validCustomerIds = ["CUST001", "CUST002", "CUST003"];
    const invalidCustomerId = "CUST_NOT_EXISTS";

    // 存在しない顧客IDを含むレポート生成パラメータを準備
    const reportGenerationParams = {
      customerId: invalidCustomerId,
      serviceId: "SVC001",
      periodStartDate: "2024-01-01",
      periodEndDate: "2024-01-31",
      reportFormat: "MONTHLY_SUMMARY",
    };

    // パラメータ検証関数を呼び出す
    const validationResult = validateReportGenerationParameters(
      reportGenerationParams,
      validCustomerIds
    );

    // 返却されたエラーオブジェクトを確認
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.errors).toBeDefined();
    expect(Array.isArray(validationResult.errors)).toBe(true);
    expect(validationResult.errors.length).toBeGreaterThan(0);

    // エラーメッセージに顧客ID不正に関する内容が含まれていることを確認
    const customerIdError = validationResult.errors.find((error: any) =>
      /顧客ID|customer/.test(error.message)
    );
    expect(customerIdError).toBeDefined();
    expect(customerIdError.message).toMatch(/見つかりません|無効な|存在しない/);

    // エラーステータスコードが適切な値（400番台）であることを確認
    expect(validationResult.statusCode).toBe(400);
  });
});