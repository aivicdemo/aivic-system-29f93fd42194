import { generateSalesDataStandardSpecification } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  // SCEN-1339
  test('営業データ標準化仕様書確定 - データ項目定義・計算ロジック・レポートマッピング・検証ルールが統合された最終仕様が正しく生成される', () => {
    const dataItemDefinitions = [
      {
        itemId: 'item_001',
        itemName: 'アポ数',
        unit: '件',
        dataType: 'integer',
        description: '新規営業活動におけるアポイント確定数'
      },
      {
        itemId: 'item_002',
        itemName: '成約数',
        unit: '件',
        dataType: 'integer',
        description: '商談から成約に至った案件数'
      },
      {
        itemId: 'item_003',
        itemName: '売上金額',
        unit: '円',
        dataType: 'decimal',
        description: '成約から発生した売上金額'
      }
    ];

    const calculationLogic = [
      {
        logicId: 'logic_001',
        logicName: '成約率計算',
        inputItemIds: ['item_001', 'item_002'],
        formula: 'item_002 / item_001 * 100',
        outputUnit: '%',
        description: 'アポ数に対する成約数の割合'
      },
      {
        logicId: 'logic_002',
        logicName: '平均単価計算',
        inputItemIds: ['item_003', 'item_002'],
        formula: 'item_003 / item_002',
        outputUnit: '円',
        description: '成約1件当たりの平均売上金額'
      }
    ];

    const reportMappings = [
      {
        mappingId: 'mapping_001',
        sourceItemId: 'item_001',
        reportFieldName: '新規アポ件数',
        reportSectionName: '営業成果',
        displayOrder: 1,
        isAggregated: true
      },
      {
        mappingId: 'mapping_002',
        sourceItemId: 'item_002',
        reportFieldName: '成約件数',
        reportSectionName: '営業成果',
        displayOrder: 2,
        isAggregated: true
      },
      {
        mappingId: 'mapping_003',
        sourceItemId: 'item_003',
        reportFieldName: '売上高',
        reportSectionName: '営業成果',
        displayOrder: 3,
        isAggregated: true
      },
      {
        mappingId: 'mapping_004',
        sourceLogicId: 'logic_001',
        reportFieldName: '成約率',
        reportSectionName: '成果指標',
        displayOrder: 4,
        isAggregated: false
      },
      {
        mappingId: 'mapping_005',
        sourceLogicId: 'logic_002',
        reportFieldName: '平均単価',
        reportSectionName: '成果指標',
        displayOrder: 5,
        isAggregated: false
      }
    ];

    const validationRules = [
      {
        ruleId: 'rule_001',
        targetItemId: 'item_001',
        ruleName: 'アポ数必須',
        ruleType: 'required',
        condition: 'value != null',
        errorMessage: 'アポ数は必須項目です'
      },
      {
        ruleId: 'rule_002',
        targetItemId: 'item_001',
        ruleName: 'アポ数範囲',
        ruleType: 'range',
        condition: 'value >= 0 AND value <= 999',
        errorMessage: 'アポ数は0から999の範囲で入力してください'
      },
      {
        ruleId: 'rule_003',
        targetItemId: 'item_002',
        ruleName: '成約数必須',
        ruleType: 'required',
        condition: 'value != null',
        errorMessage: '成約数は必須項目です'
      },
      {
        ruleId: 'rule_004',
        targetItemId: 'item_002',
        ruleName: '成約数アポ数以下',
        ruleType: 'consistency',
        condition: 'item_002 <= item_001',
        errorMessage: '成約数がアポ数を超えることはできません'
      },
      {
        ruleId: 'rule_005',
        targetItemId: 'item_003',
        ruleName: '売上金額必須',
        ruleType: 'required',
        condition: 'value != null',
        errorMessage: '売上金額は必須項目です'
      },
      {
        ruleId: 'rule_006',
        targetItemId: 'item_003',
        ruleName: '売上金額非負',
        ruleType: 'range',
        condition: 'value >= 0',
        errorMessage: '売上金額は0以上で入力してください'
      }
    ];

    const input = {
      specificationId: 'spec_20240115_001',
      specificationName: '営業データ標準化仕様書_2024年1月版',
      createdBy: 'admin_user_001',
      createdAt: '2024-01-15T10:00:00Z',
      dataItemDefinitions: dataItemDefinitions,
      calculationLogic: calculationLogic,
      reportMappings: reportMappings,
      validationRules: validationRules
    };

    const result = generateSalesDataStandardSpecification(input);

    expect(result).toBeDefined();
    expect(result.specificationId).toBe('spec_20240115_001');
    expect(result.specificationName).toBe('営業データ標準化仕様書_2024年1月版');
    expect(result.createdBy).toBe('admin_user_001');
    expect(result.createdAt).toBe('2024-01-15T10:00:00Z');

    // データ項目定義セクションの検証
    expect(result.sections).toBeDefined();
    expect(result.sections.dataItemDefinitions).toBeDefined();
    expect(result.sections.dataItemDefinitions.length).toBe(3);
    expect(result.sections.dataItemDefinitions[0]).toEqual({
      itemId: 'item_001',
      itemName: 'アポ数',
      unit: '件',
      dataType: 'integer',
      description: '新規営業活動におけるアポイント確定数'
    });
    expect(result.sections.dataItemDefinitions[1]).toEqual({
      itemId: 'item_002',
      itemName: '成約数',
      unit: '件',
      dataType: 'integer',
      description: '商談から成約に至った案件数'
    });
    expect(result.sections.dataItemDefinitions[2]).toEqual({
      itemId: 'item_003',
      itemName: '売上金額',
      unit: '円',
      dataType: 'decimal',
      description: '成約から発生した売上金額'
    });

    // 計算ロジックセクションの検証
    expect(result.sections.calculationLogic).toBeDefined();
    expect(result.sections.calculationLogic.length).toBe(2);
    expect(result.sections.calculationLogic[0]).toEqual({
      logicId: 'logic_001',
      logicName: '成約率計算',
      inputItemIds: ['item_001', 'item_002'],
      formula: 'item_002 / item_001 * 100',
      outputUnit: '%',
      description: 'アポ数に対する成約数の割合'
    });
    expect(result.sections.calculationLogic[1]).toEqual({
      logicId: 'logic_002',
      logicName: '平均単価計算',
      inputItemIds: ['item_003', 'item_002'],
      formula: 'item_003 / item_002',
      outputUnit: '円',
      description: '成約1件当たりの平均売上金額'
    });

    // レポートマッピングセクションの検証
    expect(result.sections.reportMappings).toBeDefined();
    expect(result.sections.reportMappings.length).toBe(5);
    expect(result.sections.reportMappings[0]).toEqual({
      mappingId: 'mapping_001',
      sourceItemId: 'item_001',
      reportFieldName: '新規アポ件数',
      reportSectionName: '営業成果',
      displayOrder: 1,
      isAggregated: true
    });
    expect(result.sections.reportMappings[3]).toEqual({
      mappingId: 'mapping_004',
      sourceLogicId: 'logic_001',
      reportFieldName: '成約率',
      reportSectionName: '成果指標',
      displayOrder: 4,
      isAggregated: false
    });

    // 検証ルールセクションの検証
    expect(result.sections.validationRules).toBeDefined();
    expect(result.sections.validationRules.length).toBe(6);
    expect(result.sections.validationRules[0]).toEqual({
      ruleId: 'rule_001',
      targetItemId: 'item_001',
      ruleName: 'アポ数必須',
      ruleType: 'required',
      condition: 'value != null',
      errorMessage: 'アポ数は必須項目です'
    });
    expect(result.sections.validationRules[3]).toEqual({
      ruleId: 'rule_004',
      targetItemId: 'item_002',
      ruleName: '成約数アポ数以下',
      ruleType: 'consistency',
      condition: 'item_002 <= item_001',
      errorMessage: '成約数がアポ数を超えることはできません'
    });

    // 整合性チェック結果の検証
    expect(result.consistencyCheckResults).toBeDefined();
    expect(result.consistencyCheckResults.isConsistent).toBe(true);
    expect(result.consistencyCheckResults.crossReferencesValid).toBe(true);
    expect(result.consistencyCheckResults.mappingTargetsExist).toBe(true);
    expect(result.consistencyCheckResults.calculationFormulaValid).toBe(true);

    // クロスリファレンス検証
    expect(result.crossReferences).toBeDefined();
    expect(result.crossReferences.length).toBeGreaterThan(0);

    // logic_001 のクロスリファレンス検証
    const logic_001_refs = result.crossReferences.filter(
      (ref: any) => ref.sourceId === 'logic_001'
    );
    expect(logic_001_refs.length).toBeGreaterThan(0);
    expect(logic_001_refs[0]).toEqual({
      sourceId: 'logic_001',
      sourceType: 'calculationLogic',
      targetId: 'mapping_004',
      targetType: 'reportMapping',
      relationshipType: 'usedIn'
    });

    // item_001 のクロスリファレンス検証
    const item_001_refs = result.crossReferences.filter(
      (ref: any) => ref.sourceId === 'item_001'
    );
    expect(item_001_refs.length).toBeGreaterThan(0);
    expect(
      item_001_refs.some(
        (ref: any) =>
          ref.targetId === 'mapping_001' && ref.relationshipType === 'mappedTo'
      )
    ).toBe(true);
    expect(
      item_001_refs.some(
        (ref: any) =>
          ref.targetId === 'logic_001' && ref.relationshipType === 'usedIn'
      )
    ).toBe(true);
    expect(
      item_001_refs.some(
        (ref: any) =>
          ref.targetId === 'rule_001' && ref.relationshipType === 'validatedBy'
      )
    ).toBe(true);

    // 生成された仕様書のフォーマット検証
    expect(result.format).toBe('JSON');
    expect(result.version).toBe('1.0');
    expect(result.status).toBe('final');

    // 本番環境対応性フラグ検証
    expect(result.isProductionReady).toBe(true);

    // 最終検証タイムスタンプ
    expect(result.finalizedAt).toBeDefined();
    expect(typeof result.finalizedAt).toBe('string');
  });
});