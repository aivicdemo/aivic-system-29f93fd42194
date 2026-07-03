import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・異常検出", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-613
  test("月次締め日に営業データの必須項目が1つ以上欠落している場合、検証が失敗し欠落項目を検出して代表に通知される", () => {
    // Arrange: 欠落項目を含む営業データレコード
    const sales_data_with_missing_customer_name = {
      sales_data_id: "SD001",
      customer_name: null, // 必須項目が欠落
      sales_amount: 150000,
      transaction_date: "2024-01-15",
      service_type: "standard",
      created_by: "user123",
      created_at: "2024-01-15T10:00:00Z",
    };

    const sales_data_with_missing_amount = {
      sales_data_id: "SD002",
      customer_name: "Company A",
      sales_amount: null, // 必須項目が欠落
      transaction_date: "2024-01-15",
      service_type: "standard",
      created_by: "user123",
      created_at: "2024-01-15T10:00:00Z",
    };

    const sales_data_with_missing_date = {
      sales_data_id: "SD003",
      customer_name: "Company B",
      sales_amount: 200000,
      transaction_date: null, // 必須項目が欠落
      service_type: "standard",
      created_by: "user123",
      created_at: "2024-01-15T10:00:00Z",
    };

    const mock_notification_handler = jest.fn().mockResolvedValue({
      notification_id: "NOTIF001",
      status: "sent",
    });

    // Act & Assert: 検証実行
    expect(() =>
      validateSalesDataCompleteness(
        [
          sales_data_with_missing_customer_name,
          sales_data_with_missing_amount,
          sales_data_with_missing_date,
        ],
        {
          required_fields: [
            "customer_name",
            "sales_amount",
            "transaction_date",
          ],
          notification_handler: mock_notification_handler,
          representative_email: "representative@company.com",
        }
      )
    ).toThrow(/必須項目/);

    // 欠落項目の詳細が通知に含まれたことを確認
    expect(mock_notification_handler).toHaveBeenCalled();

    const notification_call = mock_notification_handler.mock.calls[0];
    expect(notification_call).toBeDefined();

    const notification_payload = notification_call[0];
    expect(notification_payload).toHaveProperty("missing_fields");
    expect(Array.isArray(notification_payload.missing_fields)).toBe(true);
    expect(notification_payload.missing_fields.length).toBeGreaterThanOrEqual(
      1
    );

    // customer_name の欠落が検出されているか確認
    const missing_field_names = notification_payload.missing_fields.map(
      (f: any) => f.field_name
    );
    expect(missing_field_names).toContain("customer_name");
    expect(missing_field_names).toContain("sales_amount");
    expect(missing_field_names).toContain("transaction_date");

    // 該当するレコード情報が含まれているか確認
    expect(notification_payload).toHaveProperty("affected_records");
    expect(notification_payload.affected_records.length).toBe(3);

    const affected_ids = notification_payload.affected_records.map(
      (r: any) => r.sales_data_id
    );
    expect(affected_ids).toContain("SD001");
    expect(affected_ids).toContain("SD002");
    expect(affected_ids).toContain("SD003");

    // 通知内容に対象期間と詳細情報が含まれているか確認
    expect(notification_payload).toHaveProperty("validation_date");
    expect(notification_payload).toHaveProperty("error_summary");
    expect(notification_payload.error_summary).toMatch(/3件/);

    // 検証失敗の詳細レスポンスの構造を確認
    expect(notification_payload).toHaveProperty("detailed_errors");
    expect(notification_payload.detailed_errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          record_id: "SD001",
          missing_field: "customer_name",
        }),
        expect.objectContaining({
          record_id: "SD002",
          missing_field: "sales_amount",
        }),
        expect.objectContaining({
          record_id: "SD003",
          missing_field: "transaction_date",
        }),
      ])
    );

    // 通知送信先が正しく設定されているか確認
    expect(notification_payload).toHaveProperty("recipient_email");
    expect(notification_payload.recipient_email).toBe(
      "representative@company.com"
    );
  });
});