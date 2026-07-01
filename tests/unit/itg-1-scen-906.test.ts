import { validateInvoiceChecklistItems } from '../../src/logic/it-1781935279444-2-1-1';

describe('請求書作成チェックリスト検証機能', () => {
  // SCEN-906: [error] 複数のチェックリスト項目が不備で、全ての修正指示が集約される
  test('複数の不備がある請求書データに対してチェックリスト検証を実行し、全ての修正指示が集約されて返されること', () => {
    const invoiceData = {
      customer_id: '',
      customer_name: '',
      invoice_amount: -500,
      tax_rate: null,
      payment_due_date: '',
      invoice_date: '2024-01-15',
      payment_method: 'bank_transfer',
      contract_id: 'CNT-001',
    };

    const result = validateInvoiceChecklistItems(invoiceData);

    expect(result.is_valid).toBe(false);
    expect(result.error_items).toHaveLength(4);

    const error_item_names = result.error_items.map((item: any) => item.item_name);
    expect(error_item_names).toContain('顧客情報');
    expect(error_item_names).toContain('金額計算');
    expect(error_item_names).toContain('税率設定');
    expect(error_item_names).toContain('支払期限');

    expect(result.error_items[0].priority).toBe(1);
    expect(result.error_items[1].priority).toBe(2);
    expect(result.error_items[2].priority).toBe(3);
    expect(result.error_items[3].priority).toBe(4);

    result.error_items.forEach((item: any) => {
      expect(item.correction_message).toBeTruthy();
      expect(typeof item.correction_message).toBe('string');
      expect(item.correction_message.length).toBeGreaterThan(0);
    });

    const all_messages = result.error_items.map((item: any) => item.correction_message);
    const unique_messages = new Set(all_messages);
    expect(unique_messages.size).toBe(all_messages.length);

    expect(result.aggregated_message).toBeTruthy();
    expect(result.aggregated_message).toContain('4');
    expect(result.aggregated_message).toContain('修正');
  });
});