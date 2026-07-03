import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質基準チェック判定機能", () => {
  // SCEN-709: [error] 営業データ品質基準チェック判定機能 - 必須項目が欠落している場合チェック結果が『不合格』と判定される
  test("必須項目が欠落している場合、チェック結果が『不合格』と判定され、欠落している必須項目が明示されるエラーメッセージが返される", () => {
    // 必須項目が欠落したテストデータを準備
    const sales_data_without_customer_name = {
      customer_id: "C001",
      amount: 50000,
      transaction_date: "2024-01-15",
      status: "completed",
    };

    const sales_data_without_amount = {
      customer_name: "ABC Corporation",
      customer_id: "C002",
      transaction_date: "2024-01-16",
      status: "completed",
    };

    const sales_data_without_transaction_date = {
      customer_name: "XYZ Company",
      customer_id: "C003",
      amount: 75000,
      status: "completed",
    };

    // チェック判定機能を実行：顧客名欠落ケース
    const result_missing_customer_name = validateSalesDataQuality(
      sales_data_without_customer_name
    );

    // チェック結果が『不合格』と判定されることを検証
    expect(result_missing_customer_name.is_valid).toBe(false);
    expect(result_missing_customer_name.status).toBe("不合格");
    // 欠落している必須項目が明示されるエラーメッセージを検証
    expect(result_missing_customer_name.error_message).toMatch(/顧客名/);

    // チェック判定機能を実行：金額欠落ケース
    const result_missing_amount = validateSalesDataQuality(
      sales_data_without_amount
    );

    expect(result_missing_amount.is_valid).toBe(false);
    expect(result_missing_amount.status).toBe("不合格");
    expect(result_missing_amount.error_message).toMatch(/金額/);

    // チェック判定機能を実行：取引日欠落ケース
    const result_missing_transaction_date = validateSalesDataQuality(
      sales_data_without_transaction_date
    );

    expect(result_missing_transaction_date.is_valid).toBe(false);
    expect(result_missing_transaction_date.status).toBe("不合格");
    expect(result_missing_transaction_date.error_message).toMatch(/取引日/);

    // 複数の必須項目が欠落したテストデータ
    const sales_data_missing_multiple_fields = {
      customer_id: "C004",
      status: "completed",
    };

    const result_missing_multiple = validateSalesDataQuality(
      sales_data_missing_multiple_fields
    );

    expect(result_missing_multiple.is_valid).toBe(false);
    expect(result_missing_multiple.status).toBe("不合格");
    // 複数の欠落項目が列挙されることを検証
    expect(result_missing_multiple.error_message).toMatch(/顧客名/);
    expect(result_missing_multiple.error_message).toMatch(/金額/);
    expect(result_missing_multiple.error_message).toMatch(/取引日/);

    // ハッピーパス：すべての必須項目が揃っている場合
    const sales_data_valid = {
      customer_name: "Valid Customer",
      customer_id: "C005",
      amount: 100000,
      transaction_date: "2024-01-17",
      status: "completed",
    };

    const result_valid = validateSalesDataQuality(sales_data_valid);

    expect(result_valid.is_valid).toBe(true);
    expect(result_valid.status).toBe("合格");
  });
});