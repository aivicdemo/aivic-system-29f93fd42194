import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・異常検出", () => {
  // SCEN-612
  test("月次締め日に営業データの必須項目が全て入力されている場合、検証が成功し異常なしと判定される", () => {
    const sales_data = {
      customer_name: "ABC株式会社",
      product_name: "営業支援システム",
      amount: 500000,
      sales_date: "2024-01-31",
      staff_name: "営業太郎",
      sales_type: "新規",
      contact_method: "電話",
      result_status: "商談成立",
    };

    const validation_result = validateSalesDataQuality(sales_data);

    expect(validation_result.status).toBe("success");
    expect(validation_result.has_error).toBe(false);
    expect(validation_result.error_message).toBe("");
    expect(validation_result.validation_log).toBe("検証成功");
    expect(validation_result.missing_fields).toEqual([]);
  });
});