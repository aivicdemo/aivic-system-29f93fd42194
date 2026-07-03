import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質チェック・修正サイクル - 修正済みデータが再検証時に品質基準を満たすと判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-739
  test('修正済みデータが再検証時に品質基準をすべて満たすと判定され、チェック結果が「合格」と表示される', () => {
    // ========== 初期データ（不合格データ）==========
    const invalidSalesData = {
      salesId: 'SALES-001',
      customerId: 'CUST-A',
      customerName: '', // 必須項目が空（不合格）
      contactDate: '2024-01-15',
      transactionType: 'appointment',
      appointmentConfirmed: true,
      serviceType: 'service_a',
      amount: 150000,
      notes: 'Initial data with missing customer name',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    const qualityStandards = {
      customerName: {
        required: true,
        minLength: 1,
        maxLength: 100,
        dataType: 'string',
      },
      contactDate: {
        required: true,
        dataType: 'date',
        pattern: /^\d{4}-\d{2}-\d{2}$/,
      },
      transactionType: {
        required: true,
        dataType: 'string',
        allowedValues: ['appointment', 'contract', 'followup'],
      },
      amount: {
        required: true,
        dataType: 'number',
        minValue: 0,
        maxValue: 10000000,
      },
    };

    // ========== 1. 初回品質チェック（不合格期待）==========
    const firstCheckResult = validateSalesDataQuality(
      invalidSalesData,
      qualityStandards
    );

    expect(firstCheckResult.status).toBe('失格');
    expect(firstCheckResult.errors).toContainEqual(
      expect.objectContaining({
        field: 'customerName',
        reason: expect.stringMatching(/必須項目|空文字|欠落/),
      })
    );
    expect(firstCheckResult.isValid).toBe(false);

    // ========== 2. 修正済みデータの準備 ==========
    const correctedSalesData = {
      ...invalidSalesData,
      customerName: '株式会社テスト営業', // 修正：顧客名を入力
      updatedAt: '2024-01-15T11:30:00Z',
    };

    // ========== 3. 再検証（合格期待）==========
    const secondCheckResult = validateSalesDataQuality(
      correctedSalesData,
      qualityStandards
    );

    // ========== 検証ポイント ==========
    expect(secondCheckResult.status).toBe('合格');
    expect(secondCheckResult.isValid).toBe(true);
    expect(secondCheckResult.errors).toEqual([]);
    expect(secondCheckResult.passedFields).toContain('customerName');
    expect(secondCheckResult.passedFields).toContain('contactDate');
    expect(secondCheckResult.passedFields).toContain('transactionType');
    expect(secondCheckResult.passedFields).toContain('amount');
    expect(secondCheckResult.passedFields.length).toBe(4);

    // ========== 修正前後の差分確認 ==========
    expect(firstCheckResult.isValid).toBe(false);
    expect(secondCheckResult.isValid).toBe(true);
    expect(correctedSalesData.customerName).not.toBe(
      invalidSalesData.customerName
    );
    expect(correctedSalesData.customerName).toBe('株式会社テスト営業');
  });
});