import { extractAndClassifyBillingItems } from "../../src/logic/it-1-2-1";

describe("営業データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-598: [normal] 請求対象項目抽出・分類機能 - 複数顧客・複数サービスの営業データが正確に顧客別・サービス別に分類される
  test("複数顧客・複数サービスの営業データが顧客別・サービス別に正確に分類される", () => {
    const sales_data = [
      {
        sales_id: "sales_001",
        customer_id: "cust_001",
        service_type: "service_A",
        appointment_count: 5,
        contract_count: 2,
        amount: 100000,
        recorded_date: "2024-01-15",
      },
      {
        sales_id: "sales_002",
        customer_id: "cust_001",
        service_type: "service_B",
        appointment_count: 3,
        contract_count: 1,
        amount: 50000,
        recorded_date: "2024-01-16",
      },
      {
        sales_id: "sales_003",
        customer_id: "cust_002",
        service_type: "service_A",
        appointment_count: 4,
        contract_count: 1,
        amount: 80000,
        recorded_date: "2024-01-17",
      },
      {
        sales_id: "sales_004",
        customer_id: "cust_002",
        service_type: "service_C",
        appointment_count: 6,
        contract_count: 3,
        amount: 120000,
        recorded_date: "2024-01-18",
      },
      {
        sales_id: "sales_005",
        customer_id: "cust_003",
        service_type: "service_B",
        appointment_count: 2,
        contract_count: 1,
        amount: 40000,
        recorded_date: "2024-01-19",
      },
      {
        sales_id: "sales_006",
        customer_id: "cust_003",
        service_type: "service_A",
        appointment_count: 7,
        contract_count: 2,
        amount: 110000,
        recorded_date: "2024-01-20",
      },
    ];

    const result = extractAndClassifyBillingItems(sales_data);

    // 顧客ごとのグループ化検証
    expect(result.by_customer).toBeDefined();
    expect(Object.keys(result.by_customer)).toEqual(
      expect.arrayContaining(["cust_001", "cust_002", "cust_003"])
    );
    expect(Object.keys(result.by_customer).length).toBe(3);

    // cust_001の検証：service_A, service_B を含む
    expect(result.by_customer["cust_001"]).toBeDefined();
    expect(Object.keys(result.by_customer["cust_001"])).toEqual(
      expect.arrayContaining(["service_A", "service_B"])
    );
    expect(Object.keys(result.by_customer["cust_001"]).length).toBe(2);

    const cust_001_service_A = result.by_customer["cust_001"]["service_A"];
    expect(cust_001_service_A.length).toBe(1);
    expect(cust_001_service_A[0].sales_id).toBe("sales_001");
    expect(cust_001_service_A[0].amount).toBe(100000);

    const cust_001_service_B = result.by_customer["cust_001"]["service_B"];
    expect(cust_001_service_B.length).toBe(1);
    expect(cust_001_service_B[0].sales_id).toBe("sales_002");
    expect(cust_001_service_B[0].amount).toBe(50000);

    // cust_002の検証：service_A, service_C を含む
    expect(result.by_customer["cust_002"]).toBeDefined();
    expect(Object.keys(result.by_customer["cust_002"])).toEqual(
      expect.arrayContaining(["service_A", "service_C"])
    );
    expect(Object.keys(result.by_customer["cust_002"]).length).toBe(2);

    const cust_002_service_A = result.by_customer["cust_002"]["service_A"];
    expect(cust_002_service_A.length).toBe(1);
    expect(cust_002_service_A[0].sales_id).toBe("sales_003");
    expect(cust_002_service_A[0].amount).toBe(80000);

    const cust_002_service_C = result.by_customer["cust_002"]["service_C"];
    expect(cust_002_service_C.length).toBe(1);
    expect(cust_002_service_C[0].sales_id).toBe("sales_004");
    expect(cust_002_service_C[0].amount).toBe(120000);

    // cust_003の検証：service_B, service_A を含む
    expect(result.by_customer["cust_003"]).toBeDefined();
    expect(Object.keys(result.by_customer["cust_003"])).toEqual(
      expect.arrayContaining(["service_A", "service_B"])
    );
    expect(Object.keys(result.by_customer["cust_003"]).length).toBe(2);

    const cust_003_service_B = result.by_customer["cust_003"]["service_B"];
    expect(cust_003_service_B.length).toBe(1);
    expect(cust_003_service_B[0].sales_id).toBe("sales_005");
    expect(cust_003_service_B[0].amount).toBe(40000);

    const cust_003_service_A = result.by_customer["cust_003"]["service_A"];
    expect(cust_003_service_A.length).toBe(1);
    expect(cust_003_service_A[0].sales_id).toBe("sales_006");
    expect(cust_003_service_A[0].amount).toBe(110000);

    // サービス別グループ化検証
    expect(result.by_service).toBeDefined();
    expect(Object.keys(result.by_service)).toEqual(
      expect.arrayContaining(["service_A", "service_B", "service_C"])
    );
    expect(Object.keys(result.by_service).length).toBe(3);

    // service_A の検証：cust_001, cust_002, cust_003 を含む
    const service_A_data = result.by_service["service_A"];
    expect(service_A_data).toBeDefined();
    expect(Object.keys(service_A_data)).toEqual(
      expect.arrayContaining(["cust_001", "cust_002", "cust_003"])
    );
    expect(Object.keys(service_A_data).length).toBe(3);

    expect(service_A_data["cust_001"].length).toBe(1);
    expect(service_A_data["cust_001"][0].sales_id).toBe("sales_001");

    expect(service_A_data["cust_002"].length).toBe(1);
    expect(service_A_data["cust_002"][0].sales_id).toBe("sales_003");

    expect(service_A_data["cust_003"].length).toBe(1);
    expect(service_A_data["cust_003"][0].sales_id).toBe("sales_006");

    // service_B の検証：cust_001, cust_003 を含む
    const service_B_data = result.by_service["service_B"];
    expect(service_B_data).toBeDefined();
    expect(Object.keys(service_B_data)).toEqual(
      expect.arrayContaining(["cust_001", "cust_003"])
    );
    expect(Object.keys(service_B_data).length).toBe(2);

    expect(service_B_data["cust_001"].length).toBe(1);
    expect(service_B_data["cust_001"][0].sales_id).toBe("sales_002");

    expect(service_B_data["cust_003"].length).toBe(1);
    expect(service_B_data["cust_003"][0].sales_id).toBe("sales_005");

    // service_C の検証：cust_002 のみ
    const service_C_data = result.by_service["service_C"];
    expect(service_C_data).toBeDefined();
    expect(Object.keys(service_C_data)).toEqual(["cust_002"]);
    expect(Object.keys(service_C_data).length).toBe(1);

    expect(service_C_data["cust_002"].length).toBe(1);
    expect(service_C_data["cust_002"][0].sales_id).toBe("sales_004");

    // 全データ件数の検証：分類後のデータ件数が元データと一致
    let total_classified_count = 0;
    for (const customer_id in result.by_customer) {
      for (const service_type in result.by_customer[customer_id]) {
        total_classified_count += result.by_customer[customer_id][
          service_type
        ].length;
      }
    }
    expect(total_classified_count).toBe(6);

    // 重複の確認
    const classified_sales_ids = new Set<string>();
    for (const customer_id in result.by_customer) {
      for (const service_type in result.by_customer[customer_id]) {
        for (const item of result.by_customer[customer_id][service_type]) {
          expect(classified_sales_ids.has(item.sales_id)).toBe(false);
          classified_sales_ids.add(item.sales_id);
        }
      }
    }
    expect(classified_sales_ids.size).toBe(6);

    // メタデータ検証
    expect(result.total_records).toBe(6);
    expect(result.customer_count).toBe(3);
    expect(result.service_count).toBe(3);
    expect(result.total_amount).toBe(500000);
  });
});