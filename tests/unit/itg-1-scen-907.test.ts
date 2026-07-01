import { validateInvoiceChecklistItems } from '../../src/logic/it-1781935279444-2-1-1';

describe('請求書作成チェックリスト検証機能', () => {
  // SCEN-907
  test('チェックリスト項目がゼロ件の場合、バリデーションエラーを返す', () => {
    const input_checklistItems = [];
    const input_invoiceId = 'INV-2024-001';

    expect(() => {
      validateInvoiceChecklistItems({
        invoiceId: input_invoiceId,
        checklistItems: input_checklistItems,
      });
    }).toThrow(/チェックリスト項目/);
  });
});