import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculatePriceRangeAndDeviationWidth } from '../../src/logic/it-6-2-1-1';

describe('相場範囲と許容乖離幅の算出 - データ件数1件の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-891
  test('査定データが1件のみの場合、相場範囲の下限値と上限値が当該データの査定額と同一で、許容乖離幅が0または最小値となること', () => {
    // Arrange: テスト用データ - 査定データ1件のみ
    const inputDataSet = [
      {
        assessment_id: 'ASS-001',
        category_code: 'CAT-FOUNDATION',
        product_code: 'PROD-CONCRETE-BASE',
        assessment_amount: 1500000,
        quantity: 100,
        unit_price: 15000,
        assessment_date: '2024-01-15',
        region_code: 'REGION-TOKYO',
        fiscal_period: '2024-Q1'
      }
    ];

    const queryParams = {
      category_code: 'CAT-FOUNDATION',
      product_code: 'PROD-CONCRETE-BASE',
      region_code: 'REGION-TOKYO',
      fiscal_period: '2024-Q1'
    };

    // Act: 相場範囲と許容乖離幅を算出
    const result = calculatePriceRangeAndDeviationWidth(inputDataSet, queryParams);

    // Assert: 下限値が査定額と同一
    expect(result.lower_limit).toBe(1500000);

    // Assert: 上限値が査定額と同一
    expect(result.upper_limit).toBe(1500000);

    // Assert: 許容乖離幅が0
    expect(result.allowable_deviation_width).toBe(0);

    // Assert: 中央値が査定額と同一
    expect(result.median_value).toBe(1500000);

    // Assert: 四分位数の値が適切（データ1件のため全て同一）
    expect(result.quartile_25).toBe(1500000);
    expect(result.quartile_75).toBe(1500000);

    // Assert: 標準偏差が0
    expect(result.standard_deviation).toBe(0);

    // Assert: サンプル件数が1
    expect(result.sample_count).toBe(1);

    // Assert: 不正な値（null、負の値、無限大）が存在しないこと
    expect(result.lower_limit).not.toBeNull();
    expect(result.upper_limit).not.toBeNull();
    expect(result.allowable_deviation_width).not.toBeNull();
    expect(result.lower_limit).toBeGreaterThanOrEqual(0);
    expect(result.upper_limit).toBeGreaterThanOrEqual(0);
    expect(result.allowable_deviation_width).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(result.lower_limit)).toBe(true);
    expect(Number.isFinite(result.upper_limit)).toBe(true);
    expect(Number.isFinite(result.allowable_deviation_width)).toBe(true);

    // Assert: 算出結果がシステムに保存された状態（is_saved フラグ）
    expect(result.is_saved).toBe(true);

    // Assert: 保存タイムスタンプが記録されている
    expect(result.saved_timestamp).not.toBeNull();
    expect(typeof result.saved_timestamp).toBe('string');
  });
});