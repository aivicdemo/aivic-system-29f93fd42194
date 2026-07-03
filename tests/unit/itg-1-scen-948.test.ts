import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateBillingAmountWithExceptionHandling } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  let errorLogs: Array<{ recordId: string; reason: string; timestamp: string }>;

  beforeEach(() => {
    errorLogs = [];
  });

  afterEach(() => {
    errorLogs = [];
  });

  it('SCEN-948: 不完全な例外ケースデータが検出された場合、該当レコードをスキップしてエラーログに記録し、処理が継続される', () => {
    // テスト用の営業データセット
    // 1番目: 不完全（customerId 欠落）
    // 2番目: 不完全（serviceId 欠落）
    // 3番目: 正常なレコード
    // 4番目: 正常なレコード
    const salesDataSet = [
      {
        recordId: 'RECORD-001',
        customerId: null, // 必須フィールド欠落
        serviceId: 'SVC-A',
        appointmentCount: 5,
        contractCount: 2,
        unitPrice: 10000,
        discountRate: 0.1,
      },
      {
        recordId: 'RECORD-002',
        customerId: 'CUST-X',
        serviceId: null, // 必須フィールド欠落
        appointmentCount: 3,
        contractCount: 1,
        unitPrice: 15000,
        discountRate: 0.0,
      },
      {
        recordId: 'RECORD-003',
        customerId: 'CUST-Y',
        serviceId: 'SVC-B',
        appointmentCount: 8,
        contractCount: 4,
        unitPrice: 12000,
        discountRate: 0.05,
      },
      {
        recordId: 'RECORD-004',
        customerId: 'CUST-Z',
        serviceId: 'SVC-C',
        appointmentCount: 6,
        contractCount: 3,
        unitPrice: 11000,
        discountRate: 0.0,
      },
    ];

    // 処理実行
    const result = calculateBillingAmountWithExceptionHandling(
      salesDataSet,
      (logs) => {
        errorLogs = logs;
      }
    );

    // 不完全なレコードがスキップされ、エラーログに記録されたことを確認
    expect(errorLogs.length).toBe(2);
    expect(errorLogs[0]).toEqual(
      expect.objectContaining({
        recordId: 'RECORD-001',
        reason: expect.stringMatching(/customerId/),
      })
    );
    expect(errorLogs[1]).toEqual(
      expect.objectContaining({
        recordId: 'RECORD-002',
        reason: expect.stringMatching(/serviceId/),
      })
    );

    // 処理が継続され、有効なレコードが正常に処理されたことを確認
    expect(result.processedRecordCount).toBe(4);
    expect(result.skippedRecordCount).toBe(2);
    expect(result.successfulRecordCount).toBe(2);

    // 有効なデータのみが請求処理対象として反映されたことを確認
    expect(result.billingResults).toHaveLength(2);

    // RECORD-003 の期待計算: appointmentCount 8 * contractCount 4 * unitPrice 12000 * (1 - 0.05) = 3648000
    const record003Billing = result.billingResults.find(
      (b) => b.recordId === 'RECORD-003'
    );
    expect(record003Billing).toEqual(
      expect.objectContaining({
        recordId: 'RECORD-003',
        customerId: 'CUST-Y',
        serviceId: 'SVC-B',
        billingAmount: 3648000,
        status: 'SUCCESS',
      })
    );

    // RECORD-004 の期待計算: appointmentCount 6 * contractCount 3 * unitPrice 11000 * (1 - 0.0) = 198000
    const record004Billing = result.billingResults.find(
      (b) => b.recordId === 'RECORD-004'
    );
    expect(record004Billing).toEqual(
      expect.objectContaining({
        recordId: 'RECORD-004',
        customerId: 'CUST-Z',
        serviceId: 'SVC-C',
        billingAmount: 198000,
        status: 'SUCCESS',
      })
    );

    // システムエラーフラグが未設定（正常完了）であることを確認
    expect(result.systemErrorOccurred).toBe(false);

    // 処理完了メッセージが返されていることを確認
    expect(result.completionMessage).toMatch(
      /処理が正常に完了しました/
    );
  });
});