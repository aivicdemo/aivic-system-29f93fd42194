import { extractDataItemsWithoutCalculationLogic } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 計算ロジック未定義項目の抽出', () => {
  test('SCEN-1318: 計算ロジックが定義されていないデータ項目を漏れなく抽出', () => {
    // Arrange: テストデータ準備
    // 計算ロジックが定義されている項目
    const itemWithLogic1 = {
      id: 'item_001',
      name: 'アポ数',
      unit: '件',
      dataType: 'integer',
      calculationLogic: 'COUNT(営業活動 WHERE ステータス = "アポ確定")',
      reportMapping: 'report_field_001',
    };

    const itemWithLogic2 = {
      id: 'item_002',
      name: '成約数',
      unit: '件',
      dataType: 'integer',
      calculationLogic: 'COUNT(営業活動 WHERE ステータス = "成約")',
      reportMapping: 'report_field_002',
    };

    // 計算ロジックが定義されていない項目
    const itemWithoutLogic1 = {
      id: 'item_003',
      name: '顧客反応',
      unit: null,
      dataType: 'string',
      calculationLogic: null,
      reportMapping: 'report_field_003',
    };

    const itemWithoutLogic2 = {
      id: 'item_004',
      name: '接触日時',
      unit: null,
      dataType: 'datetime',
      calculationLogic: null,
      reportMapping: null,
    };

    const itemWithoutLogic3 = {
      id: 'item_005',
      name: '商談内容',
      unit: null,
      dataType: 'text',
      calculationLogic: '',
      reportMapping: 'report_field_005',
    };

    const itemWithoutLogic4 = {
      id: 'item_006',
      name: '営業担当者名',
      unit: null,
      dataType: 'string',
      calculationLogic: undefined,
      reportMapping: 'report_field_006',
    };

    const allItems = [
      itemWithLogic1,
      itemWithoutLogic1,
      itemWithLogic2,
      itemWithoutLogic2,
      itemWithoutLogic3,
      itemWithoutLogic4,
    ];

    // Act: 計算ロジックが定義されていないデータ項目を抽出
    const result = extractDataItemsWithoutCalculationLogic(allItems);

    // Assert: 検証

    // 1. 計算ロジックが定義されていないすべての項目が含まれているか確認
    expect(result.length).toBe(4);
    expect(result).toContainEqual(
      expect.objectContaining({
        id: 'item_003',
        name: '顧客反応',
      })
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        id: 'item_004',
        name: '接触日時',
      })
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        id: 'item_005',
        name: '商談内容',
      })
    );
    expect(result).toContainEqual(
      expect.objectContaining({
        id: 'item_006',
        name: '営業担当者名',
      })
    );

    // 2. 計算ロジックが定義されている項目が誤って含まれていないか確認
    const resultIds = result.map((item) => item.id);
    expect(resultIds).not.toContain('item_001');
    expect(resultIds).not.toContain('item_002');

    // 3. 抽出結果に重複がないことを確認
    const uniqueIds = new Set(resultIds);
    expect(uniqueIds.size).toBe(result.length);

    // 4. 抽出結果が空でないことを確認
    expect(result.length).toBeGreaterThan(0);

    // 5. 抽出結果のデータ項目数が期待値と一致
    const expectedCount = 4;
    expect(result.length).toBe(expectedCount);

    // 6. 抽出されたすべての項目が計算ロジック未定義の条件を満たしているか確認
    result.forEach((item) => {
      const isLogicUndefined =
        item.calculationLogic === null ||
        item.calculationLogic === undefined ||
        item.calculationLogic === '';
      expect(isLogicUndefined).toBe(true);
    });

    // 7. 抽出対象外の項目が計算ロジック定義済みであることを確認
    expect(itemWithLogic1.calculationLogic).not.toBe(null);
    expect(itemWithLogic1.calculationLogic).not.toBe(undefined);
    expect(itemWithLogic1.calculationLogic).not.toBe('');
    expect(itemWithLogic2.calculationLogic).not.toBe(null);
    expect(itemWithLogic2.calculationLogic).not.toBe(undefined);
    expect(itemWithLogic2.calculationLogic).not.toBe('');
  });
});