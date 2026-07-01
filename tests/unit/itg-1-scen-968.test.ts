import { describe, test, expect } from "@jest/globals";
import { calculateAndValidateBillingAmount } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-968: 営業データの完全性・正確性が基準を満たす場合、請求額を確定して返す", () => {
    // テストデータ: 営業データの準備
    const salesData = {
      customerId: "CUST-001",
      productId: "PROD-A100",
      quantity: 10,
      unitPrice: 5000,
      taxRate: 0.1,
    };

    // 期待値の計算
    // 小計 = 数量 × 単価 = 10 × 5000 = 50000
    // 税金 = 小計 × 税率 = 50000 × 0.1 = 5000
    // 請求額 = 小計 + 税金 = 50000 + 5000 = 55000
    const expectedSubtotal = 50000;
    const expectedTax = 5000;
    const expectedBillingAmount = 55000;

    // 関数を呼び出す
    const result = calculateAndValidateBillingAmount(salesData);

    // 完全性チェック: 必須項目がすべて存在することを確認
    expect(result.completenessCheckPassed).toBe(true);

    // 正確性チェック: データ型、値の範囲、形式が正しいことを確認
    expect(result.accuracyCheckPassed).toBe(true);

    // 計算結果の検証
    expect(result.subtotal).toBe(expectedSubtotal);
    expect(result.tax).toBe(expectedTax);
    expect(result.billingAmount).toBe(expectedBillingAmount);

    // 確定状態の検証
    expect(result.status).toBe("confirmed");

    // 返却値の構造検証
    expect(result).toEqual({
      completenessCheckPassed: true,
      accuracyCheckPassed: true,
      subtotal: expectedSubtotal,
      tax: expectedTax,
      billingAmount: expectedBillingAmount,
      status: "confirmed",
    });
  });
});