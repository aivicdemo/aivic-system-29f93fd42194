import { validateBillingItemsAgainstContract } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-906: [edge] 契約内容と請求額の整合性検証 - 請求対象項目が契約書に記載されていない場合、該当項目の除外判定と理由コードを返す
  test('契約書に記載されていない請求対象項目を識別し、除外判定と理由コードを返す', () => {
    const contractId = 'CONTRACT_2024_001';
    const contractItems = [
      { itemCode: 'ITEM_APO_COUNT', itemName: 'アポ数', unitPrice: 5000 },
      { itemCode: 'ITEM_DEAL_COUNT', itemName: '成約数', unitPrice: 50000 },
    ];

    const billingData = {
      customerId: 'CUST_123',
      contractId: contractId,
      billingItems: [
        { itemCode: 'ITEM_APO_COUNT', quantity: 10, unitPrice: 5000, amount: 50000 },
        { itemCode: 'ITEM_DEAL_COUNT', quantity: 2, unitPrice: 50000, amount: 100000 },
        { itemCode: 'ITEM_UNKNOWN_SERVICE', quantity: 5, unitPrice: 10000, amount: 50000 },
      ],
      totalAmount: 200000,
    };

    const validationResult = validateBillingItemsAgainstContract({
      contractId: contractId,
      contractItems: contractItems,
      billingData: billingData,
    });

    expect(validationResult).toEqual({
      isValid: false,
      excludedItems: [
        {
          itemCode: 'ITEM_UNKNOWN_SERVICE',
          itemName: '不明なサービス',
          quantity: 5,
          unitPrice: 10000,
          amount: 50000,
          excludeStatus: 'EXCLUDED',
          reasonCode: 'ERR_ITEM_NOT_IN_CONTRACT',
          reasonMessage: '契約書に未記載',
        },
      ],
      validItems: [
        { itemCode: 'ITEM_APO_COUNT', quantity: 10, unitPrice: 5000, amount: 50000 },
        { itemCode: 'ITEM_DEAL_COUNT', quantity: 2, unitPrice: 50000, amount: 100000 },
      ],
      adjustedTotalAmount: 150000,
      originalTotalAmount: 200000,
      deductionAmount: 50000,
      validationDetails: {
        contractItemCount: 2,
        billingItemCount: 3,
        matchedItemCount: 2,
        unmatchedItemCount: 1,
        unmatchedPercentage: 33.33,
      },
    });

    expect(validationResult.excludedItems).toHaveLength(1);
    expect(validationResult.excludedItems[0].reasonCode).toBe('ERR_ITEM_NOT_IN_CONTRACT');
    expect(validationResult.adjustedTotalAmount).toBe(150000);
    expect(validationResult.originalTotalAmount).toBe(200000);
    expect(validationResult.deductionAmount).toBe(50000);
    expect(validationResult.isValid).toBe(false);
  });
});