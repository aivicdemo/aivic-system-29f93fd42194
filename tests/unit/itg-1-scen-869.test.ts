import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import {
  validateSalesData,
  notifyValidationError,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-869
  test("[normal] 検証エラー自動通知機能 - 検証結果『誤りあり』判定時に上位管理者へ自動通知される", async () => {
    // 1. 検証対象となる営業データを準備する
    const sales_data_id = "SALES-2024-001-APP-0042";
    const sales_data_payload = {
      sales_data_id: sales_data_id,
      customer_id: "CUST-0042",
      service_id: "SVC-CONSULTING",
      appointment_count: -5,
      conclusion_count: 3,
      contact_date: "2024-02-31",
      contract_id: "CONTRACT-0042",
      sales_person_id: "SP-001",
      amount: 150000,
    };

    // 2. データ検証ルールを定義
    const validation_rules = [
      {
        rule_id: "RULE-001",
        field_name: "appointment_count",
        validation_type: "range",
        min_value: 0,
        max_value: 1000,
      },
      {
        rule_id: "RULE-002",
        field_name: "contact_date",
        validation_type: "date_format",
        date_format: "YYYY-MM-DD",
      },
      {
        rule_id: "RULE-003",
        field_name: "conclusion_count",
        validation_type: "required",
      },
      {
        rule_id: "RULE-004",
        field_name: "customer_id",
        validation_type: "required",
      },
    ];

    // 3. データ検証機能を実行する
    const validation_result = await validateSalesData(
      sales_data_payload,
      validation_rules
    );

    // 4. 検証結果が『誤りあり』と判定されることを確認する
    expect(validation_result.validation_status).toBe("error");
    expect(validation_result.has_error).toBe(true);
    expect(validation_result.error_count).toBe(2);

    // 5. エラー詳細を確認
    const error_details = validation_result.error_details;
    expect(error_details).toContainEqual({
      rule_id: "RULE-001",
      field_name: "appointment_count",
      error_message: "appointment_count",
      error_value: -5,
      expected_range: { min: 0, max: 1000 },
    });
    expect(error_details).toContainEqual({
      rule_id: "RULE-002",
      field_name: "contact_date",
      error_message: "contact_date",
      error_value: "2024-02-31",
      expected_format: "YYYY-MM-DD",
    });

    // 6. システムが上位管理者への自動通知処理を実行することを確認する
    const manager_email = "manager@example.com";
    const notification_payload = {
      validation_result_id: "VALRES-2024-001-001",
      sales_data_id: sales_data_id,
      validation_status: "error",
      error_count: 2,
      error_details: error_details,
      recipient_email: manager_email,
      timestamp: "2024-02-15T10:30:00Z",
    };

    // 7. 上位管理者のメールボックスに通知メールが送信されることを確認する
    fetchMock.mockResponseOnce(
      JSON.stringify({
        email_id: "EMAIL-2024-001-001",
        recipient: manager_email,
        subject: "検証エラー通知: 営業データ検証結果",
        status: "sent",
        timestamp: "2024-02-15T10:30:00Z",
      }),
      { status: 200 }
    );

    const notification_result = await notifyValidationError(
      notification_payload
    );

    expect(notification_result.status).toBe("sent");
    expect(notification_result.recipient).toBe(manager_email);
    expect(notification_result.email_id).toBe("EMAIL-2024-001-001");

    // 8. 通知メールに検証エラーの詳細情報が含まれていることを確認する
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call_args = fetchMock.mock.calls[0];
    expect(call_args[0]).toMatch(/notification|email/i);

    const request_body = JSON.parse(call_args[1]?.body as string);
    expect(request_body.error_count).toBe(2);
    expect(request_body.error_details).toHaveLength(2);

    // 9. 通知メールに該当データの識別情報が含まれていることを確認する
    expect(request_body.sales_data_id).toBe(sales_data_id);
    expect(request_body.customer_id).toBe("CUST-0042");
    expect(request_body.service_id).toBe("SVC-CONSULTING");

    // 10. 通知メールに誤りの内容と詳細が記載されていることを確認する
    expect(request_body.error_details[0].field_name).toBe("appointment_count");
    expect(request_body.error_details[0].error_message).toBe(
      "appointment_count"
    );
    expect(request_body.error_details[0].error_value).toBe(-5);
    expect(request_body.error_details[0].expected_range.min).toBe(0);
    expect(request_body.error_details[0].expected_range.max).toBe(1000);

    expect(request_body.error_details[1].field_name).toBe("contact_date");
    expect(request_body.error_details[1].error_message).toBe("contact_date");
    expect(request_body.error_details[1].error_value).toBe("2024-02-31");
    expect(request_body.error_details[1].expected_format).toBe("YYYY-MM-DD");
  });
});