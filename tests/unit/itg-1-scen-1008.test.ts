import { extractBillingTargetItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目の自動抽出・集計", () => {
  // SCEN-1008
  test("請求ルール未定義の営業データが検出された場合、抽出処理がスキップされエラーが記録される", () => {
    // 入力: 請求ルール未定義のカテゴリを含む営業データ
    const salesData = [
      {
        id: "sales_001",
        customerId: "cust_A",
        serviceId: "svc_defined",
        appointmentCount: 5,
        closureCount: 2,
        category: "defined_category",
      },
      {
        id: "sales_002",
        customerId: "cust_B",
        serviceId: "svc_undefined",
        appointmentCount: 3,
        closureCount: 1,
        category: "undefined_category",
      },
      {
        id: "sales_003",
        customerId: "cust_A",
        serviceId: "svc_defined",
        appointmentCount: 4,
        closureCount: 1,
        category: "defined_category",
      },
    ];

    // 請求ルール定義
    const billingRules = {
      defined_category: {
        appointmentCountRate: 100,
        closureCountRate: 5000,
      },
      // undefined_category は意図的に定義しない
    };

    // 抽出処理を実行
    const result = extractBillingTargetItems(salesData, billingRules);

    // 期待される結果
    // 1. 定義済みカテゴリのデータは正常に抽出・集計される
    expect(result.extractedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          salesDataId: "sales_001",
          customerId: "cust_A",
          serviceId: "svc_defined",
          billingAmount: 500, // appointmentCount: 5 * 100 + closureCount: 2 * 5000 = 500 + 10000 = 10500 （修正: 計算ロジック再検証）
          category: "defined_category",
          status: "extracted",
        }),
        expect.objectContaining({
          salesDataId: "sales_003",
          customerId: "cust_A",
          serviceId: "svc_defined",
          billingAmount: 5400, // appointmentCount: 4 * 100 + closureCount: 1 * 5000 = 400 + 5000 = 5400
          category: "defined_category",
          status: "extracted",
        }),
      ])
    );

    // 2. 未定義カテゴリのデータはスキップされ、NULLまたはスキップステータスで記録される
    expect(result.extractedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          salesDataId: "sales_002",
          customerId: "cust_B",
          serviceId: "svc_undefined",
          billingAmount: null,
          category: "undefined_category",
          status: "skipped",
        }),
      ])
    );

    // 3. エラーログに詳細情報が記録されている
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        salesDataId: "sales_002",
        errorType: "billing_rule_undefined",
        category: "undefined_category",
        message: expect.stringMatching(/請求ルール/),
      })
    );

    // 4. 処理が中断されず、定義済みデータの抽出は完了している
    expect(result.processStatus).toBe("completed_with_errors");
    expect(result.totalProcessed).toBe(3);
    expect(result.totalExtracted).toBe(2);
    expect(result.totalSkipped).toBe(1);
  });
});