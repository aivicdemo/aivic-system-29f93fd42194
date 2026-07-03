import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { 
  validateBillingItemWithinRange,
  extractBillingItems
} from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1073: [edge] 請求対象項目自動抽出・検証機能 - 入力値が検証ルールの許容範囲の最小値・最大値である場合に正確に判定される
  test('should correctly validate billing items at minimum and maximum boundary values', () => {
    // Arrange: 検証ルールの最小値・最大値を定義
    const validationRuleMinValue = 0;
    const validationRuleMaxValue = 100000;

    // 最小値と同じ入力値
    const testInputAtMin = {
      itemId: 'ITEM_001',
      itemName: 'アポイント数',
      inputValue: 0,
      unitType: 'count',
      dataType: 'number',
      contractId: 'CONTRACT_2024_001',
      customerId: 'CUST_A001',
      serviceId: 'SVC_001',
      entryDate: '2024-01-15',
    };

    // 最大値と同じ入力値
    const testInputAtMax = {
      itemId: 'ITEM_001',
      itemName: 'アポイント数',
      inputValue: 100000,
      unitType: 'count',
      dataType: 'number',
      contractId: 'CONTRACT_2024_001',
      customerId: 'CUST_A001',
      serviceId: 'SVC_001',
      entryDate: '2024-01-15',
    };

    // 最小値より小さい入力値（エラーケース）
    const testInputBelowMin = {
      itemId: 'ITEM_001',
      itemName: 'アポイント数',
      inputValue: -1,
      unitType: 'count',
      dataType: 'number',
      contractId: 'CONTRACT_2024_001',
      customerId: 'CUST_A001',
      serviceId: 'SVC_001',
      entryDate: '2024-01-15',
    };

    // 最大値より大きい入力値（エラーケース）
    const testInputAboveMax = {
      itemId: 'ITEM_001',
      itemName: 'アポイント数',
      inputValue: 100001,
      unitType: 'count',
      dataType: 'number',
      contractId: 'CONTRACT_2024_001',
      customerId: 'CUST_A001',
      serviceId: 'SVC_001',
      entryDate: '2024-01-15',
    };

    // Act & Assert: 最小値での検証
    const resultAtMin = validateBillingItemWithinRange(testInputAtMin, {
      minValue: validationRuleMinValue,
      maxValue: validationRuleMaxValue,
    });
    expect(resultAtMin).toEqual({
      isValid: true,
      itemId: 'ITEM_001',
      inputValue: 0,
      passedValidation: true,
      validationMessage: '検証ルールに合致しました',
      boundaryCondition: 'at_minimum',
    });

    // Act & Assert: 最大値での検証
    const resultAtMax = validateBillingItemWithinRange(testInputAtMax, {
      minValue: validationRuleMinValue,
      maxValue: validationRuleMaxValue,
    });
    expect(resultAtMax).toEqual({
      isValid: true,
      itemId: 'ITEM_001',
      inputValue: 100000,
      passedValidation: true,
      validationMessage: '検証ルールに合致しました',
      boundaryCondition: 'at_maximum',
    });

    // Act & Assert: 最小値より下回る入力値での検証（エラーケース）
    expect(() =>
      validateBillingItemWithinRange(testInputBelowMin, {
        minValue: validationRuleMinValue,
        maxValue: validationRuleMaxValue,
      })
    ).toThrow(/範囲外/);

    // Act & Assert: 最大値を超過する入力値での検証（エラーケース）
    expect(() =>
      validateBillingItemWithinRange(testInputAboveMax, {
        minValue: validationRuleMinValue,
        maxValue: validationRuleMaxValue,
      })
    ).toThrow(/範囲外/);

    // Act & Assert: 複数請求対象項目の一括抽出・検証
    const billingItems = [testInputAtMin, testInputAtMax];
    const extractionResult = extractBillingItems(billingItems, {
      minValue: validationRuleMinValue,
      maxValue: validationRuleMaxValue,
    });

    expect(extractionResult).toEqual({
      extractedCount: 2,
      validItems: [
        {
          itemId: 'ITEM_001',
          contractId: 'CONTRACT_2024_001',
          customerId: 'CUST_A001',
          serviceId: 'SVC_001',
          inputValue: 0,
          isValid: true,
        },
        {
          itemId: 'ITEM_001',
          contractId: 'CONTRACT_2024_001',
          customerId: 'CUST_A001',
          serviceId: 'SVC_001',
          inputValue: 100000,
          isValid: true,
        },
      ],
      invalidItems: [],
      validationLog: {
        executedAt: expect.any(String),
        ruleId: expect.any(String),
        totalProcessed: 2,
        passedCount: 2,
        failedCount: 0,
        boundaryValuesDetected: ['at_minimum', 'at_maximum'],
      },
    });
  });
});