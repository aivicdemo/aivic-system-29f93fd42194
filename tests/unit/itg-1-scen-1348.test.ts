import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証ルール実行機能", () => {
  test("SCEN-1348: 営業データの欠落項目が検出され、エラー内容が正確に記録される", () => {
    // テストデータ1: 顧客名が欠落
    const test_data_1_missing_customer = {
      record_id: "REC001",
      customer_name: "",
      amount: 150000,
      transaction_date: "2024-01-15",
      service_type: "consultation",
      sales_rep_id: "SR001",
      created_at: "2024-01-15T09:30:00Z",
    };

    const result_1 = validateSalesDataQuality(test_data_1_missing_customer);

    expect(result_1.is_valid).toBe(false);
    expect(result_1.error_count).toBe(1);
    expect(result_1.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "customer_name",
          error_type: "missing_required_field",
          record_id: "REC001",
          error_message: expect.stringMatching(/顧客名/),
          error_timestamp: expect.any(String),
          severity_level: "error",
        }),
      ])
    );
    expect(result_1.errors[0].error_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // テストデータ2: 金額が欠落
    const test_data_2_missing_amount = {
      record_id: "REC002",
      customer_name: "Customer A",
      amount: null,
      transaction_date: "2024-01-15",
      service_type: "support",
      sales_rep_id: "SR002",
      created_at: "2024-01-15T10:15:00Z",
    };

    const result_2 = validateSalesDataQuality(test_data_2_missing_amount);

    expect(result_2.is_valid).toBe(false);
    expect(result_2.error_count).toBe(1);
    expect(result_2.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "amount",
          error_type: "missing_required_field",
          record_id: "REC002",
          error_message: expect.stringMatching(/金額/),
          severity_level: "error",
        }),
      ])
    );

    // テストデータ3: 取引日付が欠落
    const test_data_3_missing_date = {
      record_id: "REC003",
      customer_name: "Customer B",
      amount: 250000,
      transaction_date: "",
      service_type: "development",
      sales_rep_id: "SR003",
      created_at: "2024-01-15T11:00:00Z",
    };

    const result_3 = validateSalesDataQuality(test_data_3_missing_date);

    expect(result_3.is_valid).toBe(false);
    expect(result_3.error_count).toBe(1);
    expect(result_3.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "transaction_date",
          error_type: "missing_required_field",
          record_id: "REC003",
          error_message: expect.stringMatching(/日付/),
          severity_level: "error",
        }),
      ])
    );

    // テストデータ4: 複数項目が欠落（顧客名と金額）
    const test_data_4_multiple_missing = {
      record_id: "REC004",
      customer_name: "",
      amount: undefined,
      transaction_date: "2024-01-15",
      service_type: "maintenance",
      sales_rep_id: "SR004",
      created_at: "2024-01-15T12:30:00Z",
    };

    const result_4 = validateSalesDataQuality(test_data_4_multiple_missing);

    expect(result_4.is_valid).toBe(false);
    expect(result_4.error_count).toBe(2);
    expect(result_4.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "customer_name",
          error_type: "missing_required_field",
          record_id: "REC004",
        }),
        expect.objectContaining({
          field_name: "amount",
          error_type: "missing_required_field",
          record_id: "REC004",
        }),
      ])
    );
    expect(result_4.errors.length).toBe(2);
    expect(result_4.errors.every((e) => e.record_id === "REC004")).toBe(true);
    expect(result_4.errors.every((e) => e.severity_level === "error")).toBe(
      true
    );

    // テストデータ5: 複数項目が欠落（顧客名、金額、日付）
    const test_data_5_three_missing = {
      record_id: "REC005",
      customer_name: "",
      amount: null,
      transaction_date: "",
      service_type: "training",
      sales_rep_id: "SR005",
      created_at: "2024-01-15T14:00:00Z",
    };

    const result_5 = validateSalesDataQuality(test_data_5_three_missing);

    expect(result_5.is_valid).toBe(false);
    expect(result_5.error_count).toBe(3);
    expect(result_5.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "customer_name",
          record_id: "REC005",
        }),
        expect.objectContaining({
          field_name: "amount",
          record_id: "REC005",
        }),
        expect.objectContaining({
          field_name: "transaction_date",
          record_id: "REC005",
        }),
      ])
    );
    expect(result_5.errors.length).toBe(3);
    expect(result_5.errors.every((e) => e.error_type === "missing_required_field")).toBe(true);

    // テストデータ6: すべてのフィールドが正常に入力された場合
    const test_data_6_valid = {
      record_id: "REC006",
      customer_name: "Valid Customer",
      amount: 350000,
      transaction_date: "2024-01-15",
      service_type: "consulting",
      sales_rep_id: "SR006",
      created_at: "2024-01-15T15:45:00Z",
    };

    const result_6 = validateSalesDataQuality(test_data_6_valid);

    expect(result_6.is_valid).toBe(true);
    expect(result_6.error_count).toBe(0);
    expect(result_6.errors.length).toBe(0);

    // エラーレコード一貫性の検証：すべてのエラーにタイムスタンプとレコードIDが含まれることを確認
    [result_1, result_2, result_3, result_4, result_5].forEach((result) => {
      result.errors.forEach((error) => {
        expect(error).toHaveProperty("error_timestamp");
        expect(error).toHaveProperty("record_id");
        expect(error).toHaveProperty("field_name");
        expect(error).toHaveProperty("error_type");
        expect(error).toHaveProperty("severity_level");
        expect(error.error_timestamp).not.toBeNull();
        expect(error.record_id).not.toBeNull();
        expect(error.severity_level).toBe("error");
      });
    });
  });
});