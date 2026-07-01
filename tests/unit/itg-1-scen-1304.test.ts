import { executeAccountingSystemAPILinkage } from "../../src/logic/it-1-2-1";

const fetchMock = require("jest-fetch-mock");

describe("会計システムAPI連携実行機能 - タイムアウト再試行メカニズム", () => {
  test("SCEN-1304: API呼び出しがタイムアウトした場合、指数バックオフで最大3回まで自動再試行し、3回目で成功してデータが連携される", async () => {
    fetchMock.resetMocks();

    const billing_data = {
      customer_id: "CUST-001",
      service_id: "SVC-A",
      amount: 50000,
      billing_month: "2024-01",
    };

    const api_config = {
      endpoint: "https://accounting.example.com/api/billings",
      timeout_ms: 500,
      max_retries: 3,
      backoff_strategy: "exponential",
      initial_backoff_ms: 100,
    };

    // 1回目: タイムアウト（AbortError）
    fetchMock.mockResponseOnce(
      () =>
        new Promise((resolve, reject) => {
          setTimeout(
            () => reject(new Error("Request timeout")),
            api_config.timeout_ms + 100
          );
        })
    );

    // 2回目: タイムアウト（AbortError）
    fetchMock.mockResponseOnce(
      () =>
        new Promise((resolve, reject) => {
          setTimeout(
            () => reject(new Error("Request timeout")),
            api_config.timeout_ms + 100
          );
        })
    );

    // 3回目: 成功
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: "success",
        billing_id: "BIL-2024-001",
        customer_id: "CUST-001",
        service_id: "SVC-A",
        amount: 50000,
        billing_month: "2024-01",
        linked_at: "2024-01-15T11:00:00Z",
      }),
      { status: 200 }
    );

    const result = await executeAccountingSystemAPILinkage(
      billing_data,
      api_config
    );

    // 最終的な成功を確認
    expect(result.status).toBe("success");
    expect(result.billing_id).toBe("BIL-2024-001");
    expect(result.customer_id).toBe("CUST-001");
    expect(result.service_id).toBe("SVC-A");
    expect(result.amount).toBe(50000);
    expect(result.billing_month).toBe("2024-01");

    // 再試行回数を確認（初回+2回の再試行=3回の総呼び出し）
    expect(result.retry_count).toBe(2);
    expect(result.total_attempts).toBe(3);

    // 再試行ログが記録されたことを確認
    expect(result.retry_logs).toBeDefined();
    expect(result.retry_logs.length).toBe(2);

    // 1回目の再試行ログ
    expect(result.retry_logs[0].attempt_number).toBe(1);
    expect(result.retry_logs[0].error_message).toMatch(/timeout/i);
    expect(result.retry_logs[0].backoff_delay_ms).toBe(100);

    // 2回目の再試行ログ
    expect(result.retry_logs[1].attempt_number).toBe(2);
    expect(result.retry_logs[1].error_message).toMatch(/timeout/i);
    expect(result.retry_logs[1].backoff_delay_ms).toBe(200);

    // 指数バックオフの検証（初期値100ms × 2^n）
    expect(result.retry_logs[1].backoff_delay_ms).toBe(
      api_config.initial_backoff_ms * Math.pow(2, 1)
    );

    // 最大再試行回数の制限を超えていないことを確認
    expect(result.total_attempts).toBeLessThanOrEqual(api_config.max_retries);

    // フェッチが3回呼ばれたことを確認
    expect(fetchMock.mock.calls.length).toBe(3);

    // 最終的なAPI呼び出しのペイロード検証
    const final_request_body = JSON.parse(
      fetchMock.mock.calls[2][1].body
    );
    expect(final_request_body.customer_id).toBe("CUST-001");
    expect(final_request_body.amount).toBe(50000);

    // 成功時のステータスコード検証
    expect(result.linked_at).toBe("2024-01-15T11:00:00Z");
  });
});