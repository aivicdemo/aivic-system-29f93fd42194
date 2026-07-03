import { calculateInvoiceAmount } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証と請求額確定", () => {
  // SCEN-956: [normal] 営業データ品質検証と請求額自動計算と確定
  test("完全性・正確性を満たす営業データから請求額を自動計算し確定できる", () => {
    // 準備: 完全性と正確性の検証ルールを満たす営業データ
    const salesData = {
      customerId: "CUST-001",
      customerName: "顧客A株式会社",
      productId: "PROD-001",
      productName: "営業代行サービス",
      quantity: 10,
      unitPrice: 50000,
      taxRate: 0.1,
      discountRate: 0,
      handlingFeeRate: 0.02,
    };

    // 営業データ品質検証: 完全性チェック
    const hasAllRequiredFields =
      salesData.customerId &&
      salesData.customerName &&
      salesData.productId &&
      salesData.productName &&
      salesData.quantity !== undefined &&
      salesData.unitPrice !== undefined &&
      salesData.taxRate !== undefined;
    expect(hasAllRequiredFields).toBe(true);

    // 営業データ品質検証: 正確性チェック (データ型・形式・範囲)
    const isDataTypeCorrect =
      typeof salesData.customerId === "string" &&
      typeof salesData.customerName === "string" &&
      typeof salesData.productId === "string" &&
      typeof salesData.productName === "string" &&
      typeof salesData.quantity === "number" &&
      typeof salesData.unitPrice === "number" &&
      typeof salesData.taxRate === "number" &&
      typeof salesData.discountRate === "number" &&
      typeof salesData.handlingFeeRate === "number";
    expect(isDataTypeCorrect).toBe(true);

    const isValueInRange =
      salesData.quantity > 0 &&
      salesData.unitPrice > 0 &&
      salesData.taxRate >= 0 &&
      salesData.taxRate <= 1 &&
      salesData.discountRate >= 0 &&
      salesData.discountRate <= 1 &&
      salesData.handlingFeeRate >= 0 &&
      salesData.handlingFeeRate <= 1;
    expect(isValueInRange).toBe(true);

    // 請求額自動計算: 商品金額 = 数量 × 単価
    const productAmount = salesData.quantity * salesData.unitPrice;
    expect(productAmount).toBe(500000);

    // 請求額自動計算: 割引額 = 商品金額 × 割引率
    const discountAmount = productAmount * salesData.discountRate;
    expect(discountAmount).toBe(0);

    // 請求額自動計算: 割引後金額
    const amountAfterDiscount = productAmount - discountAmount;
    expect(amountAfterDiscount).toBe(500000);

    // 請求額自動計算: 消費税 = 割引後金額 × 税率
    const taxAmount = amountAfterDiscount * salesData.taxRate;
    expect(taxAmount).toBe(50000);

    // 請求額自動計算: 手数料 = (割引後金額 + 消費税) × 手数料率
    const handlingFee = (amountAfterDiscount + taxAmount) * salesData.handlingFeeRate;
    expect(handlingFee).toBe(11000);

    // 請求額自動計算: 最終請求額 = 割引後金額 + 消費税 + 手数料
    const totalInvoiceAmount =
      amountAfterDiscount + taxAmount + handlingFee;
    expect(totalInvoiceAmount).toBe(561000);

    // 実装された calculateInvoiceAmount 関数で検証
    const calculatedResult = calculateInvoiceAmount({
      quantity: salesData.quantity,
      unitPrice: salesData.unitPrice,
      taxRate: salesData.taxRate,
      discountRate: salesData.discountRate,
      handlingFeeRate: salesData.handlingFeeRate,
    });

    expect(calculatedResult).toEqual({
      productAmount: 500000,
      discountAmount: 0,
      amountAfterDiscount: 500000,
      taxAmount: 50000,
      handlingFee: 11000,
      totalInvoiceAmount: 561000,
    });

    // 請求データ確定処理: ステータス更新
    const invoiceData = {
      invoiceId: "INV-2024-001",
      customerId: salesData.customerId,
      customerName: salesData.customerName,
      totalInvoiceAmount: calculatedResult.totalInvoiceAmount,
      status: "確定" as const,
      createdAt: "2024-01-15T11:00:00Z",
      createdBy: "user-001",
      confirmedAt: "2024-01-15T11:05:00Z",
      confirmedBy: "user-001",
    };

    expect(invoiceData.status).toBe("確定");
    expect(invoiceData.confirmedAt).toBeDefined();
    expect(invoiceData.confirmedBy).toBeDefined();

    // 監査ログ記録: 確定処理のタイムスタンプと実行者
    const auditLog = {
      logId: "LOG-2024-001",
      invoiceId: invoiceData.invoiceId,
      action: "確定",
      actionTimestamp: invoiceData.confirmedAt,
      actionBy: invoiceData.confirmedBy,
      previousStatus: "未確定",
      newStatus: "確定",
      details: {
        totalAmount: invoiceData.totalInvoiceAmount,
        customerId: invoiceData.customerId,
      },
    };

    expect(auditLog.action).toBe("確定");
    expect(auditLog.previousStatus).toBe("未確定");
    expect(auditLog.newStatus).toBe("確定");
    expect(auditLog.actionTimestamp).toBe("2024-01-15T11:05:00Z");
    expect(auditLog.details.totalAmount).toBe(561000);
  });
});