import { it6_3_1_validateOperationLogs } from "../../src/logic/it-6-3-1";

describe("月次システム稼働率・インシデント状況の監視と判定", () => {
  // SCEN-1298
  it("稼働ログが空またはデータ不完全の場合、エラーを返す", () => {
    // ケース1: 稼働ログが空の場合
    const empty_logs_result = it6_3_1_validateOperationLogs({
      operation_logs: [],
      target_month: "2024-01",
    });

    expect(empty_logs_result.success).toBe(false);
    expect(empty_logs_result.error_message).toMatch(/ログデータが存在しません/);
    expect(empty_logs_result.http_status_code).toBe(400);

    // ケース2: 稼働ログが存在するが必須フィールドが不完全な場合
    const incomplete_logs_result = it6_3_1_validateOperationLogs({
      operation_logs: [
        {
          log_id: "log_001",
          timestamp: "2024-01-15T09:00:00Z",
          // タイムスタンプは存在するが、稼働状態フィールドが欠落
          incident_count: 0,
        },
        {
          log_id: "log_002",
          // タイムスタンプが欠落
          operation_status: "active",
          incident_count: 0,
        },
      ],
      target_month: "2024-01",
    });

    expect(incomplete_logs_result.success).toBe(false);
    expect(incomplete_logs_result.error_message).toMatch(/ログデータが不完全です/);
    expect(incomplete_logs_result.http_status_code).toBe(400);
  });
});