import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateSalesDataAndAggregateErrors,
} from "../../src/logic/it-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-872: [edge] 検証エラー自動通知機能 - 複数の誤りが検出された場合に全て1件の通知に集約される
  test("複数の検証エラーが1件の統合通知メッセージとして集約される", async () => {
    const salesDataInput = {
      record_id: "REC-20240115-001",
      customer_id: "CUST-999", // 存在しない顧客ID
      service_type: "appointment",
      appointment_count: -5, // 負数（不正）
      contract_date: "2024-13-45", // 形式不正（月が13、日が45）
      amount: -10000, // 金額が負数
      sales_rep_id: "REP-001",
      record_date: "2024-01-15T10:30:00Z",
    };

    const mockCustomerValidationResponse = {
      valid_customer_ids: [
        "CUST-001",
        "CUST-002",
        "CUST-003",
      ],
    };

    fetchMock.mockResponseOnce(
      JSON.stringify(mockCustomerValidationResponse),
      { status: 200 }
    );

    const result = await validateSalesDataAndAggregateErrors(
      salesDataInput
    );

    // 通知が1件であること
    expect(result.notification_count).toBe(1);

    // 集約されたエラーが存在すること
    expect(result.aggregated_errors).toBeDefined();
    expect(Array.isArray(result.aggregated_errors)).toBe(true);

    // エラーが3件検出されていること（金額負数、日付形式、顧客ID不正）
    expect(result.aggregated_errors.length).toBe(3);

    // エラーメッセージの内容を検証
    const errorTypes = result.aggregated_errors.map(
      (err: { error_type: string }) => err.error_type
    );
    const errorFields = result.aggregated_errors.map(
      (err: { field_name: string }) => err.field_name
    );

    expect(errorTypes).toContain("negative_amount");
    expect(errorTypes).toContain("invalid_date_format");
    expect(errorTypes).toContain("customer_not_found");

    expect(errorFields).toContain("amount");
    expect(errorFields).toContain("contract_date");
    expect(errorFields).toContain("customer_id");

    // 通知メッセージが適切に生成されていること
    expect(result.notification_message).toBeDefined();
    expect(typeof result.notification_message).toBe("string");

    // 通知メッセージに全てのエラーが含まれていること
    expect(result.notification_message).toMatch(/negative_amount/);
    expect(result.notification_message).toMatch(/invalid_date_format/);
    expect(result.notification_message).toMatch(/customer_not_found/);

    // 通知のステータスが正常であること
    expect(result.notification_status).toBe("aggregated");

    // レコードIDが保持されていること
    expect(result.record_id).toBe("REC-20240115-001");

    // エラー検証タイムスタンプが記録されていること
    expect(result.validation_timestamp).toBeDefined();
    const timestamp = new Date(result.validation_timestamp);
    expect(timestamp.toISOString()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

    // 検証結果が不合格であること
    expect(result.validation_result).toBe("failed");
  });
});