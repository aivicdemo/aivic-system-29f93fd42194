import { describe, test, expect } from '@jest/globals';
import { validateMetadataAndExecuteCalculation } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ一元管理機能', () => {
  test('SCEN-678: メタデータが未定義の項目を使用した計算は実行されない', () => {
    // 前提: メタデータが未定義の営業データ項目が存在
    const undefinedMetadataItem = {
      itemId: 'ITEM_UNDEFINED_001',
      itemName: 'undefined_conversion_rate',
      definition: null,
      unit: null,
      dataType: null,
      calculationLogic: null,
    };

    // 前提: 他の項目はメタデータが定義されている
    const definedMetadataItems = [
      {
        itemId: 'ITEM_APO_001',
        itemName: 'appointment_count',
        definition: 'アポイント件数',
        unit: '件',
        dataType: 'integer',
        calculationLogic: 'COUNT(appointment_records)',
      },
      {
        itemId: 'ITEM_CONTRACT_001',
        itemName: 'contract_count',
        definition: '成約件数',
        unit: '件',
        dataType: 'integer',
        calculationLogic: 'COUNT(contract_records)',
      },
    ];

    // トリガー: メタデータが未定義の項目を含む計算式を新規作成
    const calculationFormula = {
      formulaId: 'FORMULA_TEST_001',
      formulaName: 'conversion_rate_calculation',
      expression: 'contract_count / undefined_conversion_rate * 100',
      inputItemIds: ['ITEM_CONTRACT_001', 'ITEM_UNDEFINED_001'],
      outputItemId: 'ITEM_OUTPUT_001',
    };

    // トリガー: 計算式の実行ボタンをクリック
    const metadataRegistry = {
      items: [undefinedMetadataItem, ...definedMetadataItems],
    };

    const executionResult = validateMetadataAndExecuteCalculation({
      calculationFormula,
      metadataRegistry,
      operationTimestamp: new Date('2024-01-15T11:00:00Z'),
    });

    // 期待結果: 計算は実行されず、エラーレスポンスが返される
    expect(executionResult.isSuccessful).toBe(false);
    expect(executionResult.errorMessage).toMatch(/メタデータ/);
    expect(executionResult.errorMessage).toMatch(/未定義/);
    expect(executionResult.calculationResult).toBeNull();

    // 期待結果: バリデーション詳細には未定義項目名が含まれる
    expect(executionResult.validationDetails).toBeDefined();
    expect(executionResult.validationDetails.undefinedItems).toContain(
      'undefined_conversion_rate'
    );
    expect(executionResult.validationDetails.undefinedItems.length).toBe(1);

    // 期待結果: システムログには未定義項目名とバリデーション失敗が記録される
    expect(executionResult.systemLog).toBeDefined();
    expect(executionResult.systemLog.message).toMatch(/undefined_conversion_rate/);
    expect(executionResult.systemLog.logLevel).toBe('ERROR');
    expect(executionResult.systemLog.validationFailureReason).toBe(
      'UNDEFINED_METADATA_IN_FORMULA'
    );

    // 期待結果: 計算実行状態は「実行されず」で記録
    expect(executionResult.executionStatus).toBe('NOT_EXECUTED');
    expect(executionResult.executionTimestamp).toBeNull();

    // 期待結果: 他の定義済み項目のメタデータは正常に参照可能
    expect(executionResult.validationDetails.definedItems).toContain(
      'appointment_count'
    );
    expect(executionResult.validationDetails.definedItems).toContain(
      'contract_count'
    );
  });
});