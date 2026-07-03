import { extractContractHistoryAndBillingData } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-849: [edge] 過去契約履歴・請求データの時系列抽出機能 - 指定期間に該当する過去データが存在しない場合に空結果セットが返却される
  test('指定期間にデータが存在しない場合、空の結果セットを返却する', () => {
    const input = {
      customerId: 'CUST-001',
      contractId: 'CONTRACT-001',
      periodStart: new Date('2020-01-01T00:00:00Z'),
      periodEnd: new Date('2020-01-31T23:59:59Z'),
    };

    const result = extractContractHistoryAndBillingData(input);

    expect(result).toEqual({
      records: [],
      totalCount: 0,
      status: 'completed',
      errorMessage: null,
    });
    expect(result.records.length).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.status).toBe('completed');
    expect(result.errorMessage).toBeNull();
  });

  // 正常系：指定期間内にデータが存在する場合、結果セットが返却される
  test('指定期間内にデータが存在する場合、該当レコードを返却する', () => {
    const input = {
      customerId: 'CUST-001',
      contractId: 'CONTRACT-001',
      periodStart: new Date('2024-01-01T00:00:00Z'),
      periodEnd: new Date('2024-01-31T23:59:59Z'),
    };

    const result = extractContractHistoryAndBillingData(input);

    expect(result.status).toBe('completed');
    expect(result.errorMessage).toBeNull();
    expect(Array.isArray(result.records)).toBe(true);
    expect(result.totalCount).toBeGreaterThanOrEqual(0);
    if (result.totalCount > 0) {
      expect(result.records.length).toBe(result.totalCount);
      result.records.forEach((record: any) => {
        expect(record.contractId).toBe('CONTRACT-001');
        expect(record.customerId).toBe('CUST-001');
        const recordDate = new Date(record.billingDate);
        expect(recordDate.getTime()).toBeGreaterThanOrEqual(input.periodStart.getTime());
        expect(recordDate.getTime()).toBeLessThanOrEqual(input.periodEnd.getTime());
      });
    }
  });

  // エラー系：必須パラメータが不足している場合、エラーを投げる
  test('必須パラメータ（customerId）が不足している場合、エラーを投げる', () => {
    const input = {
      customerId: '',
      contractId: 'CONTRACT-001',
      periodStart: new Date('2024-01-01T00:00:00Z'),
      periodEnd: new Date('2024-01-31T23:59:59Z'),
    };

    expect(() => extractContractHistoryAndBillingData(input)).toThrow(/顧客ID/);
  });

  // エラー系：期間の開始日が終了日より後の場合、エラーを投げる
  test('期間開始日が終了日より後の場合、エラーを投げる', () => {
    const input = {
      customerId: 'CUST-001',
      contractId: 'CONTRACT-001',
      periodStart: new Date('2024-01-31T23:59:59Z'),
      periodEnd: new Date('2024-01-01T00:00:00Z'),
    };

    expect(() => extractContractHistoryAndBillingData(input)).toThrow(/期間/);
  });

  // 境界値：期間開始日と終了日が同一の場合、該当するデータのみを返却する
  test('期間開始日と終了日が同一の場合、該当日付のデータを返却する', () => {
    const targetDate = new Date('2024-01-15T00:00:00Z');
    const input = {
      customerId: 'CUST-001',
      contractId: 'CONTRACT-001',
      periodStart: targetDate,
      periodEnd: new Date(targetDate.getTime() + 86399999), // 同日の終了時刻
    };

    const result = extractContractHistoryAndBillingData(input);

    expect(result.status).toBe('completed');
    expect(result.errorMessage).toBeNull();
    result.records.forEach((record: any) => {
      const recordDate = new Date(record.billingDate);
      expect(recordDate.toISOString().split('T')[0]).toBe(targetDate.toISOString().split('T')[0]);
    });
  });

  // エラー系：契約IDが無効な形式の場合、エラーを投げる
  test('無効な契約ID形式の場合、エラーを投げる', () => {
    const input = {
      customerId: 'CUST-001',
      contractId: 'INVALID_FORMAT',
      periodStart: new Date('2024-01-01T00:00:00Z'),
      periodEnd: new Date('2024-01-31T23:59:59Z'),
    };

    expect(() => extractContractHistoryAndBillingData(input)).toThrow(/契約ID/);
  });
});