import { calculateContractBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-963: 割引額がゼロの契約で基本料金のみが請求額として計算される", () => {
    // 準備: 割引額が0円に設定された契約情報
    const contract = {
      contractId: "CTR-2024-001",
      customerId: "CUST-A001",
      serviceId: "SVC-SALES-01",
      baseFeeAmount: 100000,
      discountAmount: 0,
      discountRate: 0,
      minimumBillingAmount: 0,
      maximumBillingAmount: 999999999,
      effectiveStartDate: "2024-01-01",
      effectiveEndDate: "2024-12-31",
    };

    // 実行: 契約別請求額計算機能に契約情報を入力
    const result = calculateContractBillingAmount(contract);

    // 検証: 割引額がゼロの契約において、基本料金のみが請求額として計算される
    expect(result).toEqual({
      contractId: "CTR-2024-001",
      customerId: "CUST-A001",
      serviceId: "SVC-SALES-01",
      baseFeeAmount: 100000,
      discountAmount: 0,
      discountedAmount: 100000,
      finalBillingAmount: 100000,
      calculatedAt: expect.any(String),
    });

    // 検証: 請求額が100,000円と等しい
    expect(result.finalBillingAmount).toBe(100000);
  });
});