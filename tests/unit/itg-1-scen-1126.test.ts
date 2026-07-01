import { describe, test, expect } from "@jest/globals";
import { validateSalesDataAggregation } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1126: [normal] 月次営業データ集計検証機能 - 集計対象期間の営業データ必須項目がすべて揃い、データ型が正確な場合、集計完了と判定される
  test("月次営業データ集計検証 - 必須項目完全・データ型正確な場合、集計完了と判定", () => {
    // テストデータ準備：集計対象期間内（2024-01-01～2024-01-31）の営業データサンプル
    const sampleSalesData = [
      {
        sales_date: "2024-01-05",
        sales_representative_id: "SR001",
        customer_id: "CUST001",
        transaction_amount: 150000,
        transaction_count: 3,
        product_category: "ProductA",
        status: "completed",
      },
      {
        sales_date: "2024-01-10",
        sales_representative_id: "SR002",
        customer_id: "CUST002",
        transaction_amount: 250000,
        transaction_count: 5,
        product_category: "ProductB",
        status: "completed",
      },
      {
        sales_date: "2024-01-15",
        sales_representative_id: "SR001",
        customer_id: "CUST003",
        transaction_amount: 180000,
        transaction_count: 4,
        product_category: "ProductC",
        status: "completed",
      },
      {
        sales_date: "2024-01-20",
        sales_representative_id: "SR003",
        customer_id: "CUST001",
        transaction_amount: 220000,
        transaction_count: 2,
        product_category: "ProductA",
        status: "completed",
      },
    ];

    const aggregation_start_date = "2024-01-01";
    const aggregation_end_date = "2024-01-31";

    // 集計検証関数を実行
    const result = validateSalesDataAggregation(
      sampleSalesData,
      aggregation_start_date,
      aggregation_end_date
    );

    // 集計ステータスが『集計完了』と判定されていることを確認
    expect(result.aggregation_status).toBe("aggregation_completed");

    // 集計期間が正確に含まれていることを確認
    expect(result.aggregation_period_start).toBe("2024-01-01");
    expect(result.aggregation_period_end).toBe("2024-01-31");

    // 集計件数が正確であることを確認：サンプルは4件
    expect(result.aggregated_record_count).toBe(4);

    // 合計金額が正確に計算されていることを確認：150000 + 250000 + 180000 + 220000 = 800000
    expect(result.total_transaction_amount).toBe(800000);

    // 合計取引件数が正確に計算されていることを確認：3 + 5 + 4 + 2 = 14
    expect(result.total_transaction_count).toBe(14);

    // データ型の検証結果が正確であることを確認
    expect(result.data_type_validation_passed).toBe(true);

    // 必須項目完全性の検証結果が正確であることを確認
    expect(result.required_fields_validation_passed).toBe(true);

    // サマリー情報に必要なフィールドがすべて含まれていることを確認
    expect(result).toHaveProperty("aggregation_status");
    expect(result).toHaveProperty("aggregation_period_start");
    expect(result).toHaveProperty("aggregation_period_end");
    expect(result).toHaveProperty("aggregated_record_count");
    expect(result).toHaveProperty("total_transaction_amount");
    expect(result).toHaveProperty("total_transaction_count");
    expect(result).toHaveProperty("data_type_validation_passed");
    expect(result).toHaveProperty("required_fields_validation_passed");
  });
});