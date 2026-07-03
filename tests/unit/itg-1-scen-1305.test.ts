import { validateSalesDataItemMetadata } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能', () => {
  // SCEN-1305
  test('メタデータのデータ型定義がメタデータ未定義項目を参照している場合、定義不備として検出される', () => {
    const metadataInput = {
      itemId: 'meta_001',
      itemName: '売上金額',
      unit: '円',
      dataType: 'numeric',
      dataTypeDefinition: {
        baseType: 'number',
        referenceItemId: 'undefined_item_ref_001',
        precision: 2,
      },
      calculationLogic: 'SUM(売上額)',
      reportMapping: {
        reportTemplateId: 'tpl_001',
        reportFieldName: '月次売上',
      },
      isRequired: true,
      validationRules: [
        {
          ruleId: 'rule_001',
          ruleType: 'range',
          minValue: 0,
          maxValue: 10000000,
        },
      ],
    };

    const definedItemIds = ['meta_001', 'meta_002', 'meta_003'];

    expect(() =>
      validateSalesDataItemMetadata(metadataInput, definedItemIds)
    ).toThrow(/参照先メタデータが未定義です/);
  });
});