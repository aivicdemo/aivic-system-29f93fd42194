import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesDataCompleteness,
  validateSalesDataAccuracy,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-757: [normal] 営業データ完全性・正確性の自動検証 - 営業データに対して不足データ・誤りが存在する場合、検証機能が自動検出し詳細なエラー内容を記録する
  test("should detect missing and invalid data in sales data and record detailed error logs", () => {
    const test_data_with_missing_fields = [
      {
        record_id: "REC-001",
        customer_id: "CUST-001",
        customer_name: "", // 必須項目の空値（不足データ）
        contact_date: "2024-01-15",
        contact_time: "09:30",
        service_type: "Service A",
        appointment_status: "confirmed",
        amount: 50000,
      },
      {
        record_id: "REC-002",
        customer_id: "CUST-002",
        customer_name: "Company B",
        contact_date: "2024-01-16",
        contact_time: "", // 必須項目の空値（不足データ）
        service_type: "Service B",
        appointment_status: "pending",
        amount: 75000,
      },
      {
        record_id: "REC-003",
        customer_id: "CUST-003",
        customer_name: "Company C",
        contact_date: "2024-01-17",
        contact_time: "14:00",
        service_type: "Service C",
        appointment_status: "confirmed",
        amount: -10000, // 誤り（負の金額）
      },
      {
        record_id: "REC-004",
        customer_id: "CUST-004",
        customer_name: "Company D",
        contact_date: "invalid-date", // 誤り（形式不正な日付）
        contact_time: "11:00",
        service_type: "Service D",
        appointment_status: "confirmed",
        amount: 100000,
      },
      {
        record_id: "REC-005",
        customer_id: "CUST-005",
        customer_name: "Company E",
        contact_date: "2024-01-19",
        contact_time: "10:30",
        service_type: "Service E",
        appointment_status: "invalid_status", // 誤り（不正なステータス値）
        amount: 60000,
      },
    ];

    const completeness_result = validateSalesDataCompleteness(
      test_data_with_missing_fields
    );

    // 不足データの検証結果を確認
    expect(completeness_result.has_errors).toBe(true);
    expect(completeness_result.error_count).toBe(2);
    expect(completeness_result.errors.length).toBe(2);

    // エラー内容の詳細確認（エラー1: REC-001のcustomer_name）
    const error_1 = completeness_result.errors.find(
      (err) => err.record_id === "REC-001" && err.field_name === "customer_name"
    );
    expect(error_1).toBeDefined();
    expect(error_1?.error_type).toBe("missing");
    expect(error_1?.error_message).toMatch(/required/i);
    expect(error_1?.severity_level).toBe("high");
    expect(error_1?.timestamp).toBeDefined();

    // エラー内容の詳細確認（エラー2: REC-002のcontact_time）
    const error_2 = completeness_result.errors.find(
      (err) => err.record_id === "REC-002" && err.field_name === "contact_time"
    );
    expect(error_2).toBeDefined();
    expect(error_2?.error_type).toBe("missing");
    expect(error_2?.error_message).toMatch(/required/i);
    expect(error_2?.severity_level).toBe("high");
    expect(error_2?.timestamp).toBeDefined();

    // 正確性の検証結果を確認
    const accuracy_result = validateSalesDataAccuracy(
      test_data_with_missing_fields
    );

    expect(accuracy_result.has_errors).toBe(true);
    expect(accuracy_result.error_count).toBe(3);
    expect(accuracy_result.errors.length).toBe(3);

    // エラー内容の詳細確認（エラー1: REC-003の負の金額）
    const accuracy_error_1 = accuracy_result.errors.find(
      (err) => err.record_id === "REC-003" && err.field_name === "amount"
    );
    expect(accuracy_error_1).toBeDefined();
    expect(accuracy_error_1?.error_type).toBe("invalid");
    expect(accuracy_error_1?.error_message).toMatch(/negative/i);
    expect(accuracy_error_1?.severity_level).toBe("high");
    expect(accuracy_error_1?.timestamp).toBeDefined();

    // エラー内容の詳細確認（エラー2: REC-004の形式不正な日付）
    const accuracy_error_2 = accuracy_result.errors.find(
      (err) => err.record_id === "REC-004" && err.field_name === "contact_date"
    );
    expect(accuracy_error_2).toBeDefined();
    expect(accuracy_error_2?.error_type).toBe("invalid");
    expect(accuracy_error_2?.error_message).toMatch(/date/i);
    expect(accuracy_error_2?.severity_level).toBe("high");
    expect(accuracy_error_2?.timestamp).toBeDefined();

    // エラー内容の詳細確認（エラー3: REC-005の不正なステータス）
    const accuracy_error_3 = accuracy_result.errors.find(
      (err) =>
        err.record_id === "REC-005" && err.field_name === "appointment_status"
    );
    expect(accuracy_error_3).toBeDefined();
    expect(accuracy_error_3?.error_type).toBe("invalid");
    expect(accuracy_error_3?.error_message).toMatch(/status/i);
    expect(accuracy_error_3?.severity_level).toBe("high");
    expect(accuracy_error_3?.timestamp).toBeDefined();

    // 全エラーログの統合結果を確認
    const all_errors = [...completeness_result.errors, ...accuracy_result.errors];
    expect(all_errors.length).toBe(5);

    // 各エラーが必要な構造化情報を持つことを確認
    all_errors.forEach((error) => {
      expect(error.record_id).toBeDefined();
      expect(error.field_name).toBeDefined();
      expect(error.error_type).toMatch(/^(missing|invalid)$/);
      expect(error.error_message).toBeDefined();
      expect(error.error_message.length).toBeGreaterThan(0);
      expect(error.severity_level).toMatch(/^(high|medium|low)$/);
      expect(error.timestamp).toBeDefined();
      // タイムスタンプは ISO 8601 形式であることを確認
      expect(new Date(error.timestamp).getTime()).toBeGreaterThan(0);
    });
  });
});