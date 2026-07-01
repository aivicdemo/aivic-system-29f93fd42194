import { extractAndAggregateInvoiceItems } from "../../src/logic/it-1-2-1";

describe("契約内容・割引基準との照合機能", () => {
  test("SCEN-1285: 複数の割引基準が定義された場合に優先度順に正確に適用される", () => {
    // テストデータ: 複数の割引基準を定義した契約書データ
    const contractData = {
      contractId: "CT-2024-001",
      customerId: "CUST-A001",
      serviceId: "SVC-SALES-ACTIVITY",
      baseAmount: 100000,
      discountRules: [
        {
          priority: 1,
          type: "quantity_discount",
          condition: { minQuantity: 50 },
          rate: 0.1, // 10%
          description: "数量割引",
        },
        {
          priority: 2,
          type: "customer_grade_discount",
          condition: { grade: "A" },
          rate: 0.05, // 5%
          description: "顧客等級割引",
        },
        {
          priority: 3,
          type: "period_limited_discount",
          condition: { validFrom: "2024-01-01", validTo: "2024-12-31" },
          rate: 0.03, // 3%
          description: "期間限定割引",
        },
      ],
      qualifyingData: {
        quantity: 60,
        customerGrade: "A",
        transactionDate: "2024-06-15",
      },
    };

    // 照合機能の実行
    const result = extractAndAggregateInvoiceItems(contractData);

    // 期待値の計算:
    // 優先度1（数量割引10%）が最初に適用: 100000 * 0.1 = 10000円割引
    // 割引後: 100000 - 10000 = 90000円
    // 優先度2以降は適用されない（重複適用なし）
    const expectedDiscountAmount = 10000;
    const expectedFinalAmount = 90000;

    // アサーション: 最終請求額が正確に計算されている
    expect(result.finalAmount).toBe(expectedFinalAmount);

    // アサーション: 適用された割引額が正確である
    expect(result.totalDiscountAmount).toBe(expectedDiscountAmount);

    // アサーション: 適用された割引基準は優先度1のみ
    expect(result.appliedDiscountRules).toEqual([
      {
        priority: 1,
        type: "quantity_discount",
        rate: 0.1,
        discountAmount: 10000,
        description: "数量割引",
      },
    ]);

    // アサーション: 優先度2以降の割引は重複適用されていない
    expect(result.appliedDiscountRules.length).toBe(1);

    // アサーション: 割引基準の評価ログに優先度順序が正しく記録されている
    expect(result.evaluationLog).toContainEqual({
      priority: 1,
      type: "quantity_discount",
      result: "applied",
      reason: "優先度1の条件を満たす",
    });

    expect(result.evaluationLog).toContainEqual({
      priority: 2,
      type: "customer_grade_discount",
      result: "skipped",
      reason: "優先度1の割引が既に適用されたため重複適用を回避",
    });

    expect(result.evaluationLog).toContainEqual({
      priority: 3,
      type: "period_limited_discount",
      result: "skipped",
      reason: "優先度1の割引が既に適用されたため重複適用を回避",
    });

    // アサーション: 評価ログの長さが3（すべての割引基準を評価）
    expect(result.evaluationLog.length).toBe(3);

    // アサーション: 元の請求額が正確に記録されている
    expect(result.baseAmount).toBe(100000);

    // アサーション: 契約IDとサービスIDが正確に引き継がれている
    expect(result.contractId).toBe("CT-2024-001");
    expect(result.serviceId).toBe("SVC-SALES-ACTIVITY");
  });
});