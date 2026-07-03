import { describe, test, expect } from '@jest/globals';
import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-596: [edge] 営業データ品質検証機能 - 範囲の境界値（最小値・最大値）が合格判定される', () => {
    // 最小値のテストケース: 合格判定を確認
    const min_value_result = validateSalesDataQuality({
      apo_count: 5,
      contract_amount: 100000,
      response_rate: 50,
    });
    expect(min_value_result.pass).toBe(true);
    expect(min_value_result.errors).toEqual([]);

    // 最大値のテストケース: 合格判定を確認
    const max_value_result = validateSalesDataQuality({
      apo_count: 100,
      contract_amount: 5000000,
      response_rate: 100,
    });
    expect(max_value_result.pass).toBe(true);
    expect(max_value_result.errors).toEqual([]);

    // 最小値-1のテストケース: 不合格判定を確認
    const below_min_result = validateSalesDataQuality({
      apo_count: 4,
      contract_amount: 100000,
      response_rate: 50,
    });
    expect(below_min_result.pass).toBe(false);
    expect(below_min_result.errors.length).toBeGreaterThan(0);
    expect(below_min_result.errors[0]).toMatch(/最小値/);

    // 最大値+1のテストケース: 不合格判定を確認
    const above_max_result = validateSalesDataQuality({
      apo_count: 101,
      contract_amount: 5000000,
      response_rate: 100,
    });
    expect(above_max_result.pass).toBe(false);
    expect(above_max_result.errors.length).toBeGreaterThan(0);
    expect(above_max_result.errors[0]).toMatch(/最大値/);

    // 複数項目の最小値-1: 不合格判定を確認
    const multi_below_min_result = validateSalesDataQuality({
      apo_count: 4,
      contract_amount: 99999,
      response_rate: 49,
    });
    expect(multi_below_min_result.pass).toBe(false);
    expect(multi_below_min_result.errors.length).toBeGreaterThanOrEqual(2);

    // 複数項目の最大値+1: 不合格判定を確認
    const multi_above_max_result = validateSalesDataQuality({
      apo_count: 101,
      contract_amount: 5000001,
      response_rate: 101,
    });
    expect(multi_above_max_result.pass).toBe(false);
    expect(multi_above_max_result.errors.length).toBeGreaterThanOrEqual(2);

    // 一部が範囲内、一部が範囲外のケース
    const partial_invalid_result = validateSalesDataQuality({
      apo_count: 5,
      contract_amount: 5000001,
      response_rate: 50,
    });
    expect(partial_invalid_result.pass).toBe(false);
    expect(partial_invalid_result.errors.length).toBe(1);
    expect(partial_invalid_result.errors[0]).toMatch(/contract_amount|金額/);
  });
});