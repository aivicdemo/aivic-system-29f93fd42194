import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractAndAggregateBillingItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-745: [edge] 請求対象項目の自動抽出・集計 - 請求額がゼロ円の顧客・サービス組み合わせが正しく処理される
  test("請求額がゼロ円の顧客・サービス組み合わせは抽出・集計から除外され、別途管理レポートに記録される", () => {
    // 入力データ: 複数の営業データ（ゼロ円と非ゼロ円の混在）
    const input_sales_data = [
      {
        sales_data_id: 1,
        customer_id: 101,
        service_id: 201,
        appointment_count: 10,
        contract_count: 2,
        service_type: "standard",
        sales_amount: 50000,
      },
      {
        sales_data_id: 2,
        customer_id: 102,
        service_id: 202,
        appointment_count: 5,
        contract_count: 0,
        service_type: "premium",
        sales_amount: 0,
      },
      {
        sales_data_id: 3,
        customer_id: 101,
        service_id: 202,
        appointment_count: 0,
        contract_count: 0,
        service_type: "premium",
        sales_amount: 0,
      },
      {
        sales_data_id: 4,
        customer_id: 103,
        service_id: 201,
        appointment_count: 8,
        contract_count: 3,
        service_type: "standard",
        sales_amount: 75000,
      },
      {
        sales_data_id: 5,
        customer_id: 104,
        service_id: 203,
        appointment_count: 0,
        contract_count: 0,
        service_type: "basic",
        sales_amount: 0,
      },
    ];

    // 入力データ: 契約ルール（顧客ごと・サービスごと）
    const input_contract_rules = [
      {
        customer_id: 101,
        service_id: 201,
        unit_price: 5000,
        min_billing_amount: 0,
      },
      {
        customer_id: 102,
        service_id: 202,
        unit_price: 10000,
        min_billing_amount: 0,
      },
      {
        customer_id: 101,
        service_id: 202,
        unit_price: 8000,
        min_billing_amount: 0,
      },
      {
        customer_id: 103,
        service_id: 201,
        unit_price: 9000,
        min_billing_amount: 0,
      },
      {
        customer_id: 104,
        service_id: 203,
        unit_price: 12000,
        min_billing_amount: 0,
      },
    ];

    const input_params = {
      sales_data: input_sales_data,
      contract_rules: input_contract_rules,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
    };

    // 関数を実行
    const result = extractAndAggregateBillingItems(input_params);

    // 期待値: 集計対象データ（ゼロ円は除外）
    // 顧客101・サービス201: 50000円
    // 顧客103・サービス201: 75000円
    // 合計: 125000円
    expect(result.billing_items_included).toHaveLength(2);
    expect(result.billing_items_included).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer_id: 101,
          service_id: 201,
          billing_amount: 50000,
        }),
        expect.objectContaining({
          customer_id: 103,
          service_id: 201,
          billing_amount: 75000,
        }),
      ])
    );

    // 期待値: 集計結果（ゼロ円は除外）
    // 顧客101: 50000円
    // 顧客103: 75000円
    // 顧客102, 104: 除外
    expect(result.aggregated_by_customer).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer_id: 101,
          total_billing_amount: 50000,
        }),
        expect.objectContaining({
          customer_id: 103,
          total_billing_amount: 75000,
        }),
      ])
    );
    expect(result.aggregated_by_customer).toHaveLength(2);

    // 期待値: ゼロ円データは別途管理レポートに記録
    expect(result.zero_amount_report).toHaveLength(3);
    expect(result.zero_amount_report).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sales_data_id: 2,
          customer_id: 102,
          service_id: 202,
          billing_amount: 0,
          reason: "zero_sales_amount",
        }),
        expect.objectContaining({
          sales_data_id: 3,
          customer_id: 101,
          service_id: 202,
          billing_amount: 0,
          reason: "zero_sales_amount",
        }),
        expect.objectContaining({
          sales_data_id: 5,
          customer_id: 104,
          service_id: 203,
          billing_amount: 0,
          reason: "zero_sales_amount",
        }),
      ])
    );

    // 期待値: 請求データ出力にゼロ円データが含まれていないこと
    expect(result.billing_output).not.toContainEqual(
      expect.objectContaining({
        customer_id: 102,
        service_id: 202,
      })
    );
    expect(result.billing_output).not.toContainEqual(
      expect.objectContaining({
        customer_id: 101,
        service_id: 202,
      })
    );
    expect(result.billing_output).not.toContainEqual(
      expect.objectContaining({
        customer_id: 104,
        service_id: 203,
      })
    );

    // 期待値: 処理が正常に完了（エラーフラグなし）
    expect(result.processing_status).toBe("completed");
    expect(result.has_error).toBe(false);

    // 期待値: 集計対象外のゼロ円レコード数が記録されている
    expect(result.excluded_record_count).toBe(3);
    expect(result.included_record_count).toBe(2);
    expect(result.total_records_processed).toBe(5);
  });
});