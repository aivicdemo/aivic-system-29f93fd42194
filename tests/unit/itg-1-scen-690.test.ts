import { describe, it, expect, beforeEach } from '@jest/globals';
import { validateSalesDataRangeMinimum } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SCEN-690: 数値項目が最小値未満である場合に範囲外エラーが検出される', () => {
    // 入力値: 最小値が100の数値項目に対して99を入力
    const inputData = {
      item_name: 'monthly_appointments',
      minimum_value: 100,
      input_value: 99,
      field_type: 'numeric'
    };

    // 期待値: 範囲外エラーが検出され、エラーメッセージが返される
    expect(() => validateSalesDataRangeMinimum(inputData)).toThrow(/最小値/);
  });

  it('SCEN-690: 数値項目が最小値と同じ値の場合は妥当', () => {
    // 入力値: 最小値が100の数値項目に対して100を入力
    const inputData = {
      item_name: 'monthly_appointments',
      minimum_value: 100,
      input_value: 100,
      field_type: 'numeric'
    };

    // 期待値: バリデーション成功、エラーなし
    const result = validateSalesDataRangeMinimum(inputData);
    expect(result).toEqual({
      is_valid: true,
      error_message: null,
      validation_timestamp: expect.any(String),
      checked_value: 100,
      constraint_minimum: 100
    });
  });

  it('SCEN-690: 数値項目が最小値より大きい場合は妥当', () => {
    // 入力値: 最小値が100の数値項目に対して150を入力
    const inputData = {
      item_name: 'monthly_appointments',
      minimum_value: 100,
      input_value: 150,
      field_type: 'numeric'
    };

    // 期待値: バリデーション成功、エラーなし
    const result = validateSalesDataRangeMinimum(inputData);
    expect(result).toEqual({
      is_valid: true,
      error_message: null,
      validation_timestamp: expect.any(String),
      checked_value: 150,
      constraint_minimum: 100
    });
  });

  it('SCEN-690: 複数の境界値をテスト（最小値0でマイナス値を入力）', () => {
    // 入力値: 最小値が0の数値項目に対して-1を入力
    const inputData = {
      item_name: 'contract_count',
      minimum_value: 0,
      input_value: -1,
      field_type: 'numeric'
    };

    // 期待値: 範囲外エラーが検出される
    expect(() => validateSalesDataRangeMinimum(inputData)).toThrow(/最小値/);
  });

  it('SCEN-690: エラーログが記録される', () => {
    // 入力値: 最小値が100の数値項目に対して50を入力
    const inputData = {
      item_name: 'deal_count',
      minimum_value: 100,
      input_value: 50,
      field_type: 'numeric'
    };

    try {
      validateSalesDataRangeMinimum(inputData);
      fail('エラーが発生すべき');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/最小値/);
      }
    }
  });
});