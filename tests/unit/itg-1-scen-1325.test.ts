import { createSalesDataMappingSpecification } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - マッピング仕様書作成', () => {
  // SCEN-1325: [edge] 営業データマッピング仕様書の作成 - マッピング対象外のデータ項目が営業システムに存在する場合、スキップリストに追加される
  test('マッピング対象外のデータ項目がスキップリストに追加される', () => {
    // 営業システムのテストデータ - マッピング仕様書に定義されていない項目を含める
    const salesSystemData = {
      items: [
        { fieldName: 'appointment_count', fieldType: 'integer', description: 'アポイント数' },
        { fieldName: 'deal_count', fieldType: 'integer', description: '成約数' },
        { fieldName: 'customer_reaction', fieldType: 'string', description: '顧客反応' },
        { fieldName: 'unmapped_field_1', fieldType: 'string', description: '未マッピング項目1' },
        { fieldName: 'unmapped_field_2', fieldType: 'boolean', description: '未マッピング項目2' },
        { fieldName: 'contact_date', fieldType: 'date', description: '接触日' },
        { fieldName: 'legacy_system_code', fieldType: 'string', description: 'レガシーシステムコード' },
      ],
    };

    // マッピング仕様書に定義される対象項目
    const mappingSpecification = {
      targetMappings: [
        { salesFieldName: 'appointment_count', reportFieldName: 'アポ数', unit: '件', dataType: 'integer', calculationLogic: 'SUM' },
        { salesFieldName: 'deal_count', reportFieldName: '成約数', unit: '件', dataType: 'integer', calculationLogic: 'SUM' },
        { salesFieldName: 'customer_reaction', reportFieldName: '顧客反応', unit: 'テキスト', dataType: 'string', calculationLogic: 'CONCAT' },
        { salesFieldName: 'contact_date', reportFieldName: '接触日', unit: '日付', dataType: 'date', calculationLogic: 'MAX' },
      ],
    };

    // マッピング仕様書作成処理を実行
    const result = createSalesDataMappingSpecification({
      salesSystemData: salesSystemData,
      mappingSpecification: mappingSpecification,
    });

    // スキップリストに追加されるべき項目（マッピング対象外）
    const expectedSkippedItems = [
      { fieldName: 'unmapped_field_1', fieldType: 'string', description: '未マッピング項目1', reason: 'not_in_mapping_spec' },
      { fieldName: 'unmapped_field_2', fieldType: 'boolean', description: '未マッピング項目2', reason: 'not_in_mapping_spec' },
      { fieldName: 'legacy_system_code', fieldType: 'string', description: 'レガシーシステムコード', reason: 'not_in_mapping_spec' },
    ];

    // スキップリストが正確に生成されていることを検証
    expect(result.skipList).toEqual(expectedSkippedItems);
    expect(result.skipList).toHaveLength(3);

    // スキップリストの各項目が正確に記録されていることを検証
    expect(result.skipList[0]).toEqual({
      fieldName: 'unmapped_field_1',
      fieldType: 'string',
      description: '未マッピング項目1',
      reason: 'not_in_mapping_spec',
    });
    expect(result.skipList[1]).toEqual({
      fieldName: 'unmapped_field_2',
      fieldType: 'boolean',
      description: '未マッピング項目2',
      reason: 'not_in_mapping_spec',
    });
    expect(result.skipList[2]).toEqual({
      fieldName: 'legacy_system_code',
      fieldType: 'string',
      description: 'レガシーシステムコード',
      reason: 'not_in_mapping_spec',
    });

    // マッピング対象項目のリストが正確に生成されていることを検証
    expect(result.mappedItems).toHaveLength(4);
    expect(result.mappedItems.map((item: any) => item.salesFieldName)).toEqual([
      'appointment_count',
      'deal_count',
      'customer_reaction',
      'contact_date',
    ]);

    // 出力データにマッピング対象外の項目が含まれていないことを検証
    const outputFieldNames = result.outputData.map((item: any) => item.fieldName);
    expect(outputFieldNames).not.toContain('unmapped_field_1');
    expect(outputFieldNames).not.toContain('unmapped_field_2');
    expect(outputFieldNames).not.toContain('legacy_system_code');

    // 出力データにはマッピング対象の項目のみが含まれていることを検証
    expect(outputFieldNames).toContain('appointment_count');
    expect(outputFieldNames).toContain('deal_count');
    expect(outputFieldNames).toContain('customer_reaction');
    expect(outputFieldNames).toContain('contact_date');

    // 出力データのサイズがマッピング対象項目数と一致することを検証
    expect(result.outputData).toHaveLength(4);

    // マッピング仕様書作成結果全体が正確であることを検証
    expect(result.success).toBe(true);
    expect(result.totalInputItems).toBe(7);
    expect(result.mappedItemsCount).toBe(4);
    expect(result.skippedItemsCount).toBe(3);
  });
});