import { detectDivergencePatterns } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1472
  test('季節変動・地域差による相場乖離検出 - 乖離パターンデータが空の場合、エラーメッセージを返して処理を中断する', () => {
    const empty_divergence_patterns = [];
    const fiscal_year = 2024;
    const region = '関東';

    const result = detectDivergencePatterns({
      divergence_patterns: empty_divergence_patterns,
      fiscal_year: fiscal_year,
      region: region,
    });

    expect(result).toEqual({
      success: false,
      error_message: '乖離パターンデータが見つかりません',
      divergence_results: null,
    });

    expect(result.success).toBe(false);
    expect(result.error_message).toMatch(/乖離パターンデータ/);
    expect(result.divergence_results).toBeNull();
  });
});