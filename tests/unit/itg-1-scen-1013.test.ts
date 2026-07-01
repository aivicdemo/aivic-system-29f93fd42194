import { determineRetrospectiveApplicationScope } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1013: [edge] 請求ルール変更時の遡及適用判定 - 遡及適用開始日時を基準に、期間内のデータは新請求ルールが適用され、期間外のデータは旧ルールが維持される
  test('遡及適用開始日時を基準に期間内外でルール適用分岐が正確に機能する', () => {
    const retrospectiveChangeStartDatetime = new Date('2024-01-01T00:00:00Z');
    const beforeBoundaryData = {
      id: 'data_001',
      transactionDate: new Date('2023-12-31T23:59:59Z'),
      customerId: 'cust_A',
      serviceId: 'svc_01',
      appointmentCount: 5,
      contractAmount: 100000,
    };
    const atBoundaryData = {
      id: 'data_002',
      transactionDate: new Date('2024-01-01T00:00:00Z'),
      customerId: 'cust_A',
      serviceId: 'svc_01',
      appointmentCount: 5,
      contractAmount: 100000,
    };
    const afterBoundaryData = {
      id: 'data_003',
      transactionDate: new Date('2024-01-01T00:00:01Z'),
      customerId: 'cust_A',
      serviceId: 'svc_01',
      appointmentCount: 5,
      contractAmount: 100000,
    };
    const withinApplicationPeriodData = {
      id: 'data_004',
      transactionDate: new Date('2024-01-15T10:30:00Z'),
      customerId: 'cust_B',
      serviceId: 'svc_02',
      appointmentCount: 3,
      contractAmount: 50000,
    };
    const testDataSet = [
      beforeBoundaryData,
      atBoundaryData,
      afterBoundaryData,
      withinApplicationPeriodData,
    ];
    const oldBillingRate = 0.15;
    const newBillingRate = 0.20;
    const oldDiscountRate = 0.05;
    const newDiscountRate = 0.10;

    const result = determineRetrospectiveApplicationScope({
      changeStartDatetime: retrospectiveChangeStartDatetime,
      transactionDataSet: testDataSet,
      oldBillingRate: oldBillingRate,
      newBillingRate: newBillingRate,
      oldDiscountRate: oldDiscountRate,
      newDiscountRate: newDiscountRate,
    });

    // 遡及非適用期間（2023-12-31 23:59:59）のデータは旧ルール適用
    const beforeBoundaryResult = result.processedRecords.find(
      (r) => r.transactionDataId === 'data_001'
    );
    expect(beforeBoundaryResult).toBeDefined();
    expect(beforeBoundaryResult?.retrospectiveApplicationStatus).toBe('not_applied');
    expect(beforeBoundaryResult?.appliedBillingRate).toBe(0.15);
    expect(beforeBoundaryResult?.appliedDiscountRate).toBe(0.05);
    const beforeBoundaryOldAmount =
      100000 * 0.15 - 100000 * 0.15 * 0.05;
    expect(beforeBoundaryResult?.recalculatedBillingAmount).toBe(
      beforeBoundaryOldAmount
    );

    // 分岐点（2024-01-01 00:00:00）のデータは新ルール適用
    const atBoundaryResult = result.processedRecords.find(
      (r) => r.transactionDataId === 'data_002'
    );
    expect(atBoundaryResult).toBeDefined();
    expect(atBoundaryResult?.retrospectiveApplicationStatus).toBe('applied');
    expect(atBoundaryResult?.appliedBillingRate).toBe(0.20);
    expect(atBoundaryResult?.appliedDiscountRate).toBe(0.10);
    const atBoundaryNewAmount =
      100000 * 0.20 - 100000 * 0.20 * 0.10;
    expect(atBoundaryResult?.recalculatedBillingAmount).toBe(
      atBoundaryNewAmount
    );

    // 分岐点直後（2024-01-01 00:00:01）のデータは新ルール適用
    const afterBoundaryResult = result.processedRecords.find(
      (r) => r.transactionDataId === 'data_003'
    );
    expect(afterBoundaryResult).toBeDefined();
    expect(afterBoundaryResult?.retrospectiveApplicationStatus).toBe('applied');
    expect(afterBoundaryResult?.appliedBillingRate).toBe(0.20);
    expect(afterBoundaryResult?.appliedDiscountRate).toBe(0.10);
    const afterBoundaryNewAmount =
      100000 * 0.20 - 100000 * 0.20 * 0.10;
    expect(afterBoundaryResult?.recalculatedBillingAmount).toBe(
      afterBoundaryNewAmount
    );

    // 遡及適用期間内（2024-01-15）のデータは新ルール適用
    const withinApplicationPeriodResult = result.processedRecords.find(
      (r) => r.transactionDataId === 'data_004'
    );
    expect(withinApplicationPeriodResult).toBeDefined();
    expect(withinApplicationPeriodResult?.retrospectiveApplicationStatus).toBe(
      'applied'
    );
    expect(withinApplicationPeriodResult?.appliedBillingRate).toBe(0.20);
    expect(withinApplicationPeriodResult?.appliedDiscountRate).toBe(0.10);
    const withinApplicationNewAmount =
      50000 * 0.20 - 50000 * 0.20 * 0.10;
    expect(withinApplicationPeriodResult?.recalculatedBillingAmount).toBe(
      withinApplicationNewAmount
    );

    // 処理結果の要約
    expect(result.totalProcessedRecordCount).toBe(4);
    expect(result.appliedRecordCount).toBe(3);
    expect(result.notAppliedRecordCount).toBe(1);
    expect(result.changeStartDatetime).toEqual(retrospectiveChangeStartDatetime);
  });
});