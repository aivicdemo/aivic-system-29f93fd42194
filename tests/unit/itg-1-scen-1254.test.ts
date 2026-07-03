import { extractAndAggregateChargeItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1254: [edge] 請求対象項目の自動抽出・集計機能 - 顧客またはサービスが複数登録されている場合、すべての組み合わせで正確に集計される
  test("複数の顧客と複数のサービスの組み合わせが正確に抽出・集計される", () => {
    const testData = {
      customers: [
        { customerId: "CUST_A", customerName: "顧客A", status: "active" },
        { customerId: "CUST_B", customerName: "顧客B", status: "active" },
        { customerId: "CUST_C", customerName: "顧客C", status: "active" },
      ],
      services: [
        { serviceId: "SRV_1", serviceName: "サービス1", status: "active" },
        { serviceId: "SRV_2", serviceName: "サービス2", status: "active" },
        { serviceId: "SRV_3", serviceName: "サービス3", status: "active" },
      ],
      chargeItems: [
        {
          customerId: "CUST_A",
          serviceId: "SRV_1",
          amount: 100000,
          quantity: 10,
          feeRate: 0.1,
          status: "active",
        },
        {
          customerId: "CUST_A",
          serviceId: "SRV_2",
          amount: 150000,
          quantity: 15,
          feeRate: 0.1,
          status: "active",
        },
        {
          customerId: "CUST_A",
          serviceId: "SRV_3",
          amount: 80000,
          quantity: 8,
          feeRate: 0.1,
          status: "active",
        },
        {
          customerId: "CUST_B",
          serviceId: "SRV_1",
          amount: 120000,
          quantity: 12,
          feeRate: 0.1,
          status: "active",
        },
        {
          customerId: "CUST_B",
          serviceId: "SRV_2",
          amount: 200000,
          quantity: 20,
          feeRate: 0.1,
          status: "active",
        },
        {
          customerId: "CUST_B",
          serviceId: "SRV_3",
          amount: 90000,
          quantity: 9,
          feeRate: 0.1,
          status: "active",
        },
        {
          customerId: "CUST_C",
          serviceId: "SRV_1",
          amount: 110000,
          quantity: 11,
          feeRate: 0.1,
          status: "active",
        },
        {
          customerId: "CUST_C",
          serviceId: "SRV_2",
          amount: 170000,
          quantity: 17,
          feeRate: 0.1,
          status: "active",
        },
        {
          customerId: "CUST_C",
          serviceId: "SRV_3",
          amount: 95000,
          quantity: 9,
          feeRate: 0.12,
          status: "active",
        },
        {
          customerId: "CUST_A",
          serviceId: "SRV_1",
          amount: 50000,
          quantity: 5,
          feeRate: 0.1,
          status: "deleted",
        },
      ],
    };

    const result = extractAndAggregateChargeItems(testData);

    expect(result.combinations.length).toBe(9);

    const combinationMap = new Map(
      result.combinations.map((combo) => [
        `${combo.customerId}_${combo.serviceId}`,
        combo,
      ])
    );

    expect(combinationMap.has("CUST_A_SRV_1")).toBe(true);
    expect(combinationMap.get("CUST_A_SRV_1")).toEqual({
      customerId: "CUST_A",
      serviceId: "SRV_1",
      totalAmount: 100000,
      totalQuantity: 10,
      totalFee: 10000,
      chargeItemCount: 1,
    });

    expect(combinationMap.has("CUST_A_SRV_2")).toBe(true);
    expect(combinationMap.get("CUST_A_SRV_2")).toEqual({
      customerId: "CUST_A",
      serviceId: "SRV_2",
      totalAmount: 150000,
      totalQuantity: 15,
      totalFee: 15000,
      chargeItemCount: 1,
    });

    expect(combinationMap.has("CUST_A_SRV_3")).toBe(true);
    expect(combinationMap.get("CUST_A_SRV_3")).toEqual({
      customerId: "CUST_A",
      serviceId: "SRV_3",
      totalAmount: 80000,
      totalQuantity: 8,
      totalFee: 8000,
      chargeItemCount: 1,
    });

    expect(combinationMap.has("CUST_B_SRV_1")).toBe(true);
    expect(combinationMap.get("CUST_B_SRV_1")).toEqual({
      customerId: "CUST_B",
      serviceId: "SRV_1",
      totalAmount: 120000,
      totalQuantity: 12,
      totalFee: 12000,
      chargeItemCount: 1,
    });

    expect(combinationMap.has("CUST_B_SRV_2")).toBe(true);
    expect(combinationMap.get("CUST_B_SRV_2")).toEqual({
      customerId: "CUST_B",
      serviceId: "SRV_2",
      totalAmount: 200000,
      totalQuantity: 20,
      totalFee: 20000,
      chargeItemCount: 1,
    });

    expect(combinationMap.has("CUST_B_SRV_3")).toBe(true);
    expect(combinationMap.get("CUST_B_SRV_3")).toEqual({
      customerId: "CUST_B",
      serviceId: "SRV_3",
      totalAmount: 90000,
      totalQuantity: 9,
      totalFee: 9000,
      chargeItemCount: 1,
    });

    expect(combinationMap.has("CUST_C_SRV_1")).toBe(true);
    expect(combinationMap.get("CUST_C_SRV_1")).toEqual({
      customerId: "CUST_C",
      serviceId: "SRV_1",
      totalAmount: 110000,
      totalQuantity: 11,
      totalFee: 11000,
      chargeItemCount: 1,
    });

    expect(combinationMap.has("CUST_C_SRV_2")).toBe(true);
    expect(combinationMap.get("CUST_C_SRV_2")).toEqual({
      customerId: "CUST_C",
      serviceId: "SRV_2",
      totalAmount: 170000,
      totalQuantity: 17,
      totalFee: 17000,
      chargeItemCount: 1,
    });

    expect(combinationMap.has("CUST_C_SRV_3")).toBe(true);
    expect(combinationMap.get("CUST_C_SRV_3")).toEqual({
      customerId: "CUST_C",
      serviceId: "SRV_3",
      totalAmount: 95000,
      totalQuantity: 9,
      totalFee: 11400,
      chargeItemCount: 1,
    });

    const duplicateCheck = new Set(
      result.combinations.map((combo) => `${combo.customerId}_${combo.serviceId}`)
    );
    expect(duplicateCheck.size).toBe(9);

    const expectedTotalAmount =
      100000 +
      150000 +
      80000 +
      120000 +
      200000 +
      90000 +
      110000 +
      170000 +
      95000;
    const actualTotalAmount = result.combinations.reduce(
      (sum, combo) => sum + combo.totalAmount,
      0
    );
    expect(actualTotalAmount).toBe(expectedTotalAmount);

    const expectedTotalQuantity = 10 + 15 + 8 + 12 + 20 + 9 + 11 + 17 + 9;
    const actualTotalQuantity = result.combinations.reduce(
      (sum, combo) => sum + combo.totalQuantity,
      0
    );
    expect(actualTotalQuantity).toBe(expectedTotalQuantity);

    const expectedTotalFee =
      10000 + 15000 + 8000 + 12000 + 20000 + 9000 + 11000 + 17000 + 11400;
    const actualTotalFee = result.combinations.reduce(
      (sum, combo) => sum + combo.totalFee,
      0
    );
    expect(actualTotalFee).toBe(expectedTotalFee);

    expect(result.summary).toEqual({
      totalCombinationCount: 9,
      totalAmount: expectedTotalAmount,
      totalQuantity: expectedTotalQuantity,
      totalFee: expectedTotalFee,
      excludedItemCount: 1,
    });
  });
});