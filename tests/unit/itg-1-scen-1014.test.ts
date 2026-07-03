import { validateSalesReportDateRange } from '../../src/logic/it-1-1-1';

describe('営業成果レポート内容妥当性判定機能', () => {
  // SCEN-1014: [edge] 営業成果レポート内容妥当性判定機能 - レポート集計期間の境界日時が正確に判定される
  test('集計期間開始日の00:00:00と終了日の23:59:59を含む境界値判定', () => {
    const reportStartDate = new Date('2024-01-01T00:00:00Z');
    const reportEndDate = new Date('2024-01-31T23:59:59Z');

    const recordAtStartBoundary = {
      id: 'rec_001',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      apoCount: 5,
      contractCount: 2,
      serviceType: 'standard'
    };

    const recordAtEndBoundary = {
      id: 'rec_002',
      createdAt: new Date('2024-01-31T23:59:59Z'),
      apoCount: 3,
      contractCount: 1,
      serviceType: 'standard'
    };

    const recordBeforeStart = {
      id: 'rec_003',
      createdAt: new Date('2023-12-31T23:59:59Z'),
      apoCount: 2,
      contractCount: 1,
      serviceType: 'standard'
    };

    const recordAfterEnd = {
      id: 'rec_004',
      createdAt: new Date('2024-02-01T00:00:00Z'),
      apoCount: 4,
      contractCount: 2,
      serviceType: 'standard'
    };

    const allRecords = [
      recordBeforeStart,
      recordAtStartBoundary,
      recordAtEndBoundary,
      recordAfterEnd
    ];

    const result = validateSalesReportDateRange({
      records: allRecords,
      startDate: reportStartDate,
      endDate: reportEndDate
    });

    expect(result.includedRecords).toContainEqual(
      expect.objectContaining({
        id: 'rec_001',
        createdAt: new Date('2024-01-01T00:00:00Z')
      })
    );

    expect(result.includedRecords).toContainEqual(
      expect.objectContaining({
        id: 'rec_002',
        createdAt: new Date('2024-01-31T23:59:59Z')
      })
    );

    expect(result.includedRecords).not.toContainEqual(
      expect.objectContaining({
        id: 'rec_003'
      })
    );

    expect(result.includedRecords).not.toContainEqual(
      expect.objectContaining({
        id: 'rec_004'
      })
    );

    expect(result.includedRecords).toHaveLength(2);
    expect(result.excludedRecords).toHaveLength(2);
    expect(result.isValid).toBe(true);
    expect(result.totalApoCount).toBe(8);
    expect(result.totalContractCount).toBe(3);
  });
});