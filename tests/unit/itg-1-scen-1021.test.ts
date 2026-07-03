import { describe, test, expect } from "@jest/globals";
import {
  confirmMonthlyReportPeriod,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1021: 月次レポート作成期間確定・集計開始機能 - 月次レポート作成開始日時が確定され、その期間内のデータのみが集計対象として自動抽出される", () => {
    const period_start_dt = new Date("2024-01-01T00:00:00Z");
    const period_end_dt = new Date("2024-01-31T23:59:59Z");
    const user_id = "USR001";
    const organization_id = "ORG001";

    const sales_data_in_period = [
      {
        sales_data_id: "SD001",
        customer_id: "CUST001",
        transaction_dt: new Date("2024-01-15T10:30:00Z"),
        amount: 100000,
        service_type: "serviceA",
        status: "completed",
      },
      {
        sales_data_id: "SD002",
        customer_id: "CUST002",
        transaction_dt: new Date("2024-01-20T14:00:00Z"),
        amount: 50000,
        service_type: "serviceB",
        status: "completed",
      },
    ];

    const sales_data_out_of_period = [
      {
        sales_data_id: "SD003",
        customer_id: "CUST003",
        transaction_dt: new Date("2023-12-31T23:59:59Z"),
        amount: 75000,
        service_type: "serviceA",
        status: "completed",
      },
      {
        sales_data_id: "SD004",
        customer_id: "CUST004",
        transaction_dt: new Date("2024-02-01T00:00:00Z"),
        amount: 25000,
        service_type: "serviceC",
        status: "completed",
      },
    ];

    const all_sales_data = [
      ...sales_data_in_period,
      ...sales_data_out_of_period,
    ];

    const result = confirmMonthlyReportPeriod({
      period_start_dt,
      period_end_dt,
      user_id,
      organization_id,
      all_sales_data,
    });

    expect(result).toEqual({
      period_confirmed: true,
      period_start_dt: new Date("2024-01-01T00:00:00Z"),
      period_end_dt: new Date("2024-01-31T23:59:59Z"),
      extracted_data_count: 2,
      extracted_sales_data: expect.arrayContaining([
        expect.objectContaining({
          sales_data_id: "SD001",
          transaction_dt: new Date("2024-01-15T10:30:00Z"),
        }),
        expect.objectContaining({
          sales_data_id: "SD002",
          transaction_dt: new Date("2024-01-20T14:00:00Z"),
        }),
      ]),
      filtered_out_count: 2,
      aggregation_started: true,
      system_message: expect.stringMatching(/期間確定|集計処理開始|データ抽出/),
      confirmation_timestamp: expect.any(Date),
      status: "aggregation_in_progress",
    });

    expect(result.extracted_data_count).toBe(2);
    expect(result.filtered_out_count).toBe(2);
    expect(result.period_confirmed).toBe(true);
    expect(result.aggregation_started).toBe(true);
    expect(result.status).toBe("aggregation_in_progress");
    expect(result.extracted_sales_data.length).toBe(2);

    result.extracted_sales_data.forEach((data: any) => {
      expect(data.transaction_dt.getTime()).toBeGreaterThanOrEqual(
        period_start_dt.getTime()
      );
      expect(data.transaction_dt.getTime()).toBeLessThanOrEqual(
        period_end_dt.getTime()
      );
    });
  });
});