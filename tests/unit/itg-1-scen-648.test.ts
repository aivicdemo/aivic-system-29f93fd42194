import { describe, test, expect, beforeEach } from '@jest/globals';
import { detectAnomaliesAndGenerateCorrectionInstructions } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データの異常値検出・補正指示生成機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-648: [edge] 営業データの異常値検出・補正指示生成機能 - 定義されていない検証ルールに対してはスキップされ補正指示は生成されない
  test('定義されていない検証ルールIDをテストデータに紐付ける場合、スキップされて補正指示が生成されない', () => {
    const salesData = {
      id: 'sales_data_001',
      customerId: 'customer_001',
      customerName: 'テスト顧客',
      contactDate: '2024-01-15',
      appointmentStatus: 'confirmed',
      contractAmount: 150000,
      serviceType: 'serviceA',
      validationRuleIds: ['RULE_001', 'UNDEFINED_RULE_999', 'RULE_002'],
    };

    const definedRules = {
      RULE_001: {
        ruleId: 'RULE_001',
        fieldName: 'contractAmount',
        ruleType: 'range',
        minValue: 0,
        maxValue: 1000000,
      },
      RULE_002: {
        ruleId: 'RULE_002',
        fieldName: 'appointmentStatus',
        ruleType: 'enum',
        allowedValues: ['pending', 'confirmed', 'cancelled'],
      },
    };

    const result = detectAnomaliesAndGenerateCorrectionInstructions(
      salesData,
      definedRules
    );

    expect(result.processedRuleIds).toEqual(['RULE_001', 'RULE_002']);
    expect(result.skippedRuleIds).toEqual(['UNDEFINED_RULE_999']);
    expect(result.anomaliesDetected).toEqual(false);
    expect(result.correctionInstructions).toEqual([]);
    expect(result.warningLogs).toContainEqual(
      expect.objectContaining({
        ruleId: 'UNDEFINED_RULE_999',
        message: expect.stringMatching(/未定義|スキップ/),
        severity: 'warning',
      })
    );
    expect(result.systemError).toBe(null);
  });
});