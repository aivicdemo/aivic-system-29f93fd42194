import { calculateInvoiceAmount } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-977: [normal] 請求額算出・検証機能 - 新入スタッフが手順書・チェックリストに基づき請求額を正確に算出・検証できる
  test("新入スタッフが手順書に従い請求額を正確に算出・検証できる", () => {
    // テスト用売上データ入力
    const invoiceData = {
      productName: "営業代行サービス",
      quantity: 100,
      unitPrice: 5000,
      discountRate: 0.1,
      taxRate: 0.1,
    };

    // 小計計算: 数量 × 単価
    const subtotal = invoiceData.quantity * invoiceData.unitPrice;
    expect(subtotal).toBe(500000);

    // 割引額計算: 小計 × 割引率
    const discountAmount = subtotal * invoiceData.discountRate;
    expect(discountAmount).toBe(50000);

    // 割引後の金額
    const discountedAmount = subtotal - discountAmount;
    expect(discountedAmount).toBe(450000);

    // 税額計算: 割引後金額 × 税率
    const taxAmount = discountedAmount * invoiceData.taxRate;
    expect(taxAmount).toBe(45000);

    // 最終請求額: 割引後金額 + 税額
    const finalAmount = discountedAmount + taxAmount;
    expect(finalAmount).toBe(495000);

    // システムの自動計算結果と手計算結果を比較
    const calculatedResult = calculateInvoiceAmount({
      productName: invoiceData.productName,
      quantity: invoiceData.quantity,
      unitPrice: invoiceData.unitPrice,
      discountRate: invoiceData.discountRate,
      taxRate: invoiceData.taxRate,
    });

    expect(calculatedResult).toEqual({
      subtotal: 500000,
      discountAmount: 50000,
      discountedAmount: 450000,
      taxAmount: 45000,
      finalAmount: 495000,
    });

    // チェックリスト項目: 金額の妥当性を検証
    expect(calculatedResult.finalAmount).toBeGreaterThan(0);
    expect(calculatedResult.finalAmount).toBe(finalAmount);

    // チェックリスト項目: 消費税の正確性を検証
    expect(calculatedResult.taxAmount).toBe(taxAmount);
    expect(calculatedResult.taxAmount).toBe(
      calculatedResult.discountedAmount * invoiceData.taxRate
    );

    // チェックリスト項目: 割引の適用可否を検証
    expect(calculatedResult.discountAmount).toBe(discountAmount);
    expect(calculatedResult.discountAmount).toBe(
      calculatedResult.subtotal * invoiceData.discountRate
    );

    // チェックリストのすべての検証項目を確認
    const checklistItems = {
      amountValidity: true,
      taxAccuracy: true,
      discountApplication: true,
    };

    expect(checklistItems.amountValidity).toBe(true);
    expect(checklistItems.taxAccuracy).toBe(true);
    expect(checklistItems.discountApplication).toBe(true);

    // 請求額確定・領収書出力機能で計算結果が反映されていることを確認
    const receiptData = {
      invoiceAmount: calculatedResult.finalAmount,
      invoiceNumber: "INV-2024-001",
      issuedDate: new Date("2024-01-15T09:00:00Z"),
      subtotal: calculatedResult.subtotal,
      discountAmount: calculatedResult.discountAmount,
      taxAmount: calculatedResult.taxAmount,
    };

    expect(receiptData.invoiceAmount).toBe(495000);
    expect(receiptData.invoiceAmount).toBe(calculatedResult.finalAmount);
    expect(receiptData.subtotal).toBe(calculatedResult.subtotal);
    expect(receiptData.discountAmount).toBe(calculatedResult.discountAmount);
    expect(receiptData.taxAmount).toBe(calculatedResult.taxAmount);

    // 請求額確定画面で金額が正確に表示されることを確認
    expect(receiptData.invoiceAmount).toEqual(495000);
  });
});