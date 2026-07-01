import { validateBillingCalculationResult } from "../../src/logic/it-1781935279444-2-2-1";

describe("請求額計算結果検証機能", () => {
  test("SCEN-911: 請求額がゼロ値で、集計データ不足として警告が出力される", () => {
    // 前提: 請求対象期間における売上データが存在しない、または集計データが不足している顧客レコード
    const billingCalculationInput = {
      customer_id: "CUST-9999",
      billing_period_start: "2024-01-01",
      billing_period_end: "2024-01-31",
      calculated_amount: 0,
      aggregated_records_count: 0,
      sales_data: [],
      service_type: "basic",
      contract_id: "CONTRACT-5555",
    };

    // 実行: 請求額計算結果検証処理
    const result = validateBillingCalculationResult(billingCalculationInput);

    // 期待結果: 請求額がゼロ値として計算され、警告が出力される
    expect(result.calculated_amount).toBe(0);
    expect(result.is_valid).toBe(true);
    expect(result.has_warning).toBe(true);
    expect(result.warning_message).toMatch(/集計データ|請求対象データ/);
    expect(result.warning_level).toBe("warning");
    expect(result.aggregated_data_insufficient).toBe(true);

    // ログ内容の検証: 警告レベルで集計データ不足の詳細情報が記録されること
    expect(result.log_entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "warning",
          message: expect.stringMatching(/集計データ/),
          timestamp: expect.any(String),
        }),
      ])
    );

    // システムが正常に処理を完了し、エラーではなく警告として扱われることを確認
    expect(result.processing_status).toBe("completed");
    expect(result.error_occurred).toBe(false);
  });
});