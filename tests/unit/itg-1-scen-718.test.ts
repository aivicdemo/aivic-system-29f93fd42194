import { generateCorrectionNotification } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-718: [normal] 修正指示通知生成 - 修正指示内容に項目名・理由・推奨値が全て記載される
  test("should generate correction notification with all required fields", () => {
    const validation_results = [
      {
        record_id: "rec_001",
        field_name: "customer_name",
        error_type: "missing_required_field",
        error_reason: "顧客名が入力されていません",
        suggested_value: "サンプル顧客A",
        severity: "error",
      },
      {
        record_id: "rec_001",
        field_name: "contact_date",
        error_type: "invalid_data_type",
        error_reason: "接触日時の形式が不正です（YYYY-MM-DD HH:MM:SS形式で入力してください）",
        suggested_value: "2024-01-15 10:30:00",
        severity: "error",
      },
      {
        record_id: "rec_001",
        field_name: "deal_amount",
        error_type: "out_of_range",
        error_reason: "金額が許容範囲を超えています（0〜10000000の範囲で入力してください）",
        suggested_value: "500000",
        severity: "warning",
      },
      {
        record_id: "rec_002",
        field_name: "service_type",
        error_type: "invalid_enumeration",
        error_reason: "サービス種別が定義済みリストにありません",
        suggested_value: "basic_plan",
        severity: "error",
      },
      {
        record_id: "rec_002",
        field_name: "appointment_status",
        error_type: "inconsistent_value",
        error_reason: "接触日時と成約日時の前後関係が矛盾しています",
        suggested_value: "pending",
        severity: "error",
      },
    ];

    const notification = generateCorrectionNotification(validation_results);

    expect(notification).toBeDefined();
    expect(notification.notification_id).toBeDefined();
    expect(notification.generated_at).toBeDefined();
    expect(notification.correction_items).toBeDefined();
    expect(Array.isArray(notification.correction_items)).toBe(true);

    const rec_001_items = notification.correction_items.filter(
      (item: any) => item.record_id === "rec_001"
    );
    expect(rec_001_items.length).toBe(3);

    const rec_001_customer_name = rec_001_items.find(
      (item: any) => item.field_name === "customer_name"
    );
    expect(rec_001_customer_name).toBeDefined();
    expect(rec_001_customer_name.field_name).toBe("customer_name");
    expect(rec_001_customer_name.error_reason).toBe(
      "顧客名が入力されていません"
    );
    expect(rec_001_customer_name.suggested_value).toBe("サンプル顧客A");
    expect(rec_001_customer_name.severity).toBe("error");

    const rec_001_contact_date = rec_001_items.find(
      (item: any) => item.field_name === "contact_date"
    );
    expect(rec_001_contact_date).toBeDefined();
    expect(rec_001_contact_date.field_name).toBe("contact_date");
    expect(rec_001_contact_date.error_reason).toBe(
      "接触日時の形式が不正です（YYYY-MM-DD HH:MM:SS形式で入力してください）"
    );
    expect(rec_001_contact_date.suggested_value).toBe("2024-01-15 10:30:00");
    expect(rec_001_contact_date.severity).toBe("error");

    const rec_001_deal_amount = rec_001_items.find(
      (item: any) => item.field_name === "deal_amount"
    );
    expect(rec_001_deal_amount).toBeDefined();
    expect(rec_001_deal_amount.field_name).toBe("deal_amount");
    expect(rec_001_deal_amount.error_reason).toBe(
      "金額が許容範囲を超えています（0〜10000000の範囲で入力してください）"
    );
    expect(rec_001_deal_amount.suggested_value).toBe("500000");
    expect(rec_001_deal_amount.severity).toBe("warning");

    const rec_002_items = notification.correction_items.filter(
      (item: any) => item.record_id === "rec_002"
    );
    expect(rec_002_items.length).toBe(2);

    const rec_002_service_type = rec_002_items.find(
      (item: any) => item.field_name === "service_type"
    );
    expect(rec_002_service_type).toBeDefined();
    expect(rec_002_service_type.field_name).toBe("service_type");
    expect(rec_002_service_type.error_reason).toBe(
      "サービス種別が定義済みリストにありません"
    );
    expect(rec_002_service_type.suggested_value).toBe("basic_plan");
    expect(rec_002_service_type.severity).toBe("error");

    const rec_002_appointment_status = rec_002_items.find(
      (item: any) => item.field_name === "appointment_status"
    );
    expect(rec_002_appointment_status).toBeDefined();
    expect(rec_002_appointment_status.field_name).toBe("appointment_status");
    expect(rec_002_appointment_status.error_reason).toBe(
      "接触日時と成約日時の前後関係が矛盾しています"
    );
    expect(rec_002_appointment_status.suggested_value).toBe("pending");
    expect(rec_002_appointment_status.severity).toBe("error");

    expect(notification.summary).toBeDefined();
    expect(notification.summary.total_records_with_errors).toBe(2);
    expect(notification.summary.total_error_count).toBe(5);
    expect(notification.summary.error_count).toBe(4);
    expect(notification.summary.warning_count).toBe(1);

    expect(notification.format_version).toBe("1.0");
    expect(notification.notification_status).toBe("pending");
  });
});