import { defineMonthlyAggregationPeriod } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-590: [edge] 月次集計期間確定機能 - 締め日前日までのデータのみが集計対象に含まれ、締め日以降のデータは除外される
  test('should include only data up to the day before cutoff date and exclude cutoff date onwards', () => {
    // Arrange: 集計期間設定
    const cutoffDate = new Date('2024-02-28T00:00:00Z');
    const aggregationStartDate = new Date('2024-02-01T00:00:00Z');

    // テストデータ: 締め日前日（2月27日）のデータ
    const dataBeforeCutoff1 = {
      date: new Date('2024-02-27T08:00:00Z'),
      type: 'sales',
      amount: 50000,
      customerId: 'C001',
    };
    const dataBeforeCutoff2 = {
      date: new Date('2024-02-27T15:30:00Z'),
      type: 'appointment',
      count: 3,
      customerId: 'C002',
    };
    const dataBeforeCutoff3 = {
      date: new Date('2024-02-27T23:59:59Z'),
      type: 'contract',
      amount: 100000,
      customerId: 'C003',
    };

    // テストデータ: 締め日当日（2月28日）のデータ
    const dataCutoffDate1 = {
      date: new Date('2024-02-28T00:00:00Z'),
      type: 'sales',
      amount: 75000,
      customerId: 'C001',
    };
    const dataCutoffDate2 = {
      date: new Date('2024-02-28T12:00:00Z'),
      type: 'appointment',
      count: 2,
      customerId: 'C002',
    };

    // テストデータ: 締め日翌日以降（3月1日以降）のデータ
    const dataAfterCutoff1 = {
      date: new Date('2024-03-01T00:00:00Z'),
      type: 'sales',
      amount: 60000,
      customerId: 'C001',
    };
    const dataAfterCutoff2 = {
      date: new Date('2024-03-02T10:00:00Z'),
      type: 'contract',
      amount: 120000,
      customerId: 'C004',
    };
    const dataAfterCutoff3 = {
      date: new Date('2024-03-05T14:00:00Z'),
      type: 'appointment',
      count: 5,
      customerId: 'C003',
    };

    const allTestData = [
      dataBeforeCutoff1,
      dataBeforeCutoff2,
      dataBeforeCutoff3,
      dataCutoffDate1,
      dataCutoffDate2,
      dataAfterCutoff1,
      dataAfterCutoff2,
      dataAfterCutoff3,
    ];

    // Act: 月次集計期間確定機能を実行
    const result = defineMonthlyAggregationPeriod({
      cutoffDate,
      aggregationStartDate,
      salesData: allTestData,
    });

    // Assert: 集計対象に含まれるデータ件数を検証
    expect(result.includedDataCount).toBe(3);

    // Assert: 集計対象から除外されたデータ件数を検証
    expect(result.excludedDataCount).toBe(5);

    // Assert: 含まれるデータの日付範囲を検証
    expect(result.includedData).toHaveLength(3);
    expect(result.includedData).toContainEqual(
      expect.objectContaining({
        date: new Date('2024-02-27T08:00:00Z'),
        customerId: 'C001',
      })
    );
    expect(result.includedData).toContainEqual(
      expect.objectContaining({
        date: new Date('2024-02-27T15:30:00Z'),
        customerId: 'C002',
      })
    );
    expect(result.includedData).toContainEqual(
      expect.objectContaining({
        date: new Date('2024-02-27T23:59:59Z'),
        customerId: 'C003',
      })
    );

    // Assert: 集計対象の最終日付が締め日の前日であることを検証
    const maxIncludedDate = new Date(
      Math.max(...result.includedData.map((d) => d.date.getTime()))
    );
    expect(maxIncludedDate.toISOString()).toBe('2024-02-27T23:59:59.000Z');

    // Assert: 除外されたデータが正しく除外されていることを検証
    expect(result.excludedData).toHaveLength(5);
    const excludedDates = result.excludedData.map((d) => d.date.toISOString());
    expect(excludedDates).toContain('2024-02-28T00:00:00.000Z');
    expect(excludedDates).toContain('2024-02-28T12:00:00.000Z');
    expect(excludedDates).toContain('2024-03-01T00:00:00.000Z');
    expect(excludedDates).toContain('2024-03-02T10:00:00.000Z');
    expect(excludedDates).toContain('2024-03-05T14:00:00.000Z');

    // Assert: 集計対象期間の開始日と終了日を検証
    expect(result.aggregationPeriod.startDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriod.endDate).toEqual(
      new Date('2024-02-27T23:59:59Z')
    );

    // Assert: 集計対象期間が正しく設定されていることを検証
    expect(result.aggregationPeriod.cutoffDate).toEqual(cutoffDate);
  });
});