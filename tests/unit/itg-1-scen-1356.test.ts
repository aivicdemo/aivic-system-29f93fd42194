import { describe, test, expect } from '@jest/globals';
import { defineValidationRule } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証ルール定義機能 - 必須フラグと空許容範囲の境界値処理', () => {
  test('SCEN-1356: 必須フラグが true で許容範囲が空の場合に境界値として適切に処理される', () => {
    // (1) ルールが正常に保存されること
    const ruleInput = {
      ruleName: '必須フラグ_空許容範囲_境界値テスト',
      targetField: '売上金額',
      isMandatory: true,
      allowableRange: '',
      dataType: 'number',
    };

    const savedRule = defineValidationRule(ruleInput);

    expect(savedRule).toBeDefined();
    expect(savedRule.ruleName).toBe('必須フラグ_空許容範囲_境界値テスト');
    expect(savedRule.targetField).toBe('売上金額');
    expect(savedRule.isMandatory).toBe(true);
    expect(savedRule.allowableRange).toBe('');
    expect(savedRule.ruleId).toBeDefined();
    expect(typeof savedRule.ruleId).toBe('string');

    // (2) NULL値に対して『必須項目です』というエラーを返すこと
    const nullValueValidationResult = defineValidationRule({
      ...ruleInput,
      validateValue: null,
    });

    expect(nullValueValidationResult.isValid).toBe(false);
    expect(nullValueValidationResult.errorMessage).toMatch(/必須/);
    expect(nullValueValidationResult.errorCode).toBe('MANDATORY_FIELD_REQUIRED');

    // (3) 未設定値に対して『必須項目です』というエラーを返すこと
    const undefinedValueValidationResult = defineValidationRule({
      ...ruleInput,
      validateValue: undefined,
    });

    expect(undefinedValueValidationResult.isValid).toBe(false);
    expect(undefinedValueValidationResult.errorMessage).toMatch(/必須/);
    expect(undefinedValueValidationResult.errorCode).toBe('MANDATORY_FIELD_REQUIRED');

    // (4) 許容範囲の空状態が内部的に『制限なし』または『無制限』として解釈されずに必須チェックのみが機能すること
    const validValueWithEmptyRange = defineValidationRule({
      ...ruleInput,
      validateValue: 100000,
    });

    expect(validValueWithEmptyRange.isValid).toBe(true);
    expect(validValueWithEmptyRange.errorMessage).toBeNull();
    expect(validValueWithEmptyRange.rangeCheckApplied).toBe(false);

    // (5) エラーメッセージが一貫性を持つこと
    const errorMessage1 = defineValidationRule({
      ...ruleInput,
      validateValue: null,
    }).errorMessage;

    const errorMessage2 = defineValidationRule({
      ...ruleInput,
      validateValue: undefined,
    }).errorMessage;

    expect(errorMessage1).toBe(errorMessage2);
    expect(errorMessage1).toMatch(/必須項目です/);
  });
});