import { extractBillingItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1298: [normal] 請求対象項目自動抽出機能 - 営業データから請求対象項目が正確に抽出され、顧客ごとに集計される
  test("営業データから請求対象項目が漏れなく正確に抽出され、顧客ごとに正しく集計されたレポートが生成されること", () => {
    const input_sales_data = [
      {
        customer_id: "CUST_A",
        customer_name: "A社",
        service_type: "product_sales",
        service_name: "商品販売",
        transaction_date: "2024-01-10",
        amount: 50000,
        quantity: 5,
        unit_price: 10000,
        billing_status: "billable",
      },
      {
        customer_id: "CUST_A",
        customer_name: "A社",
        service_type: "maintenance_fee",
        service_name: "保守料金",
        transaction_date: "2024-01-15",
        amount: 30000,
        quantity: 1,
        unit_price: 30000,
        billing_status: "billable",
      },
      {
        customer_id: "CUST_B",
        customer_name: "B社",
        service_type: "service_provision",
        service_name: "サービス提供",
        transaction_date: "2024-01-12",
        amount: 80000,
        quantity: 4,
        unit_price: 20000,
        billing_status: "billable",
      },
      {
        customer_id: "CUST_B",
        customer_name: "B社",
        service_type: "product_sales",
        service_name: "商品販売",
        transaction_date: "2024-01-18",
        amount: 60000,
        quantity: 6,
        unit_price: 10000,
        billing_status: "billable",
      },
      {
        customer_id: "CUST_B",
        customer_name: "B社",
        service_type: "consultation_fee",
        service_name: "コンサルティング",
        transaction_date: "2024-01-20",
        amount: 40000,
        quantity: 1,
        unit_price: 40000,
        billing_status: "billable",
      },
      {
        customer_id: "CUST_C",
        customer_name: "C社",
        service_type: "service_provision",
        service_name: "サービス提供",
        transaction_date: "2024-01-11",
        amount: 100000,
        quantity: 5,
        unit_price: 20000,
        billing_status: "billable",
      },
      {
        customer_id: "CUST_C",
        customer_name: "C社",
        service_type: "maintenance_fee",
        service_name: "保守料金",
        transaction_date: "2024-01-17",
        amount: 25000,
        quantity: 1,
        unit_price: 25000,
        billing_status: "billable",
      },
    ];

    const result = extractBillingItems({
      sales_data: input_sales_data,
      billing_date: "2024-01-31",
      extraction_period_start: "2024-01-01",
      extraction_period_end: "2024-01-31",
    });

    // 抽出結果の構造を検証
    expect(result).toHaveProperty("extraction_status");
    expect(result.extraction_status).toBe("success");

    expect(result).toHaveProperty("customer_aggregations");
    expect(Array.isArray(result.customer_aggregations)).toBe(true);

    // 顧客数が3社であることを検証
    expect(result.customer_aggregations.length).toBe(3);

    // A社の抽出検証（2件、合計80000円）
    const customer_a = result.customer_aggregations.find(
      (agg) => agg.customer_id === "CUST_A"
    );
    expect(customer_a).toBeDefined();
    expect(customer_a!.customer_name).toBe("A社");
    expect(customer_a!.billing_items_count).toBe(2);
    expect(customer_a!.total_billing_amount).toBe(80000);
    expect(customer_a!.billing_items).toHaveLength(2);
    expect(customer_a!.billing_items[0]).toEqual({
      service_type: "product_sales",
      service_name: "商品販売",
      transaction_date: "2024-01-10",
      amount: 50000,
      quantity: 5,
      unit_price: 10000,
    });
    expect(customer_a!.billing_items[1]).toEqual({
      service_type: "maintenance_fee",
      service_name: "保守料金",
      transaction_date: "2024-01-15",
      amount: 30000,
      quantity: 1,
      unit_price: 30000,
    });

    // B社の抽出検証（3件、合計180000円）
    const customer_b = result.customer_aggregations.find(
      (agg) => agg.customer_id === "CUST_B"
    );
    expect(customer_b).toBeDefined();
    expect(customer_b!.customer_name).toBe("B社");
    expect(customer_b!.billing_items_count).toBe(3);
    expect(customer_b!.total_billing_amount).toBe(180000);
    expect(customer_b!.billing_items).toHaveLength(3);
    expect(customer_b!.billing_items[0]).toEqual({
      service_type: "service_provision",
      service_name: "サービス提供",
      transaction_date: "2024-01-12",
      amount: 80000,
      quantity: 4,
      unit_price: 20000,
    });
    expect(customer_b!.billing_items[1]).toEqual({
      service_type: "product_sales",
      service_name: "商品販売",
      transaction_date: "2024-01-18",
      amount: 60000,
      quantity: 6,
      unit_price: 10000,
    });
    expect(customer_b!.billing_items[2]).toEqual({
      service_type: "consultation_fee",
      service_name: "コンサルティング",
      transaction_date: "2024-01-20",
      amount: 40000,
      quantity: 1,
      unit_price: 40000,
    });

    // C社の抽出検証（2件、合計125000円）
    const customer_c = result.customer_aggregations.find(
      (agg) => agg.customer_id === "CUST_C"
    );
    expect(customer_c).toBeDefined();
    expect(customer_c!.customer_name).toBe("C社");
    expect(customer_c!.billing_items_count).toBe(2);
    expect(customer_c!.total_billing_amount).toBe(125000);
    expect(customer_c!.billing_items).toHaveLength(2);
    expect(customer_c!.billing_items[0]).toEqual({
      service_type: "service_provision",
      service_name: "サービス提供",
      transaction_date: "2024-01-11",
      amount: 100000,
      quantity: 5,
      unit_price: 20000,
    });
    expect(customer_c!.billing_items[1]).toEqual({
      service_type: "maintenance_fee",
      service_name: "保守料金",
      transaction_date: "2024-01-17",
      amount: 25000,
      quantity: 1,
      unit_price: 25000,
    });

    // 全体集計値を検証
    expect(result).toHaveProperty("total_extracted_items");
    expect(result.total_extracted_items).toBe(7);
    expect(result).toHaveProperty("grand_total_billing_amount");
    expect(result.grand_total_billing_amount).toBe(385000);

    // 処理時間がシステム要件内（5秒以内）であることを検証
    expect(result).toHaveProperty("processing_time_ms");
    expect(typeof result.processing_time_ms).toBe("number");
    expect(result.processing_time_ms).toBeLessThan(5000);

    // 抽出タイムスタンプが正確であることを検証
    expect(result).toHaveProperty("extraction_timestamp");
    expect(result.extraction_timestamp).toBe("2024-01-31T00:00:00Z");

    // データ形式の完全性を検証
    result.customer_aggregations.forEach((agg) => {
      expect(agg).toHaveProperty("customer_id");
      expect(agg).toHaveProperty("customer_name");
      expect(agg).toHaveProperty("billing_items_count");
      expect(agg).toHaveProperty("total_billing_amount");
      expect(agg).toHaveProperty("billing_items");
      expect(typeof agg.customer_id).toBe("string");
      expect(typeof agg.customer_name).toBe("string");
      expect(typeof agg.billing_items_count).toBe("number");
      expect(typeof agg.total_billing_amount).toBe("number");
      expect(Array.isArray(agg.billing_items)).toBe(true);

      agg.billing_items.forEach((item) => {
        expect(item).toHaveProperty("service_type");
        expect(item).toHaveProperty("service_name");
        expect(item).toHaveProperty("transaction_date");
        expect(item).toHaveProperty("amount");
        expect(item).toHaveProperty("quantity");
        expect(item).toHaveProperty("unit_price");
        expect(typeof item.service_type).toBe("string");
        expect(typeof item.service_name).toBe("string");
        expect(typeof item.transaction_date).toBe("string");
        expect(typeof item.amount).toBe("number");
        expect(typeof item.quantity).toBe("number");
        expect(typeof item.unit_price).toBe("number");
      });
    });
  });
});