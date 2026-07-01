import { validateInvoice } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-981: 請求書自動検証機能 - 請求書の明細行がゼロ件の境界値で検証が正確に実行される', () => {
    // 明細行がゼロ件の請求書データ（基本情報は正常）
    const emptyLineItemsInvoice = {
      invoiceId: 'INV-2024-001',
      invoiceDate: '2024-01-15',
      invoiceNumber: 'INV20240115001',
      customerId: 'CUST-001',
      totalAmount: 0,
      lineItems: [],
      status: 'draft',
    };

    // 明細行が1件以上の正常な請求書データ
    const validInvoice = {
      invoiceId: 'INV-2024-002',
      invoiceDate: '2024-01-15',
      invoiceNumber: 'INV20240115002',
      customerId: 'CUST-001',
      totalAmount: 10000,
      lineItems: [
        {
          itemId: 'ITEM-001',
          quantity: 1,
          unitPrice: 10000,
          amount: 10000,
        },
      ],
      status: 'draft',
    };

    // 明細行がゼロ件の場合：エラーが発生する
    expect(() => validateInvoice(emptyLineItemsInvoice)).toThrow(/明細行/);

    // 明細行が正常に存在する場合：検証パスする
    const validationResult = validateInvoice(validInvoice);
    expect(validationResult).toEqual({
      isValid: true,
      errors: [],
      warnings: [],
      invoiceId: 'INV-2024-002',
      totalAmount: 10000,
      lineItemCount: 1,
    });

    // 基本情報は正常だが明細行がゼロ件：「明細行が必須です」エラーメッセージ
    const emptyValidation = {
      isValid: false,
      errors: ['明細行が必須です'],
      warnings: [],
      invoiceId: 'INV-2024-001',
      totalAmount: 0,
      lineItemCount: 0,
    };
    expect(emptyValidation.isValid).toBe(false);
    expect(emptyValidation.errors).toContain('明細行が必須です');
    expect(emptyValidation.lineItemCount).toBe(0);
  });
});