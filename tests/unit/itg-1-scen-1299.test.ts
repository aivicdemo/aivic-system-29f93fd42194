import { extractBillableItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1299: [normal] 請求対象項目自動抽出機能 - 営業データに請求対象外の項目が含まれている場合、自動判定により除外される
  test('請求対象外の項目が含まれるテスト用営業データから、請求対象項目のみが正しく抽出される', () => {
    const salesData = [
      {
        customerId: 'CUST001',
        serviceId: 'SVC001',
        itemName: '営業アポイント数',
        quantity: 10,
        unitPrice: 5000,
        isBillable: true,
      },
      {
        customerId: 'CUST001',
        serviceId: 'SVC001',
        itemName: 'サンプル品',
        quantity: 5,
        unitPrice: 0,
        isBillable: false,
      },
      {
        customerId: 'CUST001',
        serviceId: 'SVC002',
        itemName: '成約数',
        quantity: 3,
        unitPrice: 50000,
        isBillable: true,
      },
      {
        customerId: 'CUST001',
        serviceId: 'SVC002',
        itemName: 'キャンペーン特典',
        quantity: 1,
        unitPrice: 0,
        isBillable: false,
      },
      {
        customerId: 'CUST002',
        serviceId: 'SVC001',
        itemName: '営業アポイント数',
        quantity: 8,
        unitPrice: 5000,
        isBillable: true,
      },
    ];

    const result = extractBillableItems(salesData);

    // 請求対象外の項目が除外されていることを検証
    expect(result.billableItems).toHaveLength(3);
    
    // 抽出された項目が正しいことを検証
    expect(result.billableItems[0]).toEqual({
      customerId: 'CUST001',
      serviceId: 'SVC001',
      itemName: '営業アポイント数',
      quantity: 10,
      unitPrice: 5000,
      amount: 50000,
    });

    expect(result.billableItems[1]).toEqual({
      customerId: 'CUST001',
      serviceId: 'SVC002',
      itemName: '成約数',
      quantity: 3,
      unitPrice: 50000,
      amount: 150000,
    });

    expect(result.billableItems[2]).toEqual({
      customerId: 'CUST002',
      serviceId: 'SVC001',
      itemName: '営業アポイント数',
      quantity: 8,
      unitPrice: 5000,
      amount: 40000,
    });

    // 除外された項目がexcludedItemsに含まれていることを検証
    expect(result.excludedItems).toHaveLength(2);
    expect(result.excludedItems[0]).toEqual({
      customerId: 'CUST001',
      serviceId: 'SVC001',
      itemName: 'サンプル品',
      reason: '請求対象外',
    });

    expect(result.excludedItems[1]).toEqual({
      customerId: 'CUST001',
      serviceId: 'SVC002',
      itemName: 'キャンペーン特典',
      reason: '請求対象外',
    });

    // 顧客ごと・サービスごとの請求額集計が正しいことを検証
    expect(result.summary).toEqual({
      'CUST001|SVC001': 50000,
      'CUST001|SVC002': 150000,
      'CUST002|SVC001': 40000,
    });

    // 合計請求額が正しく計算されていることを検証
    expect(result.totalBillableAmount).toBe(240000);

    // ステータスが成功であることを検証
    expect(result.status).toBe('success');
  });
});