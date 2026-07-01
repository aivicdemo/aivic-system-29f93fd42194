import { describe, test, expect } from "@jest/globals";
import { validateSalesReport } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業報告書検証 - 必須項目完全性・計算式・異常値チェック", () => {
  test("SCEN-1098: 必須項目が完全に揃い、計算式が正確に適用され、異常値がない場合、検証合格となること", () => {
    // Arrange: テストデータ準備
    // 必須項目: 売上日、商品名、数量、単価、顧客名、担当者名
    const salesReport = {
      sales_date: "2024-01-15",
      product_name: "営業代行サービス",
      quantity: 10,
      unit_price: 50000,
      customer_name: "ABC Corporation",
      sales_person_name: "田中太郎",
    };

    // 期待値の計算: 金額 = 数量 × 単価 = 10 × 50000 = 500000
    const expected_amount = 10 * 50000;

    // Act: 営業報告書を検証システムに投入
    const validation_result = validateSalesReport(salesReport);

    // Assert: 検証結果の確認
    // 1. 検証ステータスが「合格」であること
    expect(validation_result.status).toBe("合格");

    // 2. すべての必須項目が充足していることを確認
    expect(validation_result.required_fields_complete).toBe(true);
    expect(validation_result.missing_fields).toEqual([]);

    // 3. 計算式が正確に適用され、計算結果が期待値と一致することを確認
    expect(validation_result.calculated_amount).toBe(expected_amount);

    // 4. 異常値（負数、極端に大きい値など）がないことを確認
    expect(validation_result.has_anomalies).toBe(false);
    expect(validation_result.anomaly_details).toEqual([]);

    // 5. 検証ログに異常や警告が記録されていないことを確認
    expect(validation_result.validation_warnings).toEqual([]);
    expect(validation_result.validation_errors).toEqual([]);

    // 6. 各必須項目の値が正確に記録されていること
    expect(validation_result.validated_data).toEqual({
      sales_date: "2024-01-15",
      product_name: "営業代行サービス",
      quantity: 10,
      unit_price: 50000,
      customer_name: "ABC Corporation",
      sales_person_name: "田中太郎",
      calculated_amount: 500000,
    });

    // 7. 検証完了タイムスタンプが記録されていること
    expect(validation_result.validated_at).toBeDefined();
    expect(typeof validation_result.validated_at).toBe("string");
  });
});