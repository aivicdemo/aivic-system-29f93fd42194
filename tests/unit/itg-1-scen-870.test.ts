import { describe, test, expect, beforeEach } from "@jest/globals";
import { detectValidationErrorsAndNotify } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-870: [normal] 検証エラー自動通知機能 - 検証結果『不正の可能性あり』判定時に上位管理者へ自動通知される
  test("検証結果が不正の可能性ありと判定された場合、上位管理者に対して自動通知が即座に送信され、通知メッセージには該当データの詳細情報が含まれること", () => {
    const sales_data_id = "SALES_20240115_001";
    const customer_id = "CUST_0001";
    const service_id = "SVC_BASIC";
    const appointment_count = 150;
    const contract_count = 45;
    const sales_amount = 450000;
    const data_entry_date = new Date("2024-01-15T09:30:00Z");
    const entry_user_id = "USER_SALES_001";

    const validation_result = detectValidationErrorsAndNotify({
      sales_data_id: sales_data_id,
      customer_id: customer_id,
      service_id: service_id,
      appointment_count: appointment_count,
      contract_count: contract_count,
      sales_amount: sales_amount,
      data_entry_date: data_entry_date,
      entry_user_id: entry_user_id,
    });

    expect(validation_result).toBeDefined();
    expect(validation_result.validation_status).toBe("不正の可能性あり");
    expect(validation_result.error_details).toBeDefined();
    expect(Array.isArray(validation_result.error_details)).toBe(true);
    expect(validation_result.error_details.length).toBeGreaterThan(0);

    const error_message = validation_result.error_details[0];
    expect(error_message.error_code).toBeDefined();
    expect(error_message.error_description).toBeDefined();
    expect(error_message.detected_field).toBeDefined();
    expect(error_message.detected_value).toBeDefined();

    expect(validation_result.notification_sent).toBe(true);
    expect(validation_result.notification_target_user_type).toBe("上位管理者");
    expect(validation_result.notification_timestamp).toBeDefined();
    expect(typeof validation_result.notification_timestamp).toBe("string");

    const notification_content = validation_result.notification_content;
    expect(notification_content).toBeDefined();
    expect(notification_content.data_id).toBe(sales_data_id);
    expect(notification_content.customer_id).toBe(customer_id);
    expect(notification_content.service_id).toBe(service_id);
    expect(notification_content.validation_status).toBe("不正の可能性あり");
    expect(notification_content.error_summary).toBeDefined();
    expect(notification_content.error_summary.length).toBeGreaterThan(0);
    expect(notification_content.timestamp).toBe(validation_result.notification_timestamp);

    expect(validation_result.escalation_flag).toBe(true);
    expect(validation_result.escalation_priority).toBe("高");

    const contract_rate = contract_count / appointment_count;
    expect(validation_result.calculated_metrics).toBeDefined();
    expect(validation_result.calculated_metrics.contract_rate).toBe(
      Math.round((contract_rate * 10000) / 100)
    );

    expect(validation_result.requires_manual_review).toBe(true);
  });

  test("不正の可能性がない通常データの場合、検証は合格し上位管理者への自動通知は送信されないこと", () => {
    const sales_data_id = "SALES_20240115_002";
    const customer_id = "CUST_0002";
    const service_id = "SVC_PREMIUM";
    const appointment_count = 80;
    const contract_count = 24;
    const sales_amount = 480000;
    const data_entry_date = new Date("2024-01-15T10:00:00Z");
    const entry_user_id = "USER_SALES_002";

    const validation_result = detectValidationErrorsAndNotify({
      sales_data_id: sales_data_id,
      customer_id: customer_id,
      service_id: service_id,
      appointment_count: appointment_count,
      contract_count: contract_count,
      sales_amount: sales_amount,
      data_entry_date: data_entry_date,
      entry_user_id: entry_user_id,
    });

    expect(validation_result.validation_status).toBe("合格");
    expect(validation_result.notification_sent).toBe(false);
    expect(validation_result.escalation_flag).toBe(false);
    expect(validation_result.requires_manual_review).toBe(false);
    expect(validation_result.error_details.length).toBe(0);
  });

  test("必須項目が欠落している場合、検証エラーとして検出され上位管理者に通知されること", () => {
    const sales_data_id = "SALES_20240115_003";
    const customer_id = "CUST_0003";
    const service_id = undefined;
    const appointment_count = 50;
    const contract_count = 15;
    const sales_amount = 300000;
    const data_entry_date = new Date("2024-01-15T11:00:00Z");
    const entry_user_id = "USER_SALES_003";

    expect(() => {
      detectValidationErrorsAndNotify({
        sales_data_id: sales_data_id,
        customer_id: customer_id,
        service_id: service_id as any,
        appointment_count: appointment_count,
        contract_count: contract_count,
        sales_amount: sales_amount,
        data_entry_date: data_entry_date,
        entry_user_id: entry_user_id,
      });
    }).toThrow(/必須項目/);
  });

  test("データ型が不正な場合、検証エラーとして検出され不正の可能性あり判定となること", () => {
    const sales_data_id = "SALES_20240115_004";
    const customer_id = "CUST_0004";
    const service_id = "SVC_STANDARD";
    const appointment_count = "not_a_number" as any;
    const contract_count = 18;
    const sales_amount = 360000;
    const data_entry_date = new Date("2024-01-15T12:00:00Z");
    const entry_user_id = "USER_SALES_004";

    expect(() => {
      detectValidationErrorsAndNotify({
        sales_data_id: sales_data_id,
        customer_id: customer_id,
        service_id: service_id,
        appointment_count: appointment_count,
        contract_count: contract_count,
        sales_amount: sales_amount,
        data_entry_date: data_entry_date,
        entry_user_id: entry_user_id,
      });
    }).toThrow(/データ型/);
  });

  test("金額の異常値（契約数に対して非常に低い金額）が検出された場合、不正の可能性あり判定となり上位管理者に通知されること", () => {
    const sales_data_id = "SALES_20240115_005";
    const customer_id = "CUST_0005";
    const service_id = "SVC_ENTERPRISE";
    const appointment_count = 120;
    const contract_count = 36;
    const sales_amount = 1000;
    const data_entry_date = new Date("2024-01-15T13:00:00Z");
    const entry_user_id = "USER_SALES_005";

    const validation_result = detectValidationErrorsAndNotify({
      sales_data_id: sales_data_id,
      customer_id: customer_id,
      service_id: service_id,
      appointment_count: appointment_count,
      contract_count: contract_count,
      sales_amount: sales_amount,
      data_entry_date: data_entry_date,
      entry_user_id: entry_user_id,
    });

    expect(validation_result.validation_status).toBe("不正の可能性あり");
    expect(validation_result.notification_sent).toBe(true);
    expect(validation_result.notification_target_user_type).toBe("上位管理者");
    expect(validation_result.error_details.length).toBeGreaterThan(0);

    const error_detail = validation_result.error_details.find(
      (e: any) => e.detected_field === "sales_amount"
    );
    expect(error_detail).toBeDefined();
    expect(error_detail.error_code).toMatch(/金額|異常値/);
  });

  test("契約率が異常（100%超過）の場合、不正の可能性あり判定となり上位管理者に通知されること", () => {
    const sales_data_id = "SALES_20240115_006";
    const customer_id = "CUST_0006";
    const service_id = "SVC_BASIC";
    const appointment_count = 50;
    const contract_count = 55;
    const sales_amount = 550000;
    const data_entry_date = new Date("2024-01-15T14:00:00Z");
    const entry_user_id = "USER_SALES_006";

    const validation_result = detectValidationErrorsAndNotify({
      sales_data_id: sales_data_id,
      customer_id: customer_id,
      service_id: service_id,
      appointment_count: appointment_count,
      contract_count: contract_count,
      sales_amount: sales_amount,
      data_entry_date: data_entry_date,
      entry_user_id: entry_user_id,
    });

    expect(validation_result.validation_status).toBe("不正の可能性あり");
    expect(validation_result.notification_sent).toBe(true);
    expect(validation_result.error_details.length).toBeGreaterThan(0);

    const error_detail = validation_result.error_details.find(
      (e: any) => e.detected_field === "contract_rate"
    );
    expect(error_detail).toBeDefined();
    expect(error_detail.error_code).toMatch(/契約率|矛盾/);
  });

  test("通知メッセージに検証エラーの詳細情報（データID、エラー内容、タイムスタンプ等）が含まれていることを確認", () => {
    const sales_data_id = "SALES_20240115_007";
    const customer_id = "CUST_0007";
    const service_id = "SVC_PREMIUM";
    const appointment_count = 200;
    const contract_count = 80;
    const sales_amount = 100000;
    const data_entry_date = new Date("2024-01-15T15:00:00Z");
    const entry_user_id = "USER_SALES_007";

    const validation_result = detectValidationErrorsAndNotify({
      sales_data_id: sales_data_id,
      customer_id: customer_id,
      service_id: service_id,
      appointment_count: appointment_count,
      contract_count: contract_count,
      sales_amount: sales_amount,
      data_entry_date: data_entry_date,
      entry_user_id: entry_user_id,
    });

    if (validation_result.validation_status === "不正の可能性あり") {
      expect(validation_result.notification_content.data_id).toBe(
        sales_data_id
      );
      expect(validation_result.notification_content.customer_id).toBe(
        customer_id
      );
      expect(validation_result.notification_content.error_summary).toBeDefined();
      expect(
        Array.isArray(validation_result.notification_content.error_summary)
      ).toBe(true);

      validation_result.notification_content.error_summary.forEach(
        (error: any) => {
          expect(error).toHaveProperty("error_code");
          expect(error).toHaveProperty("error_description");
          expect(error).toHaveProperty("severity");
        }
      );

      expect(validation_result.notification_content.timestamp).toBeDefined();
      expect(typeof validation_result.notification_content.timestamp).toBe(
        "string"
      );

      const timestamp_date = new Date(
        validation_result.notification_content.timestamp
      );
      expect(timestamp_date.getTime()).toBeGreaterThan(0);
    }
  });

  test("上位管理者への自動通知がシステムログに記録されていることを確認", () => {
    const sales_data_id = "SALES_20240115_008";
    const customer_id = "CUST_0008";
    const service_id = "SVC_STANDARD";
    const appointment_count = 160;
    const contract_count = 64;
    const sales_amount = 50000;
    const data_entry_date = new Date("2024-01-15T16:00:00Z");
    const entry_user_id = "USER_SALES_008";

    const validation_result = detectValidationErrorsAndNotify({
      sales_data_id: sales_data_id,
      customer_id: customer_id,
      service_id: service_id,
      appointment_count: appointment_count,
      contract_count: contract_count,
      sales_amount: sales_amount,
      data_entry_date: data_entry_date,
      entry_user_id: entry_user_id,
    });

    if (validation_result.notification_sent) {
      expect(validation_result).toHaveProperty("system_log_entry");
      expect(validation_result.system_log_entry).toBeDefined();
      expect(validation_result.system_log_entry.log_timestamp).toBeDefined();
      expect(validation_result.system_log_entry.notification_type).toBe(
        "VALIDATION_ERROR_ALERT"
      );
      expect(validation_result.system_log_entry.target_user_id).toMatch(
        /ADMIN|MANAGER/
      );
      expect(validation_result.system_log_entry.sales_data_id).toBe(
        sales_data_id
      );
    }
  });

  test("複数の検証エラーが存在する場合、全エラーが通知メッセージに含まれて上位管理者に送信されること", () => {
    const sales_data_id = "SALES_20240115_009";
    const customer_id = "CUST_0009";
    const service_id = "SVC_BASIC";
    const appointment_count = 10;
    const contract_count = 20;
    const sales_amount = 500;
    const data_entry_date = new Date("2024-01-15T17:00:00Z");
    const entry_user_id = "USER_SALES_009";

    const validation_result = detectValidationErrorsAndNotify({
      sales_data_id: sales_data_id,
      customer_id: customer_id,
      service_id: service_id,
      appointment_count: appointment_count,
      contract_count: contract_count,
      sales_amount: sales_amount,
      data_entry_date: data_entry_date,
      entry_user_id: entry_user_id,
    });

    expect(validation_result.validation_status).toBe("不正の可能性あり");
    expect(validation_result.notification_sent).toBe(true);
    expect(validation_result.error_details.length).toBeGreaterThanOrEqual(2);

    const error_codes = validation_result.error_details.map(
      (e: any) => e.error_code
    );
    expect(error_codes.length).toBeGreaterThanOrEqual(2);

    validation_result.notification_content.error_summary.forEach(
      (error: any) => {
        expect(error_codes).toContain(error.error_code);
      }
    );
  });

  test("通知タイムスタンプが現在時刻に近い値で記録されていることを確認", () => {
    const sales_data_id = "SALES_20240115_010";
    const customer_id = "CUST_0010";
    const service_id = "SVC_ENTERPRISE";
    const appointment_count = 100;
    const contract_count = 50;
    const sales_amount = 100;
    const data_entry_date = new Date("2024-01-15T18:00:00Z");
    const entry_user_id = "USER_SALES_010";

    const before_timestamp = new Date();

    const validation_result = detectValidationErrorsAndNotify({
      sales_data_id: sales_data_id,
      customer_id: customer_id,
      service_id: service_id,
      appointment_count: appointment_count,
      contract_count: contract_count,
      sales_amount: sales_amount,
      data_entry_date: data_entry_date,
      entry_user_id: entry_user_id,
    });

    const after_timestamp = new Date();

    if (validation_result.notification_sent) {
      const notification_ts = new Date(
        validation_result.notification_timestamp
      );
      expect(notification_ts.getTime()).toBeGreaterThanOrEqual(
        before_timestamp.getTime() - 1000
      );
      expect(notification_ts.getTime()).toBeLessThanOrEqual(
        after_timestamp.getTime() + 1000
      );
    }
  });

  test("エスカレーション優先度が正しく判定され、通知に反映されていることを確認", () => {
    const sales_data_id = "SALES_20240115_011";
    const customer_id = "CUST_0011";
    const service_id = "SVC_BASIC";
    const appointment_count = 5;
    const contract_count = 10;
    const sales_amount = 50000000;
    const data_entry_date = new Date("2024-01-15T19:00:00Z");
    const entry_user_id = "USER_SALES_011";

    const validation_result = detectValidationErrorsAndNotify({
      sales_data_id: sales_data_id,
      customer_id: customer_id,
      service_id: service_id,
      appointment_count: appointment_count,
      contract_count: contract_count,
      sales_amount: sales_amount,
      data_entry_date: data_entry_date,
      entry_user_id: entry_user_id,
    });

    if (validation_result.validation_status === "不正の可能性あり") {
      expect(validation_result.escalation_flag).toBe(true);
      expect(
        ["高", "中", "低"].includes(validation_result.escalation_priority)
      ).toBe(true);
      expect(validation_result.notification_content).toHaveProperty(
        "escalation_priority"
      );
      expect(validation_result.notification_content.escalation_priority).toBe(
        validation_result.escalation_priority
      );
    }
  });
});