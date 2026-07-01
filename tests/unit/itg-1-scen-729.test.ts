import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('月次レポート生成前の最終検証機能', () => {
  // SCEN-729: [normal] 月次レポート生成前の最終検証機能 - 確定済みデータの完全性・正確性を検証し、不備がない場合にレポート生成可を判定する

  it('確定済みの営業データ100件の完全性・正確性を検証し、不備なしでレポート生成可を判定する', () => {
    // テストデータベース: 確定済みの営業データ100件を準備
    const salesDataRecords = Array.from({ length: 100 }, (_, index) => ({
      recordId: `REC-${String(index + 1).padStart(3, '0')}`,
      customerId: `CUST-${String((index % 10) + 1).padStart(3, '0')}`,
      amount: 10000 + index * 100,
      transactionDate: new Date('2024-01-15').toISOString(),
      productCode: `PROD-${String((index % 5) + 1).padStart(2, '0')}`,
      status: 'confirmed',
    }));

    // 各データレコードの必須フィールド（顧客ID、金額、日付、商品コード）が全て入力されていることを確認
    salesDataRecords.forEach((record) => {
      expect(record.customerId).not.toBeNull();
      expect(record.customerId).not.toBe('');
      expect(record.amount).not.toBeNull();
      expect(typeof record.amount).toBe('number');
      expect(record.transactionDate).not.toBeNull();
      expect(record.transactionDate).not.toBe('');
      expect(record.productCode).not.toBeNull();
      expect(record.productCode).not.toBe('');
    });

    // 月次レポート生成前の最終検証機能を実行
    const validationResult = validateSalesDataCompleteness({
      salesData: salesDataRecords,
      validationDate: new Date('2024-01-31').toISOString(),
      batchId: 'BATCH-2024-01',
    });

    // データ完全性チェック（NULL値、空文字列がないか）を実行
    expect(validationResult.completenessCheck).toBeDefined();
    expect(validationResult.completenessCheck.nullValueCount).toBe(0);
    expect(validationResult.completenessCheck.emptyStringCount).toBe(0);
    expect(validationResult.completenessCheck.missingFieldCount).toBe(0);

    // データ正確性チェック（金額の妥当性、日付形式の正確性、顧客ID有効性）を実行
    expect(validationResult.accuracyCheck).toBeDefined();
    expect(validationResult.accuracyCheck.invalidAmountCount).toBe(0);
    expect(validationResult.accuracyCheck.invalidDateFormatCount).toBe(0);
    expect(validationResult.accuracyCheck.invalidCustomerIdCount).toBe(0);
    expect(validationResult.accuracyCheck.invalidProductCodeCount).toBe(0);

    // チェック結果のサマリーレポートを取得
    expect(validationResult.summary).toBeDefined();

    // 不備件数が0件であることを確認
    const totalDefectCount =
      validationResult.completenessCheck.nullValueCount +
      validationResult.completenessCheck.emptyStringCount +
      validationResult.completenessCheck.missingFieldCount +
      validationResult.accuracyCheck.invalidAmountCount +
      validationResult.accuracyCheck.invalidDateFormatCount +
      validationResult.accuracyCheck.invalidCustomerIdCount +
      validationResult.accuracyCheck.invalidProductCodeCount;

    expect(totalDefectCount).toBe(0);

    // レポート生成可否の判定結果を確認
    expect(validationResult.canGenerateReport).toBe(true);
    expect(validationResult.reportGenerationApprovalStatus).toBe('approved');

    // システムログにレポート生成許可のステータスが記録されていることを確認
    expect(validationResult.auditLog).toBeDefined();
    expect(validationResult.auditLog.length).toBeGreaterThan(0);
    const approvalLog = validationResult.auditLog.find(
      (log) => log.eventType === 'report_generation_approval'
    );
    expect(approvalLog).toBeDefined();
    expect(approvalLog?.status).toBe('approved');
    expect(approvalLog?.timestamp).toBeDefined();
    expect(approvalLog?.approvedRecordCount).toBe(100);
    expect(approvalLog?.defectRecordCount).toBe(0);
  });
});