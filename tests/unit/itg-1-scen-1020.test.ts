import { extractAndAggregateChargeableItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し顧客ごと・サービスごとに集計", () => {
  test("SCEN-1020: 同一顧客の複数サービスが正確に集計される", () => {
    // テストデータ: 同一顧客IDを持つ複数サービス利用レコード
    const sales_data = [
      {
        sales_data_id: "SD001",
        customer_id: "C001",
        service_code: "SVC_A",
        service_name: "基本サービス",
        usage_period_start: "2024-01-01",
        usage_period_end: "2024-01-31",
        quantity: 10,
        unit_price: 1000,
        amount: 10000,
        is_chargeable: true,
      },
      {
        sales_data_id: "SD002",
        customer_id: "C001",
        service_code: "SVC_B",
        service_name: "プレミアムサービス",
        usage_period_start: "2024-01-01",
        usage_period_end: "2024-01-31",
        quantity: 5,
        unit_price: 2000,
        amount: 10000,
        is_chargeable: true,
      },
      {
        sales_data_id: "SD003",
        customer_id: "C001",
        service_code: "SVC_C",
        service_name: "オプションサービス",
        usage_period_start: "2024-01-01",
        usage_period_end: "2024-01-31",
        quantity: 3,
        unit_price: 5000,
        amount: 15000,
        is_chargeable: true,
      },
      {
        sales_data_id: "SD004",
        customer_id: "C002",
        service_code: "SVC_A",
        service_name: "基本サービス",
        usage_period_start: "2024-01-01",
        usage_period_end: "2024-01-31",
        quantity: 8,
        unit_price: 1000,
        amount: 8000,
        is_chargeable: true,
      },
    ];

    // 請求対象項目の自動抽出と集計を実行
    const result = extractAndAggregateChargeableItems(sales_data);

    // 期待値の設定
    // 顧客C001: サービスSVC_A + SVC_B + SVC_C の合計 = 10000 + 10000 + 15000 = 35000
    // 顧客C002: サービスSVC_A = 8000

    // 結果の検証: 顧客ごと・サービスごとの集計が正確に生成されていることを確認
    expect(result).toEqual({
      summary: [
        {
          customer_id: "C001",
          customer_name: undefined,
          total_amount: 35000,
          service_count: 3,
          services: [
            {
              service_code: "SVC_A",
              service_name: "基本サービス",
              quantity: 10,
              unit_price: 1000,
              subtotal: 10000,
            },
            {
              service_code: "SVC_B",
              service_name: "プレミアムサービス",
              quantity: 5,
              unit_price: 2000,
              subtotal: 10000,
            },
            {
              service_code: "SVC_C",
              service_name: "オプションサービス",
              quantity: 3,
              unit_price: 5000,
              subtotal: 15000,
            },
          ],
        },
        {
          customer_id: "C002",
          customer_name: undefined,
          total_amount: 8000,
          service_count: 1,
          services: [
            {
              service_code: "SVC_A",
              service_name: "基本サービス",
              quantity: 8,
              unit_price: 1000,
              subtotal: 8000,
            },
          ],
        },
      ],
      total_customers: 2,
      grand_total: 43000,
    });

    // 各検証項目
    // 1. サービス数が正確に反映されていることを確認
    expect(result.summary[0].service_count).toBe(3);
    expect(result.summary[1].service_count).toBe(1);

    // 2. 各サービスごとの集計金額が正確に計算されていることを確認
    expect(result.summary[0].services[0].subtotal).toBe(10000);
    expect(result.summary[0].services[1].subtotal).toBe(10000);
    expect(result.summary[0].services[2].subtotal).toBe(15000);

    // 3. 顧客単位での合計金額が各サービス集計金額の合計と一致することを検証
    const customer_c001_service_totals =
      result.summary[0].services.reduce(
        (sum, svc) => sum + svc.subtotal,
        0
      );
    expect(result.summary[0].total_amount).toBe(customer_c001_service_totals);
    expect(result.summary[0].total_amount).toBe(35000);

    // 4. 全体の合計金額が正確に計算されていることを確認
    const expected_grand_total = result.summary.reduce(
      (sum, cust) => sum + cust.total_amount,
      0
    );
    expect(result.grand_total).toBe(expected_grand_total);
    expect(result.grand_total).toBe(43000);

    // 5. 集計結果のフォーマットと必須項目がすべて揃っていることを確認
    expect(result.summary).toBeDefined();
    expect(Array.isArray(result.summary)).toBe(true);
    result.summary.forEach((customer_summary) => {
      expect(customer_summary.customer_id).toBeDefined();
      expect(customer_summary.total_amount).toBeDefined();
      expect(customer_summary.service_count).toBeDefined();
      expect(Array.isArray(customer_summary.services)).toBe(true);
      expect(customer_summary.service_count).toBe(
        customer_summary.services.length
      );

      customer_summary.services.forEach((service) => {
        expect(service.service_code).toBeDefined();
        expect(service.service_name).toBeDefined();
        expect(service.quantity).toBeDefined();
        expect(service.unit_price).toBeDefined();
        expect(service.subtotal).toBeDefined();
        expect(service.subtotal).toBe(service.quantity * service.unit_price);
      });
    });

    // 6. 顧客数が正確に反映されていることを確認
    expect(result.total_customers).toBe(2);
  });
});