import { validateSalesReportAggregation } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業報告書集計自動検証機能", () => {
  test("SCEN-1077: 営業データの集計値がゼロ件の境界値である場合に正確に検証される", () => {
    // Arrange: ゼロ件の営業データを準備
    const aggregationData = {
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      customer_id: "CUST_001",
      service_type: "SERVICE_A",
      total_appointments: 0,
      total_contracts: 0,
      customer_responses: 0,
      total_amount: 0,
      data_count: 0,
    };

    // Act: 自動検証機能を実行
    const validationResult = validateSalesReportAggregation(aggregationData);

    // Assert: 検証結果の正確性を確認
    expect(validationResult).toEqual({
      is_valid: true,
      has_errors: false,
      error_messages: [],
      warnings: [],
      aggregation_summary: {
        total_appointments: 0,
        total_contracts: 0,
        customer_responses: 0,
        total_amount: 0,
        average_appointment_value: 0,
        average_contract_value: 0,
        record_count: 0,
      },
      statistics: {
        sum_appointments: 0,
        sum_contracts: 0,
        sum_responses: 0,
        sum_amount: 0,
        avg_appointments: 0,
        avg_contracts: 0,
        avg_responses: 0,
        avg_amount: 0,
        is_zero_boundary: true,
      },
      subsequent_process_status: "SKIP",
      system_errors: [],
      validation_timestamp: expect.any(String),
    });

    // Assert: ゼロ件の境界値が正確に認識されていることを確認
    expect(validationResult.statistics.is_zero_boundary).toBe(true);
    expect(validationResult.statistics.record_count).toBe(0);

    // Assert: すべての統計値がゼロであることを確認
    expect(validationResult.aggregation_summary.total_appointments).toBe(0);
    expect(validationResult.aggregation_summary.total_contracts).toBe(0);
    expect(validationResult.aggregation_summary.customer_responses).toBe(0);
    expect(validationResult.aggregation_summary.total_amount).toBe(0);

    // Assert: エラーログやアラートが不適切に発生していないことを確認
    expect(validationResult.has_errors).toBe(false);
    expect(validationResult.error_messages.length).toBe(0);
    expect(validationResult.system_errors.length).toBe(0);

    // Assert: ゼロ件の状態が後続処理に正しく反映されていることを確認
    expect(validationResult.subsequent_process_status).toBe("SKIP");
    expect(validationResult.is_valid).toBe(true);

    // Assert: 集計結果レポートが正常に完了したことを確認
    expect(validationResult.validation_timestamp).toBeDefined();
    expect(typeof validationResult.validation_timestamp).toBe("string");
  });
});