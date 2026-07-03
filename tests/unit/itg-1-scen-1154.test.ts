import { searchSalesActivities } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業活動データ検索・抽出機能", () => {
  // SCEN-1154
  test("指定期間・顧客・営業担当者で営業活動データが正確に抽出される", () => {
    const start_date = "2024-01-01";
    const end_date = "2024-01-31";
    const customer_id = "CUST001";
    const sales_rep_id = "REP001";

    const search_input = {
      period_start: start_date,
      period_end: end_date,
      customer_id: customer_id,
      sales_rep_id: sales_rep_id,
    };

    const expected_records = [
      {
        activity_id: "ACT001",
        activity_date: "2024-01-05",
        customer_id: "CUST001",
        customer_name: "顧客A",
        sales_rep_id: "REP001",
        sales_rep_name: "営業太郎",
        activity_type: "アポイント",
        result_status: "成約",
        notes: "初回訪問",
      },
      {
        activity_id: "ACT002",
        activity_date: "2024-01-15",
        customer_id: "CUST001",
        customer_name: "顧客A",
        sales_rep_id: "REP001",
        sales_rep_name: "営業太郎",
        activity_type: "電話",
        result_status: "進行中",
        notes: "提案資料送付",
      },
      {
        activity_id: "ACT003",
        activity_date: "2024-01-22",
        customer_id: "CUST001",
        customer_name: "顧客A",
        sales_rep_id: "REP001",
        sales_rep_name: "営業太郎",
        activity_type: "メール",
        result_status: "成約",
        notes: "契約締結",
      },
    ];

    const result = searchSalesActivities(search_input);

    expect(result.total_count).toBe(3);
    expect(result.records.length).toBe(3);

    result.records.forEach((record, index) => {
      const expected = expected_records[index];
      expect(record.activity_id).toBe(expected.activity_id);
      expect(record.activity_date).toBe(expected.activity_date);
      expect(record.customer_id).toBe(expected.customer_id);
      expect(record.customer_name).toBe(expected.customer_name);
      expect(record.sales_rep_id).toBe(expected.sales_rep_id);
      expect(record.sales_rep_name).toBe(expected.sales_rep_name);
      expect(record.activity_type).toBe(expected.activity_type);
      expect(record.result_status).toBe(expected.result_status);
    });

    const activity_date_1 = new Date(result.records[0].activity_date);
    const activity_date_3 = new Date(result.records[2].activity_date);
    const period_start = new Date(start_date);
    const period_end = new Date(end_date);

    expect(activity_date_1.getTime()).toBeGreaterThanOrEqual(period_start.getTime());
    expect(activity_date_1.getTime()).toBeLessThanOrEqual(period_end.getTime());
    expect(activity_date_3.getTime()).toBeGreaterThanOrEqual(period_start.getTime());
    expect(activity_date_3.getTime()).toBeLessThanOrEqual(period_end.getTime());

    result.records.forEach((record) => {
      expect(record.customer_id).toBe(customer_id);
      expect(record.sales_rep_id).toBe(sales_rep_id);
    });

    const csv_export = result.csv_export;
    expect(csv_export).toBeDefined();
    expect(csv_export).toContain("activity_id");
    expect(csv_export).toContain("activity_date");
    expect(csv_export).toContain("customer_name");
    expect(csv_export).toContain("sales_rep_name");
    expect(csv_export).toContain("ACT001");
    expect(csv_export).toContain("2024-01-05");
    expect(csv_export).toContain("顧客A");
    expect(csv_export).toContain("営業太郎");

    const csv_lines = csv_export.split("\n").filter((line) => line.trim().length > 0);
    expect(csv_lines.length).toBe(4);
  });
});