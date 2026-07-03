import {
  extractAndClassifyBillingItems,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-597: 品質検証済み営業データから顧客ごと・サービスごとに請求対象項目が正確に分類される", () => {
    // テストデータ: 品質検証済みの営業データ（複数顧客、複数サービス）
    const qualityVerifiedSalesData = [
      {
        id: "sales_001",
        customer_id: "cust_A",
        service_type: "service_1",
        appointment_count: 5,
        contract_amount: 50000,
        is_billable: true,
        verification_status: "passed",
      },
      {
        id: "sales_002",
        customer_id: "cust_A",
        service_type: "service_2",
        appointment_count: 3,
        contract_amount: 30000,
        is_billable: true,
        verification_status: "passed",
      },
      {
        id: "sales_003",
        customer_id: "cust_B",
        service_type: "service_1",
        appointment_count: 7,
        contract_amount: 70000,
        is_billable: true,
        verification_status: "passed",
      },
      {
        id: "sales_004",
        customer_id: "cust_B",
        service_type: "service_2",
        appointment_count: 2,
        contract_amount: 20000,
        is_billable: true,
        verification_status: "passed",
      },
    ];

    // 請求対象項目抽出・分類機能を起動
    const result = extractAndClassifyBillingItems(qualityVerifiedSalesData);

    // 顧客ごとのグループ化が正確であることを検証
    expect(result.by_customer).toBeDefined();
    expect(Object.keys(result.by_customer)).toEqual(
      expect.arrayContaining(["cust_A", "cust_B"])
    );
    expect(Object.keys(result.by_customer).length).toBe(2);

    // 顧客A（cust_A）のグループ内容を検証
    const customer_a_items = result.by_customer["cust_A"];
    expect(customer_a_items).toBeDefined();
    expect(customer_a_items.length).toBe(2);
    expect(customer_a_items.map((item: any) => item.id)).toEqual(
      expect.arrayContaining(["sales_001", "sales_002"])
    );

    // 顧客B（cust_B）のグループ内容を検証
    const customer_b_items = result.by_customer["cust_B"];
    expect(customer_b_items).toBeDefined();
    expect(customer_b_items.length).toBe(2);
    expect(customer_b_items.map((item: any) => item.id)).toEqual(
      expect.arrayContaining(["sales_003", "sales_004"])
    );

    // サービスごとのグループ化が正確であることを検証
    expect(result.by_service).toBeDefined();
    expect(Object.keys(result.by_service)).toEqual(
      expect.arrayContaining(["service_1", "service_2"])
    );
    expect(Object.keys(result.by_service).length).toBe(2);

    // サービス1（service_1）のグループ内容を検証
    const service_1_items = result.by_service["service_1"];
    expect(service_1_items).toBeDefined();
    expect(service_1_items.length).toBe(2);
    expect(service_1_items.map((item: any) => item.id)).toEqual(
      expect.arrayContaining(["sales_001", "sales_003"])
    );

    // サービス2（service_2）のグループ内容を検証
    const service_2_items = result.by_service["service_2"];
    expect(service_2_items).toBeDefined();
    expect(service_2_items.length).toBe(2);
    expect(service_2_items.map((item: any) => item.id)).toEqual(
      expect.arrayContaining(["sales_002", "sales_004"])
    );

    // グループ内のすべての項目が請求対象条件を満たしていることを確認
    const all_grouped_items = [
      ...customer_a_items,
      ...customer_b_items,
    ];
    all_grouped_items.forEach((item: any) => {
      expect(item.is_billable).toBe(true);
      expect(item.verification_status).toBe("passed");
    });

    // 顧客別・サービス別の統計情報を検証
    expect(result.summary).toBeDefined();
    expect(result.summary.total_items_processed).toBe(4);
    expect(result.summary.total_billable_items).toBe(4);
    expect(result.summary.customer_count).toBe(2);
    expect(result.summary.service_count).toBe(2);

    // 顧客別の集計額を検証
    expect(result.summary.by_customer_total).toBeDefined();
    expect(result.summary.by_customer_total["cust_A"]).toBe(80000);
    expect(result.summary.by_customer_total["cust_B"]).toBe(90000);

    // サービス別の集計額を検証
    expect(result.summary.by_service_total).toBeDefined();
    expect(result.summary.by_service_total["service_1"]).toBe(120000);
    expect(result.summary.by_service_total["service_2"]).toBe(50000);

    // グループ間に漏れと重複がないことを確認
    const all_by_customer_ids = all_grouped_items.map((item: any) => item.id);
    const all_by_service_ids = [
      ...service_1_items.map((item: any) => item.id),
      ...service_2_items.map((item: any) => item.id),
    ];
    expect(new Set(all_by_customer_ids).size).toBe(4);
    expect(new Set(all_by_service_ids).size).toBe(4);

    // 分類済みデータの構造が正しいことを検証
    expect(result.by_customer).toHaveProperty("cust_A");
    expect(result.by_customer).toHaveProperty("cust_B");
    expect(result.by_service).toHaveProperty("service_1");
    expect(result.by_service).toHaveProperty("service_2");

    // 各項目の必須フィールドが存在することを確認
    customer_a_items.forEach((item: any) => {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("customer_id");
      expect(item).toHaveProperty("service_type");
      expect(item).toHaveProperty("appointment_count");
      expect(item).toHaveProperty("contract_amount");
      expect(item).toHaveProperty("is_billable");
      expect(item).toHaveProperty("verification_status");
    });

    // 処理結果全体の構造を最終確認
    expect(result).toHaveProperty("by_customer");
    expect(result).toHaveProperty("by_service");
    expect(result).toHaveProperty("summary");
    expect(typeof result.by_customer).toBe("object");
    expect(typeof result.by_service).toBe("object");
    expect(typeof result.summary).toBe("object");
  });
});