import { describe, test, expect } from '@jest/globals';
import { executeComplexMetadataCalculation } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理', () => {
  test('SCEN-611: 複合条件を含む計算ロジックが複雑な式を正確に実行する', () => {
    // ===== テストケース 1: 基本的な複合条件 (AND条件が真) =====
    // 条件: (fieldA > 100 AND fieldB < 50) OR (fieldC = '特定値' AND fieldD != 0)
    // テストデータ: fieldA=150, fieldB=30, fieldC='その他', fieldD=0
    // 期待: 最初のOR条件が真 (150>100 AND 30<50 = true AND true = true)
    const testData_1 = {
      fieldA: 150,
      fieldB: 30,
      fieldC: 'その他',
      fieldD: 0,
    };
    const result_1 = executeComplexMetadataCalculation(testData_1);
    expect(result_1.evaluated).toBe(true);
    expect(result_1.matchedCondition).toBe('first_or_condition');

    // ===== テストケース 2: 第2OR条件が真 =====
    // テストデータ: fieldA=50, fieldB=60, fieldC='特定値', fieldD=5
    // 期待: 最初のOR条件が偽、第2OR条件が真 ('特定値'='特定値' AND 5!=0 = true AND true = true)
    const testData_2 = {
      fieldA: 50,
      fieldB: 60,
      fieldC: '特定値',
      fieldD: 5,
    };
    const result_2 = executeComplexMetadataCalculation(testData_2);
    expect(result_2.evaluated).toBe(true);
    expect(result_2.matchedCondition).toBe('second_or_condition');

    // ===== テストケース 3: 境界値 - 第1OR条件の境界 (AND条件が偽) =====
    // テストデータ: fieldA=100, fieldB=50, fieldC='その他', fieldD=0
    // 期待: fieldA=100 (NOT > 100)、fieldB=50 (NOT < 50) → 第1条件偽
    //       fieldC != '特定値'、fieldD = 0 → 第2条件偽
    //       結果: 全体偽
    const testData_3 = {
      fieldA: 100,
      fieldB: 50,
      fieldC: 'その他',
      fieldD: 0,
    };
    const result_3 = executeComplexMetadataCalculation(testData_3);
    expect(result_3.evaluated).toBe(false);
    expect(result_3.matchedCondition).toBe('none');

    // ===== テストケース 4: 正常値での複雑な計算 =====
    // テストデータ: fieldA=200, fieldB=0, fieldC='値A', fieldD=10
    // 期待: 第1OR条件: 200>100 AND 0<50 = true AND true = true
    const testData_4 = {
      fieldA: 200,
      fieldB: 0,
      fieldC: '値A',
      fieldD: 10,
    };
    const result_4 = executeComplexMetadataCalculation(testData_4);
    expect(result_4.evaluated).toBe(true);
    expect(result_4.matchedCondition).toBe('first_or_condition');

    // ===== テストケース 5: 異常値 - すべての条件が偽 =====
    // テストデータ: fieldA=50, fieldB=60, fieldC='異なる値', fieldD=0
    // 期待: 第1条件: 50>100=false, 偽AND真=偽
    //       第2条件: '異なる値'!='特定値'=true AND 0!=0=false, 真AND偽=偽
    //       OR演算: 偽 OR 偽 = 偽
    const testData_5 = {
      fieldA: 50,
      fieldB: 60,
      fieldC: '異なる値',
      fieldD: 0,
    };
    const result_5 = executeComplexMetadataCalculation(testData_5);
    expect(result_5.evaluated).toBe(false);
    expect(result_5.matchedCondition).toBe('none');

    // ===== テストケース 6: 第2OR条件のみ真 (fieldD境界値) =====
    // テストデータ: fieldA=99, fieldB=51, fieldC='特定値', fieldD=1
    // 期待: 第1条件: 99>100=false, false AND true=false
    //       第2条件: '特定値'='特定値'=true AND 1!=0=true, true AND true=true
    //       結果: false OR true = true
    const testData_6 = {
      fieldA: 99,
      fieldB: 51,
      fieldC: '特定値',
      fieldD: 1,
    };
    const result_6 = executeComplexMetadataCalculation(testData_6);
    expect(result_6.evaluated).toBe(true);
    expect(result_6.matchedCondition).toBe('second_or_condition');

    // ===== テストケース 7: 負の値を含む複雑なケース =====
    // テストデータ: fieldA=101, fieldB=-10, fieldC='特定値', fieldD=-5
    // 期待: 第1条件: 101>100=true AND -10<50=true, true AND true=true
    //       結果: true (第1条件が真でショートサーキット評価)
    const testData_7 = {
      fieldA: 101,
      fieldB: -10,
      fieldC: '特定値',
      fieldD: -5,
    };
    const result_7 = executeComplexMetadataCalculation(testData_7);
    expect(result_7.evaluated).toBe(true);
    expect(result_7.matchedCondition).toBe('first_or_condition');

    // ===== テストケース 8: 大きな数値での計算精度 =====
    // テストデータ: fieldA=10000, fieldB=-999, fieldC='データ', fieldD=999999
    // 期待: 第1条件: 10000>100=true AND -999<50=true, true AND true=true
    const testData_8 = {
      fieldA: 10000,
      fieldB: -999,
      fieldC: 'データ',
      fieldD: 999999,
    };
    const result_8 = executeComplexMetadataCalculation(testData_8);
    expect(result_8.evaluated).toBe(true);
    expect(result_8.matchedCondition).toBe('first_or_condition');

    // ===== テストケース 9: 演算子優先順位の検証 =====
    // テストデータ: fieldA=150, fieldB=25, fieldC='特定値', fieldD=0
    // AND優先度が正しく適用されることを検証
    // 期待: (150>100 AND 25<50) OR ('特定値'='特定値' AND 0!=0)
    //       (true AND true) OR (true AND false)
    //       true OR false = true (第1条件が優先)
    const testData_9 = {
      fieldA: 150,
      fieldB: 25,
      fieldC: '特定値',
      fieldD: 0,
    };
    const result_9 = executeComplexMetadataCalculation(testData_9);
    expect(result_9.evaluated).toBe(true);
    expect(result_9.matchedCondition).toBe('first_or_condition');

    // ===== テストケース 10: すべての条件が微妙に外れるケース =====
    // テストデータ: fieldA=100.5, fieldB=49.9, fieldC='特定値', fieldD=0.1
    // 期待: 第1条件: 100.5>100=true AND 49.9<50=true, true AND true=true
    //       結果: true
    const testData_10 = {
      fieldA: 100.5,
      fieldB: 49.9,
      fieldC: '特定値',
      fieldD: 0.1,
    };
    const result_10 = executeComplexMetadataCalculation(testData_10);
    expect(result_10.evaluated).toBe(true);
    expect(result_10.matchedCondition).toBe('first_or_condition');

    // ===== 計算式の正確性を統合的に検証 =====
    // すべてのテストケースが期待通り評価されたことを確認
    expect([result_1, result_2, result_3, result_4, result_5, result_6, result_7, result_8, result_9, result_10]).toBeDefined();
    
    // エラーハンドリング: 必須フィールド不足
    expect(() => executeComplexMetadataCalculation({
      fieldA: 100,
      fieldB: 50,
      // fieldC, fieldD 不足
    })).toThrow(/フィールド定義/);

    // エラーハンドリング: 無効なデータ型
    expect(() => executeComplexMetadataCalculation({
      fieldA: 'invalid',
      fieldB: 50,
      fieldC: '特定値',
      fieldD: 0,
    })).toThrow(/データ型/);

    // エラーハンドリング: null/undefined 値
    expect(() => executeComplexMetadataCalculation({
      fieldA: null,
      fieldB: 50,
      fieldC: '特定値',
      fieldD: 0,
    })).toThrow(/必須項目/);
  });
});