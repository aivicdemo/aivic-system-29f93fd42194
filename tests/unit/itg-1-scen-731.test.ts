import { validateSalesDataForMonthlyReport } from "../../src/logic/it-1781935279444-2-2-1";

describe("月次レポート生成前の最終検証機能", () => {
  // SCEN-731: [edge] 月次レポート生成前の最終検証機能 - 数値項目の異常値（負数が想定されない項目に負数がある場合）を検出する
  test("売上金額フィールドの負数値を検出し、エラーフラグを付与し、詳細ログを記録し、レコードをフラグ付けして件数をカウントする", () => {
    const salesDataRecords = [
      {
        record_id: "REC001",
        customer_id: "CUST001",
        sales_amount: 50000,
        appointment_count: 5,
        contract_count: 2,
        service_type: "service_a",
        record_date: "2024-01-10",
      },
      {
        record_id: "REC002",
        customer_id: "CUST002",
        sales_amount: -50000,
        appointment_count: 3,
        contract_count: 1,
        service_type: "service_b",
        record_date: "2024-01-15",
      },
      {
        record_id: "REC003",
        customer_id: "CUST003",
        sales_amount: 75000,
        appointment_count: 8,
        contract_count: 3,
        service_type: "service_a",
        record_date: "2024-01-20",
      },
      {
        record_id: "REC004",
        customer_id: "CUST004",
        sales_amount: -10000,
        appointment_count: 2,
        contract_count: 0,
        service_type: "service_c",
        record_date: "2024-01-25",
      },
    ];

    const validationResult = validateSalesDataForMonthlyReport(
      salesDataRecords
    );

    expect(validationResult.total_records).toBe(4);
    expect(validationResult.anomaly_count).toBe(2);
    expect(validationResult.valid_records_count).toBe(2);
    expect(validationResult.flagged_records_count).toBe(2);

    const anomalyRecords = validationResult.anomaly_details;
    expect(anomalyRecords).toHaveLength(2);

    expect(anomalyRecords[0].record_id).toBe("REC002");
    expect(anomalyRecords[0].is_anomaly).toBe(true);
    expect(anomalyRecords[0].anomaly_field).toBe("sales_amount");
    expect(anomalyRecords[0].anomaly_value).toBe(-50000);
    expect(anomalyRecords[0].expected_range_min).toBe(0);
    expect(anomalyRecords[0].expected_range_max).toBe(999999999);
    expect(anomalyRecords[0].error_message).toMatch(/sales_amount/);

    expect(anomalyRecords[1].record_id).toBe("REC004");
    expect(anomalyRecords[1].is_anomaly).toBe(true);
    expect(anomalyRecords[1].anomaly_field).toBe("sales_amount");
    expect(anomalyRecords[1].anomaly_value).toBe(-10000);
    expect(anomalyRecords[1].expected_range_min).toBe(0);
    expect(anomalyRecords[1].expected_range_max).toBe(999999999);

    expect(validationResult.validation_summary.anomalies_detected).toBe(true);
    expect(validationResult.validation_summary.critical_error_count).toBe(2);
    expect(validationResult.validation_summary.validation_status).toBe("flagged");

    const processingResult = validationResult.processing_result;
    expect(processingResult.excluded_from_report_count).toBe(2);
    expect(processingResult.included_in_report_count).toBe(2);
    expect(processingResult.flagged_for_review_count).toBe(2);

    const validRecordsForReport = validationResult.records_for_monthly_report;
    expect(validRecordsForReport).toHaveLength(2);
    expect(validRecordsForReport.map((r: any) => r.record_id)).toEqual([
      "REC001",
      "REC003",
    ]);
  });
});