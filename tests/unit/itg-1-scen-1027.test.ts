import { describe, test, expect } from '@jest/globals';
import {
  validateSalesDataInputDataType,
} from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-1027: 数値項目に文字列を入力した場合、データ型不整合エラーが表示される', () => {
    // Arrange: 数値項目に文字列を入力するシナリオ
    const input_numeric_field_with_string = {
      field_name: 'sales_amount',
      field_type: 'numeric',
      input_value: 'abc',
      expected_type: 'number',
    };

    const input_numeric_field_with_japanese = {
      field_name: 'quantity',
      field_type: 'numeric',
      input_value: 'テスト',
      expected_type: 'number',
    };

    const input_numeric_field_valid = {
      field_name: 'sales_amount',
      field_type: 'numeric',
      input_value: '12345',
      expected_type: 'number',
    };

    // Act & Assert: データ型不整合時はエラーを throw
    expect(() =>
      validateSalesDataInputDataType(input_numeric_field_with_string)
    ).toThrow(/データ型/);

    expect(() =>
      validateSalesDataInputDataType(input_numeric_field_with_japanese)
    ).toThrow(/データ型/);

    // Act & Assert: 正しい数値は検証成功
    const result_valid = validateSalesDataInputDataType(
      input_numeric_field_valid
    );
    expect(result_valid).toEqual({
      is_valid: true,
      field_name: 'sales_amount',
      field_type: 'numeric',
      input_value: '12345',
      converted_value: 12345,
      error_message: null,
      visual_state: 'normal',
    });

    // Act & Assert: エラーメッセージに型情報と入力値が含まれていることを検証
    try {
      validateSalesDataInputDataType(input_numeric_field_with_string);
    } catch (err) {
      const error_message = (err as Error).message;
      expect(error_message).toMatch(/abc/);
      expect(error_message).toMatch(/数値/);
    }

    // Act & Assert: 小数点を含む有効な数値は成功
    const input_decimal_valid = {
      field_name: 'unit_price',
      field_type: 'numeric',
      input_value: '123.45',
      expected_type: 'number',
    };
    const result_decimal = validateSalesDataInputDataType(input_decimal_valid);
    expect(result_decimal.is_valid).toBe(true);
    expect(result_decimal.converted_value).toBe(123.45);

    // Act & Assert: 負の数も有効
    const input_negative_valid = {
      field_name: 'discount_amount',
      field_type: 'numeric',
      input_value: '-500',
      expected_type: 'number',
    };
    const result_negative = validateSalesDataInputDataType(input_negative_valid);
    expect(result_negative.is_valid).toBe(true);
    expect(result_negative.converted_value).toBe(-500);

    // Act & Assert: 空文字列はエラー
    expect(() =>
      validateSalesDataInputDataType({
        field_name: 'sales_amount',
        field_type: 'numeric',
        input_value: '',
        expected_type: 'number',
      })
    ).toThrow(/データ型/);

    // Act & Assert: スペースのみもエラー
    expect(() =>
      validateSalesDataInputDataType({
        field_name: 'sales_amount',
        field_type: 'numeric',
        input_value: '   ',
        expected_type: 'number',
      })
    ).toThrow(/データ型/);

    // Act & Assert: 特殊文字混在もエラー
    expect(() =>
      validateSalesDataInputDataType({
        field_name: 'quantity',
        field_type: 'numeric',
        input_value: '123abc',
        expected_type: 'number',
      })
    ).toThrow(/データ型/);

    // Act & Assert: 視覚的エラー状態の確認
    const result_error_state = validateSalesDataInputDataType({
      field_name: 'sales_amount',
      field_type: 'numeric',
      input_value: '999999999',
      expected_type: 'number',
    });
    expect(result_error_state.visual_state).toBe('normal');

    // Act & Assert: 0 は有効な数値
    const input_zero = {
      field_name: 'adjustment',
      field_type: 'numeric',
      input_value: '0',
      expected_type: 'number',
    };
    const result_zero = validateSalesDataInputDataType(input_zero);
    expect(result_zero.is_valid).toBe(true);
    expect(result_zero.converted_value).toBe(0);
  });
});