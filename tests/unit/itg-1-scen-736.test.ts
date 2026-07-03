import { describe, test, expect } from '@jest/globals';
import {
  executeValidationRules,
} from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-736: [error] 営業データ自動検証ルール実行 - 検証ルール違反データが検出され、エラー内容が正確に記録される
  test('should detect validation rule violations and record error details accurately', () => {
    // Arrange: 複数の検証ルール定義
    const validationRules = [
      {
        ruleId: 'RULE_001',
        ruleName: '金額フォーマット',
        fieldName: 'amount',
        ruleType: 'range',
        minValue: 0,
        maxValue: 9999999,
        isActive: true,
      },
      {
        ruleId: 'RULE_002',
        ruleName: '顧客情報必須項目',
        fieldName: 'customerId',
        ruleType: 'required',
        isActive: true,
      },
      {
        ruleId: 'RULE_003',
        ruleName: 'データ型チェック',
        fieldName: 'amount',
        ruleType: 'dataType',
        expectedType: 'number',
        isActive: true,
      },
    ];

    // 検証ルール違反を含むテストデータセット
    const testDataset = [
      {
        dataId: 'DATA_001',
        customerId: '',
        amount: 50000,
        createdAt: '2024-01-15T09:00:00Z',
      },
      {
        dataId: 'DATA_002',
        customerId: 'CUST_123',
        amount: -30000,
        createdAt: '2024-01-15T09:15:00Z',
      },
      {
        dataId: 'DATA_003',
        customerId: 'CUST_456',
        amount: 'invalid_amount',
        createdAt: '2024-01-15T09:30:00Z',
      },
      {
        dataId: 'DATA_004',
        customerId: 'CUST_789',
        amount: 100000,
        createdAt: '2024-01-15T09:45:00Z',
      },
    ];

    // Act: 検証ルール実行
    const result = executeValidationRules({
      validationRules,
      testDataset,
      executionTimestamp: '2024-01-15T10:00:00Z',
    });

    // Assert: エラー検出結果の検証
    expect(result.totalDataProcessed).toBe(4);
    expect(result.totalViolationsDetected).toBe(3);
    expect(result.validationPassed).toBe(false);

    // 最初の違反: 顧客IDが空白
    const violation1 = result.violations[0];
    expect(violation1.dataId).toBe('DATA_001');
    expect(violation1.ruleId).toBe('RULE_002');
    expect(violation1.ruleName).toBe('顧客情報必須項目');
    expect(violation1.fieldName).toBe('customerId');
    expect(violation1.violationType).toBe('required');
    expect(violation1.errorCode).toBe('ERR_CUST_ID_REQUIRED');
    expect(violation1.errorMessage).toContain('顧客ID');
    expect(violation1.actualValue).toBe('');
    expect(violation1.detectedAt).toBe('2024-01-15T10:00:00Z');
    expect(violation1.severity).toBe('error');

    // 2番目の違反: 金額が負数
    const violation2 = result.violations[1];
    expect(violation2.dataId).toBe('DATA_002');
    expect(violation2.ruleId).toBe('RULE_001');
    expect(violation2.ruleName).toBe('金額フォーマット');
    expect(violation2.fieldName).toBe('amount');
    expect(violation2.violationType).toBe('range');
    expect(violation2.errorCode).toBe('ERR_AMOUNT_OUT_OF_RANGE');
    expect(violation2.errorMessage).toContain('金額');
    expect(violation2.actualValue).toBe(-30000);
    expect(violation2.expectedRangeMin).toBe(0);
    expect(violation2.expectedRangeMax).toBe(9999999);
    expect(violation2.detectedAt).toBe('2024-01-15T10:00:00Z');
    expect(violation2.severity).toBe('error');

    // 3番目の違反: データ型不正
    const violation3 = result.violations[2];
    expect(violation3.dataId).toBe('DATA_003');
    expect(violation3.ruleId).toBe('RULE_003');
    expect(violation3.ruleName).toBe('データ型チェック');
    expect(violation3.fieldName).toBe('amount');
    expect(violation3.violationType).toBe('dataType');
    expect(violation3.errorCode).toBe('ERR_AMOUNT_DATA_TYPE');
    expect(violation3.errorMessage).toContain('データ型');
    expect(violation3.actualValue).toBe('invalid_amount');
    expect(violation3.expectedType).toBe('number');
    expect(violation3.detectedAt).toBe('2024-01-15T10:00:00Z');
    expect(violation3.severity).toBe('error');

    // 正常データの検証
    expect(result.validData.length).toBe(1);
    expect(result.validData[0].dataId).toBe('DATA_004');

    // データベース記録の完全性検証
    expect(result.recordedViolations.length).toBe(3);
    result.recordedViolations.forEach((record) => {
      expect(record).toHaveProperty('violationId');
      expect(record).toHaveProperty('dataId');
      expect(record).toHaveProperty('ruleId');
      expect(record).toHaveProperty('errorCode');
      expect(record).toHaveProperty('errorMessage');
      expect(record).toHaveProperty('severity');
      expect(record).toHaveProperty('recordedAt');
      expect(record.violationId).toMatch(/^ERR_\d{10,}/);
    });

    // 一意性の検証
    const errorCodes = result.violations.map((v) => v.errorCode);
    const uniqueErrorCodes = new Set(errorCodes);
    expect(uniqueErrorCodes.size).toBe(3);

    // 検出日時の整合性検証
    result.violations.forEach((violation) => {
      const detectedTime = new Date(violation.detectedAt);
      const executionTime = new Date('2024-01-15T10:00:00Z');
      expect(detectedTime.getTime()).toBeLessThanOrEqual(
        executionTime.getTime()
      );
    });
  });
});