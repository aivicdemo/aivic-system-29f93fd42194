import { extractAndAggregateInvoiceItems } from '../../src/logic/it-1-2-1';

describe('請求対象項目の自動抽出・集計機能', () => {
  // SCEN-987: [error] 契約に記載されない請求対象項目は除外される
  test('契約に明示された項目のみが集計され、記載されていない項目は除外される', () => {
    const contractId = 'CTR-2024-001';
    const customerId = 'CUST-A001';
    const serviceId = 'SVC-BASIC';

    // 契約に明示された請求対象項目
    const contractBillingItems = [
      {
        itemId: 'ITEM-APO-001',
        itemName: 'アポイント数',
        unitPrice: 5000,
        quantity: 10,
      },
      {
        itemId: 'ITEM-DEAL-001',
        itemName: '成約数',
        unitPrice: 50000,
        quantity: 2,
      },
    ];

    // 入力データ：契約に記載されていない項目を含む
    const inputData = [
      {
        itemId: 'ITEM-APO-001',
        itemName: 'アポイント数',
        quantity: 10,
      },
      {
        itemId: 'ITEM-DEAL-001',
        itemName: '成約数',
        quantity: 2,
      },
      {
        itemId: 'ITEM-UNAUTHORIZED-999',
        itemName: '契約外の項目',
        quantity: 5,
      },
    ];

    const result = extractAndAggregateInvoiceItems({
      contractId,
      customerId,
      serviceId,
      contractBillingItems,
      inputData,
    });

    // 期待結果：契約に明示された項目のみが集計される
    // アポイント数：5000 × 10 = 50,000
    // 成約数：50,000 × 2 = 100,000
    // 合計：150,000
    expect(result.aggregatedItems).toHaveLength(2);
    expect(result.aggregatedItems[0]).toEqual({
      itemId: 'ITEM-APO-001',
      itemName: 'アポイント数',
      unitPrice: 5000,
      quantity: 10,
      subtotal: 50000,
    });
    expect(result.aggregatedItems[1]).toEqual({
      itemId: 'ITEM-DEAL-001',
      itemName: '成約数',
      unitPrice: 50000,
      quantity: 2,
      subtotal: 100000,
    });
    expect(result.totalAmount).toBe(150000);

    // 契約に記載されていない項目がフィルタリングされたことを確認
    expect(result.excludedItems).toEqual([
      {
        itemId: 'ITEM-UNAUTHORIZED-999',
        itemName: '契約外の項目',
        reason: '契約に記載されていない請求対象項目',
      },
    ]);

    // エラーログが生成されていることを確認
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/契約外/);
  });
});