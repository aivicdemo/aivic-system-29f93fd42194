import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { createQualityChecklistWithBoundaryValidation } from '../../src/logic/it-1781935279444-2-1-1';

describe('品質管理ルール・チェックリスト作成 - 数値範囲境界値テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1332: 数値範囲の上限値・下限値がチェックリストの境界値として正しく記録される
  test('should correctly save numeric range boundary values in checklist', () => {
    // ハッピーパス: 正常な範囲（下限値≤上限値）でチェックリストが作成される
    const checklistInput1 = {
      name: '数値範囲境界値テスト',
      checkItems: [
        {
          itemType: '数値範囲',
          minValue: -999999.99,
          maxValue: 999999.99,
        },
      ],
    };

    const result1 = createQualityChecklistWithBoundaryValidation(checklistInput1);

    expect(result1.success).toBe(true);
    expect(result1.checklist).toEqual({
      id: expect.any(String),
      name: '数値範囲境界値テスト',
      checkItems: [
        {
          itemType: '数値範囲',
          minValue: -999999.99,
          maxValue: 999999.99,
        },
      ],
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(result1.checklist.checkItems[0].minValue).toBe(-999999.99);
    expect(result1.checklist.checkItems[0].maxValue).toBe(999999.99);

    // 境界値が同一値である場合（下限値=上限値）もチェックリストが作成される
    const checklistInput2 = {
      name: '同一値範囲テスト',
      checkItems: [
        {
          itemType: '数値範囲',
          minValue: 100.00,
          maxValue: 100.00,
        },
      ],
    };

    const result2 = createQualityChecklistWithBoundaryValidation(checklistInput2);

    expect(result2.success).toBe(true);
    expect(result2.checklist.checkItems[0].minValue).toBe(100.00);
    expect(result2.checklist.checkItems[0].maxValue).toBe(100.00);

    // エラーケース1: 下限値>上限値の場合、バリデーションエラーが発生する
    const checklistInput3 = {
      name: '無効な範囲テスト',
      checkItems: [
        {
          itemType: '数値範囲',
          minValue: 1000000.00,
          maxValue: -1000000.00,
        },
      ],
    };

    const result3 = createQualityChecklistWithBoundaryValidation(checklistInput3);

    expect(result3.success).toBe(false);
    expect(result3.error).toMatch(/下限値/);

    // エラーケース2: チェックリスト名が空の場合
    const checklistInput4 = {
      name: '',
      checkItems: [
        {
          itemType: '数値範囲',
          minValue: 0,
          maxValue: 100,
        },
      ],
    };

    const result4 = createQualityChecklistWithBoundaryValidation(checklistInput4);

    expect(result4.success).toBe(false);
    expect(result4.error).toMatch(/チェックリスト名/);

    // エラーケース3: チェック項目が空配列の場合
    const checklistInput5 = {
      name: 'テスト',
      checkItems: [],
    };

    const result5 = createQualityChecklistWithBoundaryValidation(checklistInput5);

    expect(result5.success).toBe(false);
    expect(result5.error).toMatch(/チェック項目/);

    // 極端な値での正常系: 非常に大きい数値と小さい数値の範囲
    const checklistInput6 = {
      name: '極端値テスト',
      checkItems: [
        {
          itemType: '数値範囲',
          minValue: -999999999.99,
          maxValue: 999999999.99,
        },
      ],
    };

    const result6 = createQualityChecklistWithBoundaryValidation(checklistInput6);

    expect(result6.success).toBe(true);
    expect(result6.checklist.checkItems[0].minValue).toBe(-999999999.99);
    expect(result6.checklist.checkItems[0].maxValue).toBe(999999999.99);

    // 精度検証: 小数点以下の桁数が正確に保持される
    const checklistInput7 = {
      name: '精度テスト',
      checkItems: [
        {
          itemType: '数値範囲',
          minValue: -123.456,
          maxValue: 789.012,
        },
      ],
    };

    const result7 = createQualityChecklistWithBoundaryValidation(checklistInput7);

    expect(result7.success).toBe(true);
    expect(result7.checklist.checkItems[0].minValue).toBe(-123.456);
    expect(result7.checklist.checkItems[0].maxValue).toBe(789.012);
  });
});