import { describe, it, expect, beforeEach } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 金額データ型不整合検出", () => {
  it("SCEN-927: 金額フィールドのデータ型不整合を検出し、エラー内容と検出位置が正確に記録される", () => {
    // 初期化: 検証ルール適用前の準備
    const testData = {
      record_id: "SLS-2024-001",
      customer_id: "CUST-12345",
      appointment_count: 5,
      contract_count: 2,
      revenue_amount: "abc123", // 金額フィールドに文字列型の値を設定（エラートリガー）
      service_type: "basic",
      transaction_date: "2024-01-15",
      row_number: 1,
      column_number: 6,
    };

    const validationRules = {
      revenue_amount: {
        field_name: "revenue_amount",
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 9999999,
        error_code: "DATA_TYPE_MISMATCH",
      },
    };

    // 金額データ型検証ルールを適用
    const result = validateSalesDataQuality(testData, validationRules);

    // エラーが検出されたことを確認
    expect(result.is_valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // エラーメッセージの内容を検証
    const revenue_error = result.errors.find(
      (err) => err.field_name === "revenue_amount"
    );
    expect(revenue_error).toBeDefined();
    expect(revenue_error?.error_code).toBe("DATA_TYPE_MISMATCH");
    expect(revenue_error?.message).toMatch(/revenue_amount/);

    // 検出位置（行番号、列番号、フィールド名）を検証
    expect(revenue_error?.row_number).toBe(1);
    expect(revenue_error?.column_number).toBe(6);
    expect(revenue_error?.field_name).toBe("revenue_amount");

    // タイムスタンプが正確に記録されている
    expect(revenue_error?.detected_at).toBeDefined();
    expect(typeof revenue_error?.detected_at).toBe("string");

    // 検出されたエラー内容が期待値と一致
    expect(revenue_error?.detected_value).toBe("abc123");
    expect(revenue_error?.expected_type).toBe("number");

    // エラーレコードがシステムログに正確に記録されている
    expect(result.error_log_id).toBeDefined();
    expect(result.error_log_id).toMatch(/^ERR-/);

    // 後続の請求自動化処理がスキップされることを確認
    expect(result.can_proceed_to_billing).toBe(false);

    // 検証結果の構造が正確に保持されている
    expect(result).toHaveProperty("is_valid");
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("error_log_id");
    expect(result).toHaveProperty("can_proceed_to_billing");
    expect(result).toHaveProperty("validation_timestamp");
  });
});