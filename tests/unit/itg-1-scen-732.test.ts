import { validateSalesActivityData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業活動データ自動検証・エラー通知機能", () => {
  // SCEN-732: [normal] 営業活動データ入力時に必須項目の欠落を検出し、営業担当者に通知する
  test("必須項目（顧客名）が欠落している場合、バリデーションエラーを検出し、詳細を含むエラー通知を送信する", () => {
    const input_activity_data = {
      sales_user_id: "user_001",
      customer_name: "",
      activity_date: "2024-01-15",
      activity_time: "10:30",
      activity_content: "営業訪問",
      appointment_status: "未確定",
    };

    const result = validateSalesActivityData(input_activity_data);

    expect(result.is_valid).toBe(false);
    expect(result.error_code).toBe("MISSING_REQUIRED_FIELD");
    expect(result.error_message).toMatch(/顧客名/);
    expect(result.validation_errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "customer_name",
          error_type: "required_field_missing",
          error_description: expect.stringMatching(/顧客名.*必須/),
        }),
      ])
    );

    expect(result.notification).toBeDefined();
    expect(result.notification.recipient_user_id).toBe("user_001");
    expect(result.notification.notification_type).toBe("validation_error");
    expect(result.notification.notification_content).toMatch(/顧客名/);
    expect(result.notification.sent_at).toBeDefined();

    const notification_sent_at = new Date(result.notification.sent_at);
    expect(notification_sent_at instanceof Date).toBe(true);
    expect(notification_sent_at.getTime()).toBeGreaterThan(0);

    expect(result.notification.notification_level).toBe("error");
  });
});