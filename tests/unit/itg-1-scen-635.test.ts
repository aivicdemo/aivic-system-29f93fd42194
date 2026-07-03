import { visualizeContractChangeDifference } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-635: 複数回の契約変更履歴がある場合も全変更ポイントの差分が可視化される', () => {
    // 複数回の契約変更履歴を持つ契約データ
    const contractId = 'CTR-2024-001';
    const changeHistories = [
      {
        changeId: 'CHG-001',
        sequenceNumber: 1,
        changeDate: '2024-01-15',
        changedBy: 'USER-001',
        previousConditions: {
          basePrice: 100000,
          serviceType: 'Service-A',
          discountRate: 0.0,
          minimumBillingAmount: 50000,
          billingItems: ['item-1', 'item-2'],
        },
        currentConditions: {
          basePrice: 120000,
          serviceType: 'Service-A',
          discountRate: 0.05,
          minimumBillingAmount: 50000,
          billingItems: ['item-1', 'item-2', 'item-3'],
        },
      },
      {
        changeId: 'CHG-002',
        sequenceNumber: 2,
        changeDate: '2024-02-20',
        changedBy: 'USER-002',
        previousConditions: {
          basePrice: 120000,
          serviceType: 'Service-A',
          discountRate: 0.05,
          minimumBillingAmount: 50000,
          billingItems: ['item-1', 'item-2', 'item-3'],
        },
        currentConditions: {
          basePrice: 120000,
          serviceType: 'Service-B',
          discountRate: 0.1,
          minimumBillingAmount: 60000,
          billingItems: ['item-1', 'item-2', 'item-3', 'item-4'],
        },
      },
      {
        changeId: 'CHG-003',
        sequenceNumber: 3,
        changeDate: '2024-03-10',
        changedBy: 'USER-003',
        previousConditions: {
          basePrice: 120000,
          serviceType: 'Service-B',
          discountRate: 0.1,
          minimumBillingAmount: 60000,
          billingItems: ['item-1', 'item-2', 'item-3', 'item-4'],
        },
        currentConditions: {
          basePrice: 150000,
          serviceType: 'Service-B',
          discountRate: 0.1,
          minimumBillingAmount: 60000,
          billingItems: ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'],
        },
      },
    ];

    const result = visualizeContractChangeDifference({
      contractId,
      changeHistories,
    });

    // 全変更ポイントが漏れなく差分として可視化されることを確認
    expect(result.totalChangePoints).toBe(3);
    expect(result.visualizedDifferences.length).toBe(3);

    // 変更1の差分が正確に可視化されていることを確認
    const diff1 = result.visualizedDifferences[0];
    expect(diff1.changeId).toBe('CHG-001');
    expect(diff1.sequenceNumber).toBe(1);
    expect(diff1.changeDate).toBe('2024-01-15');
    expect(diff1.changedBy).toBe('USER-001');
    expect(diff1.differences.length).toBe(3);

    const diff1_basePriceChange = diff1.differences.find(
      (d: any) => d.fieldName === 'basePrice'
    );
    expect(diff1_basePriceChange).toBeDefined();
    expect(diff1_basePriceChange.previousValue).toBe(100000);
    expect(diff1_basePriceChange.currentValue).toBe(120000);
    expect(diff1_basePriceChange.changeType).toBe('MODIFIED');
    expect(diff1_basePriceChange.isHighlighted).toBe(true);

    const diff1_discountChange = diff1.differences.find(
      (d: any) => d.fieldName === 'discountRate'
    );
    expect(diff1_discountChange).toBeDefined();
    expect(diff1_discountChange.previousValue).toBe(0.0);
    expect(diff1_discountChange.currentValue).toBe(0.05);
    expect(diff1_discountChange.changeType).toBe('MODIFIED');
    expect(diff1_discountChange.isHighlighted).toBe(true);

    const diff1_itemsChange = diff1.differences.find(
      (d: any) => d.fieldName === 'billingItems'
    );
    expect(diff1_itemsChange).toBeDefined();
    expect(diff1_itemsChange.previousValue).toEqual(['item-1', 'item-2']);
    expect(diff1_itemsChange.currentValue).toEqual([
      'item-1',
      'item-2',
      'item-3',
    ]);
    expect(diff1_itemsChange.changeType).toBe('ADDED');
    expect(diff1_itemsChange.addedItems).toEqual(['item-3']);

    // 変更2の差分が正確に可視化されていることを確認
    const diff2 = result.visualizedDifferences[1];
    expect(diff2.changeId).toBe('CHG-002');
    expect(diff2.sequenceNumber).toBe(2);
    expect(diff2.changeDate).toBe('2024-02-20');
    expect(diff2.changedBy).toBe('USER-002');
    expect(diff2.differences.length).toBe(4);

    const diff2_serviceChange = diff2.differences.find(
      (d: any) => d.fieldName === 'serviceType'
    );
    expect(diff2_serviceChange).toBeDefined();
    expect(diff2_serviceChange.previousValue).toBe('Service-A');
    expect(diff2_serviceChange.currentValue).toBe('Service-B');
    expect(diff2_serviceChange.changeType).toBe('MODIFIED');

    const diff2_discountChange = diff2.differences.find(
      (d: any) => d.fieldName === 'discountRate'
    );
    expect(diff2_discountChange).toBeDefined();
    expect(diff2_discountChange.previousValue).toBe(0.05);
    expect(diff2_discountChange.currentValue).toBe(0.1);

    const diff2_minimumChange = diff2.differences.find(
      (d: any) => d.fieldName === 'minimumBillingAmount'
    );
    expect(diff2_minimumChange).toBeDefined();
    expect(diff2_minimumChange.previousValue).toBe(50000);
    expect(diff2_minimumChange.currentValue).toBe(60000);

    // 変更3の差分が正確に可視化されていることを確認
    const diff3 = result.visualizedDifferences[2];
    expect(diff3.changeId).toBe('CHG-003');
    expect(diff3.sequenceNumber).toBe(3);
    expect(diff3.changeDate).toBe('2024-03-10');
    expect(diff3.changedBy).toBe('USER-003');
    expect(diff3.differences.length).toBe(2);

    const diff3_basePriceChange = diff3.differences.find(
      (d: any) => d.fieldName === 'basePrice'
    );
    expect(diff3_basePriceChange).toBeDefined();
    expect(diff3_basePriceChange.previousValue).toBe(120000);
    expect(diff3_basePriceChange.currentValue).toBe(150000);
    expect(diff3_basePriceChange.changeType).toBe('MODIFIED');

    const diff3_itemsChange = diff3.differences.find(
      (d: any) => d.fieldName === 'billingItems'
    );
    expect(diff3_itemsChange).toBeDefined();
    expect(diff3_itemsChange.previousValue).toEqual([
      'item-1',
      'item-2',
      'item-3',
      'item-4',
    ]);
    expect(diff3_itemsChange.currentValue).toEqual([
      'item-1',
      'item-2',
      'item-3',
      'item-4',
      'item-5',
    ]);
    expect(diff3_itemsChange.changeType).toBe('ADDED');
    expect(diff3_itemsChange.addedItems).toEqual(['item-5']);

    // 各変更ステップ間での請求パターン差分の計算確認
    expect(result.billingPatternDifferences.length).toBe(3);

    // 変更1での請求パターン差分を確認
    const billingDiff1 = result.billingPatternDifferences[0];
    expect(billingDiff1.sequenceNumber).toBe(1);
    expect(billingDiff1.basePriceDifference).toBe(20000);
    expect(billingDiff1.discountRateDifference).toBe(0.05);
    expect(billingDiff1.minimumBillingAmountDifference).toBe(0);
    expect(billingDiff1.billingItemsAdded).toEqual(['item-3']);
    expect(billingDiff1.billingItemsRemoved).toEqual([]);

    // 変更2での請求パターン差分を確認
    const billingDiff2 = result.billingPatternDifferences[1];
    expect(billingDiff2.sequenceNumber).toBe(2);
    expect(billingDiff2.basePriceDifference).toBe(0);
    expect(billingDiff2.discountRateDifference).toBe(0.05);
    expect(billingDiff2.minimumBillingAmountDifference).toBe(10000);
    expect(billingDiff2.serviceTypeChange).toBe('Service-A -> Service-B');
    expect(billingDiff2.billingItemsAdded).toEqual(['item-4']);

    // 変更3での請求パターン差分を確認
    const billingDiff3 = result.billingPatternDifferences[2];
    expect(billingDiff3.sequenceNumber).toBe(3);
    expect(billingDiff3.basePriceDifference).toBe(30000);
    expect(billingDiff3.discountRateDifference).toBe(0);
    expect(billingDiff3.minimumBillingAmountDifference).toBe(0);
    expect(billingDiff3.billingItemsAdded).toEqual(['item-5']);

    // 変更前後の値の比較表示が正しく機能していることを確認
    expect(result.visualizationFormat).toBe('HIGHLIGHTED_COMPARISON');
    expect(result.comparisonHighlighting.enableColorCoding).toBe(true);
    expect(result.comparisonHighlighting.modifiedFieldColor).toBe('yellow');
    expect(result.comparisonHighlighting.addedFieldColor).toBe('green');
    expect(result.comparisonHighlighting.removedFieldColor).toBe('red');

    // 全ての変更履歴について漏れなく差分が表示されていることを確認
    expect(result.isComplete).toBe(true);
    expect(result.missingChangeIds.length).toBe(0);
    expect(result.summaryText).toContain('3');
  });
});