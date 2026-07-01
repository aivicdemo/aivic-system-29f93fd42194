import { describe, test, expect, beforeEach } from '@jest/globals';
import { judgeInvoiceModificationNeeded } from '../../src/logic/it-1781935279444-2-2-1';

describe('請求内容の再計算・修正判定', () => {
  // SCEN-986
  test('顧客の異議が請求ルール違反である場合、修正が必要と判定される', () => {
    // テストデータ準備
    const invoiceData = {
      customerId: 'CUST-001',
      invoiceId: 'INV-20240115-001',
      invoiceAmount: 10000,
      taxRate: 0.08,
      discountRate: 0.05,
      unitPrice: 1000,
      quantity: 10,
      contractId: 'CONTRACT-001',
    };

    const objectionContent = {
      objectionId: 'OBJ-001',
      objectionType: 'price_dispute',
      reason: '適用税率が異なる。8%ではなく10%が正しい',
      proposedTaxRate: 0.1,
      proposedAmount: 10500,
    };

    const billingRules = {
      allowedTaxRates: [0.08],
      allowedDiscountRates: [0.0, 0.05, 0.1],
      minUnitPrice: 500,
      maxUnitPrice: 5000,
      minDiscount: 0,
      maxDiscount: 0.2,
    };

    // 請求内容の再計算・修正判定機能を実行
    const result = judgeInvoiceModificationNeeded({
      invoiceData,
      objectionContent,
      billingRules,
    });

    // ルール違反を検証
    expect(result.isRuleViolation).toBe(true);

    // 修正判定ステータスが『修正必要』と判定されていることを確認
    expect(result.modificationJudgmentStatus).toBe('修正必要');

    // 違反ルール項目を確認
    expect(result.violationRuleItems).toContain('taxRate');

    // 修正理由に具体的なルール違反内容が記録されていることを確認
    expect(result.modificationReason).toMatch(/税率/);
    expect(result.modificationReason).toMatch(/8%/);
    expect(result.modificationReason).toMatch(/10%/);

    // 修正対象の具体的な内容を確認
    expect(result.proposedCorrections).toEqual({
      taxRate: 0.1,
      expectedAmount: 10500,
      differenceAmount: 500,
    });

    // ステータスコードが適切であることを確認
    expect(result.statusCode).toBe(200);
  });
});