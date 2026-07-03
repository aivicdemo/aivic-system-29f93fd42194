import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesReportCompleteness,
  type SalesReportValidationInput,
  type SalesReportValidationResult,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業報告書集計自動検証機能", () => {
  // SCEN-1074: [normal] 営業報告書集計自動検証機能 - 営業データの必須項目がすべて揃い計算式が正確に適用されている場合に検証完了と判定される
  test("必須項目がすべて揃い計算式が正確に適用されている場合に検証完了と判定される", () => {
    const testInput: SalesReportValidationInput = {
      sales_rep_name: "田中太郎",
      sales_date: "2024-01-15",
      product_name: "営業代行サービス",
      quantity: 10,
      unit_price: 50000,
      customer_name: "顧客A企業",
      tax_rate: 0.1,
    };

    const result: SalesReportValidationResult =
      validateSalesReportCompleteness(testInput);

    // 検証ステータスが「検証完了」
    expect(result.validation_status).toBe("検証完了");

    // すべての必須項目が揃っていることが確認される
    expect(result.required_fields_complete).toBe(true);

    // 計算項目の検証
    // 小計: 10 * 50000 = 500000
    expect(result.subtotal).toBe(500000);

    // 税金: 500000 * 0.1 = 50000
    expect(result.tax_amount).toBe(50000);

    // 合計金額: 500000 + 50000 = 550000
    expect(result.total_amount).toBe(550000);

    // 計算式が正確に適用されていることが確認される
    expect(result.calculation_accurate).toBe(true);

    // エラーが存在しないことを確認
    expect(result.validation_errors).toEqual([]);
  });
});