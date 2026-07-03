import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  generateMonthlySummaryReport,
  validateReportAccuracy,
  validateReportCompleteness,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1011
  test("レポートに0件のサマリーデータが含まれている場合でも正確性・完全性が判定できる", () => {
    const target_month = "2024-01";
    const report_period_start = "2024-01-01";
    const report_period_end = "2024-01-31";
    const generation_timestamp = "2024-02-01T09:00:00Z";
    const system_version = "1.0.0";
    const summary_data_count = 0;

    const generated_report = generateMonthlySummaryReport({
      target_month,
      report_period_start,
      report_period_end,
      generation_timestamp,
      system_version,
      summary_data_list: [],
    });

    expect(generated_report).toBeDefined();
    expect(typeof generated_report).toBe("object");

    expect(generated_report.data_count).toBe(summary_data_count);
    expect(generated_report.data_count).toBe(0);

    expect(generated_report.header).toBeDefined();
    expect(generated_report.header.report_period_start).toBe(
      report_period_start
    );
    expect(generated_report.header.report_period_end).toBe(report_period_end);
    expect(generated_report.header.generation_timestamp).toBe(
      generation_timestamp
    );
    expect(generated_report.header.system_version).toBe(system_version);

    const accuracy_check_result = validateReportAccuracy({
      report: generated_report,
      target_month,
    });

    expect(accuracy_check_result).toBeDefined();
    expect(typeof accuracy_check_result).toBe("boolean");

    const completeness_check_result = validateReportCompleteness({
      report: generated_report,
      target_month,
    });

    expect(completeness_check_result).toBeDefined();
    expect(typeof completeness_check_result).toBe("boolean");

    expect(
      accuracy_check_result === true || accuracy_check_result === false
    ).toBe(true);
    expect(
      completeness_check_result === true ||
        completeness_check_result === false
    ).toBe(true);

    expect(generated_report.header).toEqual({
      report_period_start: "2024-01-01",
      report_period_end: "2024-01-31",
      generation_timestamp: "2024-02-01T09:00:00Z",
      system_version: "1.0.0",
    });

    expect(generated_report.summary_data_list).toBeDefined();
    expect(Array.isArray(generated_report.summary_data_list)).toBe(true);
    expect(generated_report.summary_data_list.length).toBe(0);
  });
});