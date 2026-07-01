import { calculateBillingAmountByCustomerAndService } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-592: 請求額の計算と検証 - 契約書に定義された単価と数量から、顧客ごと・サービスごとの請求額が正確に計算される", () => {
    // テストデータ: 複数顧客・複数サービスの契約データを準備
    const contractData = [
      {
        customerId: "CUST001",
        customerName: "顧客A",
        contracts: [
          {
            serviceId: "SVC001",
            serviceName: "サービス1",
            unitPrice: 10000,
            quantity: 5,
          },
          {
            serviceId: "SVC002",
            serviceName: "サービス2",
            unitPrice: 15000,
            quantity: 3,
          },
        ],
      },
      {
        customerId: "CUST002",
        customerName: "顧客B",
        contracts: [
          {
            serviceId: "SVC001",
            serviceName: "サービス1",
            unitPrice: 12000,
            quantity: 4,
          },
          {
            serviceId: "SVC002",
            serviceName: "サービス2",
            unitPrice: 8000,
            quantity: 6,
          },
        ],
      },
    ];

    // 請求額計算ロジックを実行
    const result = calculateBillingAmountByCustomerAndService(contractData);

    // 顧客Aのサービス1の請求額を検証: 10000 × 5 = 50000
    expect(result.customerBillings[0].serviceBillings[0].billingAmount).toBe(
      50000
    );

    // 顧客Aのサービス2の請求額を検証: 15000 × 3 = 45000
    expect(result.customerBillings[0].serviceBillings[1].billingAmount).toBe(
      45000
    );

    // 顧客Bのサービス1の請求額を検証: 12000 × 4 = 48000
    expect(result.customerBillings[1].serviceBillings[0].billingAmount).toBe(
      48000
    );

    // 顧客Bのサービス2の請求額を検証: 8000 × 6 = 48000
    expect(result.customerBillings[1].serviceBillings[1].billingAmount).toBe(
      48000
    );

    // 顧客Aの合計請求額を検証: 50000 + 45000 = 95000
    expect(result.customerBillings[0].totalBillingAmount).toBe(95000);

    // 顧客Bの合計請求額を検証: 48000 + 48000 = 96000
    expect(result.customerBillings[1].totalBillingAmount).toBe(96000);

    // 全体の合計請求額を検証: 95000 + 96000 = 191000
    expect(result.grandTotalBillingAmount).toBe(191000);

    // レスポンスの構造を検証
    expect(result.customerBillings).toHaveLength(2);
    expect(result.customerBillings[0].customerId).toBe("CUST001");
    expect(result.customerBillings[0].customerName).toBe("顧客A");
    expect(result.customerBillings[0].serviceBillings).toHaveLength(2);

    expect(result.customerBillings[1].customerId).toBe("CUST002");
    expect(result.customerBillings[1].customerName).toBe("顧客B");
    expect(result.customerBillings[1].serviceBillings).toHaveLength(2);

    // サービス別の明細を検証
    expect(result.customerBillings[0].serviceBillings[0].serviceId).toBe(
      "SVC001"
    );
    expect(result.customerBillings[0].serviceBillings[0].serviceName).toBe(
      "サービス1"
    );
    expect(result.customerBillings[0].serviceBillings[0].unitPrice).toBe(10000);
    expect(result.customerBillings[0].serviceBillings[0].quantity).toBe(5);

    expect(result.customerBillings[0].serviceBillings[1].serviceId).toBe(
      "SVC002"
    );
    expect(result.customerBillings[0].serviceBillings[1].serviceName).toBe(
      "サービス2"
    );
    expect(result.customerBillings[0].serviceBillings[1].unitPrice).toBe(15000);
    expect(result.customerBillings[0].serviceBillings[1].quantity).toBe(3);

    expect(result.customerBillings[1].serviceBillings[0].serviceId).toBe(
      "SVC001"
    );
    expect(result.customerBillings[1].serviceBillings[0].serviceName).toBe(
      "サービス1"
    );
    expect(result.customerBillings[1].serviceBillings[0].unitPrice).toBe(12000);
    expect(result.customerBillings[1].serviceBillings[0].quantity).toBe(4);

    expect(result.customerBillings[1].serviceBillings[1].serviceId).toBe(
      "SVC002"
    );
    expect(result.customerBillings[1].serviceBillings[1].serviceName).toBe(
      "サービス2"
    );
    expect(result.customerBillings[1].serviceBillings[1].unitPrice).toBe(8000);
    expect(result.customerBillings[1].serviceBillings[1].quantity).toBe(6);
  });
});