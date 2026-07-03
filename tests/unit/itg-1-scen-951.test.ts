import { calculateContractBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-951: [error] 契約ごとの請求額計算 - 割引額が請求額を超過する場合、エラーを返して計算を中止できる", () => {
    const contractData = {
      contractId: "C-20240115-001",
      customerId: "CUST-12345",
      serviceId: "SVC-BASIC",
      baseBillingAmount: 10000,
      discountAmount: 15000,
    };

    expect(() => calculateContractBillingAmount(contractData)).toThrow(
      /割引額が請求額を超過/
    );
  });
});