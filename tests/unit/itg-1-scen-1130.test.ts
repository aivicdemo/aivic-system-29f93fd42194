import { describe, test, expect } from "@jest/globals";
import { validateReportQualityWithMultipleAnomalies } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1130: [edge] レポート内の異常値・矛盾検出 - 複数の軽微な異常値が組み合わさった場合の総合判定が正確に行われる
  test("複数の軽微な異常値が組み合わさった場合、個別検出と総合判定が正確に実行される", () => {
    // 準備：複数の軽微な異常値を含むレポートデータ（3項目組み合わせパターン1）
    const report_pattern_1 = {
      sales_amount: 950000,
      sales_amount_threshold_min: 500000,
      sales_amount_threshold_max: 1000000,
      customer_count: 92,
      customer_count_prev_month: 100,
      customer_count_threshold_percentage: 90,
      billing_date: new Date("2024-01-17T09:00:00Z"),
      billing_date_standard: new Date("2024-01-15T09:00:00Z"),
      billing_date_tolerance_days: 1,
      unit_price: 9200,
      unit_price_average: 10000,
      unit_price_deviation_threshold_percentage: 10,
    };

    // 実行：レポート品質検証エンジンに入力
    const result_1 = validateReportQualityWithMultipleAnomalies(report_pattern_1);

    // 検証1：個別異常検出が実行される
    // - sales_amount: 950000 は 1000000 の 95%（許容上限）→ 軽微異常
    expect(result_1.individual_anomalies.find((a: any) => a.field === "sales_amount")?.severity).toBe(
      "warning"
    );
    expect(result_1.individual_anomalies.find((a: any) => a.field === "sales_amount")?.value).toBe(950000);
    expect(
      result_1.individual_anomalies.find((a: any) => a.field === "sales_amount")?.range_min
    ).toBe(500000);
    expect(
      result_1.individual_anomalies.find((a: any) => a.field === "sales_amount")?.range_max
    ).toBe(1000000);

    // - customer_count: 92 は 100 の 92%（許容下限 90%）→ 軽微異常
    expect(
      result_1.individual_anomalies.find((a: any) => a.field === "customer_count")?.severity
    ).toBe("warning");
    expect(
      result_1.individual_anomalies.find((a: any) => a.field === "customer_count")?.value
    ).toBe(92);
    expect(
      result_1.individual_anomalies.find((a: any) => a.field === "customer_count")?.previous_value
    ).toBe(100);

    // - billing_date: 2日遅延（許容 1日）→ 軽微異常
    expect(result_1.individual_anomalies.find((a: any) => a.field === "billing_date")?.severity).toBe(
      "warning"
    );
    expect(result_1.individual_anomalies.find((a: any) => a.field === "billing_date")?.delay_days).toBe(
      2
    );
    expect(
      result_1.individual_anomalies.find((a: any) => a.field === "billing_date")?.tolerance_days
    ).toBe(1);

    // 検証2：複数軽微異常の累積判定が実行される（3項目組み合わせ）
    expect(result_1.combined_anomaly_count).toBe(3);
    expect(result_1.overall_severity).toBe("warning");
    expect(result_1.overall_score).toBe(72);
    expect(result_1.status).toBe("requires_confirmation");
    expect(result_1.anomaly_details.length).toBe(3);

    // 準備：複数の軽微な異常値を含むレポートデータ（4項目組み合わせパターン2）
    const report_pattern_2 = {
      sales_amount: 950000,
      sales_amount_threshold_min: 500000,
      sales_amount_threshold_max: 1000000,
      customer_count: 92,
      customer_count_prev_month: 100,
      customer_count_threshold_percentage: 90,
      billing_date: new Date("2024-01-17T09:00:00Z"),
      billing_date_standard: new Date("2024-01-15T09:00:00Z"),
      billing_date_tolerance_days: 1,
      unit_price: 9200,
      unit_price_average: 10000,
      unit_price_deviation_threshold_percentage: 10,
      settlement_amount: 9280000,
      settlement_amount_threshold_percentage: 5,
      actual_settlement: 8900000,
    };

    // 実行：レポート品質検証エンジンに入力（4項目組み合わせ）
    const result_2 = validateReportQualityWithMultipleAnomalies(report_pattern_2);

    // 検証3：unit_price異常が検出される
    // - unit_price: 9200 は 10000 から 8%乖離（許容 10%）→ 軽微異常
    expect(result_2.individual_anomalies.find((a: any) => a.field === "unit_price")?.severity).toBe(
      "warning"
    );
    expect(result_2.individual_anomalies.find((a: any) => a.field === "unit_price")?.value).toBe(9200);
    expect(result_2.individual_anomalies.find((a: any) => a.field === "unit_price")?.average).toBe(10000);
    expect(
      result_2.individual_anomalies.find((a: any) => a.field === "unit_price")?.deviation_percentage
    ).toBe(8);

    // 検証4：settlement_amount異常が検出される
    // - settlement_amount: 8900000 は 9280000 から 4.1%乖離（許容 5%）→ 軽微異常（境界内）
    expect(
      result_2.individual_anomalies.find((a: any) => a.field === "settlement_amount")?.severity
    ).toBe("warning");
    expect(
      result_2.individual_anomalies.find((a: any) => a.field === "settlement_amount")?.expected_amount
    ).toBe(9280000);
    expect(
      result_2.individual_anomalies.find((a: any) => a.field === "settlement_amount")?.actual_amount
    ).toBe(8900000);

    // 検証5：複数軽微異常の累積判定が実行される（4項目組み合わせ）
    expect(result_2.combined_anomaly_count).toBe(4);
    expect(result_2.overall_severity).toBe("warning");
    expect(result_2.overall_score).toBe(65);
    expect(result_2.status).toBe("requires_confirmation");
    expect(result_2.anomaly_details.length).toBe(4);

    // 検証6：異常パターンの詳細情報が正確に記録される
    expect(result_2.anomaly_details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "sales_amount",
          severity: "warning",
          value: 950000,
          range_min: 500000,
          range_max: 1000000,
        }),
        expect.objectContaining({
          field: "customer_count",
          severity: "warning",
          value: 92,
          previous_value: 100,
        }),
        expect.objectContaining({
          field: "billing_date",
          severity: "warning",
          delay_days: 2,
          tolerance_days: 1,
        }),
        expect.objectContaining({
          field: "unit_price",
          severity: "warning",
          value: 9200,
          average: 10000,
          deviation_percentage: 8,
        }),
      ])
    );

    // 準備：異なる組み合わせパターン（異常なしケース）
    const report_pattern_3 = {
      sales_amount: 800000,
      sales_amount_threshold_min: 500000,
      sales_amount_threshold_max: 1000000,
      customer_count: 98,
      customer_count_prev_month: 100,
      customer_count_threshold_percentage: 90,
      billing_date: new Date("2024-01-15T09:00:00Z"),
      billing_date_standard: new Date("2024-01-15T09:00:00Z"),
      billing_date_tolerance_days: 1,
      unit_price: 10000,
      unit_price_average: 10000,
      unit_price_deviation_threshold_percentage: 10,
    };

    // 実行：正常パターン
    const result_3 = validateReportQualityWithMultipleAnomalies(report_pattern_3);

    // 検証7：正常パターンは異常なし
    expect(result_3.combined_anomaly_count).toBe(0);
    expect(result_3.overall_severity).toBe("normal");
    expect(result_3.overall_score).toBe(100);
    expect(result_3.status).toBe("approved");
    expect(result_3.anomaly_details.length).toBe(0);

    // 準備：5項目以上の異常値を含むパターン
    const report_pattern_4 = {
      sales_amount: 950000,
      sales_amount_threshold_min: 500000,
      sales_amount_threshold_max: 1000000,
      customer_count: 88,
      customer_count_prev_month: 100,
      customer_count_threshold_percentage: 90,
      billing_date: new Date("2024-01-17T09:00:00Z"),
      billing_date_standard: new Date("2024-01-15T09:00:00Z"),
      billing_date_tolerance_days: 1,
      unit_price: 9000,
      unit_price_average: 10000,
      unit_price_deviation_threshold_percentage: 10,
      settlement_amount: 8500000,
      settlement_amount_threshold_percentage: 5,
      actual_settlement: 8500000,
      invoice_count: 45,
      invoice_count_average: 50,
      invoice_count_threshold_percentage: 8,
    };

    // 実行：5項目組み合わせパターン
    const result_4 = validateReportQualityWithMultipleAnomalies(report_pattern_4);

    // 検証8：複数軽微異常の累積判定（5項目以上組み合わせ）
    expect(result_4.combined_anomaly_count).toBeGreaterThanOrEqual(5);
    expect(result_4.overall_severity).toBe("warning");
    expect(result_4.overall_score).toBeGreaterThan(0);
    expect(result_4.overall_score).toBeLessThan(100);
    expect(result_4.status).toBe("requires_confirmation");

    // 検証9：複数パターン間で判定の一貫性が保証される
    // パターン1（3項目異常）とパターン2（4項目異常）で、共通項目の判定結果が一致
    const sales_amount_result_1 = result_1.individual_anomalies.find(
      (a: any) => a.field === "sales_amount"
    );
    const sales_amount_result_2 = result_2.individual_anomalies.find(
      (a: any) => a.field === "sales_amount"
    );
    expect(sales_amount_result_1?.severity).toBe(sales_amount_result_2?.severity);
    expect(sales_amount_result_1?.value).toBe(sales_amount_result_2?.value);

    const customer_count_result_1 = result_1.individual_anomalies.find(
      (a: any) => a.field === "customer_count"
    );
    const customer_count_result_2 = result_2.individual_anomalies.find(
      (a: any) => a.field === "customer_count"
    );
    expect(customer_count_result_1?.severity).toBe(customer_count_result_2?.severity);
    expect(customer_count_result_1?.value).toBe(customer_count_result_2?.value);

    // 検証10：スコア計算式の妥当性（総合スコア = 100 - (軽微異常数 × 重み係数)）
    // パターン1：3項目異常 → スコア = 100 - (3 × 9.33) ≒ 72
    expect(result_1.overall_score).toBe(72);
    // パターン2：4項目異常 → スコア = 100 - (4 × 9) ≒ 64
    expect(result_2.overall_score).toBe(65);
    // パターン3：0項目異常 → スコア = 100
    expect(result_3.overall_score).toBe(100);
  });
});