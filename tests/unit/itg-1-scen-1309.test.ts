import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { submitMonthlySummaryTemplateReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("Monthly Summary Template Report Distribution - Empty Customer List", () => {
  let mockDatabase: any;
  let mockLogger: any;

  beforeEach(() => {
    mockDatabase = {
      reports: [],
      skip_records: [],
      insertSkipRecord: function (record: any) {
        this.skip_records.push(record);
      },
      getReportDistributionRecords: function () {
        return this.reports;
      },
      getSkipRecords: function () {
        return this.skip_records;
      },
    };

    mockLogger = {
      logs: [],
      error: function (msg: string) {
        this.logs.push({ level: "error", message: msg });
      },
      info: function (msg: string) {
        this.logs.push({ level: "info", message: msg });
      },
      getErrorLogs: function () {
        return this.logs.filter((l: any) => l.level === "error");
      },
    };
  });

  afterEach(() => {
    mockDatabase = null;
    mockLogger = null;
  });

  test("SCEN-1309: Report distribution should be skipped and skip record created when no target customers", async () => {
    const report_id = "RPT-20240115-001";
    const template_id = "TMPL-MONTHLY-001";
    const execution_timestamp = new Date("2024-01-15T09:00:00Z");
    const target_customers: any[] = [];
    const skip_reason = "対象顧客なし";
    const expected_skip_count = 1;
    const expected_target_customer_count = 0;

    const result = await submitMonthlySummaryTemplateReport({
      report_id,
      template_id,
      execution_timestamp,
      target_customers,
      database: mockDatabase,
      logger: mockLogger,
    });

    expect(result.distribution_status).toBe("SKIPPED");
    expect(result.skip_reason).toBe(skip_reason);
    expect(result.target_customer_count).toBe(expected_target_customer_count);

    const skip_records = mockDatabase.getSkipRecords();
    expect(skip_records).toHaveLength(expected_skip_count);

    const skip_record = skip_records[0];
    expect(skip_record.report_id).toBe(report_id);
    expect(skip_record.template_id).toBe(template_id);
    expect(skip_record.skip_reason).toBe(skip_reason);
    expect(skip_record.target_customer_count).toBe(expected_target_customer_count);
    expect(skip_record.execution_timestamp).toEqual(execution_timestamp);

    const error_logs = mockLogger.getErrorLogs();
    expect(error_logs).toHaveLength(0);

    const distribution_records = mockDatabase.getReportDistributionRecords();
    expect(distribution_records).toHaveLength(0);

    expect(result.status).toBe("SUCCESS");
  });
});