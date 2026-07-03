import { validateSalesDataInput } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時自動検証機能', () => {
  test('SCEN-1026: 入力値が許容範囲の最小値・最大値と完全に一致する場合、検証が正常に完了する', () => {
    // 最小値での検証（金額フィールド: 最小値 0）
    const minAmountInput = {
      fieldName: '金額',
      value: 0,
      minValue: 0,
      maxValue: 999999999,
      dataType: 'number',
      isRequired: true,
    };

    const minAmountResult = validateSalesDataInput(minAmountInput);
    expect(minAmountResult.isValid).toBe(true);
    expect(minAmountResult.errors).toEqual([]);
    expect(minAmountResult.warnings).toEqual([]);

    // 最大値での検証（金額フィールド: 最大値 999999999）
    const maxAmountInput = {
      fieldName: '金額',
      value: 999999999,
      minValue: 0,
      maxValue: 999999999,
      dataType: 'number',
      isRequired: true,
    };

    const maxAmountResult = validateSalesDataInput(maxAmountInput);
    expect(maxAmountResult.isValid).toBe(true);
    expect(maxAmountResult.errors).toEqual([]);
    expect(maxAmountResult.warnings).toEqual([]);

    // 最小値での検証（数量フィールド: 最小値 1）
    const minQuantityInput = {
      fieldName: '数量',
      value: 1,
      minValue: 1,
      maxValue: 99999,
      dataType: 'number',
      isRequired: true,
    };

    const minQuantityResult = validateSalesDataInput(minQuantityInput);
    expect(minQuantityResult.isValid).toBe(true);
    expect(minQuantityResult.errors).toEqual([]);
    expect(minQuantityResult.warnings).toEqual([]);

    // 最大値での検証（数量フィールド: 最大値 99999）
    const maxQuantityInput = {
      fieldName: '数量',
      value: 99999,
      minValue: 1,
      maxValue: 99999,
      dataType: 'number',
      isRequired: true,
    };

    const maxQuantityResult = validateSalesDataInput(maxQuantityInput);
    expect(maxQuantityResult.isValid).toBe(true);
    expect(maxQuantityResult.errors).toEqual([]);
    expect(maxQuantityResult.warnings).toEqual([]);

    // すべての検証が完了し、データが有効な状態であることを確認
    expect([minAmountResult, maxAmountResult, minQuantityResult, maxQuantityResult].every(r => r.isValid)).toBe(true);
  });
});