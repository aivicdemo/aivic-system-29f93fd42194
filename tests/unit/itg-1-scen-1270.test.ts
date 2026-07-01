import { describe, test, expect } from "@jest/globals";
import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1270
  test("[normal] 月次営業データ完全性・正確性の自動検証 - 営業データの必須項目がすべて揃っている場合、検証完了として集計完了の可否を正しく判定する", () => {
    // 必須項目がすべて含まれたテストデータを準備
    const testData = {
      sales_date: "2024-01-15",
      customer_id: "CUST001",
      product_code: "PROD-A",
      sales_amount: 150000,
      sales_rep_id: "REP001",
      department_code: "DEPT-01",
    };

    // 営業データ検証モジュールに入力してデータ完全性チェックを実行
    const result = validateSalesDataCompleteness(testData);

    // すべての必須項目が揃っていることを確認
    expect(result).toEqual({
      is_complete: true,
      is_valid: true,
      validation_complete: true,
      aggregation_ready: true,
      missing_fields: [],
      error_messages: [],
    });

    // 検証完了フラグがtrueとなっていることを確認
    expect(result.validation_complete).toBe(true);

    // 集計完了判定がtrueで返却されることを確認
    expect(result.aggregation_ready).toBe(true);

    // 欠落フィールドがないことを確認
    expect(result.missing_fields.length).toBe(0);

    // エラーメッセージがないことを確認
    expect(result.error_messages.length).toBe(0);

    // 完全性チェック結果がtrueであることを確認
    expect(result.is_complete).toBe(true);

    // 妥当性チェック結果がtrueであることを確認
    expect(result.is_valid).toBe(true);
  });
});