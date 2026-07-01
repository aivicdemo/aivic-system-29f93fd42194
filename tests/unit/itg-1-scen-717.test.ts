import { generateCorrectionNotification } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-717: [error] 修正指示通知生成 - 不備が検出されないデータに対して修正指示が生成されない
  test("不備が検出されないデータに対して修正指示通知が生成されない", () => {
    const validSalesData = {
      sales_data_id: "SD-2024-001",
      customer_id: "CUST-001",
      service_id: "SVC-BASIC",
      contact_date: "2024-01-15",
      contact_time: "14:30",
      appointment_confirmed: true,
      appointment_count: 3,
      contract_count: 1,
      customer_response: "positive",
      amount: 150000,
      status: "completed",
      data_entry_date: "2024-01-15T11:00:00Z",
      validated_at: "2024-01-15T11:05:00Z",
      validation_status: "passed",
      validation_errors: [] as string[],
      has_defects: false,
    };

    const result = generateCorrectionNotification({
      sales_data: validSalesData,
      validation_errors: [],
      has_defects: false,
      checked_by: "operator-001",
      checked_at: "2024-01-15T11:05:00Z",
    });

    expect(result).toEqual({
      notification_id: null,
      should_generate_notification: false,
      notification_count: 0,
      defects_detected: false,
      system_message: "修正指示なし",
      log_record: {
        timestamp: "2024-01-15T11:05:00Z",
        processed_data_id: "SD-2024-001",
        status: "no_correction_needed",
        message: "正常なデータのため修正指示は生成されません",
        error_occurred: false,
      },
    });

    expect(result.notification_id).toBeNull();
    expect(result.should_generate_notification).toBe(false);
    expect(result.notification_count).toBe(0);
    expect(result.defects_detected).toBe(false);
    expect(result.system_message).toBe("修正指示なし");
    expect(result.log_record.status).toBe("no_correction_needed");
    expect(result.log_record.error_occurred).toBe(false);
  });
});