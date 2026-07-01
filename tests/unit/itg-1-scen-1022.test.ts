import { extractAndAggregateInvoiceItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し顧客ごと・サービスごとに集計", () => {
  // SCEN-1022
  test("不正なデータ型の営業データが入力されたときにエラーが返却される", () => {
    const invalidSalesData = [
      {
        customerId: "CUST001",
        serviceName: "Service A",
        appointmentCount: "ABC",
        closedDealCount: 5,
        customerReaction: "positive",
        saleAmount: 50000,
        transactionDate: "2024-01-15",
      },
      {
        customerId: "CUST002",
        serviceName: "Service B",
        appointmentCount: 10,
        closedDealCount: 3,
        customerReaction: "neutral",
        saleAmount: "invalid_amount",
        transactionDate: "2024-13-45",
      },
      {
        customerId: { nested: "object" },
        serviceName: "Service C",
        appointmentCount: 8,
        closedDealCount: 2,
        customerReaction: "negative",
        saleAmount: 30000,
        transactionDate: "2024-01-20",
      },
    ];

    expect(() =>
      extractAndAggregateInvoiceItems(invalidSalesData)
    ).toThrow(/データ型/);
  });
});