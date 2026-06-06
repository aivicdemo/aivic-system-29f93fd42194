import { validateInventoryDataConsistency } from '../../src/logic/it-1780551315784-2-2-1';

describe('作業完了時に品質基準への適合状況を測定し記録する機能', () => {
  // SCEN-462
  test('差異が許容範囲内の場合に在庫データを正常に確定更新する', () => {
    const stocktakingResults = [
      {
        itemCode: 'ITEM001',
        actualQuantity: 105
      },
      {
        itemCode: 'ITEM002',
        actualQuantity: 95
      }
    ];

    const systemInventoryData = [
      {
        itemCode: 'ITEM001',
        theoreticalQuantity: 100
      },
      {
        itemCode: 'ITEM002',
        theoreticalQuantity: 100
      }
    ];

    const toleranceThreshold = 0.05;

    const result = validateInventoryDataConsistency(
      stocktakingResults,
      systemInventoryData,
      toleranceThreshold
    );

    expect(result.isValid).toBe(true);
    expect(result.discrepancies).toEqual([]);
    expect(result.requiredAction).toBe('在庫データ確定処理');
    expect(result.totalDiscrepancyRate).toBe(0.05);
  });
});