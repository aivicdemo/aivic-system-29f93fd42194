import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・エラー検出機能", () => {
  // SCEN-1151: [normal] 営業データ品質検証・エラー検出機能 - 金額の異常値を検出し検証失敗とマークされる
  test("金額フィールドの異常値を検出し検証失敗とマークする", () => {
    // ハッピーパス: 正常な金額データ
    const validSalesData = {
      sales_id: "SALES-001",
      customer_id: "CUST-001",
      amount: 150000,
      transaction_date: "2024-01-15",
      status: "completed"
    };
    const validResult = validateSalesData(validSalesData);
    expect(validResult.is_valid).toBe(true);
    expect(validResult.validation_errors).toEqual([]);

    // エラーケース1: 負の金額
    const negativeSalesData = {
      sales_id: "SALES-002",
      customer_id: "CUST-001",
      amount: -50000,
      transaction_date: "2024-01-15",
      status: "completed"
    };
    const negativeResult = validateSalesData(negativeSalesData);
    expect(negativeResult.is_valid).toBe(false);
    expect(negativeResult.validation_errors).toContainEqual(
      expect.objectContaining({
        field_name: "amount",
        error_code: "AMOUNT_NEGATIVE",
        error_message: expect.stringMatching(/金額/)
      })
    );
    expect(negativeResult.failed_validation_flag).toBe(true);

    // エラーケース2: 極端に大きな金額（最大閾値超過: 1億円以上）
    const extremeLargeSalesData = {
      sales_id: "SALES-003",
      customer_id: "CUST-001",
      amount: 150000000,
      transaction_date: "2024-01-15",
      status: "completed"
    };
    const extremeResult = validateSalesData(extremeLargeSalesData);
    expect(extremeResult.is_valid).toBe(false);
    expect(extremeResult.validation_errors).toContainEqual(
      expect.objectContaining({
        field_name: "amount",
        error_code: "AMOUNT_EXCEEDS_THRESHOLD",
        error_message: expect.stringMatching(/金額/)
      })
    );
    expect(extremeResult.failed_validation_flag).toBe(true);

    // エラーケース3: 金額が0（必須チェック）
    const zeroAmountData = {
      sales_id: "SALES-004",
      customer_id: "CUST-001",
      amount: 0,
      transaction_date: "2024-01-15",
      status: "completed"
    };
    const zeroResult = validateSalesData(zeroAmountData);
    expect(zeroResult.is_valid).toBe(false);
    expect(zeroResult.validation_errors).toContainEqual(
      expect.objectContaining({
        field_name: "amount",
        error_code: "AMOUNT_REQUIRED",
        error_message: expect.stringMatching(/金額/)
      })
    );
    expect(zeroResult.failed_validation_flag).toBe(true);

    // 複合エラーケース: 金額以外に必須項目欠落も存在
    const multipleErrorData = {
      sales_id: "SALES-005",
      customer_id: "",
      amount: -100000,
      transaction_date: "2024-01-15",
      status: "completed"
    };
    const multipleResult = validateSalesData(multipleErrorData);
    expect(multipleResult.is_valid).toBe(false);
    expect(multipleResult.validation_errors.length).toBeGreaterThanOrEqual(2);
    expect(multipleResult.validation_errors).toContainEqual(
      expect.objectContaining({
        field_name: "amount",
        error_code: "AMOUNT_NEGATIVE"
      })
    );
    expect(multipleResult.validation_errors).toContainEqual(
      expect.objectContaining({
        field_name: "customer_id",
        error_code: "CUSTOMER_ID_REQUIRED"
      })
    );
    expect(multipleResult.failed_validation_flag).toBe(true);
    expect(multipleResult.excluded_from_billing).toBe(true);

    // 境界値テスト: 最小有効金額（1円）
    const minAmountData = {
      sales_id: "SALES-006",
      customer_id: "CUST-001",
      amount: 1,
      transaction_date: "2024-01-15",
      status: "completed"
    };
    const minResult = validateSalesData(minAmountData);
    expect(minResult.is_valid).toBe(true);
    expect(minResult.validation_errors).toEqual([]);

    // 境界値テスト: 最大有効金額（9999万9999円）
    const maxValidAmountData = {
      sales_id: "SALES-007",
      customer_id: "CUST-001",
      amount: 99999999,
      transaction_date: "2024-01-15",
      status: "completed"
    };
    const maxValidResult = validateSalesData(maxValidAmountData);
    expect(maxValidResult.is_valid).toBe(true);
    expect(maxValidResult.validation_errors).toEqual([]);
  });
});