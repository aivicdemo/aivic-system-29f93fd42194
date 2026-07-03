import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { distributeApprovedReportOnSchedule } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-687
  test("承認されたレポートが定義されたスケジュールに従い顧客企業向けポータルに自動配信される", () => {
    const report_id = "RPT-2024-01-001";
    const report_title = "月次営業成果レポート";
    const report_status = "承認済み";
    const report_content = {
      customer_id: "CUST-001",
      report_month: "2024-01",
      apo_count: 15,
      contract_count: 3,
      customer_response_rate: 0.92,
    };
    const schedule_date = "2024-01-15T09:00:00Z";
    const schedule_frequency = "monthly";
    const distribution_target_customers = ["CUST-001", "CUST-002"];
    const portal_enabled = true;
    const distribution_log_id = "LOG-2024-01-15-001";

    const result = distributeApprovedReportOnSchedule({
      report_id,
      report_title,
      report_status,
      report_content,
      schedule_date,
      schedule_frequency,
      distribution_target_customers,
      portal_enabled,
    });

    expect(result.success).toBe(true);
    expect(result.distributed_report_id).toBe(report_id);
    expect(result.distribution_status).toBe("成功");
    expect(result.distribution_timestamp).toBe(schedule_date);
    expect(result.distributed_customer_count).toBe(2);
    expect(result.distributed_customers).toEqual(distribution_target_customers);
    expect(result.portal_delivery_confirmed).toBe(true);
    expect(result.report_content_integrity).toBe(true);
    expect(result.report_format_valid).toBe(true);
    expect(result.delivery_metadata).toEqual({
      delivery_datetime: schedule_date,
      delivery_source: "自動配信システム",
      frequency: schedule_frequency,
    });
    expect(result.distribution_log_status).toBe("成功");
    expect(result.distribution_log_id).toBeDefined();
    expect(typeof result.distribution_log_id).toBe("string");
  });

  test("承認ステータスでない場合配信を実行しない", () => {
    const report_id = "RPT-2024-01-002";
    const report_title = "月次営業成果レポート";
    const report_status = "差戻し";
    const report_content = {
      customer_id: "CUST-003",
      report_month: "2024-01",
      apo_count: 10,
      contract_count: 2,
      customer_response_rate: 0.85,
    };
    const schedule_date = "2024-01-15T09:00:00Z";
    const schedule_frequency = "monthly";
    const distribution_target_customers = ["CUST-003"];
    const portal_enabled = true;

    expect(() => {
      distributeApprovedReportOnSchedule({
        report_id,
        report_title,
        report_status,
        report_content,
        schedule_date,
        schedule_frequency,
        distribution_target_customers,
        portal_enabled,
      });
    }).toThrow(/承認/);
  });

  test("ポータル配信が無効な場合配信を実行しない", () => {
    const report_id = "RPT-2024-01-003";
    const report_title = "月次営業成果レポート";
    const report_status = "承認済み";
    const report_content = {
      customer_id: "CUST-004",
      report_month: "2024-01",
      apo_count: 12,
      contract_count: 2,
      customer_response_rate: 0.88,
    };
    const schedule_date = "2024-01-15T09:00:00Z";
    const schedule_frequency = "monthly";
    const distribution_target_customers = ["CUST-004"];
    const portal_enabled = false;

    expect(() => {
      distributeApprovedReportOnSchedule({
        report_id,
        report_title,
        report_status,
        report_content,
        schedule_date,
        schedule_frequency,
        distribution_target_customers,
        portal_enabled,
      });
    }).toThrow(/ポータル/);
  });

  test("配信対象顧客が空の場合配信を実行しない", () => {
    const report_id = "RPT-2024-01-004";
    const report_title = "月次営業成果レポート";
    const report_status = "承認済み";
    const report_content = {
      customer_id: "CUST-005",
      report_month: "2024-01",
      apo_count: 8,
      contract_count: 1,
      customer_response_rate: 0.80,
    };
    const schedule_date = "2024-01-15T09:00:00Z";
    const schedule_frequency = "monthly";
    const distribution_target_customers: string[] = [];
    const portal_enabled = true;

    expect(() => {
      distributeApprovedReportOnSchedule({
        report_id,
        report_title,
        report_status,
        report_content,
        schedule_date,
        schedule_frequency,
        distribution_target_customers,
        portal_enabled,
      });
    }).toThrow(/顧客/);
  });

  test("複数顧客への配信を正確に実行し各顧客に対応したログを記録する", () => {
    const report_id = "RPT-2024-02-001";
    const report_title = "月次営業成果レポート";
    const report_status = "承認済み";
    const report_content = {
      customer_id: "CUST-MULTI",
      report_month: "2024-02",
      apo_count: 25,
      contract_count: 5,
      customer_response_rate: 0.95,
    };
    const schedule_date = "2024-02-15T10:00:00Z";
    const schedule_frequency = "monthly";
    const distribution_target_customers = [
      "CUST-006",
      "CUST-007",
      "CUST-008",
      "CUST-009",
    ];
    const portal_enabled = true;

    const result = distributeApprovedReportOnSchedule({
      report_id,
      report_title,
      report_status,
      report_content,
      schedule_date,
      schedule_frequency,
      distribution_target_customers,
      portal_enabled,
    });

    expect(result.success).toBe(true);
    expect(result.distributed_customer_count).toBe(4);
    expect(result.distribution_status).toBe("成功");
    expect(result.distributed_customers.length).toBe(4);
    expect(result.distributed_customers).toEqual(distribution_target_customers);
  });

  test("レポートコンテンツが破損している場合配信を実行しない", () => {
    const report_id = "RPT-2024-03-001";
    const report_title = "月次営業成果レポート";
    const report_status = "承認済み";
    const report_content = null as any;
    const schedule_date = "2024-03-15T09:00:00Z";
    const schedule_frequency = "monthly";
    const distribution_target_customers = ["CUST-010"];
    const portal_enabled = true;

    expect(() => {
      distributeApprovedReportOnSchedule({
        report_id,
        report_title,
        report_status,
        report_content,
        schedule_date,
        schedule_frequency,
        distribution_target_customers,
        portal_enabled,
      });
    }).toThrow(/コンテンツ/);
  });

  test("スケジュール日時が過去の場合配信を実行しない", () => {
    const report_id = "RPT-2024-04-001";
    const report_title = "月次営業成果レポート";
    const report_status = "承認済み";
    const report_content = {
      customer_id: "CUST-011",
      report_month: "2024-04",
      apo_count: 20,
      contract_count: 4,
      customer_response_rate: 0.90,
    };
    const schedule_date = "2020-01-15T09:00:00Z";
    const schedule_frequency = "monthly";
    const distribution_target_customers = ["CUST-011"];
    const portal_enabled = true;

    expect(() => {
      distributeApprovedReportOnSchedule({
        report_id,
        report_title,
        report_status,
        report_content,
        schedule_date,
        schedule_frequency,
        distribution_target_customers,
        portal_enabled,
      });
    }).toThrow(/スケジュール/);
  });
});