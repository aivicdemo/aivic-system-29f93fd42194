import { describe, test, expect, beforeEach } from "@jest/globals";
import { filterReportsByPortalDeliveryFlag } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-673: [error] 顧客別ポータル表示制御機能 - ポータル配信フラグが無効な場合、承認済みレポートは表示されない
  test("ポータル配信フラグが無効な場合、承認済みレポートを表示しない", () => {
    const customer_id = "CUST-001";
    const portal_delivery_flag = false;
    const approved_reports = [
      {
        report_id: "RPT-2024-001",
        customer_id: customer_id,
        report_name: "2024年1月営業成果レポート",
        status: "承認済み",
        generated_date: "2024-01-31T00:00:00Z",
      },
      {
        report_id: "RPT-2024-002",
        customer_id: customer_id,
        report_name: "2024年2月営業成果レポート",
        status: "承認済み",
        generated_date: "2024-02-29T00:00:00Z",
      },
      {
        report_id: "RPT-2024-003",
        customer_id: customer_id,
        report_name: "2024年3月営業成果レポート",
        status: "承認済み",
        generated_date: "2024-03-31T00:00:00Z",
      },
    ];

    const filtered_reports = filterReportsByPortalDeliveryFlag({
      customer_id: customer_id,
      portal_delivery_flag: portal_delivery_flag,
      approved_reports: approved_reports,
    });

    expect(filtered_reports).toEqual({
      displayable_reports: [],
      is_display_allowed: false,
      message: "配信対象外です",
      error: null,
    });
  });

  test("ポータル配信フラグが有効な場合、承認済みレポートを表示する", () => {
    const customer_id = "CUST-002";
    const portal_delivery_flag = true;
    const approved_reports = [
      {
        report_id: "RPT-2024-004",
        customer_id: customer_id,
        report_name: "2024年1月営業成果レポート",
        status: "承認済み",
        generated_date: "2024-01-31T00:00:00Z",
      },
      {
        report_id: "RPT-2024-005",
        customer_id: customer_id,
        report_name: "2024年2月営業成果レポート",
        status: "承認済み",
        generated_date: "2024-02-29T00:00:00Z",
      },
    ];

    const filtered_reports = filterReportsByPortalDeliveryFlag({
      customer_id: customer_id,
      portal_delivery_flag: portal_delivery_flag,
      approved_reports: approved_reports,
    });

    expect(filtered_reports).toEqual({
      displayable_reports: approved_reports,
      is_display_allowed: true,
      message: null,
      error: null,
    });
    expect(filtered_reports.displayable_reports.length).toBe(2);
  });

  test("顧客IDが一致しないレポートは除外する", () => {
    const customer_id = "CUST-003";
    const portal_delivery_flag = true;
    const approved_reports = [
      {
        report_id: "RPT-2024-006",
        customer_id: "CUST-003",
        report_name: "2024年1月営業成果レポート",
        status: "承認済み",
        generated_date: "2024-01-31T00:00:00Z",
      },
      {
        report_id: "RPT-2024-007",
        customer_id: "CUST-999",
        report_name: "2024年2月営業成果レポート",
        status: "承認済み",
        generated_date: "2024-02-29T00:00:00Z",
      },
    ];

    const filtered_reports = filterReportsByPortalDeliveryFlag({
      customer_id: customer_id,
      portal_delivery_flag: portal_delivery_flag,
      approved_reports: approved_reports,
    });

    expect(filtered_reports.displayable_reports.length).toBe(1);
    expect(filtered_reports.displayable_reports[0].report_id).toBe(
      "RPT-2024-006"
    );
  });

  test("承認済み以外のレポートは除外する", () => {
    const customer_id = "CUST-004";
    const portal_delivery_flag = true;
    const approved_reports = [
      {
        report_id: "RPT-2024-008",
        customer_id: customer_id,
        report_name: "2024年1月営業成果レポート",
        status: "承認済み",
        generated_date: "2024-01-31T00:00:00Z",
      },
      {
        report_id: "RPT-2024-009",
        customer_id: customer_id,
        report_name: "2024年2月営業成果レポート",
        status: "差戻し",
        generated_date: "2024-02-29T00:00:00Z",
      },
      {
        report_id: "RPT-2024-010",
        customer_id: customer_id,
        report_name: "2024年3月営業成果レポート",
        status: "生成中",
        generated_date: "2024-03-31T00:00:00Z",
      },
    ];

    const filtered_reports = filterReportsByPortalDeliveryFlag({
      customer_id: customer_id,
      portal_delivery_flag: portal_delivery_flag,
      approved_reports: approved_reports,
    });

    expect(filtered_reports.displayable_reports.length).toBe(1);
    expect(filtered_reports.displayable_reports[0].status).toBe("承認済み");
  });

  test("レポートが存在しない場合は空配列を返す", () => {
    const customer_id = "CUST-005";
    const portal_delivery_flag = true;
    const approved_reports: any[] = [];

    const filtered_reports = filterReportsByPortalDeliveryFlag({
      customer_id: customer_id,
      portal_delivery_flag: portal_delivery_flag,
      approved_reports: approved_reports,
    });

    expect(filtered_reports).toEqual({
      displayable_reports: [],
      is_display_allowed: true,
      message: null,
      error: null,
    });
  });

  test("必須パラメータが不足する場合、エラーを返す", () => {
    const filtered_reports = filterReportsByPortalDeliveryFlag({
      customer_id: undefined as any,
      portal_delivery_flag: true,
      approved_reports: [],
    });

    expect(filtered_reports.error).toBeDefined();
    expect(filtered_reports.error).toMatch(/顧客ID/);
  });

  test("portal_delivery_flagが未定義の場合、エラーを返す", () => {
    const filtered_reports = filterReportsByPortalDeliveryFlag({
      customer_id: "CUST-006",
      portal_delivery_flag: undefined as any,
      approved_reports: [],
    });

    expect(filtered_reports.error).toBeDefined();
    expect(filtered_reports.error).toMatch(/配信フラグ/);
  });
});