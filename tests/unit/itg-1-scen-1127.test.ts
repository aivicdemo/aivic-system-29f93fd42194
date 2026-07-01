import { validateMonthlyAggregation } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  // SCEN-1127
  test("月次営業データ集計検証機能 - 集計期間内に必須項目が空のレコードが存在する場合、集計完了不可と判定される", () => {
    // Arrange: テストデータベースに集計期間内の営業データレコード10件を準備
    const aggregationPeriod = {
      start_date: "2024-01-01",
      end_date: "2024-01-31",
    };

    const salesRecords = [
      {
        record_id: 1,
        customer_id: "CUST001",
        sales_amount: 100000,
        transaction_date: "2024-01-05",
        service_type: "ServiceA",
      },
      {
        record_id: 2,
        customer_id: "CUST002",
        sales_amount: 150000,
        transaction_date: "2024-01-10",
        service_type: "ServiceB",
      },
      {
        record_id: 3,
        customer_id: null, // 必須項目が空（エラー対象1）
        sales_amount: 120000,
        transaction_date: "2024-01-12",
        service_type: "ServiceA",
      },
      {
        record_id: 4,
        customer_id: "CUST004",
        sales_amount: 200000,
        transaction_date: "2024-01-15",
        service_type: "ServiceC",
      },
      {
        record_id: 5,
        customer_id: "CUST005",
        sales_amount: "", // 必須項目が空（エラー対象2）
        transaction_date: "2024-01-18",
        service_type: "ServiceB",
      },
      {
        record_id: 6,
        customer_id: "CUST006",
        sales_amount: 180000,
        transaction_date: "2024-01-20",
        service_type: "ServiceA",
      },
      {
        record_id: 7,
        customer_id: "CUST007",
        sales_amount: 95000,
        transaction_date: null, // 必須項目が空（エラー対象3）
        service_type: "ServiceC",
      },
      {
        record_id: 8,
        customer_id: "CUST008",
        sales_amount: 250000,
        transaction_date: "2024-01-22",
        service_type: "ServiceB",
      },
      {
        record_id: 9,
        customer_id: "CUST009",
        sales_amount: 110000,
        transaction_date: "2024-01-25",
        service_type: "ServiceA",
      },
      {
        record_id: 10,
        customer_id: "CUST010",
        sales_amount: 160000,
        transaction_date: "2024-01-28",
        service_type: "ServiceC",
      },
    ];

    const required_fields = ["customer_id", "sales_amount", "transaction_date"];

    // Act: 月次営業データ集計検証機能を実行
    const result = validateMonthlyAggregation({
      aggregation_period: aggregationPeriod,
      sales_records: salesRecords,
      required_fields: required_fields,
    });

    // Assert: 検証ステータスが'NG'であることを確認
    expect(result.validation_status).toBe("NG");

    // 集計完了フラグがfalseであることを確認
    expect(result.is_aggregation_complete).toBe(false);

    // エラーレコード件数が3であることを確認
    expect(result.error_record_count).toBe(3);

    // エラー詳細に不足項目を含むレコードIDが記録されていることを確認
    expect(result.error_details).toBeDefined();
    expect(result.error_details.length).toBe(3);

    // エラー詳細の内容を確認（レコード3: customer_id がnull）
    expect(result.error_details[0]).toEqual({
      record_id: 3,
      missing_field: "customer_id",
      record_values: {
        customer_id: null,
        sales_amount: 120000,
        transaction_date: "2024-01-12",
      },
    });

    // エラー詳細の内容を確認（レコード5: sales_amount が空文字列）
    expect(result.error_details[1]).toEqual({
      record_id: 5,
      missing_field: "sales_amount",
      record_values: {
        customer_id: "CUST005",
        sales_amount: "",
        transaction_date: "2024-01-18",
      },
    });

    // エラー詳細の内容を確認（レコード7: transaction_date がnull）
    expect(result.error_details[2]).toEqual({
      record_id: 7,
      missing_field: "transaction_date",
      record_values: {
        customer_id: "CUST007",
        sales_amount: 95000,
        transaction_date: null,
      },
    });

    // エラーメッセージに件数情報が含まれていることを確認
    expect(result.error_message).toMatch(/3件/);
    expect(result.error_message).toMatch(/必須項目/);

    // データ集計処理が実行されていないことを確認（aggregated_dataがnullまたは空）
    expect(result.aggregated_data).toBeNull();
  });
});