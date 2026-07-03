import { aggregateMonthlySummaryByCustomerAndService } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次成果レポート自動集計機能 - 複数サービス利用顧客の顧客別・サービス別集計分離", () => {
  // SCEN-682
  test("複数サービス利用顧客について正確に顧客別・サービス別集計が分離される", () => {
    // テストデータ: 3顧客、複数サービス組み合わせ
    const transactionData = [
      // 顧客1(C001)のサービスA: 3件、売上 150,000
      {
        customerId: "C001",
        customerName: "顧客A会社",
        serviceId: "SVC-A",
        serviceName: "サービスA",
        transactionCount: 3,
        salesAmount: 150000,
        transactionMonth: "2024-01",
      },
      // 顧客1(C001)のサービスB: 2件、売上 100,000
      {
        customerId: "C001",
        customerName: "顧客A会社",
        serviceId: "SVC-B",
        serviceName: "サービスB",
        transactionCount: 2,
        salesAmount: 100000,
        transactionMonth: "2024-01",
      },
      // 顧客2(C002)のサービスB: 4件、売上 200,000
      {
        customerId: "C002",
        customerName: "顧客B会社",
        serviceId: "SVC-B",
        serviceName: "サービスB",
        transactionCount: 4,
        salesAmount: 200000,
        transactionMonth: "2024-01",
      },
      // 顧客2(C002)のサービスC: 1件、売上 50,000
      {
        customerId: "C002",
        customerName: "顧客B会社",
        serviceId: "SVC-C",
        serviceName: "サービスC",
        transactionCount: 1,
        salesAmount: 50000,
        transactionMonth: "2024-01",
      },
      // 顧客3(C003)のサービスA: 5件、売上 250,000
      {
        customerId: "C003",
        customerName: "顧客C会社",
        serviceId: "SVC-A",
        serviceName: "サービスA",
        transactionCount: 5,
        salesAmount: 250000,
        transactionMonth: "2024-01",
      },
      // 顧客3(C003)のサービスB: 2件、売上 120,000
      {
        customerId: "C003",
        customerName: "顧客C会社",
        serviceId: "SVC-B",
        serviceName: "サービスB",
        transactionCount: 2,
        salesAmount: 120000,
        transactionMonth: "2024-01",
      },
      // 顧客3(C003)のサービスC: 3件、売上 180,000
      {
        customerId: "C003",
        customerName: "顧客C会社",
        serviceId: "SVC-C",
        serviceName: "サービスC",
        transactionCount: 3,
        salesAmount: 180000,
        transactionMonth: "2024-01",
      },
    ];

    // 月次集計機能を実行
    const result = aggregateMonthlySummaryByCustomerAndService({
      transactions: transactionData,
      reportMonth: "2024-01",
    });

    // 顧客別集計の検証
    expect(result.customerAggregation).toEqual([
      {
        customerId: "C001",
        customerName: "顧客A会社",
        totalSalesAmount: 250000, // 150,000 + 100,000
        totalTransactionCount: 5, // 3 + 2
        serviceCount: 2,
      },
      {
        customerId: "C002",
        customerName: "顧客B会社",
        totalSalesAmount: 250000, // 200,000 + 50,000
        totalTransactionCount: 5, // 4 + 1
        serviceCount: 2,
      },
      {
        customerId: "C003",
        customerName: "顧客C会社",
        totalSalesAmount: 550000, // 250,000 + 120,000 + 180,000
        totalTransactionCount: 10, // 5 + 2 + 3
        serviceCount: 3,
      },
    ]);

    // サービス別集計の検証
    expect(result.serviceAggregation).toEqual([
      {
        serviceId: "SVC-A",
        serviceName: "サービスA",
        totalSalesAmount: 400000, // 150,000 + 250,000
        totalTransactionCount: 8, // 3 + 5
        customerCount: 2,
      },
      {
        serviceId: "SVC-B",
        serviceName: "サービスB",
        totalSalesAmount: 420000, // 100,000 + 200,000 + 120,000
        totalTransactionCount: 8, // 2 + 4 + 2
        customerCount: 3,
      },
      {
        serviceId: "SVC-C",
        serviceName: "サービスC",
        totalSalesAmount: 230000, // 50,000 + 180,000
        totalTransactionCount: 4, // 1 + 3
        customerCount: 2,
      },
    ]);

    // 顧客・サービス交差集計テーブルの検証
    expect(result.crossTabulation).toEqual([
      {
        customerId: "C001",
        customerName: "顧客A会社",
        serviceId: "SVC-A",
        serviceName: "サービスA",
        salesAmount: 150000,
        transactionCount: 3,
      },
      {
        customerId: "C001",
        customerName: "顧客A会社",
        serviceId: "SVC-B",
        serviceName: "サービスB",
        salesAmount: 100000,
        transactionCount: 2,
      },
      {
        customerId: "C002",
        customerName: "顧客B会社",
        serviceId: "SVC-B",
        serviceName: "サービスB",
        salesAmount: 200000,
        transactionCount: 4,
      },
      {
        customerId: "C002",
        customerName: "顧客B会社",
        serviceId: "SVC-C",
        serviceName: "サービスC",
        salesAmount: 50000,
        transactionCount: 1,
      },
      {
        customerId: "C003",
        customerName: "顧客C会社",
        serviceId: "SVC-A",
        serviceName: "サービスA",
        salesAmount: 250000,
        transactionCount: 5,
      },
      {
        customerId: "C003",
        customerName: "顧客C会社",
        serviceId: "SVC-B",
        serviceName: "サービスB",
        salesAmount: 120000,
        transactionCount: 2,
      },
      {
        customerId: "C003",
        customerName: "顧客C会社",
        serviceId: "SVC-C",
        serviceName: "サービスC",
        salesAmount: 180000,
        transactionCount: 3,
      },
    ]);

    // 全体集計の検証（重複がないことの確認）
    const grandTotalSales = result.crossTabulation.reduce(
      (sum, row) => sum + row.salesAmount,
      0
    );
    const grandTotalTransactions = result.crossTabulation.reduce(
      (sum, row) => sum + row.transactionCount,
      0
    );

    expect(grandTotalSales).toBe(1050000); // 全売上合計
    expect(grandTotalTransactions).toBe(20); // 全取引件数合計

    // 顧客別集計の合計がグランドトータルと一致することを検証
    const customerTotalSales = result.customerAggregation.reduce(
      (sum, row) => sum + row.totalSalesAmount,
      0
    );
    expect(customerTotalSales).toBe(1050000);

    // サービス別集計の合計がグランドトータルと一致することを検証
    const serviceTotalSales = result.serviceAggregation.reduce(
      (sum, row) => sum + row.totalSalesAmount,
      0
    );
    expect(serviceTotalSales).toBe(1050000);

    // データ分離の正確性: 交差集計テーブルの行数が7行（3顧客×2〜3サービス）
    expect(result.crossTabulation.length).toBe(7);

    // レポート生成月の確認
    expect(result.reportMonth).toBe("2024-01");

    // 生成タイムスタンプが ISO 形式で存在することを検証
    expect(result.generatedAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // 重複検出の最終確認: 交差集計テーブルのユニークキー（customerId + serviceId）が重複していないことを検証
    const uniqueKeys = new Set(
      result.crossTabulation.map(
        (row) => `${row.customerId}#${row.serviceId}`
      )
    );
    expect(uniqueKeys.size).toBe(result.crossTabulation.length);
  });
});