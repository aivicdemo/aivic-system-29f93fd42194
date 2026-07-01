import { defineValidationRule } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証ルール定義機能', () => {
  // SCEN-1355: [error] 営業データ項目の定義に矛盾がある場合（データ型と許容範囲の不整合）にエラーが返される
  test('データ型が整数型で許容値が文字列の場合、エラーを返す', () => {
    const input = {
      field_name: 'test_field',
      data_type: 'integer',
      min_value: -100,
      max_value: 50,
      allowed_values: ['あいうえお'],
    };

    expect(() => defineValidationRule(input)).toThrow(/データ型と許容範囲/);
  });

  // 正常系: データ型と許容範囲が整合している場合、ルール定義が成功する
  test('データ型が整数型で許容値が整数の場合、ルール定義が成功する', () => {
    const input = {
      field_name: 'test_field',
      data_type: 'integer',
      min_value: -100,
      max_value: 50,
      allowed_values: [10, 25, 40],
    };

    const result = defineValidationRule(input);
    expect(result).toEqual({
      field_name: 'test_field',
      data_type: 'integer',
      min_value: -100,
      max_value: 50,
      allowed_values: [10, 25, 40],
      validation_status: 'approved',
    });
  });

  // 境界値テスト: 許容範囲の境界値が正しく検証される
  test('許容値が範囲の境界値である場合、ルール定義が成功する', () => {
    const input = {
      field_name: 'boundary_field',
      data_type: 'integer',
      min_value: 0,
      max_value: 100,
      allowed_values: [0, 100],
    };

    const result = defineValidationRule(input);
    expect(result.validation_status).toBe('approved');
  });

  // エラー系: 複数の許容値に文字列が混在している場合
  test('許容値の配列に文字列が含まれている場合、エラーを返す', () => {
    const input = {
      field_name: 'mixed_field',
      data_type: 'integer',
      min_value: -100,
      max_value: 50,
      allowed_values: [10, 'invalid_string', 25],
    };

    expect(() => defineValidationRule(input)).toThrow(/データ型と許容範囲/);
  });

  // エラー系: データ型が文字列型なのに許容値が数値の場合
  test('データ型が文字列型で許容値が数値の場合、エラーを返す', () => {
    const input = {
      field_name: 'string_field',
      data_type: 'string',
      min_value: 0,
      max_value: 100,
      allowed_values: [10, 20, 30],
    };

    expect(() => defineValidationRule(input)).toThrow(/データ型と許容範囲/);
  });

  // 正常系: データ型が文字列型で許容値が文字列の場合
  test('データ型が文字列型で許容値が文字列の場合、ルール定義が成功する', () => {
    const input = {
      field_name: 'string_field',
      data_type: 'string',
      allowed_values: ['sales', 'support', 'engineering'],
    };

    const result = defineValidationRule(input);
    expect(result.validation_status).toBe('approved');
    expect(result.allowed_values).toEqual(['sales', 'support', 'engineering']);
  });

  // エラー系: 空の許容値配列で定義する場合
  test('許容値が空配列の場合、エラーを返す', () => {
    const input = {
      field_name: 'empty_field',
      data_type: 'integer',
      allowed_values: [],
    };

    expect(() => defineValidationRule(input)).toThrow(/許容値/);
  });

  // エラー系: データ型が不正な値の場合
  test('データ型が不正な値の場合、エラーを返す', () => {
    const input = {
      field_name: 'invalid_type_field',
      data_type: 'invalid_type',
      allowed_values: [10, 20],
    };

    expect(() => defineValidationRule(input)).toThrow(/データ型/);
  });
});