import { describe, test, expect } from "@jest/globals";
import {
  validateBillingExtractedData,
  transitionToBillingCalculationStep,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1094: [normal] 請求書作成入力値検証 - 営業データから抽出した請求対象項目がすべて検証ルールに合致する場合、請求額計算ステップへ遷移すること
  test("should validate billing extracted data and transition to billing calculation step when all validation rules pass", () => {
    // Arrange: 営業データから抽出した請求対象項目を準備
    const extracted_billing_data = {
      customer_id: "CUST-2024-001",
      billing_amount: 150000,
      billing_date: "2024-01-15",
      product_code: "PROD-ABC-123",
      quantity: 5,
    };

    // Act: 検証ルール適用
    const validation_result = validateBillingExtractedData(
      extracted_billing_data
    );

    // Assert: すべての検証ルール検証結果がtrueであることを確認
    expect(validation_result.customer_id_format_valid).toBe(true);
    expect(validation_result.billing_amount_positive_number).toBe(true);
    expect(validation_result.billing_date_valid_format).toBe(true);
    expect(validation_result.product_code_format_valid).toBe(true);
    expect(validation_result.quantity_positive_integer).toBe(true);
    expect(validation_result.all_validations_passed).toBe(true);

    // Act: 請求額計算ステップへの遷移処理を実行
    const transition_result = transitionToBillingCalculationStep(
      validation_result
    );

    // Assert: 現在のステップが請求額計算ステップであることを確認
    expect(transition_result.current_step).toBe("billing_calculation");
    expect(transition_result.transition_success).toBe(true);
    expect(transition_result.timestamp).toBeDefined();
  });
});