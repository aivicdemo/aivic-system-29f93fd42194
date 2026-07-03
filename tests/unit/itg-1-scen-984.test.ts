import { extractAndAggregateInvoiceItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-984: 請求対象項目の自動抽出・集計機能 - 営業データから請求ルールに基づいて請求対象項目が正確に抽出される", () => {
    // テストデータベースに営業データを準備
    const salesData = [
      {
        customerId: "CUST001",
        productCode: "PROD_A",
        transactionDate: "2024-01-15",
        amount: 50000,
        status: "完了",
      },
      {
        customerId: "CUST001",
        productCode: "PROD_B",
        transactionDate: "2024-01-16",
        amount: 30000,
        status: "完了",
      },
      {
        customerId: "CUST001",
        productCode: "PROD_C",
        transactionDate: "2024-01-17",
        amount: 8000,
        status: "完了",
      },
      {
        customerId: "CUST001",
        productCode: "PROD_EXCLUDE",
        transactionDate: "2024-01-18",
        amount: 25000,
        status: "完了",
      },
      {
        customerId: "CUST001",
        productCode: "PROD_A",
        transactionDate: "2024-01-19",
        amount: 15000,
        status: "保留中",
      },
      {
        customerId: "CUST002",
        productCode: "PROD_A",
        transactionDate: "2024-01-20",
        amount: 60000,
        status: "完了",
      },
      {
        customerId: "CUST002",
        productCode: "PROD_B",
        transactionDate: "2024-01-21",
        amount: 45000,
        status: "完了",
      },
      {
        customerId: "CUST002",
        productCode: "PROD_A",
        transactionDate: "2024-01-22",
        amount: 5000,
        status: "完了",
      },
      {
        customerId: "CUST003",
        productCode: "PROD_B",
        transactionDate: "2024-01-23",
        amount: 100000,
        status: "完了",
      },
      {
        customerId: "CUST003",
        productCode: "PROD_A",
        transactionDate: "2024-01-24",
        amount: 9000,
        status: "完了",
      },
    ];

    // 請求ルール設定を登録
    const invoiceRules = {
      targetStatus: "完了",
      targetProductCategories: ["PROD_A", "PROD_B"],
      excludeProducts: ["PROD_EXCLUDE"],
      minimumInvoiceAmount: 10000,
    };

    // 自動抽出・集計機能を実行
    const result = extractAndAggregateInvoiceItems(salesData, invoiceRules);

    // 抽出結果が請求ルールに合致しているか確認
    // CUST001 の期待結果：
    // - PROD_A: 50,000（1件、最小金額以上） + 0（保留中は除外）= 50,000
    // - PROD_B: 30,000（1件、最小金額以上）= 30,000
    // - PROD_C: 8,000（ルール外カテゴリ、最小金額以下で除外）= 0
    // - PROD_EXCLUDE: 除外対象なので集計から除外
    // CUST001 合計: 80,000

    // CUST002 の期待結果：
    // - PROD_A: 60,000 + 5,000 = 65,000（両件とも完了かつ対象カテゴリ）
    // - PROD_B: 45,000（1件、最小金額以上）= 45,000
    // CUST002 合計: 110,000

    // CUST003 の期待結果：
    // - PROD_B: 100,000（1件、最小金額以上）= 100,000
    // - PROD_A: 9,000（最小金額未満で除外）= 0
    // CUST003 合計: 100,000

    // 抽出された請求対象項目の一覧を取得
    expect(result).toBeDefined();
    expect(result.invoiceItems).toBeDefined();
    expect(Array.isArray(result.invoiceItems)).toBe(true);

    // 除外されるべき項目が含まれていないか確認
    const excludedProductItems = result.invoiceItems.filter(
      (item: any) => item.productCode === "PROD_EXCLUDE"
    );
    expect(excludedProductItems).toHaveLength(0);

    const belowMinimumItems = result.invoiceItems.filter(
      (item: any) => item.amount < 10000
    );
    expect(belowMinimumItems).toHaveLength(0);

    const notCompletedItems = result.invoiceItems.filter(
      (item: any) => item.status !== "完了"
    );
    expect(notCompletedItems).toHaveLength(0);

    // 請求対象項目ごとの集計金額が正確に計算されているか検証
    const cust001Items = result.invoiceItems.filter(
      (item: any) => item.customerId === "CUST001"
    );
    const cust001Total = cust001Items.reduce(
      (sum: number, item: any) => sum + item.amount,
      0
    );
    expect(cust001Total).toBe(80000);

    const cust002Items = result.invoiceItems.filter(
      (item: any) => item.customerId === "CUST002"
    );
    const cust002Total = cust002Items.reduce(
      (sum: number, item: any) => sum + item.amount,
      0
    );
    expect(cust002Total).toBe(110000);

    const cust003Items = result.invoiceItems.filter(
      (item: any) => item.customerId === "CUST003"
    );
    const cust003Total = cust003Items.reduce(
      (sum: number, item: any) => sum + item.amount,
      0
    );
    expect(cust003Total).toBe(100000);

    // 複数顧客の請求対象項目が正確に分類・集計されているか確認
    expect(result.customerAggregation).toBeDefined();
    expect(result.customerAggregation["CUST001"]).toBe(80000);
    expect(result.customerAggregation["CUST002"]).toBe(110000);
    expect(result.customerAggregation["CUST003"]).toBe(100000);

    // 商品別集計の確認
    expect(result.productAggregation).toBeDefined();
    const prodATotal =
      cust001Items.filter((item: any) => item.productCode === "PROD_A")
        .length > 0
        ? cust001Items
            .filter((item: any) => item.productCode === "PROD_A")
            .reduce((sum: number, item: any) => sum + item.amount, 0) +
          cust002Items
            .filter((item: any) => item.productCode === "PROD_A")
            .reduce((sum: number, item: any) => sum + item.amount, 0)
        : cust002Items
            .filter((item: any) => item.productCode === "PROD_A")
            .reduce((sum: number, item: any) => sum + item.amount, 0);
    expect(result.productAggregation["PROD_A"]).toBe(115000);

    const prodBTotal =
      cust001Items
        .filter((item: any) => item.productCode === "PROD_B")
        .reduce((sum: number, item: any) => sum + item.amount, 0) +
      cust002Items
        .filter((item: any) => item.productCode === "PROD_B")
        .reduce((sum: number, item: any) => sum + item.amount, 0) +
      cust003Items
        .filter((item: any) => item.productCode === "PROD_B")
        .reduce((sum: number, item: any) => sum + item.amount, 0);
    expect(result.productAggregation["PROD_B"]).toBe(175000);

    // 全体の集計額を確認
    expect(result.totalInvoiceAmount).toBe(290000);

    // 抽出対象外（ステータスが「完了」ではない）のデータが除外されていることを確認
    const allStatuses = result.invoiceItems.map((item: any) => item.status);
    expect(allStatuses.every((status: string) => status === "完了")).toBe(true);

    // 抽出対象外（カテゴリがルール外）のデータが除外されていることを確認
    const allProducts = result.invoiceItems.map((item: any) => item.productCode);
    expect(
      allProducts.every(
        (product: string) =>
          invoiceRules.targetProductCategories.includes(product) &&
          !invoiceRules.excludeProducts.includes(product)
      )
    ).toBe(true);
  });
});