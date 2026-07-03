import { describe, test, expect } from "@jest/globals";
import {
  extractBillableItems,
  aggregateBillingAmountByCustomer,
  aggregateBillingAmountByService,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - 請求対象項目自動抽出・請求額集計", () => {
  // SCEN-616: [normal] 請求対象項目自動抽出・請求額集計 - 営業成果データから請求対象項目が正しく抽出され、顧客ごと・サービスごとの請求額が集計される

  test("SCEN-616: 営業成果データから請求対象項目が正確に抽出・集計される", () => {
    // テスト用の営業成果データ（複数顧客、複数サービス種別）
    const sales_data = [
      {
        sales_id: "SALE001",
        customer_id: "CUST_A",
        service_type: "SERVICE_X",
        period: "2024-01",
        appointment_count: 5,
        contract_count: 2,
        unit_price: 10000,
        is_billable: true,
        created_at: "2024-01-15T10:00:00Z",
      },
      {
        sales_id: "SALE002",
        customer_id: "CUST_A",
        service_type: "SERVICE_Y",
        period: "2024-01",
        appointment_count: 3,
        contract_count: 1,
        unit_price: 15000,
        is_billable: true,
        created_at: "2024-01-16T11:30:00Z",
      },
      {
        sales_id: "SALE003",
        customer_id: "CUST_B",
        service_type: "SERVICE_X",
        period: "2024-01",
        appointment_count: 8,
        contract_count: 3,
        unit_price: 10000,
        is_billable: true,
        created_at: "2024-01-17T09:15:00Z",
      },
      {
        sales_id: "SALE004",
        customer_id: "CUST_B",
        service_type: "SERVICE_Z",
        period: "2024-01",
        appointment_count: 2,
        contract_count: 1,
        unit_price: 20000,
        is_billable: true,
        created_at: "2024-01-18T14:45:00Z",
      },
      {
        sales_id: "SALE005",
        customer_id: "CUST_C",
        service_type: "SERVICE_Y",
        period: "2024-01",
        appointment_count: 1,
        contract_count: 0,
        unit_price: 15000,
        is_billable: false,
        created_at: "2024-01-19T13:20:00Z",
      },
    ];

    // ステップ1: 請求対象項目の自動抽出
    const extracted_items = extractBillableItems(sales_data);

    // 期待値: billable=true のもののみ抽出（SALE005は除外）
    expect(extracted_items).toHaveLength(4);
    expect(extracted_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sales_id: "SALE001",
          customer_id: "CUST_A",
          service_type: "SERVICE_X",
          period: "2024-01",
          appointment_count: 5,
          contract_count: 2,
          unit_price: 10000,
          is_billable: true,
        }),
        expect.objectContaining({
          sales_id: "SALE002",
          customer_id: "CUST_A",
          service_type: "SERVICE_Y",
          period: "2024-01",
          appointment_count: 3,
          contract_count: 1,
          unit_price: 15000,
          is_billable: true,
        }),
        expect.objectContaining({
          sales_id: "SALE003",
          customer_id: "CUST_B",
          service_type: "SERVICE_X",
          period: "2024-01",
          appointment_count: 8,
          contract_count: 3,
          unit_price: 10000,
          is_billable: true,
        }),
        expect.objectContaining({
          sales_id: "SALE004",
          customer_id: "CUST_B",
          service_type: "SERVICE_Z",
          period: "2024-01",
          appointment_count: 2,
          contract_count: 1,
          unit_price: 20000,
          is_billable: true,
        }),
      ])
    );

    // ステップ2: 抽出された請求対象項目が正確であることを確認
    const sale_001 = extracted_items.find((item) => item.sales_id === "SALE001");
    expect(sale_001?.period).toBe("2024-01");
    expect(sale_001?.service_type).toBe("SERVICE_X");
    expect(sale_001?.appointment_count).toBe(5);
    expect(sale_001?.contract_count).toBe(2);

    // ステップ3: 顧客ごとの請求額集計
    // 計算式: contract_count * unit_price
    // CUST_A: (2 * 10000) + (1 * 15000) = 20000 + 15000 = 35000
    // CUST_B: (3 * 10000) + (1 * 20000) = 30000 + 20000 = 50000
    const customer_billing = aggregateBillingAmountByCustomer(extracted_items);

    expect(customer_billing).toHaveLength(2);
    expect(customer_billing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer_id: "CUST_A",
          total_billing_amount: 35000,
          item_count: 2,
        }),
        expect.objectContaining({
          customer_id: "CUST_B",
          total_billing_amount: 50000,
          item_count: 2,
        }),
      ])
    );

    const cust_a_billing = customer_billing.find(
      (item) => item.customer_id === "CUST_A"
    );
    expect(cust_a_billing?.total_billing_amount).toBe(35000);
    expect(cust_a_billing?.item_count).toBe(2);

    const cust_b_billing = customer_billing.find(
      (item) => item.customer_id === "CUST_B"
    );
    expect(cust_b_billing?.total_billing_amount).toBe(50000);
    expect(cust_b_billing?.item_count).toBe(2);

    // ステップ4: サービスごとの請求額集計
    // SERVICE_X: (2 * 10000) + (3 * 10000) = 20000 + 30000 = 50000
    // SERVICE_Y: (1 * 15000) = 15000
    // SERVICE_Z: (1 * 20000) = 20000
    const service_billing = aggregateBillingAmountByService(extracted_items);

    expect(service_billing).toHaveLength(3);
    expect(service_billing).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          service_type: "SERVICE_X",
          total_billing_amount: 50000,
          item_count: 2,
        }),
        expect.objectContaining({
          service_type: "SERVICE_Y",
          total_billing_amount: 15000,
          item_count: 1,
        }),
        expect.objectContaining({
          service_type: "SERVICE_Z",
          total_billing_amount: 20000,
          item_count: 1,
        }),
      ])
    );

    const service_x_billing = service_billing.find(
      (item) => item.service_type === "SERVICE_X"
    );
    expect(service_x_billing?.total_billing_amount).toBe(50000);
    expect(service_x_billing?.item_count).toBe(2);

    const service_y_billing = service_billing.find(
      (item) => item.service_type === "SERVICE_Y"
    );
    expect(service_y_billing?.total_billing_amount).toBe(15000);
    expect(service_y_billing?.item_count).toBe(1);

    const service_z_billing = service_billing.find(
      (item) => item.service_type === "SERVICE_Z"
    );
    expect(service_z_billing?.total_billing_amount).toBe(20000);
    expect(service_z_billing?.item_count).toBe(1);

    // ステップ5: 顧客別・サービス別の請求データが相互に一致していることを検証
    const total_from_customer =
      35000 + 50000; /* CUST_A + CUST_B */
    const total_from_service =
      50000 + 15000 + 20000; /* SERVICE_X + SERVICE_Y + SERVICE_Z */
    expect(total_from_customer).toBe(85000);
    expect(total_from_service).toBe(85000);
    expect(total_from_customer).toBe(total_from_service);

    // ステップ6: 請求対象外項目（SALE005）が正しく除外されていることを確認
    const excluded_item = extracted_items.find(
      (item) => item.sales_id === "SALE005"
    );
    expect(excluded_item).toBeUndefined();

    // 最終検証: 抽出されたアイテム数が正確（4件、SALE005のみ除外）
    const non_billable_count = sales_data.filter(
      (item) => !item.is_billable
    ).length;
    expect(non_billable_count).toBe(1);
    expect(extracted_items.length).toBe(sales_data.length - non_billable_count);
  });
});