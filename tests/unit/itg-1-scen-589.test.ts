import { extractBillingItems } from "../../src/logic/it-1-2-1";

describe("請求対象項目の抽出と分類", () => {
  // SCEN-589
  test("品質検証を通過した営業データが顧客ごと・サービスごとに正確に分類され請求額計算用の入力データとして確定される", () => {
    // テストデータ: 品質検証を通過した営業データ（複数顧客、複数サービス種別）
    const validatedSalesData = [
      {
        salesDataId: "SD001",
        customerId: "CUST001",
        serviceType: "basic",
        appointmentCount: 10,
        contractAmount: 50000,
        unitPrice: 5000,
        quantity: 10,
        applicationPeriodStart: "2024-01-01",
        applicationPeriodEnd: "2024-01-31",
        status: "validated",
      },
      {
        salesDataId: "SD002",
        customerId: "CUST001",
        serviceType: "option",
        appointmentCount: 3,
        contractAmount: 15000,
        unitPrice: 5000,
        quantity: 3,
        applicationPeriodStart: "2024-01-01",
        applicationPeriodEnd: "2024-01-31",
        status: "validated",
      },
      {
        salesDataId: "SD003",
        customerId: "CUST002",
        serviceType: "basic",
        appointmentCount: 8,
        contractAmount: 40000,
        unitPrice: 5000,
        quantity: 8,
        applicationPeriodStart: "2024-01-01",
        applicationPeriodEnd: "2024-01-31",
        status: "validated",
      },
      {
        salesDataId: "SD004",
        customerId: "CUST002",
        serviceType: "addon",
        appointmentCount: 2,
        contractAmount: 10000,
        unitPrice: 5000,
        quantity: 2,
        applicationPeriodStart: "2024-01-01",
        applicationPeriodEnd: "2024-01-31",
        status: "validated",
      },
    ];

    // 請求対象項目抽出モジュールに入力
    const result = extractBillingItems(validatedSalesData);

    // 顧客IDごとにデータが分類されていることを確認
    expect(result.classifiedByCustomer).toHaveProperty("CUST001");
    expect(result.classifiedByCustomer).toHaveProperty("CUST002");
    expect(Object.keys(result.classifiedByCustomer)).toEqual([
      "CUST001",
      "CUST002",
    ]);

    // 顧客CUST001のデータ確認
    expect(result.classifiedByCustomer.CUST001).toHaveLength(2);
    expect(result.classifiedByCustomer.CUST001[0].serviceType).toBe("basic");
    expect(result.classifiedByCustomer.CUST001[1].serviceType).toBe("option");

    // 顧客CUST002のデータ確認
    expect(result.classifiedByCustomer.CUST002).toHaveLength(2);
    expect(result.classifiedByCustomer.CUST002[0].serviceType).toBe("basic");
    expect(result.classifiedByCustomer.CUST002[1].serviceType).toBe("addon");

    // 各顧客内でサービス種別ごとにデータが分類されていることを確認
    expect(result.classifiedByService).toHaveProperty("CUST001");
    expect(result.classifiedByService.CUST001).toHaveProperty("basic");
    expect(result.classifiedByService.CUST001).toHaveProperty("option");
    expect(result.classifiedByService.CUST002).toHaveProperty("basic");
    expect(result.classifiedByService.CUST002).toHaveProperty("addon");

    // CUST001のbasicサービス確認
    expect(result.classifiedByService.CUST001.basic).toHaveLength(1);
    expect(result.classifiedByService.CUST001.basic[0].salesDataId).toBe(
      "SD001"
    );

    // CUST001のoptionサービス確認
    expect(result.classifiedByService.CUST001.option).toHaveLength(1);
    expect(result.classifiedByService.CUST001.option[0].salesDataId).toBe(
      "SD002"
    );

    // 分類されたデータの請求額計算に必要な項目が漏れなく含まれていることを確認
    const cust001BasicItem = result.classifiedByCustomer.CUST001.find(
      (item: { serviceType: string }) => item.serviceType === "basic"
    );
    expect(cust001BasicItem).toHaveProperty("unitPrice");
    expect(cust001BasicItem).toHaveProperty("quantity");
    expect(cust001BasicItem).toHaveProperty("applicationPeriodStart");
    expect(cust001BasicItem).toHaveProperty("applicationPeriodEnd");
    expect(cust001BasicItem.unitPrice).toBe(5000);
    expect(cust001BasicItem.quantity).toBe(10);

    // 分類結果が請求額計算モジュールの入力データ形式に適合していることを確認
    expect(result.schema).toEqual({
      customerId: "string",
      salesDataId: "string",
      serviceType: "string",
      unitPrice: "number",
      quantity: "number",
      applicationPeriodStart: "string",
      applicationPeriodEnd: "string",
      contractAmount: "number",
    });

    // 各アイテムがスキーマに適合していることを確認
    result.classifiedByCustomer.CUST001.forEach(
      (item: { [key: string]: unknown }) => {
        expect(typeof item.customerId).toBe("string");
        expect(typeof item.salesDataId).toBe("string");
        expect(typeof item.serviceType).toBe("string");
        expect(typeof item.unitPrice).toBe("number");
        expect(typeof item.quantity).toBe("number");
        expect(typeof item.applicationPeriodStart).toBe("string");
        expect(typeof item.applicationPeriodEnd).toBe("string");
        expect(typeof item.contractAmount).toBe("number");
      }
    );

    // 同一顧客・同一サービスの重複データが存在しないことを確認
    const duplicationCheck = new Map<string, number>();
    Object.entries(result.classifiedByService).forEach(([customerId, services]) => {
      Object.entries(services as Record<string, unknown[]>).forEach(([serviceType, items]) => {
        const key = `${customerId}-${serviceType}`;
        const count = (items as unknown[]).length;
        if (duplicationCheck.has(key)) {
          const existingCount = duplicationCheck.get(key)!;
          expect(count).toBe(existingCount);
        }
        duplicationCheck.set(key, count);
      });
    });

    // 検証済みデータのみが含まれていることを確認
    result.classifiedByCustomer.CUST001.forEach(
      (item: { status?: string }) => {
        expect(item.status).toBe("validated");
      }
    );

    // 分類完了ステータスが正常に更新されていることを確認
    expect(result.status).toBe("classified");
    expect(result.totalRecordsProcessed).toBe(4);
    expect(result.totalCustomers).toBe(2);
    expect(result.totalServices).toBe(4);

    // 請求額計算に必要な集計情報が生成されていることを確認
    expect(result.billingInputForCUST001).toEqual({
      customerId: "CUST001",
      totalBillingAmount: 65000,
      serviceBreakdown: [
        {
          serviceType: "basic",
          amount: 50000,
          quantity: 10,
          unitPrice: 5000,
        },
        {
          serviceType: "option",
          amount: 15000,
          quantity: 3,
          unitPrice: 5000,
        },
      ],
    });

    expect(result.billingInputForCUST002).toEqual({
      customerId: "CUST002",
      totalBillingAmount: 50000,
      serviceBreakdown: [
        {
          serviceType: "basic",
          amount: 40000,
          quantity: 8,
          unitPrice: 5000,
        },
        {
          serviceType: "addon",
          amount: 10000,
          quantity: 2,
          unitPrice: 5000,
        },
      ],
    });

    // 分類結果が請求額計算入力フォーマットに適合していることを確認
    expect(Array.isArray(result.billingItems)).toBe(true);
    expect(result.billingItems).toHaveLength(4);
    result.billingItems.forEach(
      (item: {
        customerId: string;
        serviceType: string;
        calculableAmount: number;
      }) => {
        expect(item).toHaveProperty("customerId");
        expect(item).toHaveProperty("serviceType");
        expect(item).toHaveProperty("calculableAmount");
        expect(typeof item.calculableAmount).toBe("number");
        expect(item.calculableAmount).toBeGreaterThan(0);
      }
    );
  });
});