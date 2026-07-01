import { describe, test, expect } from "@jest/globals";
import {
  validateSalesDataQuality,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ品質検証 - 日付・金額・ステータスの矛盾検出", () => {
  test("SCEN-708: 日付・金額・ステータスの矛盾を検出し修正対象項目と理由を特定する", () => {
    // テストデータ: 3つの矛盾パターンを含むレコード
    const sales_data_record = {
      record_id: "REC-001",
      contract_date: "2024-01-15",
      billing_date: "2024-01-10", // 矛盾1: 契約日より請求日が前
      amount: -50000, // 矛盾2: 金額がマイナス値
      status: "completed",
      billing_date_value: "", // 矛盾3: ステータス完了なのに請求日空白
    };

    // 品質検証実行
    const validation_result = validateSalesDataQuality(sales_data_record);

    // 検出された矛盾が配列形式で返されることを確認
    expect(Array.isArray(validation_result.inconsistencies)).toBe(true);
    expect(validation_result.inconsistencies.length).toBe(3);

    // 矛盾1: 日付矛盾の検出と詳細確認
    const date_inconsistency = validation_result.inconsistencies.find(
      (item: any) => item.inconsistency_type === "date_order"
    );
    expect(date_inconsistency).toBeDefined();
    expect(date_inconsistency.target_field).toBe("billing_date");
    expect(date_inconsistency.correction_reason).toMatch(/契約日/);
    expect(date_inconsistency.current_value).toBe("2024-01-10");
    expect(date_inconsistency.expected_value_range).toMatch(/2024-01-15/);

    // 矛盾2: 金額矛盾の検出と詳細確認
    const amount_inconsistency = validation_result.inconsistencies.find(
      (item: any) => item.inconsistency_type === "negative_amount"
    );
    expect(amount_inconsistency).toBeDefined();
    expect(amount_inconsistency.target_field).toBe("amount");
    expect(amount_inconsistency.correction_reason).toMatch(/負数/);
    expect(amount_inconsistency.current_value).toBe(-50000);
    expect(amount_inconsistency.expected_constraint).toBe("amount >= 0");

    // 矛盾3: ステータス矛盾の検出と詳細確認
    const status_inconsistency = validation_result.inconsistencies.find(
      (item: any) => item.inconsistency_type === "status_field_mismatch"
    );
    expect(status_inconsistency).toBeDefined();
    expect(status_inconsistency.target_field).toBe("billing_date_value");
    expect(status_inconsistency.correction_reason).toMatch(/請求日/);
    expect(status_inconsistency.dependent_field).toBe("status");
    expect(status_inconsistency.dependent_value).toBe("completed");

    // 全体の検証ステータス確認
    expect(validation_result.validation_status).toBe("failed");
    expect(validation_result.error_count).toBe(3);
    expect(validation_result.correction_required).toBe(true);

    // 修正提案が提示されていることを確認
    expect(validation_result.correction_suggestions).toBeDefined();
    expect(Array.isArray(validation_result.correction_suggestions)).toBe(true);
    expect(validation_result.correction_suggestions.length).toBeGreaterThan(0);

    // 修正提案の具体的な内容確認
    const correction_for_billing_date =
      validation_result.correction_suggestions.find(
        (suggestion: any) => suggestion.field === "billing_date"
      );
    expect(correction_for_billing_date).toBeDefined();
    expect(correction_for_billing_date.suggested_value).toBe("2024-01-15");
    expect(correction_for_billing_date.reasoning).toMatch(/契約日以降/);

    const correction_for_amount = validation_result.correction_suggestions.find(
      (suggestion: any) => suggestion.field === "amount"
    );
    expect(correction_for_amount).toBeDefined();
    expect(correction_for_amount.suggested_value).toBe(50000);
    expect(correction_for_amount.reasoning).toMatch(/正数/);

    const correction_for_billing_date_value =
      validation_result.correction_suggestions.find(
        (suggestion: any) => suggestion.field === "billing_date_value"
      );
    expect(correction_for_billing_date_value).toBeDefined();
    expect(correction_for_billing_date_value.suggested_value).toBe(
      "2024-01-15"
    );
    expect(correction_for_billing_date_value.reasoning).toMatch(/ステータス完了/);

    // 修正提案の優先度確認
    expect(validation_result.correction_priority).toBeDefined();
    expect(validation_result.correction_priority).toMatch(/高/);

    // 監査ログが記録されていることを確認
    expect(validation_result.audit_log).toBeDefined();
    expect(validation_result.audit_log.validation_timestamp).toBeDefined();
    expect(validation_result.audit_log.validation_rule_version).toBeDefined();
  });
});