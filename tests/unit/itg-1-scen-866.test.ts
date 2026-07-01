import { extractContractAndBillingDataByDateRange } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-866: [edge] 契約履歴と請求データの時系列抽出機能 - 期間指定で開始日と終了日が同一の場合でも該当データが正確に抽出される
  test('開始日と終了日が同一の日付の場合、その日付のデータが漏れなく時系列順で抽出される', () => {
    // Arrange: 契約履歴と請求データセット
    const targetDate = '2024-01-15';
    const contractAndBillingRecords = [
      {
        id: 'contract_001',
        type: 'contract',
        customerId: 'cust_A',
        contractDate: '2024-01-14T10:00:00Z',
        amount: 100000,
      },
      {
        id: 'billing_001',
        type: 'billing',
        customerId: 'cust_B',
        billingDate: '2024-01-15T08:30:00Z',
        amount: 50000,
      },
      {
        id: 'contract_002',
        type: 'contract',
        customerId: 'cust_A',
        contractDate: '2024-01-15T09:00:00Z',
        amount: 75000,
      },
      {
        id: 'billing_002',
        type: 'billing',
        customerId: 'cust_C',
        billingDate: '2024-01-15T14:30:00Z',
        amount: 120000,
      },
      {
        id: 'contract_003',
        type: 'contract',
        customerId: 'cust_B',
        contractDate: '2024-01-15T11:45:00Z',
        amount: 90000,
      },
      {
        id: 'billing_003',
        type: 'billing',
        customerId: 'cust_A',
        billingDate: '2024-01-16T10:00:00Z',
        amount: 60000,
      },
    ];

    // Act: 開始日と終了日が同じ日付で抽出を実行
    const result = extractContractAndBillingDataByDateRange(
      contractAndBillingRecords,
      targetDate,
      targetDate
    );

    // Assert: 抽出結果の件数確認
    expect(result.records.length).toBe(4);

    // Assert: 抽出されたデータの日付が指定日付と完全に一致
    result.records.forEach((record) => {
      const recordDate =
        record.type === 'contract'
          ? record.contractDate.split('T')[0]
          : record.billingDate.split('T')[0];
      expect(recordDate).toBe(targetDate);
    });

    // Assert: 指定日付以外のデータが含まれていないことを検証
    const hasInvalidDate = result.records.some((record) => {
      const recordDate =
        record.type === 'contract'
          ? record.contractDate.split('T')[0]
          : record.billingDate.split('T')[0];
      return recordDate !== targetDate;
    });
    expect(hasInvalidDate).toBe(false);

    // Assert: 時系列順に整列されていることを確認
    const timestamps = result.records.map((record) =>
      record.type === 'contract'
        ? new Date(record.contractDate).getTime()
        : new Date(record.billingDate).getTime()
    );
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }

    // Assert: 抽出されたレコードのIDが予期されたもの
    const extractedIds = result.records.map((r) => r.id).sort();
    const expectedIds = ['billing_001', 'billing_002', 'contract_002', 'contract_003'].sort();
    expect(extractedIds).toEqual(expectedIds);

    // Assert: 件数、日付精度、データ整合性がすべて正確
    expect(result.totalCount).toBe(4);
    expect(result.isCompleteAndAccurate).toBe(true);
  });
});