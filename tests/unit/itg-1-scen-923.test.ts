import { validateContractBillingItemsIntegrity } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約内容との整合性検証機能 - 部分一致時の詳細判定', () => {
  test('SCEN-923: 複数の請求対象項目のうち一部のみ一致している場合、部分一致の詳細が正確に判定される', () => {
    // 準備: 契約情報（4項目）
    const contractData = {
      contractId: 'CONT-2024-001',
      customerId: 'CUST-ABC',
      items: [
        {
          itemName: '商品A',
          quantity: 100,
          unitPrice: 1500,
          deliveryDate: '2024-12-31',
        },
      ],
    };

    // 準備: 請求データ（一部項目は異なる値）
    const billingData = {
      billingId: 'BILL-2024-001',
      contractId: 'CONT-2024-001',
      items: [
        {
          itemName: '商品A', // ✅ 契約と一致
          quantity: 100, // ✅ 契約と一致
          unitPrice: 1800, // ❌ 契約は1500、請求は1800
          deliveryDate: '2024-12-15', // ❌ 契約は2024-12-31、請求は2024-12-15
        },
      ],
    };

    // 実行: 整合性検証機能を実行
    const result = validateContractBillingItemsIntegrity(
      contractData,
      billingData
    );

    // 検証1: 検証結果が『部分一致』と判定される
    expect(result.overallStatus).toBe('partial_match');

    // 検証2: 一致項目が正確に識別される
    expect(result.matchedItems).toEqual(['itemName', 'quantity']);
    expect(result.matchedItems.length).toBe(2);

    // 検証3: 不一致項目が正確に識別される
    expect(result.mismatchedItems).toEqual(['unitPrice', 'deliveryDate']);
    expect(result.mismatchedItems.length).toBe(2);

    // 検証4: 不一致項目ごとの詳細差分が記録される
    expect(result.details.length).toBe(2);

    // 検証4a: 単価の差分詳細
    const unitPriceMismatch = result.details.find(
      (d) => d.fieldName === 'unitPrice'
    );
    expect(unitPriceMismatch).toBeDefined();
    expect(unitPriceMismatch?.contractValue).toBe(1500);
    expect(unitPriceMismatch?.billingValue).toBe(1800);
    expect(unitPriceMismatch?.difference).toBe(300);
    expect(unitPriceMismatch?.status).toBe('mismatch');

    // 検証4b: 納期の差分詳細
    const deliveryDateMismatch = result.details.find(
      (d) => d.fieldName === 'deliveryDate'
    );
    expect(deliveryDateMismatch).toBeDefined();
    expect(deliveryDateMismatch?.contractValue).toBe('2024-12-31');
    expect(deliveryDateMismatch?.billingValue).toBe('2024-12-15');
    expect(deliveryDateMismatch?.status).toBe('mismatch');

    // 検証5: 一致項目については差分詳細に含まれない
    const itemNameDetail = result.details.find((d) => d.fieldName === 'itemName');
    expect(itemNameDetail).toBeUndefined();

    const quantityDetail = result.details.find(
      (d) => d.fieldName === 'quantity'
    );
    expect(quantityDetail).toBeUndefined();

    // 検証6: 検証結果が構造化フォーマットで返される
    expect(result).toHaveProperty('overallStatus');
    expect(result).toHaveProperty('matchedItems');
    expect(result).toHaveProperty('mismatchedItems');
    expect(result).toHaveProperty('details');
    expect(result).toHaveProperty('timestamp');
    expect(typeof result.timestamp).toBe('string');
  });
});