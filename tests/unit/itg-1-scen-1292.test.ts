import { calculateBillingAmount } from "../../src/logic/it-1-2-1";

describe("顧客ごと・サービスごとの請求額計算", () => {
  test("SCEN-1292: 必須データが不足している場合に計算が失敗し、エラーが通知される", () => {
    // 顧客ID欠落パターン
    expect(() =>
      calculateBillingAmount({
        customerId: undefined,
        serviceId: "SVC001",
        unitPrice: 10000,
        quantity: 5,
      })
    ).toThrow(/顧客ID/);

    // サービスID欠落パターン
    expect(() =>
      calculateBillingAmount({
        customerId: "CUST001",
        serviceId: undefined,
        unitPrice: 10000,
        quantity: 5,
      })
    ).toThrow(/サービスID/);

    // 単価欠落パターン
    expect(() =>
      calculateBillingAmount({
        customerId: "CUST001",
        serviceId: "SVC001",
        unitPrice: undefined,
        quantity: 5,
      })
    ).toThrow(/単価/);

    // 数量欠落パターン
    expect(() =>
      calculateBillingAmount({
        customerId: "CUST001",
        serviceId: "SVC001",
        unitPrice: 10000,
        quantity: undefined,
      })
    ).toThrow(/数量/);

    // 複数必須項目欠落パターン
    expect(() =>
      calculateBillingAmount({
        customerId: undefined,
        serviceId: undefined,
        unitPrice: 10000,
        quantity: 5,
      })
    ).toThrow(/顧客ID|サービスID/);

    // すべての必須項目がnullの場合
    expect(() =>
      calculateBillingAmount({
        customerId: null,
        serviceId: null,
        unitPrice: null,
        quantity: null,
      })
    ).toThrow(/必須/);

    // 正常なデータでの計算成功確認（顧客ごと・サービスごとの請求額 = 10000 * 5 = 50000）
    const result = calculateBillingAmount({
      customerId: "CUST001",
      serviceId: "SVC001",
      unitPrice: 10000,
      quantity: 5,
    });

    expect(result).toEqual({
      customerId: "CUST001",
      serviceId: "SVC001",
      billingAmount: 50000,
      unitPrice: 10000,
      quantity: 5,
    });
  });
});