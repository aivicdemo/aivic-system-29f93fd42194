import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateSalesDataWithRules } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1336
  test("検証ルール定義の読み込み失敗時、検証処理がエラーとなり、入力データの確定が阻止される", () => {
    const sales_input_data = {
      customer_name: "テスト顧客",
      amount: 100000,
      contact_date: "2024-01-15",
      appointment_status: "confirmed",
    };

    const validation_rule_config = null;

    const result = () =>
      validateSalesDataWithRules(sales_input_data, validation_rule_config);

    expect(result).toThrow(/検証ルール定義/);
  });
});