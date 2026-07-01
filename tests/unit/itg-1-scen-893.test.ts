import { extractBillingRulesAndDiscounts } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-893: [normal] 適用請求ルール・割引基準の明確化
  test("月次締め業務で顧客ごと・サービスごとに適用される請求ルールと割引基準が正確に抽出される", () => {
    // Arrange
    const customers = [
      {
        customerId: "CUST_A",
        customerName: "顧客A",
        contractStatus: "active",
      },
      {
        customerId: "CUST_B",
        customerName: "顧客B",
        contractStatus: "active",
      },
      {
        customerId: "CUST_C",
        customerName: "顧客C",
        contractStatus: "active",
      },
    ];

    const services = [
      { serviceId: "SVC_1", serviceName: "サービス1" },
      { serviceId: "SVC_2", serviceName: "サービス2" },
      { serviceId: "SVC_3", serviceName: "サービス3" },
    ];

    const billingRules = [
      {
        customerId: "CUST_A",
        serviceId: "SVC_1",
        basePrice: 100000,
        discountRate: 0.1,
        discountReason: "volume_discount",
        minBillingAmount: 50000,
        maxBillingAmount: 500000,
      },
      {
        customerId: "CUST_B",
        serviceId: "SVC_2",
        basePrice: 80000,
        discountRate: 0.05,
        discountReason: "early_payment",
        minBillingAmount: 40000,
        maxBillingAmount: 400000,
      },
      {
        customerId: "CUST_C",
        serviceId: "SVC_3",
        basePrice: 150000,
        discountRate: 0.0,
        discountReason: "none",
        minBillingAmount: 75000,
        maxBillingAmount: 750000,
      },
      {
        customerId: "CUST_A",
        serviceId: "SVC_2",
        basePrice: 120000,
        discountRate: 0.08,
        discountReason: "promotional",
        minBillingAmount: 60000,
        maxBillingAmount: 600000,
      },
      {
        customerId: "CUST_B",
        serviceId: "SVC_1",
        basePrice: 90000,
        discountRate: 0.03,
        discountReason: "contract_renewal",
        minBillingAmount: 45000,
        maxBillingAmount: 450000,
      },
    ];

    const billingCycleStartDate = new Date("2024-01-01T00:00:00Z");
    const billingCycleEndDate = new Date("2024-01-31T23:59:59Z");

    // Act
    const result = extractBillingRulesAndDiscounts({
      customers,
      services,
      billingRules,
      billingCycleStartDate,
      billingCycleEndDate,
    });

    // Assert: 抽出結果の構造検証
    expect(result).toHaveProperty("extractedRulesCount");
    expect(result).toHaveProperty("customerServiceCombinations");
    expect(result).toHaveProperty("uniqueCustomers");
    expect(result).toHaveProperty("uniqueServices");
    expect(result).toHaveProperty("totalCombinations");

    // Assert: 抽出件数検証
    expect(result.extractedRulesCount).toBe(5);
    expect(result.totalCombinations).toBe(5);

    // Assert: 顧客ごとの請求ルール抽出検証
    expect(result.uniqueCustomers).toEqual(
      expect.arrayContaining(["CUST_A", "CUST_B", "CUST_C"])
    );
    expect(result.uniqueCustomers.length).toBe(3);

    // Assert: サービスごとの請求ルール抽出検証
    expect(result.uniqueServices).toEqual(
      expect.arrayContaining(["SVC_1", "SVC_2", "SVC_3"])
    );
    expect(result.uniqueServices.length).toBe(3);

    // Assert: 顧客・サービス組み合わせの検証
    expect(result.customerServiceCombinations).toHaveProperty("CUST_A");
    expect(result.customerServiceCombinations["CUST_A"]).toHaveProperty("SVC_1");
    expect(result.customerServiceCombinations["CUST_A"]).toHaveProperty("SVC_2");

    expect(result.customerServiceCombinations).toHaveProperty("CUST_B");
    expect(result.customerServiceCombinations["CUST_B"]).toHaveProperty("SVC_2");
    expect(result.customerServiceCombinations["CUST_B"]).toHaveProperty("SVC_1");

    expect(result.customerServiceCombinations).toHaveProperty("CUST_C");
    expect(result.customerServiceCombinations["CUST_C"]).toHaveProperty("SVC_3");

    // Assert: 顧客A・サービス1の請求ルールと割引基準
    const custA_svc1 = result.customerServiceCombinations["CUST_A"]["SVC_1"];
    expect(custA_svc1.basePrice).toBe(100000);
    expect(custA_svc1.discountRate).toBe(0.1);
    expect(custA_svc1.discountReason).toBe("volume_discount");
    expect(custA_svc1.minBillingAmount).toBe(50000);
    expect(custA_svc1.maxBillingAmount).toBe(500000);

    // Assert: 顧客A・サービス2の請求ルールと割引基準
    const custA_svc2 = result.customerServiceCombinations["CUST_A"]["SVC_2"];
    expect(custA_svc2.basePrice).toBe(120000);
    expect(custA_svc2.discountRate).toBe(0.08);
    expect(custA_svc2.discountReason).toBe("promotional");
    expect(custA_svc2.minBillingAmount).toBe(60000);
    expect(custA_svc2.maxBillingAmount).toBe(600000);

    // Assert: 顧客B・サービス2の請求ルールと割引基準
    const custB_svc2 = result.customerServiceCombinations["CUST_B"]["SVC_2"];
    expect(custB_svc2.basePrice).toBe(80000);
    expect(custB_svc2.discountRate).toBe(0.05);
    expect(custB_svc2.discountReason).toBe("early_payment");
    expect(custB_svc2.minBillingAmount).toBe(40000);
    expect(custB_svc2.maxBillingAmount).toBe(400000);

    // Assert: 顧客B・サービス1の請求ルールと割引基準
    const custB_svc1 = result.customerServiceCombinations["CUST_B"]["SVC_1"];
    expect(custB_svc1.basePrice).toBe(90000);
    expect(custB_svc1.discountRate).toBe(0.03);
    expect(custB_svc1.discountReason).toBe("contract_renewal");
    expect(custB_svc1.minBillingAmount).toBe(45000);
    expect(custB_svc1.maxBillingAmount).toBe(450000);

    // Assert: 顧客C・サービス3の請求ルールと割引基準
    const custC_svc3 = result.customerServiceCombinations["CUST_C"]["SVC_3"];
    expect(custC_svc3.basePrice).toBe(150000);
    expect(custC_svc3.discountRate).toBe(0.0);
    expect(custC_svc3.discountReason).toBe("none");
    expect(custC_svc3.minBillingAmount).toBe(75000);
    expect(custC_svc3.maxBillingAmount).toBe(750000);

    // Assert: 複数顧客間で請求ルールと割引基準が正しく分離されていることを確認
    expect(custA_svc1.discountRate).not.toBe(custB_svc2.discountRate);
    expect(custA_svc1.basePrice).not.toBe(custB_svc2.basePrice);

    // Assert: 同一顧客の異なるサービス間で請求ルールと割引基準が正しく適用されていることを確認
    expect(custA_svc1.discountRate).not.toBe(custA_svc2.discountRate);
    expect(custA_svc1.basePrice).not.toBe(custA_svc2.basePrice);

    // Assert: 重複なし、漏れなしの検証
    const allCombinations = [];
    for (const customerId in result.customerServiceCombinations) {
      for (const serviceId in result.customerServiceCombinations[customerId]) {
        allCombinations.push(`${customerId}-${serviceId}`);
      }
    }
    expect(allCombinations.length).toBe(5);
    expect(new Set(allCombinations).size).toBe(5);

    // Assert: 月次締め日時検証
    expect(result).toHaveProperty("billingCycleStartDate");
    expect(result).toHaveProperty("billingCycleEndDate");
    expect(result.billingCycleStartDate).toEqual(billingCycleStartDate);
    expect(result.billingCycleEndDate).toEqual(billingCycleEndDate);
  });
});