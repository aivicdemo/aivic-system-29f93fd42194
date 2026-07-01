import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateReportAccuracy,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("レポート数値正確性判定機能", () => {
  // SCEN-1200
  test("ソースデータとレポート値が完全一致する場合、合否判定が『正確』で返される", () => {
    const source_data = {
      sales_amount: 1500000,
      transaction_count: 25,
      handling_fee_rate: 0.03,
      handling_fee_amount: 45000,
      net_amount: 1455000,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      customer_id: "CUST-001",
      service_type: "standard",
    };

    const report_values = {
      sales_amount: 1500000,
      transaction_count: 25,
      handling_fee_rate: 0.03,
      handling_fee_amount: 45000,
      net_amount: 1455000,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      customer_id: "CUST-001",
      service_type: "standard",
    };

    const result = validateReportAccuracy({
      source_data,
      report_values,
    });

    expect(result.judgment_result).toBe("正確");
    expect(result.all_fields_match).toBe(true);
    expect(result.matched_field_count).toBe(9);
    expect(result.mismatched_fields).toEqual([]);
    expect(result.accuracy_percentage).toBe(100);
  });

  test("ソースデータとレポート値に差異がある場合、合否判定が『要確認』で返され、不一致項目が特定される", () => {
    const source_data = {
      sales_amount: 1500000,
      transaction_count: 25,
      handling_fee_rate: 0.03,
      handling_fee_amount: 45000,
      net_amount: 1455000,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      customer_id: "CUST-001",
      service_type: "standard",
    };

    const report_values = {
      sales_amount: 1400000,
      transaction_count: 25,
      handling_fee_rate: 0.03,
      handling_fee_amount: 42000,
      net_amount: 1358000,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      customer_id: "CUST-001",
      service_type: "standard",
    };

    const result = validateReportAccuracy({
      source_data,
      report_values,
    });

    expect(result.judgment_result).toBe("要確認");
    expect(result.all_fields_match).toBe(false);
    expect(result.matched_field_count).toBe(6);
    expect(result.mismatched_fields).toContain("sales_amount");
    expect(result.mismatched_fields).toContain("handling_fee_amount");
    expect(result.mismatched_fields).toContain("net_amount");
    expect(result.mismatched_fields.length).toBe(3);
    expect(result.accuracy_percentage).toBe(66.66666666666666);
  });

  test("ソースデータの必須項目が欠落している場合、エラーが発生する", () => {
    const incomplete_source_data = {
      sales_amount: 1500000,
      transaction_count: 25,
      handling_fee_rate: 0.03,
    };

    const report_values = {
      sales_amount: 1500000,
      transaction_count: 25,
      handling_fee_rate: 0.03,
      handling_fee_amount: 45000,
      net_amount: 1455000,
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      customer_id: "CUST-001",
      service_type: "standard",
    };

    expect(() =>
      validateReportAccuracy({
        source_data: incomplete_source_data as any,
        report_values,
      })
    ).toThrow(/必須項目/);
  });

  test("金額計算の乖離が許容範囲内の場合、判定結果に計算誤り詳細が含まれる", () => {
    const source_data = {
      sales_amount: 1000000,
      transaction_count: 10,
      handling_fee_rate: 0.03,
      handling_fee_amount: 30000,
      net_amount: 970000,
      period_start: "2024-02-01",
      period_end: "2024-02-29",
      customer_id: "CUST-002",
      service_type: "premium",
    };

    const report_values = {
      sales_amount: 1000000,
      transaction_count: 10,
      handling_fee_rate: 0.03,
      handling_fee_amount: 30001,
      net_amount: 969999,
      period_start: "2024-02-01",
      period_end: "2024-02-29",
      customer_id: "CUST-002",
      service_type: "premium",
    };

    const result = validateReportAccuracy({
      source_data,
      report_values,
      tolerance_amount: 5,
    });

    expect(result.judgment_result).toBe("要確認");
    expect(result.calculation_variance_details).toBeDefined();
    expect(
      result.calculation_variance_details?.handling_fee_amount_variance
    ).toBe(1);
    expect(
      result.calculation_variance_details?.net_amount_variance
    ).toBe(-1);
    expect(result.calculation_variance_details?.within_tolerance).toBe(true);
  });

  test("複数の数値項目で集計誤りが検出された場合、詳細な不一致分析が返される", () => {
    const source_data = {
      sales_amount: 500000,
      transaction_count: 5,
      handling_fee_rate: 0.05,
      handling_fee_amount: 25000,
      net_amount: 475000,
      period_start: "2024-03-01",
      period_end: "2024-03-31",
      customer_id: "CUST-003",
      service_type: "basic",
    };

    const report_values = {
      sales_amount: 450000,
      transaction_count: 4,
      handling_fee_rate: 0.05,
      handling_fee_amount: 20000,
      net_amount: 430000,
      period_start: "2024-03-01",
      period_end: "2024-03-31",
      customer_id: "CUST-003",
      service_type: "basic",
    };

    const result = validateReportAccuracy({
      source_data,
      report_values,
    });

    expect(result.judgment_result).toBe("要確認");
    expect(result.mismatched_fields.length).toBe(4);
    expect(result.accuracy_percentage).toBeLessThan(100);
    expect(result.summary).toBeDefined();
    expect(result.summary?.error_pattern).toBeDefined();
  });
});