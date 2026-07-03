import { generateMonthlySalesySummary } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-900: 営業活動データが不完全な場合は集計エラーが検出される", () => {
    // 不完全なデータ（顧客名が空、売上金額がnull、取引日が未入力）
    const incompleteActivities = [
      {
        id: "activity_001",
        customer_name: "",
        sales_amount: 50000,
        transaction_date: "2024-01-15",
      },
      {
        id: "activity_002",
        customer_name: "顧客A",
        sales_amount: null,
        transaction_date: "2024-01-16",
      },
      {
        id: "activity_003",
        customer_name: "顧客B",
        sales_amount: 75000,
        transaction_date: "",
      },
      {
        id: "activity_004",
        customer_name: "顧客C",
        sales_amount: 100000,
        transaction_date: "2024-01-17",
      },
      {
        id: "activity_005",
        customer_name: "顧客D",
        sales_amount: 60000,
        transaction_date: "2024-01-18",
      },
    ];

    const result = generateMonthlySalesySummary(incompleteActivities);

    // エラーステータスが返却されることを確認
    expect(result.status).toBe("error");

    // エラーメッセージに「データ品質エラー」として分類されていることを確認
    expect(result.error_message).toMatch(/データ品質エラー/);

    // 集計対象外となったレコードIDのリストが返却されることを確認
    expect(result.excluded_record_ids).toContain("activity_001");
    expect(result.excluded_record_ids).toContain("activity_002");
    expect(result.excluded_record_ids).toContain("activity_003");
    expect(result.excluded_record_ids.length).toBe(3);

    // エラーログに対象レコードIDと不完全な項目が明記されていることを確認
    expect(result.error_details).toBeDefined();
    expect(result.error_details[0].record_id).toBe("activity_001");
    expect(result.error_details[0].missing_fields).toContain("customer_name");
    expect(result.error_details[1].record_id).toBe("activity_002");
    expect(result.error_details[1].missing_fields).toContain("sales_amount");
    expect(result.error_details[2].record_id).toBe("activity_003");
    expect(result.error_details[2].missing_fields).toContain("transaction_date");

    // 不完全なデータが集計結果に含まれていないことを確認
    expect(result.aggregated_data).toBeDefined();
    expect(result.aggregated_data.total_sales).toBe(160000); // 100000 + 60000
    expect(result.aggregated_data.valid_record_count).toBe(2);

    // 正常なデータは引き続き集計されていることを確認
    expect(result.aggregated_data.records_by_customer).toBeDefined();
    expect(result.aggregated_data.records_by_customer["顧客C"]).toBe(100000);
    expect(result.aggregated_data.records_by_customer["顧客D"]).toBe(60000);

    // 機能の戻り値がエラーオブジェクト（error status）であることを検証
    expect(result).toHaveProperty("status");
    expect(result).toHaveProperty("error_message");
    expect(result).toHaveProperty("excluded_record_ids");
    expect(result).toHaveProperty("error_details");
    expect(result).toHaveProperty("aggregated_data");
  });
});