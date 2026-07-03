import { describe, test, expect } from '@jest/globals';
import { validateDiscountCode } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-1262: 割引基準マスタに存在しない割引コードが指定された場合、エラーとして検出される', () => {
    // 割引基準マスタのセットアップ
    const validDiscountMaster = [
      { discountCode: 'DISCOUNT_10', discountRate: 0.1, applicableServices: ['SERVICE_A', 'SERVICE_B'] },
      { discountCode: 'DISCOUNT_20', discountRate: 0.2, applicableServices: ['SERVICE_B', 'SERVICE_C'] },
      { discountCode: 'EARLY_BIRD_05', discountRate: 0.05, applicableServices: ['SERVICE_A'] },
    ];

    // 存在しない割引コード
    const invalidDiscountCode = 'INVALID_DISCOUNT_999';

    // 割引コード検証処理を実行
    const result = validateDiscountCode({
      discountCode: invalidDiscountCode,
      discountMaster: validDiscountMaster,
    });

    // エラーハンドリング結果を確認
    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('ERR_DISCOUNT_CODE_NOT_FOUND');
    expect(result.errorMessage).toMatch(/割引コード/);
    expect(result.discountRate).toBeNull();
    expect(result.isProcessed).toBe(false);
  });

  test('SCEN-1262: 割引基準マスタに存在しない割引コードを入力した場合、エラーがスローされる', () => {
    const validDiscountMaster = [
      { discountCode: 'DISCOUNT_10', discountRate: 0.1, applicableServices: ['SERVICE_A'] },
    ];

    const invalidDiscountCode = 'INVALID_DISCOUNT_999';

    expect(() =>
      validateDiscountCode({
        discountCode: invalidDiscountCode,
        discountMaster: validDiscountMaster,
        throwOnError: true,
      })
    ).toThrow(/割引コード/);
  });

  test('SCEN-1262: 正規の割引コードが指定された場合、正常に検証される', () => {
    const validDiscountMaster = [
      { discountCode: 'DISCOUNT_10', discountRate: 0.1, applicableServices: ['SERVICE_A', 'SERVICE_B'] },
      { discountCode: 'DISCOUNT_20', discountRate: 0.2, applicableServices: ['SERVICE_B', 'SERVICE_C'] },
    ];

    const validDiscountCode = 'DISCOUNT_10';

    const result = validateDiscountCode({
      discountCode: validDiscountCode,
      discountMaster: validDiscountMaster,
    });

    expect(result.isValid).toBe(true);
    expect(result.errorCode).toBeNull();
    expect(result.discountRate).toBe(0.1);
    expect(result.isProcessed).toBe(true);
    expect(result.applicableServices).toEqual(['SERVICE_A', 'SERVICE_B']);
  });

  test('SCEN-1262: 空の割引基準マスタに対して割引コードを検証する場合、エラーが検出される', () => {
    const emptyDiscountMaster: Array<{ discountCode: string; discountRate: number; applicableServices: string[] }> = [];
    const discountCode = 'DISCOUNT_10';

    const result = validateDiscountCode({
      discountCode: discountCode,
      discountMaster: emptyDiscountMaster,
    });

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('ERR_DISCOUNT_CODE_NOT_FOUND');
  });

  test('SCEN-1262: 複数の割引コードが存在する中で、指定された割引コードが見つからない場合、正確にエラーが識別される', () => {
    const validDiscountMaster = [
      { discountCode: 'DISCOUNT_05', discountRate: 0.05, applicableServices: ['SERVICE_A'] },
      { discountCode: 'DISCOUNT_10', discountRate: 0.1, applicableServices: ['SERVICE_B'] },
      { discountCode: 'DISCOUNT_15', discountRate: 0.15, applicableServices: ['SERVICE_C'] },
      { discountCode: 'DISCOUNT_20', discountRate: 0.2, applicableServices: ['SERVICE_D'] },
      { discountCode: 'EARLY_BIRD_03', discountRate: 0.03, applicableServices: ['SERVICE_A'] },
    ];

    const invalidDiscountCode = 'INVALID_DISCOUNT_999';

    const result = validateDiscountCode({
      discountCode: invalidDiscountCode,
      discountMaster: validDiscountMaster,
    });

    expect(result.isValid).toBe(false);
    expect(result.errorCode).toBe('ERR_DISCOUNT_CODE_NOT_FOUND');
    expect(result.discountRate).toBeNull();
  });
});