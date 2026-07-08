import { calculatePrecisionImprovement } from '../../src/logic/it-6-2-2-1';

describe('精度改善度自動計算・分析機能', () => {
  // SCEN-1140
  test('モデル更新前後の精度値から改善率・有意性判定・信頼区間・段階評価が正確に計算される', () => {
    // テストデータ1: 基本的な改善シナリオ
    // 更新前精度: 0.85, 更新後精度: 0.92, サンプルサイズ: 1000件
    const result1 = calculatePrecisionImprovement({
      before_accuracy: 0.85,
      after_accuracy: 0.92,
      sample_size: 1000,
    });

    // 改善率の検証: (0.92 - 0.85) / 0.85 * 100 = 8.235294...%
    expect(result1.improvement_rate_percent).toBeCloseTo(8.235294, 5);

    // 改善率が正の値であることを検証
    expect(result1.improvement_rate_percent).toBeGreaterThan(0);

    // 有意性判定の検証
    // p値が計算されていることと、0.05以下であることを確認
    expect(result1.p_value).toBeDefined();
    expect(result1.p_value).toBeGreaterThanOrEqual(0);
    expect(result1.p_value).toBeLessThanOrEqual(1);
    // このシナリオでは改善が統計的に有意と期待
    expect(result1.is_significant).toBe(true);
    expect(result1.p_value).toBeLessThanOrEqual(0.05);

    // 信頼区間の検証（95%信頼区間）
    expect(result1.confidence_interval_lower).toBeDefined();
    expect(result1.confidence_interval_upper).toBeDefined();
    // 信頼区間の上限 > 下限であることを確認
    expect(result1.confidence_interval_upper).toBeGreaterThan(
      result1.confidence_interval_lower
    );
    // 改善率が信頼区間内に含まれることを確認
    expect(result1.improvement_rate_percent).toBeGreaterThanOrEqual(
      result1.confidence_interval_lower
    );
    expect(result1.improvement_rate_percent).toBeLessThanOrEqual(
      result1.confidence_interval_upper
    );

    // 段階評価の検証（5段階以上のレベル評価）
    expect(result1.improvement_level).toBeDefined();
    expect(typeof result1.improvement_level).toBe('number');
    // 改善率が約8.2%であるため、レベルは2または3と期待
    expect(result1.improvement_level).toBeGreaterThanOrEqual(1);
    expect(result1.improvement_level).toBeLessThanOrEqual(5);

    // テストデータ2: より大幅な改善シナリオ
    // 更新前精度: 0.75, 更新後精度: 0.88, サンプルサイズ: 1500件
    const result2 = calculatePrecisionImprovement({
      before_accuracy: 0.75,
      after_accuracy: 0.88,
      sample_size: 1500,
    });

    // 改善率の検証: (0.88 - 0.75) / 0.75 * 100 = 17.333...%
    expect(result2.improvement_rate_percent).toBeCloseTo(17.333333, 5);
    expect(result2.improvement_rate_percent).toBeGreaterThan(
      result1.improvement_rate_percent
    );

    // 有意性判定の検証
    expect(result2.is_significant).toBe(true);
    expect(result2.p_value).toBeLessThanOrEqual(0.05);

    // 信頼区間の検証
    expect(result2.confidence_interval_upper).toBeGreaterThan(
      result2.confidence_interval_lower
    );
    expect(result2.improvement_rate_percent).toBeGreaterThanOrEqual(
      result2.confidence_interval_lower
    );
    expect(result2.improvement_rate_percent).toBeLessThanOrEqual(
      result2.confidence_interval_upper
    );

    // 段階評価の検証
    expect(result2.improvement_level).toBeGreaterThanOrEqual(1);
    expect(result2.improvement_level).toBeLessThanOrEqual(5);
    // 改善率が約17.3%であるため、レベルは3または4と期待
    expect(result2.improvement_level).toBeGreaterThanOrEqual(3);

    // テストデータ3: 小幅な改善シナリオ
    // 更新前精度: 0.90, 更新後精度: 0.92, サンプルサイズ: 800件
    const result3 = calculatePrecisionImprovement({
      before_accuracy: 0.9,
      after_accuracy: 0.92,
      sample_size: 800,
    });

    // 改善率の検証: (0.92 - 0.90) / 0.90 * 100 = 2.222...%
    expect(result3.improvement_rate_percent).toBeCloseTo(2.222222, 5);
    expect(result3.improvement_rate_percent).toBeGreaterThan(0);

    // 有意性判定: サンプルサイズが小さく改善が小幅のため、有意でない可能性
    expect(result3.p_value).toBeGreaterThanOrEqual(0);
    expect(result3.p_value).toBeLessThanOrEqual(1);

    // 信頼区間の検証
    expect(result3.confidence_interval_upper).toBeGreaterThan(
      result3.confidence_interval_lower
    );

    // 段階評価の検証
    expect(result3.improvement_level).toBeGreaterThanOrEqual(1);
    expect(result3.improvement_level).toBeLessThanOrEqual(5);

    // テストデータ4: 大規模サンプルでの検証
    // 更新前精度: 0.82, 更新後精度: 0.87, サンプルサイズ: 5000件
    const result4 = calculatePrecisionImprovement({
      before_accuracy: 0.82,
      after_accuracy: 0.87,
      sample_size: 5000,
    });

    // 改善率の検証: (0.87 - 0.82) / 0.82 * 100 = 6.097...%
    expect(result4.improvement_rate_percent).toBeCloseTo(6.097560, 5);

    // 大規模サンプルでは統計的有意性が高い可能性
    expect(result4.p_value).toBeLessThanOrEqual(0.05);
    expect(result4.is_significant).toBe(true);

    // 信頼区間の幅が結果3より狭い可能性（大規模サンプルの効果）
    const ci_width_3 = result3.confidence_interval_upper - result3.confidence_interval_lower;
    const ci_width_4 = result4.confidence_interval_upper - result4.confidence_interval_lower;
    expect(ci_width_4).toBeLessThan(ci_width_3);

    // テストデータ5: 負の改善（精度低下）シナリオ
    // 更新前精度: 0.88, 更新後精度: 0.85, サンプルサイズ: 1000件
    const result5 = calculatePrecisionImprovement({
      before_accuracy: 0.88,
      after_accuracy: 0.85,
      sample_size: 1000,
    });

    // 改善率が負の値であることを検証: (0.85 - 0.88) / 0.88 * 100 = -3.409...%
    expect(result5.improvement_rate_percent).toBeCloseTo(-3.409090, 5);
    expect(result5.improvement_rate_percent).toBeLessThan(0);

    // 有意性判定の結果
    expect(result5.p_value).toBeGreaterThanOrEqual(0);
    expect(result5.p_value).toBeLessThanOrEqual(1);

    // 信頼区間の検証
    expect(result5.confidence_interval_upper).toBeGreaterThan(
      result5.confidence_interval_lower
    );

    // 段階評価の検証
    expect(result5.improvement_level).toBeGreaterThanOrEqual(1);
    expect(result5.improvement_level).toBeLessThanOrEqual(5);

    // 数学的一貫性の検証：複数回実行で同じ入力なら同じ結果
    const result1_retest = calculatePrecisionImprovement({
      before_accuracy: 0.85,
      after_accuracy: 0.92,
      sample_size: 1000,
    });
    expect(result1_retest.improvement_rate_percent).toBeCloseTo(
      result1.improvement_rate_percent,
      5
    );
    expect(result1_retest.p_value).toBeCloseTo(result1.p_value, 10);
    expect(result1_retest.improvement_level).toBe(result1.improvement_level);
    expect(result1_retest.is_significant).toBe(result1.is_significant);
    expect(result1_retest.confidence_interval_lower).toBeCloseTo(
      result1.confidence_interval_lower,
      10
    );
    expect(result1_retest.confidence_interval_upper).toBeCloseTo(
      result1.confidence_interval_upper,
      10
    );
  });
});