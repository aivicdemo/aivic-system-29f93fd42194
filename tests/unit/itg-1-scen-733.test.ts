import { validateSalesActivityDataType } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業活動データ品質自動検出・通知機能", () => {
  test("SCEN-733: アポ確定状況のデータ型不整合を自動検出し修正通知を発行", () => {
    const input_contact_date = "2024-01-15";
    const input_appointment_status = 123;
    const input_customer_name = "テスト顧客A";
    const input_service_type = "営業コンサルティング";
    const input_contact_result = "受注";

    const result = validateSalesActivityDataType({
      contact_date: input_contact_date,
      appointment_status: input_appointment_status,
      customer_name: input_customer_name,
      service_type: input_service_type,
      contact_result: input_contact_result,
    });

    expect(result.is_valid).toBe(false);
    expect(result.error_count).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({
      field_name: "appointment_status",
      error_type: "type_mismatch",
      expected_type: "string",
      actual_type: "number",
      actual_value: 123,
    });
    expect(result.errors[0].message).toMatch(/アポ確定状況/);
    expect(result.errors[0].message).toMatch(/文字列型/);
    expect(result.notification_message).toMatch(/アポ確定状況のデータ型が不正です/);
    expect(result.notification_message).toMatch(/文字列型を入力してください/);
    expect(result.is_billable).toBe(false);
    expect(result.record_status).toBe("quality_error");
  });
});