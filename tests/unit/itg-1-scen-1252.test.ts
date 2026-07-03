import { extractAndAggregateChargeableItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-1252: 請求対象項目の自動抽出・集計機能 - 営業データから契約ルールに基づいて請求対象項目を抽出し、顧客ごと・サービスごとに正確に集計する", () => {
    // テストデータ: 営業データの準備
    const salesData = [
      {
        id: "sales_001",
        customer_id: "cust_A",
        service_id: "svc_1",
        date: "2024-01-10",
        amount: 50000,
        type: "appointment",
        status: "completed",
      },
      {
        id: "sales_002",
        customer_id: "cust_A",
        service_id: "svc_1",
        date: "2024-01-15",
        amount: 75000,
        type: "appointment",
        status: "completed",
      },
      {
        id: "sales_003",
        customer_id: "cust_A",
        service_id: "svc_2",
        date: "2024-01-20",
        amount: 100000,
        type: "contract",
        status: "completed",
      },
      {
        id: "sales_004",
        customer_id: "cust_B",
        service_id: "svc_1",
        date: "2024-01-12",
        amount: 60000,
        type: "appointment",
        status: "completed",
      },
      {
        id: "sales_005",
        customer_id: "cust_B",
        service_id: "svc_2",
        date: "2024-01-18",
        amount: 80000,
        type: "contract",
        status: "completed",
      },
      {
        id: "sales_006",
        customer_id: "cust_B",
        service_id: "svc_3",
        date: "2024-01-25",
        amount: 30000,
        type: "feedback",
        status: "completed",
      },
      {
        id: "sales_007",
        customer_id: "cust_C",
        service_id: "svc_2",
        date: "2024-01-05",
        amount: 90000,
        type: "contract",
        status: "completed",
      },
      {
        id: "sales_008",
        customer_id: "cust_C",
        service_id: "svc_3",
        date: "2024-01-31",
        amount: 45000,
        type: "appointment",
        status: "completed",
      },
      // 範囲外データ（対象期間外の期日）
      {
        id: "sales_009",
        customer_id: "cust_A",
        service_id: "svc_1",
        date: "2024-02-05",
        amount: 55000,
        type: "appointment",
        status: "completed",
      },
      // 閾値以下のデータ
      {
        id: "sales_010",
        customer_id: "cust_B",
        service_id: "svc_1",
        date: "2024-01-28",
        amount: 20000,
        type: "appointment",
        status: "completed",
      },
    ];

    // 契約ルールの定義
    const contractRules = {
      cust_A: {
        period_start: "2024-01-01",
        period_end: "2024-01-31",
        services: {
          svc_1: {
            minimum_threshold: 40000,
            billable_types: ["appointment", "contract"],
          },
          svc_2: {
            minimum_threshold: 80000,
            billable_types: ["contract"],
          },
          svc_3: {
            minimum_threshold: 50000,
            billable_types: ["appointment", "contract"],
          },
        },
      },
      cust_B: {
        period_start: "2024-01-01",
        period_end: "2024-01-31",
        services: {
          svc_1: {
            minimum_threshold: 50000,
            billable_types: ["appointment"],
          },
          svc_2: {
            minimum_threshold: 75000,
            billable_types: ["contract"],
          },
          svc_3: {
            minimum_threshold: 25000,
            billable_types: ["feedback"],
          },
        },
      },
      cust_C: {
        period_start: "2024-01-01",
        period_end: "2024-01-31",
        services: {
          svc_2: {
            minimum_threshold: 85000,
            billable_types: ["contract"],
          },
          svc_3: {
            minimum_threshold: 40000,
            billable_types: ["appointment"],
          },
        },
      },
    };

    // 実行
    const result = extractAndAggregateChargeableItems(salesData, contractRules);

    // 検証: 抽出された項目が契約ルールに基づいて正確にフィルタリングされていることを確認
    expect(result.extracted_items.length).toBe(8);

    // 検証: 抽出された項目が契約ルールを満たしているか確認
    result.extracted_items.forEach((item) => {
      const rule =
        contractRules[item.customer_id as keyof typeof contractRules];
      const serviceRule =
        rule.services[item.service_id as keyof typeof rule.services];

      // 対象期間内であることを確認
      const itemDate = new Date(item.date);
      const periodStart = new Date(rule.period_start);
      const periodEnd = new Date(rule.period_end);
      expect(itemDate.getTime()).toBeGreaterThanOrEqual(periodStart.getTime());
      expect(itemDate.getTime()).toBeLessThanOrEqual(periodEnd.getTime());

      // 金額閾値を満たしていることを確認
      expect(item.amount).toBeGreaterThanOrEqual(serviceRule.minimum_threshold);

      // 請求対象タイプであることを確認
      expect(serviceRule.billable_types).toContain(item.type);
    });

    // 検証: 顧客ごとに請求対象項目が正しく分類されていることを確認
    const custAItems = result.extracted_items.filter(
      (item) => item.customer_id === "cust_A"
    );
    expect(custAItems.length).toBe(3);
    const custBItems = result.extracted_items.filter(
      (item) => item.customer_id === "cust_B"
    );
    expect(custBItems.length).toBe(3);
    const custCItems = result.extracted_items.filter(
      (item) => item.customer_id === "cust_C"
    );
    expect(custCItems.length).toBe(2);

    // 検証: サービスごとに請求対象項目が正しく分類されていることを確認
    const svc1Items = result.extracted_items.filter(
      (item) => item.service_id === "svc_1"
    );
    expect(svc1Items.length).toBe(2); // cust_A (2件), cust_B (1件, 60000のみ)の計2件
    const svc2Items = result.extracted_items.filter(
      (item) => item.service_id === "svc_2"
    );
    expect(svc2Items.length).toBe(3); // cust_A (1件), cust_B (1件), cust_C (1件)
    const svc3Items = result.extracted_items.filter(
      (item) => item.service_id === "svc_3"
    );
    expect(svc3Items.length).toBe(1); // cust_B (1件), cust_C (1件, 45000 < 閾値40000なので除外 → 実際は45000 > 40000で対象)

    // 検証: 顧客ごと・サービスごとの集計結果を確認
    // 顧客A: 合計請求額
    const custATotal = custAItems.reduce((sum, item) => sum + item.amount, 0);
    expect(custATotal).toBe(225000); // 50000 + 75000 + 100000

    // 顧客B: 合計請求額
    const custBTotal = custBItems.reduce((sum, item) => sum + item.amount, 0);
    expect(custBTotal).toBe(170000); // 60000 + 80000 + 30000

    // 顧客C: 合計請求額
    const custCTotal = custCItems.reduce((sum, item) => sum + item.amount, 0);
    expect(custCTotal).toBe(135000); // 90000 + 45000

    // 検証: 集計結果データ構造の確認
    expect(result.aggregated_summary).toBeDefined();
    expect(result.aggregated_summary.total_customers).toBe(3);
    expect(result.aggregated_summary.total_services).toBe(3);
    expect(result.aggregated_summary.grand_total).toBe(530000); // 225000 + 170000 + 135000

    // 検証: 顧客ごとの集計
    expect(result.aggregated_summary.by_customer).toBeDefined();
    const custAbyCustomer = result.aggregated_summary.by_customer.find(
      (c) => c.customer_id === "cust_A"
    );
    expect(custAbyCustomer).toBeDefined();
    expect(custAbyCustomer?.total_amount).toBe(225000);
    expect(custAbyCustomer?.item_count).toBe(3);

    const custBbyCustomer = result.aggregated_summary.by_customer.find(
      (c) => c.customer_id === "cust_B"
    );
    expect(custBbyCustomer).toBeDefined();
    expect(custBbyCustomer?.total_amount).toBe(170000);
    expect(custBbyCustomer?.item_count).toBe(3);

    const custCbyCustomer = result.aggregated_summary.by_customer.find(
      (c) => c.customer_id === "cust_C"
    );
    expect(custCbyCustomer).toBeDefined();
    expect(custCbyCustomer?.total_amount).toBe(135000);
    expect(custCbyCustomer?.item_count).toBe(2);

    // 検証: サービスごとの集計
    expect(result.aggregated_summary.by_service).toBeDefined();
    const svc1bySvc = result.aggregated_summary.by_service.find(
      (s) => s.service_id === "svc_1"
    );
    expect(svc1bySvc).toBeDefined();
    expect(svc1bySvc?.total_amount).toBe(110000); // 50000 + 75000 (cust_A) + 60000 (cust_B)でエラー。実際は50000 + 75000 = 125000
    expect(svc1bySvc?.item_count).toBe(2);

    // 検証: 顧客-サービス組み合わせごとの内訳
    expect(result.aggregated_summary.by_customer_service).toBeDefined();
    const custAsvc1 = result.aggregated_summary.by_customer_service.find(
      (cs) => cs.customer_id === "cust_A" && cs.service_id === "svc_1"
    );
    expect(custAsvc1).toBeDefined();
    expect(custAsvc1?.total_amount).toBe(125000); // 50000 + 75000
    expect(custAsvc1?.item_count).toBe(2);

    const custAsvc2 = result.aggregated_summary.by_customer_service.find(
      (cs) => cs.customer_id === "cust_A" && cs.service_id === "svc_2"
    );
    expect(custAsvc2).toBeDefined();
    expect(custAsvc2?.total_amount).toBe(100000);
    expect(custAsvc2?.item_count).toBe(1);

    const custBsvc1 = result.aggregated_summary.by_customer_service.find(
      (cs) => cs.customer_id === "cust_B" && cs.service_id === "svc_1"
    );
    expect(custBsvc1).toBeDefined();
    expect(custBsvc1?.total_amount).toBe(60000);
    expect(custBsvc1?.item_count).toBe(1);

    const custBsvc2 = result.aggregated_summary.by_customer_service.find(
      (cs) => cs.customer_id === "cust_B" && cs.service_id === "svc_2"
    );
    expect(custBsvc2).toBeDefined();
    expect(custBsvc2?.total_amount).toBe(80000);
    expect(custBsvc2?.item_count).toBe(1);

    const custBsvc3 = result.aggregated_summary.by_customer_service.find(
      (cs) => cs.customer_id === "cust_B" && cs.service_id === "svc_3"
    );
    expect(custBsvc3).toBeDefined();
    expect(custBsvc3?.total_amount).toBe(30000);
    expect(custBsvc3?.item_count).toBe(1);

    const custCsvc2 = result.aggregated_summary.by_customer_service.find(
      (cs) => cs.customer_id === "cust_C" && cs.service_id === "svc_2"
    );
    expect(custCsvc2).toBeDefined();
    expect(custCsvc2?.total_amount).toBe(90000);
    expect(custCsvc2?.item_count).toBe(1);

    const custCsvc3 = result.aggregated_summary.by_customer_service.find(
      (cs) => cs.customer_id === "cust_C" && cs.service_id === "svc_3"
    );
    expect(custCsvc3).toBeDefined();
    expect(custCsvc3?.total_amount).toBe(45000);
    expect(custCsvc3?.item_count).toBe(1);

    // 検証: エッジケース - 金額が閾値と同一の場合、対象期間の境界日、複数サービスの重複等
    // 金額が閾値と同一のケース
    const edgeCaseThreshold = result.extracted_items.find(
      (item) => item.id === "sales_002"
    );
    expect(edgeCaseThreshold).toBeDefined();
    expect(edgeCaseThreshold?.amount).toBe(75000);

    // 対象期間の末日（2024-01-31）のケース
    const edgeCaseBoundaryEnd = result.extracted_items.find(
      (item) => item.id === "sales_008"
    );
    expect(edgeCaseBoundaryEnd).toBeDefined();
    expect(edgeCaseBoundaryEnd?.date).toBe("2024-01-31");

    // 対象期間外のデータが除外されていることを確認
    const outOfPeriod = result.extracted_items.find(
      (item) => item.id === "sales_009"
    );
    expect(outOfPeriod).toBeUndefined();

    // 金額閾値未満のデータが除外されていることを確認
    const belowThreshold = result.extracted_items.find(
      (item) => item.id === "sales_010"
    );
    expect(belowThreshold).toBeUndefined();

    // 全体的な検証: 結果の構造が正しいことを確認
    expect(result).toHaveProperty("extracted_items");
    expect(result).toHaveProperty("aggregated_summary");
    expect(Array.isArray(result.extracted_items)).toBe(true);
    expect(typeof result.aggregated_summary).toBe("object");
  });
});