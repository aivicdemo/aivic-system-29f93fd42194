import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateSalesData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1029: [error] 営業データの検証ルール確認と品質基準の明確化 - 検証ルール定義が存在しない場合にエラーが返却される
  test("検証ルール定義が存在しない場合、適切なエラーコードとメッセージを返却する", () => {
    const input_sales_data = {
      sales_activity_id: "SA20240115001",
      customer_id: "CUST001",
      contact_date: "2024-01-15",
      outcome_content: "新規商談開始",
      appointment_status: "confirmed",
      service_type: "consulting"
    };

    const input_validation_rules = null;

    expect(() => {
      validateSalesData(input_sales_data, input_validation_rules);
    }).toThrow(/検証ルール定義/);
  });
});