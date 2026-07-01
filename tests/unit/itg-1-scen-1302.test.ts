import { executeAccountingSystemAPI } from "../../src/logic/it-1-2-1";

describe("会計システムAPI連携 - バリデーションエラー時のアラート通知", () => {
  test("SCEN-1302: 会計システムのバリデーションエラー発生時にアラート通知が実行される", async () => {
    // ========== テストセットアップ ==========
    const fetchMock = require("jest-fetch-mock");
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    // 不正な請求データ（必須項目欠落、形式エラー等を含む）
    const invalidBillingData = {
      customer_id: "", // 必須項目が空
      service_type: "invalid_type", // 形式エラー
      billing_amount: -1000, // 負の金額（範囲エラー）
      billing_date: "2024-13-45", // 日付形式エラー
      line_items: null, // nullで送信（必須）
    };

    const errorTimestamp = new Date("2024-01-15T10:30:00Z");
    const validationErrorResponse = {
      status: 400,
      error_code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: [
        {
          field: "customer_id",
          error: "required_field_missing",
        },
        {
          field: "service_type",
          error: "invalid_format",
        },
        {
          field: "billing_amount",
          error: "out_of_range",
        },
        {
          field: "billing_date",
          error: "invalid_date_format",
        },
        {
          field: "line_items",
          error: "required_field_missing",
        },
      ],
      timestamp: errorTimestamp.toISOString(),
    };

    // 会計システムからのバリデーションエラーレスポンスをモック
    fetchMock.mockResponseOnce(
      JSON.stringify(validationErrorResponse),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );

    // ========== 実行 ==========
    const result = await executeAccountingSystemAPI({
      billing_data: invalidBillingData,
      integration_user_id: "ops_manager_001",
      timestamp: errorTimestamp,
    });

    // ========== 検証 ==========

    // 1. API連携がエラーをキャッチしたことを確認
    expect(result.success).toBe(false);
    expect(result.error_code).toBe("VALIDATION_ERROR");

    // 2. エラーハンドリング処理が実行されたか確認
    expect(result.error_handled).toBe(true);
    expect(result.handler_execution_timestamp).toBeDefined();

    // 3. アラート通知機能が呼び出されたか確認
    expect(result.alert_notification_triggered).toBe(true);
    expect(result.alert_count).toBe(1);

    // 4. 通知先の確認（メール、ダッシュボード等）
    expect(result.notification_channels).toContain("email");
    expect(result.notification_channels).toContain("dashboard");
    expect(result.notification_channels.length).toBe(2);

    // 5. 通知に含まれるエラー内容の確認
    expect(result.alert_details.error_code).toBe("VALIDATION_ERROR");
    expect(result.alert_details.error_message).toBe(
      "Request validation failed"
    );
    expect(result.alert_details.error_count).toBe(5);

    // 6. 通知に含まれる発生時刻の確認
    expect(result.alert_details.error_timestamp).toBe(
      "2024-01-15T10:30:00Z"
    );

    // 7. 通知に含まれる対象データ情報の確認
    expect(result.alert_details.affected_data).toEqual({
      customer_id: "",
      service_type: "invalid_type",
      billing_amount: -1000,
      billing_date: "2024-13-45",
    });

    // 8. エラーフィールド詳細の確認
    expect(result.alert_details.validation_errors).toEqual([
      {
        field: "customer_id",
        error: "required_field_missing",
      },
      {
        field: "service_type",
        error: "invalid_format",
      },
      {
        field: "billing_amount",
        error: "out_of_range",
      },
      {
        field: "billing_date",
        error: "invalid_date_format",
      },
      {
        field: "line_items",
        error: "required_field_missing",
      },
    ]);

    // 9. 通知メタデータの確認
    expect(result.alert_details.integration_user_id).toBe("ops_manager_001");
    expect(result.alert_details.notification_status).toBe("sent");

    // 10. API呼び出しが正しく実行されたか確認
    expect(fetchMock.mock.calls.length).toBe(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/accounting-system/validate");
  });
});