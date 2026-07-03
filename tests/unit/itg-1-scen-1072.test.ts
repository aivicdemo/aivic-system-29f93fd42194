import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateBillingTargetItem,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("請求対象項目自動抽出・検証機能", () => {
  // SCEN-1072: [error] 検証ルール違反の入力値は即座にエラーが通知される
  test("検証ルール違反となる入力値を入力した場合、エラーメッセージが即座に表示される", () => {
    // 前提条件: 営業システムから抽出された顧客ごと・サービスごとの営業成果データが存在する状態
    // 発生条件: 請求対象項目自動抽出・検証機能で、検証ルール違反となる入力値が入力フィールドに入力され、検証処理が実行される
    // 期待結果: 検証ルール違反が検出され、エラーメッセージが即座に表示される

    // Case 1: 金額が数値ではなく文字列が入力された場合
    const invalid_amount_input = {
      billable_item_id: "BIL001",
      item_name: "basic_service_fee",
      amount: "invalid_amount_string",
      billing_date: "2024-01-15",
      customer_code: "CUST001",
    };

    expect(() => validateBillingTargetItem(invalid_amount_input)).toThrow(/金額/);

    // Case 2: 日付が不正な形式（YYYY-MM-DD形式ではない）で入力された場合
    const invalid_date_input = {
      billable_item_id: "BIL002",
      item_name: "commission_fee",
      amount: 50000,
      billing_date: "2024/01/15",
      customer_code: "CUST002",
    };

    expect(() => validateBillingTargetItem(invalid_date_input)).toThrow(/日付/);

    // Case 3: 顧客コード（必須項目）が空文字列で入力された場合
    const missing_customer_code_input = {
      billable_item_id: "BIL003",
      item_name: "additional_fee",
      amount: 25000,
      billing_date: "2024-01-15",
      customer_code: "",
    };

    expect(() => validateBillingTargetItem(missing_customer_code_input)).toThrow(/顧客コード/);

    // Case 4: 金額が負の数値で入力された場合（負数は範囲外）
    const negative_amount_input = {
      billable_item_id: "BIL004",
      item_name: "service_fee",
      amount: -10000,
      billing_date: "2024-01-15",
      customer_code: "CUST003",
    };

    expect(() => validateBillingTargetItem(negative_amount_input)).toThrow(/金額範囲/);

    // Case 5: 金額が上限値を超える場合（例：1000万円以上は不正）
    const excessive_amount_input = {
      billable_item_id: "BIL005",
      item_name: "service_fee",
      amount: 15000000,
      billing_date: "2024-01-15",
      customer_code: "CUST004",
    };

    expect(() => validateBillingTargetItem(excessive_amount_input)).toThrow(/金額範囲/);

    // Case 6: 請求日付が過去の日付（集計期間外）である場合
    const out_of_period_date_input = {
      billable_item_id: "BIL006",
      item_name: "service_fee",
      amount: 30000,
      billing_date: "2023-12-01",
      customer_code: "CUST005",
    };

    expect(() => validateBillingTargetItem(out_of_period_date_input)).toThrow(/期間/);

    // Case 7: 請求対象項目名が無効な値である場合
    const invalid_item_name_input = {
      billable_item_id: "BIL007",
      item_name: "invalid_item_type",
      amount: 40000,
      billing_date: "2024-01-15",
      customer_code: "CUST006",
    };

    expect(() => validateBillingTargetItem(invalid_item_name_input)).toThrow(/項目/);

    // Case 8: 正常な入力値の場合、エラーが発生しない（成功ケース）
    const valid_input = {
      billable_item_id: "BIL008",
      item_name: "basic_service_fee",
      amount: 50000,
      billing_date: "2024-01-15",
      customer_code: "CUST007",
    };

    const result = validateBillingTargetItem(valid_input);

    // 期待値: 検証が完全に成功し、正規化されたデータが返される
    expect(result).toEqual({
      billable_item_id: "BIL008",
      item_name: "basic_service_fee",
      amount: 50000,
      billing_date: "2024-01-15",
      customer_code: "CUST007",
      validation_status: "passed",
      validated_at: expect.any(String),
      error_details: null,
    });

    // Case 9: 複数の検証ルール違反が含まれている場合、最初の違反を報告
    const multiple_violations_input = {
      billable_item_id: "BIL009",
      item_name: "invalid_type",
      amount: "abc",
      billing_date: "invalid_date",
      customer_code: "",
    };

    expect(() => validateBillingTargetItem(multiple_violations_input)).toThrow(/項目|金額|日付|顧客コード/);

    // Case 10: 金額が0円の場合（エッジケース：許可される場合と許可されない場合がある）
    const zero_amount_input = {
      billable_item_id: "BIL010",
      item_name: "adjustment_fee",
      amount: 0,
      billing_date: "2024-01-15",
      customer_code: "CUST008",
    };

    // 調整費（adjustment_fee）の場合は0円が許可されることを前提
    const result_zero = validateBillingTargetItem(zero_amount_input);
    expect(result_zero.validation_status).toBe("passed");

    // Case 11: 小数点を含む金額が入力された場合（通常は許可されない）
    const decimal_amount_input = {
      billable_item_id: "BIL011",
      item_name: "service_fee",
      amount: 50000.5,
      billing_date: "2024-01-15",
      customer_code: "CUST009",
    };

    expect(() => validateBillingTargetItem(decimal_amount_input)).toThrow(/金額|小数/);
  });
});