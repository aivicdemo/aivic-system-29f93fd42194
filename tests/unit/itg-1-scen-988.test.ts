import { extractAndAggregateChargeItems } from "../../src/logic/it-1-2-1";

describe("請求対象項目の自動抽出・集計機能", () => {
  // SCEN-988
  test("複数サービスを契約する顧客の請求額が二重計上されない", () => {
    // テストデータ: 複数サービス（ServiceA、ServiceB、ServiceC）を契約する顧客
    const customerId = "CUST-001";
    const billingPeriod = {
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    };

    const chargeItemsInput = [
      // ServiceA: 基本料金50,000円 + 税10% + 割引10% = 45,000円
      {
        customerId: "CUST-001",
        serviceId: "SVC-A",
        serviceName: "ServiceA",
        amount: 50000,
        taxRate: 0.1,
        discountRate: 0.1,
        occurrenceCount: 1,
      },
      // ServiceB: 基本料金30,000円 + 税10% + 割引5% = 31,350円
      {
        customerId: "CUST-001",
        serviceId: "SVC-B",
        serviceName: "ServiceB",
        amount: 30000,
        taxRate: 0.1,
        discountRate: 0.05,
        occurrenceCount: 1,
      },
      // ServiceC: 基本料金20,000円 + 税10% + 割引0% = 22,000円
      {
        customerId: "CUST-001",
        serviceId: "SVC-C",
        serviceName: "ServiceC",
        amount: 20000,
        taxRate: 0.1,
        discountRate: 0,
        occurrenceCount: 1,
      },
    ];

    // 実行: 請求対象項目の自動抽出・集計
    const result = extractAndAggregateChargeItems({
      customerId,
      billingPeriod,
      chargeItems: chargeItemsInput,
    });

    // 検証: 各サービスの請求額が個別に計上されているか
    expect(result.extractedItems).toHaveLength(3);

    // ServiceA の請求額検証
    const serviceAItem = result.extractedItems.find(
      (item: { serviceId: string }) => item.serviceId === "SVC-A"
    );
    expect(serviceAItem).toBeDefined();
    expect(serviceAItem.baseAmount).toBe(50000);
    expect(serviceAItem.taxAmount).toBe(5000); // 50000 * 10%
    expect(serviceAItem.discountAmount).toBe(5500); // (50000 + 5000) * 10%
    expect(serviceAItem.chargeAmount).toBe(49500); // 50000 + 5000 - 5500

    // ServiceB の請求額検証
    const serviceBItem = result.extractedItems.find(
      (item: { serviceId: string }) => item.serviceId === "SVC-B"
    );
    expect(serviceBItem).toBeDefined();
    expect(serviceBItem.baseAmount).toBe(30000);
    expect(serviceBItem.taxAmount).toBe(3000); // 30000 * 10%
    expect(serviceBItem.discountAmount).toBe(1650); // (30000 + 3000) * 5%
    expect(serviceBItem.chargeAmount).toBe(31350); // 30000 + 3000 - 1650

    // ServiceC の請求額検証
    const serviceCItem = result.extractedItems.find(
      (item: { serviceId: string }) => item.serviceId === "SVC-C"
    );
    expect(serviceCItem).toBeDefined();
    expect(serviceCItem.baseAmount).toBe(20000);
    expect(serviceCItem.taxAmount).toBe(2000); // 20000 * 10%
    expect(serviceCItem.discountAmount).toBe(0); // (20000 + 2000) * 0%
    expect(serviceCItem.chargeAmount).toBe(22000); // 20000 + 2000 - 0

    // 検証: 同一サービスの重複計上がないか
    const serviceACount = result.extractedItems.filter(
      (item: { serviceId: string }) => item.serviceId === "SVC-A"
    ).length;
    const serviceBCount = result.extractedItems.filter(
      (item: { serviceId: string }) => item.serviceId === "SVC-B"
    ).length;
    const serviceCCount = result.extractedItems.filter(
      (item: { serviceId: string }) => item.serviceId === "SVC-C"
    ).length;

    expect(serviceACount).toBe(1);
    expect(serviceBCount).toBe(1);
    expect(serviceCCount).toBe(1);

    // 検証: 複数サービスの請求額合計が正確に集計されているか
    const totalChargeAmount =
      result.extractedItems.reduce(
        (sum: number, item: { chargeAmount: number }) =>
          sum + item.chargeAmount,
        0
      ) || 0;
    const expectedTotalChargeAmount = 49500 + 31350 + 22000; // 102,850円

    expect(totalChargeAmount).toBe(expectedTotalChargeAmount);

    // 検証: 請求書の合計金額が二重計上されていないか
    expect(result.totalAmount).toBe(102850);
    expect(result.invoiceStatus).toBe("ready");
    expect(result.customerId).toBe("CUST-001");

    // 検証: 複数サービスのサマリーが正確か
    expect(result.summary).toBeDefined();
    expect(result.summary.serviceCount).toBe(3);
    expect(result.summary.totalBaseAmount).toBe(100000); // 50000 + 30000 + 20000
    expect(result.summary.totalTaxAmount).toBe(10000); // 5000 + 3000 + 2000
    expect(result.summary.totalDiscountAmount).toBe(7150); // 5500 + 1650 + 0
  });
});