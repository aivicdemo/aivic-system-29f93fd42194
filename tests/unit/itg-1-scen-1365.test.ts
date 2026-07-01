import { describe, test, expect } from '@jest/globals';
import { finalizeDataSpecification } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ標準化仕様書確定機能', () => {
  test('SCEN-1365: CRMベンダー実装優先度が未定の場合、仕様書確定がエラーとなり確認待ちの旨が通知される', () => {
    const specificationData = {
      specificationId: 'SPEC-20240115-001',
      dataItemDefinitions: [
        {
          itemId: 'ITEM-APO-001',
          itemName: 'アポ数',
          dataType: 'number',
          unit: '件',
          isRequired: true,
        },
        {
          itemId: 'ITEM-CONTRACT-001',
          itemName: '成約数',
          dataType: 'number',
          unit: '件',
          isRequired: true,
        },
      ],
      calculationLogic: [
        {
          logicId: 'CALC-001',
          itemId: 'ITEM-APO-001',
          formula: 'SUM(daily_apo_count)',
          description: '月間アポ数の合計',
        },
      ],
      reportMapping: [
        {
          reportFieldId: 'RF-001',
          sourceItemId: 'ITEM-APO-001',
          transformRule: 'direct_map',
        },
      ],
      qualityValidationRules: [
        {
          ruleId: 'QR-001',
          itemId: 'ITEM-APO-001',
          minValue: 0,
          maxValue: 1000,
          allowNull: false,
        },
      ],
      crmVendorImplementationPriority: undefined,
      specificationStatus: 'draft',
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T09:00:00Z',
    };

    expect(() => finalizeDataSpecification(specificationData)).toThrow(/優先度/);
  });
});