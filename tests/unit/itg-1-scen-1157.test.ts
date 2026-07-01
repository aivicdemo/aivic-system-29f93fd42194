import { validateSalesDataRatioDeviation } from "../../src/logic/it-1781935279444-2-2-1";

describe("レポート内異常値・矛盾検出 - 売上数量と売上金額の比率検証", () => {
  // SCEN-1157
  test("売上数量と売上金額の比率が業界標準から逸脱している場合、矛盾として検出される", () => {
    // 業界標準: 1単位当たり平均単価 = 10000円（許容偏差 ±20%）
    const industry_standard_unit_price = 10000;
    const industry_standard_deviation_percent = 20;

    // テストデータ: 複数行の営業データ
    const report_data = [
      {
        row_number: 1,
        sales_quantity: 10,
        sales_amount: 100000,
        customer_id: "CUST001",
        service_type: "service_A"
      },
      // 売上単価 = 100000 / 10 = 10000（正常、標準値）
      {
        row_number: 2,
        sales_quantity: 20,
        sales_amount: 175000,
        customer_id: "CUST002",
        service_type: "service_B"
      },
      // 売上単価 = 175000 / 20 = 8750（正常、許容範囲内 -12.5%）
      {
        row_number: 3,
        sales_quantity: 15,
        sales_amount: 300000,
        customer_id: "CUST003",
        service_type: "service_A"
      },
      // 売上単価 = 300000 / 15 = 20000（逸脱、+100%）
      {
        row_number: 4,
        sales_quantity: 25,
        sales_amount: 150000,
        customer_id: "CUST004",
        service_type: "service_C"
      },
      // 売上単価 = 150000 / 25 = 6000（逸脱、-40%）
      {
        row_number: 5,
        sales_quantity: 5,
        sales_amount: 52500,
        customer_id: "CUST005",
        service_type: "service_B"
      }
      // 売上単価 = 52500 / 5 = 10500（正常、許容範囲内 +5%）
    ];

    const result = validateSalesDataRatioDeviation({
      report_data: report_data,
      industry_standard_unit_price: industry_standard_unit_price,
      industry_standard_deviation_percent: industry_standard_deviation_percent
    });

    // 期待結果: 全行検証完了
    expect(result.validation_status).toBe("completed");

    // 期待結果: 異常検出数 = 2件（row_number 3と4）
    expect(result.anomaly_count).toBe(2);

    // 期待結果: 正常行数 = 3件（row_number 1,2,5）
    expect(result.valid_row_count).toBe(3);

    // 期待結果: 検出されたデータが正確に特定される
    expect(result.detected_anomalies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row_number: 3,
          sales_quantity: 15,
          sales_amount: 300000,
          calculated_unit_price: 20000,
          deviation_percent: 100,
          deviation_status: "exceeds_upper_threshold",
          is_anomaly: true
        }),
        expect.objectContaining({
          row_number: 4,
          sales_quantity: 25,
          sales_amount: 150000,
          calculated_unit_price: 6000,
          deviation_percent: -40,
          deviation_status: "exceeds_lower_threshold",
          is_anomaly: true
        })
      ])
    );

    // 期待結果: 各異常データに対して矛盾フラグが付与される
    const row_3_anomaly = result.detected_anomalies.find(
      (a) => a.row_number === 3
    );
    expect(row_3_anomaly?.is_anomaly).toBe(true);
    expect(row_3_anomaly?.anomaly_flag).toBe("ratio_deviation_detected");

    const row_4_anomaly = result.detected_anomalies.find(
      (a) => a.row_number === 4
    );
    expect(row_4_anomaly?.is_anomaly).toBe(true);
    expect(row_4_anomaly?.anomaly_flag).toBe("ratio_deviation_detected");

    // 期待結果: 矛盾検出の詳細情報がレポートに記録される
    expect(result.detection_details).toEqual(
      expect.objectContaining({
        standard_unit_price: 10000,
        standard_deviation_tolerance_lower: 8000,
        standard_deviation_tolerance_upper: 12000,
        total_rows_processed: 5,
        anomaly_threshold_percent: 20
      })
    );

    // 期待結果: アラート通知が生成される
    expect(result.alert_notification).toEqual(
      expect.objectContaining({
        alert_type: "data_ratio_anomaly",
        severity_level: "high",
        affected_row_count: 2,
        affected_rows: [3, 4],
        timestamp: expect.any(String),
        message: expect.stringContaining("売上単価")
      })
    );

    // 期待結果: 通知には具体的な逸脱率が含まれる
    expect(result.alert_notification.details).toContainEqual({
      row_number: 3,
      deviation_percent: 100,
      expected_range: "8000-12000",
      actual_unit_price: 20000
    });

    expect(result.alert_notification.details).toContainEqual({
      row_number: 4,
      deviation_percent: -40,
      expected_range: "8000-12000",
      actual_unit_price: 6000
    });

    // 期待結果: 正常行は検出対象から除外される
    const normal_rows = result.detected_anomalies.filter(
      (a) => a.row_number === 1 || a.row_number === 2 || a.row_number === 5
    );
    expect(normal_rows.length).toBe(0);
  });
});