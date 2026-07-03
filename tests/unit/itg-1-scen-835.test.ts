import { extractAndAggregateRevenue } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-835: [error] 契約納期変更自動通知機能 - 顧客企業の営業責任者メールアドレスが未登録の場合、メール送信が失敗し例外が発生する
  test("営業責任者メールアドレスが未登録の場合、契約納期変更通知は失敗し例外が発生する", () => {
    const input = {
      customerId: "CUST-001",
      customerName: "テスト顧客",
      responsiblePersonEmail: null,
      responsiblePersonName: "営業太郎",
      contractChangeDetails: {
        changeType: "納期変更",
        previousDeliveryDate: "2024-02-01",
        newDeliveryDate: "2024-02-15",
        reason: "顧客要望による変更"
      },
      salesData: [
        {
          serviceId: "SVC-A",
          serviceName: "コンサルティング",
          appointmentCount: 5,
          contractCount: 2,
          unitPrice: 50000,
          discountRate: 0.1
        }
      ]
    };

    expect(() => extractAndAggregateRevenue(input)).toThrow(/営業責任者のメールアドレス/);
  });
});