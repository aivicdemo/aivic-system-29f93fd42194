import {
  validateSalesReportAccuracy,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業成果レポート内容妥当性判定", () => {
  // SCEN-1040
  test("レポート内の売上集計額が営業データの合計と不一致のとき異常が検出される", () => {
    // 営業データベースに複数の営業取引レコードを作成
    const sales_records = [
      {
        id: "sales_001",
        amount: 100000,
        transaction_date: "2024-01-10",
        customer_id: "cust_001",
        service_id: "svc_001",
      },
      {
        id: "sales_002",
        amount: 250000,
        transaction_date: "2024-01-15",
        customer_id: "cust_001",
        service_id: "svc_001",
      },
      {
        id: "sales_003",
        amount: 150000,
        transaction_date: "2024-01-20",
        customer_id: "cust_002",
        service_id: "svc_002",
      },
    ];

    // 合計売上額を計算
    const expected_total_amount = 500000; // 100000 + 250000 + 150000

    // 生成されたレポート内の売上集計額（意図的に不一致を発生）
    const report_data = {
      report_id: "rep_001",
      month: "2024-01",
      total_sales: 450000, // 誤りを挿入: 50000円少ない
      record_count: 3,
      customers_affected: ["cust_001", "cust_002"],
      period_start: "2024-01-01",
      period_end: "2024-01-31",
    };

    // 異常検知モジュールを実行
    const validation_result = validateSalesReportAccuracy({
      sales_records: sales_records,
      report_data: report_data,
      expected_total_amount: expected_total_amount,
    });

    // レポート内の売上集計額が営業データの合計と不一致であることが検出される
    expect(validation_result.is_accurate).toBe(false);

    // エラーフラグが立てられている
    expect(validation_result.has_error).toBe(true);

    // 不一致の詳細が含まれている
    expect(validation_result.discrepancy_amount).toBe(50000); // 500000 - 450000
    expect(validation_result.error_message).toMatch(/売上集計額/);
    expect(validation_result.error_message).toMatch(/不一致/);

    // 不一致の詳細（差異金額、対象期間、影響レコード数等）を確認
    expect(validation_result.details).toEqual({
      expected_amount: 500000,
      reported_amount: 450000,
      difference: 50000,
      affected_record_count: 3,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      affected_customers: ["cust_001", "cust_002"],
    });
  });
});