import { extractBillableItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1253
  test("請求ルール定義が欠落している場合、抽出不可エラーを返して処理を中断する", () => {
    const sales_data = [
      {
        customer_id: "CUST001",
        service_id: "SVC001",
        appoint_count: 5,
        contract_count: 2,
        amount: 100000,
      },
    ];

    const billing_rules = [];

    const customer_info = {
      customer_id: "CUST001",
      customer_name: "TestCustomer",
      contract_id: "CONTRACT001",
    };

    expect(() =>
      extractBillableItems({
        sales_data,
        billing_rules,
        customer_info,
      })
    ).toThrow(/請求ルール定義/);
  });
});