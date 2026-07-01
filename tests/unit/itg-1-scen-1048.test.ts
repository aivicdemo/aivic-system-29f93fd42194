import { defineMonthlyReportPeriod } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次レポート作成期間の自動確定と対象データ抽出", () => {
  test("SCEN-1048: 開始日時に到達したとき集計期間が正確に確定され、その期間内のデータのみが抽出される", () => {
    // 集計期間の設定: 2024年1月1日00:00:00 ～ 2024年1月31日23:59:59
    const period_start_date = new Date("2024-01-01T00:00:00Z");
    const period_end_date = new Date("2024-01-31T23:59:59Z");
    const current_timestamp = new Date("2024-01-01T00:00:00Z");

    // テスト対象データ: 期間内・期間外のデータを混在させる
    const test_sales_data = [
      {
        sales_activity_id: 1,
        customer_id: "CUST_001",
        activity_date: new Date("2023-12-31T23:59:59Z"), // 期間外（前）
        sales_count: 1,
        appointment_count: 2,
      },
      {
        sales_activity_id: 2,
        customer_id: "CUST_001",
        activity_date: new Date("2024-01-15T10:30:00Z"), // 期間内
        sales_count: 3,
        appointment_count: 5,
      },
      {
        sales_activity_id: 3,
        customer_id: "CUST_002",
        activity_date: new Date("2024-01-20T14:00:00Z"), // 期間内
        sales_count: 2,
        appointment_count: 4,
      },
      {
        sales_activity_id: 4,
        customer_id: "CUST_002",
        activity_date: new Date("2024-02-01T00:00:01Z"), // 期間外（後）
        sales_count: 1,
        appointment_count: 1,
      },
    ];

    // 関数実行
    const result = defineMonthlyReportPeriod({
      period_start_date,
      period_end_date,
      current_timestamp,
      sales_data_records: test_sales_data,
    });

    // 期待値: 期間内データのみが抽出されること
    expect(result.confirmed_period_start).toEqual(
      new Date("2024-01-01T00:00:00Z")
    );
    expect(result.confirmed_period_end).toEqual(
      new Date("2024-01-31T23:59:59Z")
    );

    // 抽出されたデータは期間内のみ（2件）
    expect(result.extracted_data_count).toBe(2);
    expect(result.extracted_records).toHaveLength(2);

    // 抽出されたデータの検証
    expect(result.extracted_records[0]).toEqual({
      sales_activity_id: 2,
      customer_id: "CUST_001",
      activity_date: new Date("2024-01-15T10:30:00Z"),
      sales_count: 3,
      appointment_count: 5,
    });

    expect(result.extracted_records[1]).toEqual({
      sales_activity_id: 3,
      customer_id: "CUST_002",
      activity_date: new Date("2024-01-20T14:00:00Z"),
      sales_count: 2,
      appointment_count: 4,
    });

    // 期間開始前のデータが除外されていることを確認
    const before_period_data = result.extracted_records.filter(
      (record) =>
        record.activity_date.getTime() < period_start_date.getTime()
    );
    expect(before_period_data).toHaveLength(0);

    // 期間終了後のデータが除外されていることを確認
    const after_period_data = result.extracted_records.filter(
      (record) => record.activity_date.getTime() > period_end_date.getTime()
    );
    expect(after_period_data).toHaveLength(0);

    // 確定フラグ
    expect(result.is_period_confirmed).toBe(true);

    // 集計期間確定のタイムスタンプ
    expect(result.confirmed_at).toEqual(new Date("2024-01-01T00:00:00Z"));
  });
});