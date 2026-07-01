import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  validateReportDataCompleteness,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1155
  it("should detect no anomalies when report contains only valid numeric and string data within defined ranges", () => {
    const reportData = {
      report_id: "RPT20240115001",
      generated_date: "2024-01-15T09:00:00Z",
      reporting_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      },
      customer_id: "CUST00123",
      customer_name: "Sample Customer Inc.",
      service_type: "standard_service",
      metrics: {
        appointment_count: 12,
        contract_count: 3,
        customer_satisfaction_rate: 92.5,
      },
      financial_data: {
        base_amount: 150000,
        discount_rate: 10,
        adjusted_amount: 135000,
      },
      status: "approved",
      validation_rules: {
        numeric_ranges: {
          appointment_count: { min: 0, max: 100 },
          contract_count: { min: 0, max: 50 },
          customer_satisfaction_rate: { min: 0, max: 100 },
          base_amount: { min: 0, max: 1000000 },
          discount_rate: { min: 0, max: 100 },
          adjusted_amount: { min: 0, max: 1000000 },
        },
        string_allowlist: {
          service_type: ["standard_service", "premium_service", "basic_service"],
          status: ["approved", "pending", "rejected"],
        },
      },
    };

    const result = validateReportDataCompleteness(reportData);

    expect(result.is_valid).toBe(true);
    expect(result.anomalies_detected).toBe(0);
    expect(result.validation_status).toBe("passed");
    expect(result.numeric_data_check.all_within_range).toBe(true);
    expect(result.numeric_data_check.out_of_range_items).toEqual([]);
    expect(result.string_data_check.all_values_in_allowlist).toBe(true);
    expect(result.string_data_check.disallowed_values).toEqual([]);
    expect(result.consistency_check.inconsistencies_found).toBe(0);
    expect(result.consistency_check.issues).toEqual([]);
    expect(result.error_report_lines).toBe(0);
  });

  // SCEN-1155: エラーケース - 数値が範囲外
  it("should detect anomaly when numeric data exceeds defined range", () => {
    const reportDataWithAnomalyNumeric = {
      report_id: "RPT20240115002",
      generated_date: "2024-01-15T09:00:00Z",
      reporting_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      },
      customer_id: "CUST00124",
      customer_name: "Test Customer Corp.",
      service_type: "premium_service",
      metrics: {
        appointment_count: 150,
        contract_count: 3,
        customer_satisfaction_rate: 92.5,
      },
      financial_data: {
        base_amount: 150000,
        discount_rate: 10,
        adjusted_amount: 135000,
      },
      status: "approved",
      validation_rules: {
        numeric_ranges: {
          appointment_count: { min: 0, max: 100 },
          contract_count: { min: 0, max: 50 },
          customer_satisfaction_rate: { min: 0, max: 100 },
          base_amount: { min: 0, max: 1000000 },
          discount_rate: { min: 0, max: 100 },
          adjusted_amount: { min: 0, max: 1000000 },
        },
        string_allowlist: {
          service_type: ["standard_service", "premium_service", "basic_service"],
          status: ["approved", "pending", "rejected"],
        },
      },
    };

    const result = validateReportDataCompleteness(
      reportDataWithAnomalyNumeric
    );

    expect(result.is_valid).toBe(false);
    expect(result.anomalies_detected).toBeGreaterThan(0);
    expect(result.validation_status).toBe("failed");
    expect(result.numeric_data_check.all_within_range).toBe(false);
    expect(result.numeric_data_check.out_of_range_items).toContainEqual(
      expect.objectContaining({
        field_name: "appointment_count",
        value: 150,
        expected_min: 0,
        expected_max: 100,
      })
    );
  });

  // SCEN-1155: エラーケース - 文字列が許可リスト外
  it("should detect anomaly when string data is not in allowlist", () => {
    const reportDataWithAnomalyString = {
      report_id: "RPT20240115003",
      generated_date: "2024-01-15T09:00:00Z",
      reporting_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      },
      customer_id: "CUST00125",
      customer_name: "Another Customer Ltd.",
      service_type: "unknown_service",
      metrics: {
        appointment_count: 12,
        contract_count: 3,
        customer_satisfaction_rate: 92.5,
      },
      financial_data: {
        base_amount: 150000,
        discount_rate: 10,
        adjusted_amount: 135000,
      },
      status: "approved",
      validation_rules: {
        numeric_ranges: {
          appointment_count: { min: 0, max: 100 },
          contract_count: { min: 0, max: 50 },
          customer_satisfaction_rate: { min: 0, max: 100 },
          base_amount: { min: 0, max: 1000000 },
          discount_rate: { min: 0, max: 100 },
          adjusted_amount: { min: 0, max: 1000000 },
        },
        string_allowlist: {
          service_type: ["standard_service", "premium_service", "basic_service"],
          status: ["approved", "pending", "rejected"],
        },
      },
    };

    const result = validateReportDataCompleteness(reportDataWithAnomalyString);

    expect(result.is_valid).toBe(false);
    expect(result.anomalies_detected).toBeGreaterThan(0);
    expect(result.validation_status).toBe("failed");
    expect(result.string_data_check.all_values_in_allowlist).toBe(false);
    expect(result.string_data_check.disallowed_values).toContainEqual(
      expect.objectContaining({
        field_name: "service_type",
        value: "unknown_service",
        allowed_values: ["standard_service", "premium_service", "basic_service"],
      })
    );
  });

  // SCEN-1155: エラーケース - データ間の矛盾（合計値の不一致）
  it("should detect inconsistency when adjusted amount does not match base amount minus discount", () => {
    const reportDataWithInconsistency = {
      report_id: "RPT20240115004",
      generated_date: "2024-01-15T09:00:00Z",
      reporting_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      },
      customer_id: "CUST00126",
      customer_name: "Inconsistent Customer Corp.",
      service_type: "standard_service",
      metrics: {
        appointment_count: 12,
        contract_count: 3,
        customer_satisfaction_rate: 92.5,
      },
      financial_data: {
        base_amount: 150000,
        discount_rate: 10,
        adjusted_amount: 140000,
      },
      status: "approved",
      validation_rules: {
        numeric_ranges: {
          appointment_count: { min: 0, max: 100 },
          contract_count: { min: 0, max: 50 },
          customer_satisfaction_rate: { min: 0, max: 100 },
          base_amount: { min: 0, max: 1000000 },
          discount_rate: { min: 0, max: 100 },
          adjusted_amount: { min: 0, max: 1000000 },
        },
        string_allowlist: {
          service_type: ["standard_service", "premium_service", "basic_service"],
          status: ["approved", "pending", "rejected"],
        },
      },
    };

    const result = validateReportDataCompleteness(reportDataWithInconsistency);

    expect(result.is_valid).toBe(false);
    expect(result.anomalies_detected).toBeGreaterThan(0);
    expect(result.validation_status).toBe("failed");
    expect(result.consistency_check.inconsistencies_found).toBeGreaterThan(0);
    expect(result.consistency_check.issues).toContainEqual(
      expect.objectContaining({
        issue_type: "calculation_mismatch",
        description: expect.stringMatching(/adjusted_amount/),
      })
    );
  });

  // SCEN-1155: エラーケース - 複数の異常が同時に検出
  it("should detect multiple anomalies when both numeric and string data are invalid", () => {
    const reportDataWithMultipleAnomalies = {
      report_id: "RPT20240115005",
      generated_date: "2024-01-15T09:00:00Z",
      reporting_period: {
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      },
      customer_id: "CUST00127",
      customer_name: "Multiple Anomaly Customer Ltd.",
      service_type: "invalid_service",
      metrics: {
        appointment_count: 250,
        contract_count: 3,
        customer_satisfaction_rate: 150,
      },
      financial_data: {
        base_amount: 150000,
        discount_rate: 150,
        adjusted_amount: 135000,
      },
      status: "unknown_status",
      validation_rules: {
        numeric_ranges: {
          appointment_count: { min: 0, max: 100 },
          contract_count: { min: 0, max: 50 },
          customer_satisfaction_rate: { min: 0, max: 100 },
          base_amount: { min: 0, max: 1000000 },
          discount_rate: { min: 0, max: 100 },
          adjusted_amount: { min: 0, max: 1000000 },
        },
        string_allowlist: {
          service_type: ["standard_service", "premium_service", "basic_service"],
          status: ["approved", "pending", "rejected"],
        },
      },
    };

    const result = validateReportDataCompleteness(reportDataWithMultipleAnomalies);

    expect(result.is_valid).toBe(false);
    expect(result.anomalies_detected).toBeGreaterThanOrEqual(3);
    expect(result.validation_status).toBe("failed");
    expect(result.error_report_lines).toBeGreaterThanOrEqual(3);
  });
});