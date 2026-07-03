import { extractSalesDataByDateRange } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 顧客質問対応根拠データ自動抽出", () => {
  // SCEN-1020
  test("指定期間内のデータのみを対象に、境界日時のレコードが正確に抽出される", () => {
    const period_start = new Date("2024-01-01T00:00:00Z");
    const period_end = new Date("2024-01-31T23:59:59Z");

    const test_records = [
      {
        record_id: 1,
        customer_id: "CUST-001",
        sales_activity_date: new Date("2023-12-31T23:59:59Z"),
        apo_count: 1,
        contract_count: 0,
      },
      {
        record_id: 2,
        customer_id: "CUST-001",
        sales_activity_date: new Date("2024-01-01T00:00:00Z"),
        apo_count: 2,
        contract_count: 1,
      },
      {
        record_id: 3,
        customer_id: "CUST-001",
        sales_activity_date: new Date("2024-01-15T12:30:00Z"),
        apo_count: 3,
        contract_count: 1,
      },
      {
        record_id: 4,
        customer_id: "CUST-001",
        sales_activity_date: new Date("2024-01-20T09:15:00Z"),
        apo_count: 2,
        contract_count: 2,
      },
      {
        record_id: 5,
        customer_id: "CUST-001",
        sales_activity_date: new Date("2024-01-31T23:59:59Z"),
        apo_count: 1,
        contract_count: 0,
      },
      {
        record_id: 6,
        customer_id: "CUST-001",
        sales_activity_date: new Date("2024-02-01T00:00:00Z"),
        apo_count: 4,
        contract_count: 2,
      },
    ];

    const result = extractSalesDataByDateRange(
      test_records,
      period_start,
      period_end,
      "CUST-001"
    );

    expect(result.extracted_count).toBe(4);
    expect(result.total_apo_count).toBe(8);
    expect(result.total_contract_count).toBe(4);
    expect(result.records.length).toBe(4);

    expect(result.records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: 2,
          sales_activity_date: new Date("2024-01-01T00:00:00Z"),
          apo_count: 2,
        }),
        expect.objectContaining({
          record_id: 3,
          sales_activity_date: new Date("2024-01-15T12:30:00Z"),
          apo_count: 3,
        }),
        expect.objectContaining({
          record_id: 4,
          sales_activity_date: new Date("2024-01-20T09:15:00Z"),
          apo_count: 2,
        }),
        expect.objectContaining({
          record_id: 5,
          sales_activity_date: new Date("2024-01-31T23:59:59Z"),
          apo_count: 1,
        }),
      ])
    );

    const boundary_before = result.records.find((r) => r.record_id === 1);
    const boundary_after = result.records.find((r) => r.record_id === 6);

    expect(boundary_before).toBeUndefined();
    expect(boundary_after).toBeUndefined();

    const has_start_boundary = result.records.some(
      (r) => r.record_id === 2 && r.sales_activity_date.getTime() === period_start.getTime()
    );
    const has_end_boundary = result.records.some(
      (r) => r.record_id === 5 && r.sales_activity_date.getTime() === period_end.getTime()
    );

    expect(has_start_boundary).toBe(true);
    expect(has_end_boundary).toBe(true);
  });
});