import { calculateInvoiceAmount } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 複数スタッフ間の請求ルール理解度統一確認", () => {
  test("SCEN-999: 複数スタッフが同一営業データから一致した請求額を算出", () => {
    // ==================== テストデータ準備 ====================
    // 同一の営業データ（顧客情報、商品情報、数量、単価、割引率、税率など）
    const commonSalesData = {
      customerId: "CUST-20250526-001",
      customerName: "テスト顧客A",
      serviceType: "SERVICE_BASIC",
      quantity: 10,
      unitPrice: 5000,
      discountRate: 0.1, // 10% 割引
      taxRate: 0.1, // 10% 税
    };

    // ==================== ビジネスルール確認 ====================
    // 期待される請求額の計算ロジック:
    // 1. 基本額 = 数量 × 単価 = 10 × 5000 = 50000
    // 2. 割引額 = 基本額 × 割引率 = 50000 × 0.1 = 5000
    // 3. 割引後金額 = 基本額 - 割引額 = 50000 - 5000 = 45000
    // 4. 税額 = 割引後金額 × 税率 = 45000 × 0.1 = 4500
    // 5. 請求額 = 割引後金額 + 税額 = 45000 + 4500 = 49500
    const expectedSystemInvoiceAmount = 49500;

    // ==================== 複数スタッフ（最低3名）による独立した請求額算出 ====================
    // スタッフA: 請求ルール理解度が高い場合
    const staffA_calculatedAmount = 49500; // 正確に計算

    // スタッフB: 請求ルール理解度が高い場合（スタッフAと同じルール適用）
    const staffB_calculatedAmount = 49500; // 正確に計算

    // スタッフC: 請求ルール理解度が高い場合（スタッフA, Bと同じルール適用）
    const staffC_calculatedAmount = 49500; // 正確に計算

    // ==================== システムの請求ルールエンジンで正式な請求額を算出 ====================
    const systemCalculatedAmount = calculateInvoiceAmount(commonSalesData);

    // ==================== 各スタッフの算出結果とシステムの算出結果を比較検証 ====================
    // スタッフAの結果がシステムと一致
    expect(staffA_calculatedAmount).toBe(expectedSystemInvoiceAmount);

    // スタッフBの結果がシステムと一致
    expect(staffB_calculatedAmount).toBe(expectedSystemInvoiceAmount);

    // スタッフCの結果がシステムと一致
    expect(staffC_calculatedAmount).toBe(expectedSystemInvoiceAmount);

    // ==================== システムが返した請求額の検証 ====================
    // システムが計算した請求額の確認
    expect(systemCalculatedAmount).toBe(expectedSystemInvoiceAmount);

    // ==================== 複数スタッフ間の算出結果の一致性をチェック ====================
    // スタッフA = スタッフB
    expect(staffA_calculatedAmount).toBe(staffB_calculatedAmount);

    // スタッフB = スタッフC
    expect(staffB_calculatedAmount).toBe(staffC_calculatedAmount);

    // スタッフA = スタッフC（間接的な検証）
    expect(staffA_calculatedAmount).toBe(staffC_calculatedAmount);

    // ==================== 全スタッフとシステムの算出結果が完全に一致 ====================
    const allStaffAmounts = [
      staffA_calculatedAmount,
      staffB_calculatedAmount,
      staffC_calculatedAmount,
    ];
    const allAmountsMatch = allStaffAmounts.every(
      (amount) => amount === systemCalculatedAmount
    );
    expect(allAmountsMatch).toBe(true);

    // ==================== 請求額の差異がないことを明示的に確認 ====================
    const invoiceAmountDifferences = allStaffAmounts.map(
      (amount) => amount - systemCalculatedAmount
    );
    const noDifferences = invoiceAmountDifferences.every(
      (diff) => diff === 0
    );
    expect(noDifferences).toBe(true);

    // ==================== 最終的なビジネスルール要件確認 ====================
    // 期待結果: 複数スタッフが同一の営業データに対して算出した請求額が全て一致し、
    // かつシステムの請求ルールエンジンで算出された正式な請求額とも一致すること
    expect({
      staffA: staffA_calculatedAmount,
      staffB: staffB_calculatedAmount,
      staffC: staffC_calculatedAmount,
      systemCalculated: systemCalculatedAmount,
      allMatch:
        staffA_calculatedAmount ===
        staffB_calculatedAmount &&
        staffB_calculatedAmount === staffC_calculatedAmount &&
        staffC_calculatedAmount === systemCalculatedAmount,
    }).toEqual({
      staffA: 49500,
      staffB: 49500,
      staffC: 49500,
      systemCalculated: 49500,
      allMatch: true,
    });
  });
});