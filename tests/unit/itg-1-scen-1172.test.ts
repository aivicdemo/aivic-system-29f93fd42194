import { aggregateBillingByCustomerAndService } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 請求額自動集計・抽出", () => {
  test("SCEN-1172: 複数顧客・複数サービスの営業データが顧客ごと・サービスごとに正確に集計される", () => {
    // テストデータ: 3顧客 × 2サービス = 6組み合わせ、各組み合わせに複数営業データ
    const salesData = [
      // 顧客A (customer_id: "CUST001")
      { customer_id: "CUST001", service_id: "SVC001", amount: 100000, quantity: 10, unit_price: 10000 },
      { customer_id: "CUST001", service_id: "SVC001", amount: 50000, quantity: 5, unit_price: 10000 },
      { customer_id: "CUST001", service_id: "SVC002", amount: 75000, quantity: 3, unit_price: 25000 },
      // 顧客B (customer_id: "CUST002")
      { customer_id: "CUST002", service_id: "SVC001", amount: 120000, quantity: 12, unit_price: 10000 },
      { customer_id: "CUST002", service_id: "SVC002", amount: 80000, quantity: 4, unit_price: 20000 },
      { customer_id: "CUST002", service_id: "SVC002", amount: 40000, quantity: 2, unit_price: 20000 },
      // 顧客C (customer_id: "CUST003")
      { customer_id: "CUST003", service_id: "SVC001", amount: 90000, quantity: 9, unit_price: 10000 },
      { customer_id: "CUST003", service_id: "SVC002", amount: 60000, quantity: 2, unit_price: 30000 },
      { customer_id: "CUST003", service_id: "SVC002", amount: 30000, quantity: 1, unit_price: 30000 },
    ];

    // 期待値の計算（手動で検証）
    // 顧客A: SVC001合計 = 100000 + 50000 = 150000, SVC002合計 = 75000, 顧客A総計 = 225000
    // 顧客B: SVC001合計 = 120000, SVC002合計 = 80000 + 40000 = 120000, 顧客B総計 = 240000
    // 顧客C: SVC001合計 = 90000, SVC002合計 = 60000 + 30000 = 90000, 顧客C総計 = 180000
    // 全体総計 = 225000 + 240000 + 180000 = 645000

    // SVC001総計 = 150000 + 120000 + 90000 = 360000
    // SVC002総計 = 75000 + 120000 + 90000 = 285000
    // サービス別総計 = 360000 + 285000 = 645000

    const result = aggregateBillingByCustomerAndService(salesData);

    // 検証1: 顧客別集計の構造確認
    expect(result.by_customer).toBeDefined();
    expect(result.by_customer).toHaveProperty("CUST001");
    expect(result.by_customer).toHaveProperty("CUST002");
    expect(result.by_customer).toHaveProperty("CUST003");

    // 検証2: 顧客A (CUST001) の集計値
    expect(result.by_customer.CUST001.total_amount).toBe(225000);
    expect(result.by_customer.CUST001.services).toHaveProperty("SVC001");
    expect(result.by_customer.CUST001.services).toHaveProperty("SVC002");
    expect(result.by_customer.CUST001.services.SVC001).toBe(150000);
    expect(result.by_customer.CUST001.services.SVC002).toBe(75000);

    // 検証3: 顧客B (CUST002) の集計値
    expect(result.by_customer.CUST002.total_amount).toBe(240000);
    expect(result.by_customer.CUST002.services.SVC001).toBe(120000);
    expect(result.by_customer.CUST002.services.SVC002).toBe(120000);

    // 検証4: 顧客C (CUST003) の集計値
    expect(result.by_customer.CUST003.total_amount).toBe(180000);
    expect(result.by_customer.CUST003.services.SVC001).toBe(90000);
    expect(result.by_customer.CUST003.services.SVC002).toBe(90000);

    // 検証5: サービス別集計の構造確認
    expect(result.by_service).toBeDefined();
    expect(result.by_service).toHaveProperty("SVC001");
    expect(result.by_service).toHaveProperty("SVC002");

    // 検証6: サービスSVC001の集計値
    expect(result.by_service.SVC001.total_amount).toBe(360000);
    expect(result.by_service.SVC001.customers).toHaveProperty("CUST001");
    expect(result.by_service.SVC001.customers).toHaveProperty("CUST002");
    expect(result.by_service.SVC001.customers).toHaveProperty("CUST003");
    expect(result.by_service.SVC001.customers.CUST001).toBe(150000);
    expect(result.by_service.SVC001.customers.CUST002).toBe(120000);
    expect(result.by_service.SVC001.customers.CUST003).toBe(90000);

    // 検証7: サービスSVC002の集計値
    expect(result.by_service.SVC002.total_amount).toBe(285000);
    expect(result.by_service.SVC002.customers.CUST001).toBe(75000);
    expect(result.by_service.SVC002.customers.CUST002).toBe(120000);
    expect(result.by_service.SVC002.customers.CUST003).toBe(90000);

    // 検証8: 顧客×サービスのクロス集計結果
    expect(result.cross_tabulation).toBeDefined();
    expect(result.cross_tabulation).toHaveProperty("CUST001");
    expect(result.cross_tabulation.CUST001).toHaveProperty("SVC001");
    expect(result.cross_tabulation.CUST001).toHaveProperty("SVC002");
    expect(result.cross_tabulation.CUST001.SVC001).toBe(150000);
    expect(result.cross_tabulation.CUST001.SVC002).toBe(75000);

    expect(result.cross_tabulation).toHaveProperty("CUST002");
    expect(result.cross_tabulation.CUST002.SVC001).toBe(120000);
    expect(result.cross_tabulation.CUST002.SVC002).toBe(120000);

    expect(result.cross_tabulation).toHaveProperty("CUST003");
    expect(result.cross_tabulation.CUST003.SVC001).toBe(90000);
    expect(result.cross_tabulation.CUST003.SVC002).toBe(90000);

    // 検証9: 全営業データの総合計
    expect(result.grand_total).toBe(645000);

    // 検証10: 顧客別集計の合計と全体総計の一致性
    const customer_total_sum =
      result.by_customer.CUST001.total_amount +
      result.by_customer.CUST002.total_amount +
      result.by_customer.CUST003.total_amount;
    expect(customer_total_sum).toBe(645000);
    expect(customer_total_sum).toBe(result.grand_total);

    // 検証11: サービス別集計の合計と全体総計の一致性
    const service_total_sum = result.by_service.SVC001.total_amount + result.by_service.SVC002.total_amount;
    expect(service_total_sum).toBe(645000);
    expect(service_total_sum).toBe(result.grand_total);

    // 検証12: クロス集計の全セルの合計と全体総計の一致性
    let cross_total = 0;
    for (const customer_id in result.cross_tabulation) {
      for (const service_id in result.cross_tabulation[customer_id]) {
        cross_total += result.cross_tabulation[customer_id][service_id];
      }
    }
    expect(cross_total).toBe(645000);
    expect(cross_total).toBe(result.grand_total);

    // 検証13: 二重計上がないことの確認（各セルの値が一度だけ計算されていることを検証）
    // 顧客別の各セルが独立していることを確認
    const customer_a_sum = Object.values(result.by_customer.CUST001.services).reduce(
      (sum: number, val: number) => sum + val,
      0
    );
    expect(customer_a_sum).toBe(result.by_customer.CUST001.total_amount);

    const customer_b_sum = Object.values(result.by_customer.CUST002.services).reduce(
      (sum: number, val: number) => sum + val,
      0
    );
    expect(customer_b_sum).toBe(result.by_customer.CUST002.total_amount);

    const customer_c_sum = Object.values(result.by_customer.CUST003.services).reduce(
      (sum: number, val: number) => sum + val,
      0
    );
    expect(customer_c_sum).toBe(result.by_customer.CUST003.total_amount);

    // 検証14: サービス別の各セルの合計が一致していることを確認
    const service_001_sum = Object.values(result.by_service.SVC001.customers).reduce(
      (sum: number, val: number) => sum + val,
      0
    );
    expect(service_001_sum).toBe(result.by_service.SVC001.total_amount);

    const service_002_sum = Object.values(result.by_service.SVC002.customers).reduce(
      (sum: number, val: number) => sum + val,
      0
    );
    expect(service_002_sum).toBe(result.by_service.SVC002.total_amount);

    // 検証15: 漏れデータがないことの確認（入力データのすべてのレコードが集計に反映されているか）
    const input_total = salesData.reduce((sum, record) => sum + record.amount, 0);
    expect(input_total).toBe(645000);
    expect(result.grand_total).toBe(input_total);
  });
});