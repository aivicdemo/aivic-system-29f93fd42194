import { calculateDivergencePriority } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1459: 乖離集中度判定・優先度決定機能 - 乖離集中度と影響度から優先度が正確に判定される', () => {
    // ケース1: 乖離集中度が高（80%以上）で影響度が高
    const result_high_high = calculateDivergencePriority({
      divergence_concentration: 85,
      impact_degree: 8,
    });
    expect(result_high_high.priority).toBe('高');

    // ケース2: 乖離集中度が中（50%～80%未満）で影響度が中
    const result_mid_mid = calculateDivergencePriority({
      divergence_concentration: 65,
      impact_degree: 5,
    });
    expect(result_mid_mid.priority).toBe('中');

    // ケース3: 乖離集中度が低（50%未満）で影響度が低
    const result_low_low = calculateDivergencePriority({
      divergence_concentration: 35,
      impact_degree: 2,
    });
    expect(result_low_low.priority).toBe('低');

    // ケース4: 乖離集中度が高で影響度が低の境界値
    const result_high_low = calculateDivergencePriority({
      divergence_concentration: 80,
      impact_degree: 3,
    });
    expect(['高', '中']).toContain(result_high_low.priority);
    expect(result_high_low.priority).toBe('中');

    // ケース5: 乖離集中度が低で影響度が高の境界値
    const result_low_high = calculateDivergencePriority({
      divergence_concentration: 50,
      impact_degree: 8,
    });
    expect(['中', '高']).toContain(result_low_high.priority);
    expect(result_low_high.priority).toBe('中');

    // ケース6: 集中度ちょうど80%（境界値）で影響度が高
    const result_boundary_80 = calculateDivergencePriority({
      divergence_concentration: 80,
      impact_degree: 7,
    });
    expect(result_boundary_80.priority).toBe('高');

    // ケース7: 集中度ちょうど50%（境界値）で影響度が中
    const result_boundary_50 = calculateDivergencePriority({
      divergence_concentration: 50,
      impact_degree: 5,
    });
    expect(result_boundary_50.priority).toBe('中');

    // ケース8: 最高値ケース（集中度100%、影響度10）
    const result_max = calculateDivergencePriority({
      divergence_concentration: 100,
      impact_degree: 10,
    });
    expect(result_max.priority).toBe('高');

    // ケース9: 最低値ケース（集中度0%、影響度1）
    const result_min = calculateDivergencePriority({
      divergence_concentration: 0,
      impact_degree: 1,
    });
    expect(result_min.priority).toBe('低');
  });
});