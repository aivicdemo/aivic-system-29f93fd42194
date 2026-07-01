import { describe, test, expect } from '@jest/globals';
import { validateDataRange } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-688: [normal] 営業データ値の範囲検証機能 - 数値項目が定義された最小値と最大値の範囲内にある場合に検証が合格する
  test('SCEN-688: 数値が定義範囲内の場合に検証が合格する', () => {
    const input_min_value = 0;
    const input_max_value = 1000000;
    const input_test_value = 500000;

    const result = validateDataRange({
      minValue: input_min_value,
      maxValue: input_max_value,
      testValue: input_test_value,
    });

    expect(result).toEqual({
      status: 'PASS',
      isValid: true,
      message: '検証が合格しました。入力値は定義された範囲内です。',
    });
  });

  test('SCEN-688: 数値が最小値と等しい場合に検証が合格する', () => {
    const input_min_value = 0;
    const input_max_value = 1000000;
    const input_test_value = 0;

    const result = validateDataRange({
      minValue: input_min_value,
      maxValue: input_max_value,
      testValue: input_test_value,
    });

    expect(result).toEqual({
      status: 'PASS',
      isValid: true,
      message: '検証が合格しました。入力値は定義された範囲内です。',
    });
  });

  test('SCEN-688: 数値が最大値と等しい場合に検証が合格する', () => {
    const input_min_value = 0;
    const input_max_value = 1000000;
    const input_test_value = 1000000;

    const result = validateDataRange({
      minValue: input_min_value,
      maxValue: input_max_value,
      testValue: input_test_value,
    });

    expect(result).toEqual({
      status: 'PASS',
      isValid: true,
      message: '検証が合格しました。入力値は定義された範囲内です。',
    });
  });

  test('SCEN-688: 数値が最小値未満の場合に検証が不合格となる', () => {
    const input_min_value = 0;
    const input_max_value = 1000000;
    const input_test_value = -1;

    const result = validateDataRange({
      minValue: input_min_value,
      maxValue: input_max_value,
      testValue: input_test_value,
    });

    expect(result).toEqual({
      status: 'FAIL',
      isValid: false,
      message: '検証が不合格です。入力値が最小値を下回っています。',
    });
  });

  test('SCEN-688: 数値が最大値を超える場合に検証が不合格となる', () => {
    const input_min_value = 0;
    const input_max_value = 1000000;
    const input_test_value = 1000001;

    const result = validateDataRange({
      minValue: input_min_value,
      maxValue: input_max_value,
      testValue: input_test_value,
    });

    expect(result).toEqual({
      status: 'FAIL',
      isValid: false,
      message: '検証が不合格です。入力値が最大値を超えています。',
    });
  });

  test('SCEN-688: 最小値が最大値より大きい場合に例外が発生する', () => {
    const input_min_value = 1000000;
    const input_max_value = 0;
    const input_test_value = 500000;

    expect(() =>
      validateDataRange({
        minValue: input_min_value,
        maxValue: input_max_value,
        testValue: input_test_value,
      })
    ).toThrow(/範囲定義/);
  });
});