import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateMetadataRegistration } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データメタデータ管理 - 集計ロジック検証', () => {
  // SCEN-1116
  test('メタデータが未登録の項目が参照された場合にエラーが返される', () => {
    const registeredMetadata = [
      {
        item_id: 'item_001',
        item_name: 'アポ数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'SUM',
        report_mapping: 'appointment_count',
      },
      {
        item_id: 'item_002',
        item_name: '成約数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'SUM',
        report_mapping: 'contract_count',
      },
    ];

    const unregisteredItemName = '顧客反応度スコア';

    expect(() =>
      validateMetadataRegistration({
        registered_metadata: registeredMetadata,
        requested_item_name: unregisteredItemName,
      })
    ).toThrow(/メタデータ/);
  });
});