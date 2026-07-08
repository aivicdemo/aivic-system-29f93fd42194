import { aggregateAccuracyIndicators } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1529
  test('改善度がゼロまたはマイナスの場合に警告として部署長レポートに記載される', () => {
    const improvement_records = [
      {
        improvement_id: 'IMP-001',
        assessor_id: 'ASS-001',
        construction_type: '鉄骨工事',
        amount_band: '1000万円以上5000万円未満',
        improvement_degree_before: 75.5,
        improvement_degree_after: 75.5,
        recorded_at: '2024-01-15T10:30:00Z',
      },
      {
        improvement_id: 'IMP-002',
        assessor_id: 'ASS-002',
        construction_type: '型枠工事',
        amount_band: '500万円以上1000万円未満',
        improvement_degree_before: 82.0,
        improvement_degree_after: 80.5,
        recorded_at: '2024-01-15T11:00:00Z',
      },
      {
        improvement_id: 'IMP-003',
        assessor_id: 'ASS-003',
        construction_type: '機械装置工事',
        amount_band: '5000万円以上',
        improvement_degree_before: 70.0,
        improvement_degree_after: 65.0,
        recorded_at: '2024-01-15T11:30:00Z',
      },
      {
        improvement_id: 'IMP-004',
        assessor_id: 'ASS-001',
        construction_type: '鉄骨工事',
        amount_band: '1000万円以上5000万円未満',
        improvement_degree_before: 88.0,
        improvement_degree_after: 92.5,
        recorded_at: '2024-01-15T12:00:00Z',
      },
    ];

    const result = aggregateAccuracyIndicators(improvement_records);

    // 改善度がゼロまたはマイナスの改善実績を警告対象として抽出
    const warning_records = result.departmental_report.warnings.filter(
      (w: any) => w.improvement_degree_change <= 0
    );

    expect(warning_records).toHaveLength(2);

    // IMP-001: 改善度ゼロ（75.5 - 75.5 = 0）
    const zero_improvement_warning = warning_records.find(
      (w: any) => w.improvement_id === 'IMP-001'
    );
    expect(zero_improvement_warning).toBeDefined();
    expect(zero_improvement_warning.improvement_degree_change).toBe(0);
    expect(zero_improvement_warning.message).toMatch(/改善度がゼロ/);
    expect(zero_improvement_warning.improvement_id).toBe('IMP-001');
    expect(zero_improvement_warning.assessor_id).toBe('ASS-001');
    expect(zero_improvement_warning.construction_type).toBe('鉄骨工事');
    expect(zero_improvement_warning.recorded_at).toBe('2024-01-15T10:30:00Z');

    // IMP-003: 改善度マイナス（65.0 - 70.0 = -5.0）
    const negative_improvement_warning = warning_records.find(
      (w: any) => w.improvement_id === 'IMP-003'
    );
    expect(negative_improvement_warning).toBeDefined();
    expect(negative_improvement_warning.improvement_degree_change).toBe(-5.0);
    expect(negative_improvement_warning.message).toMatch(/改善度が低下/);
    expect(negative_improvement_warning.improvement_id).toBe('IMP-003');
    expect(negative_improvement_warning.assessor_id).toBe('ASS-003');
    expect(negative_improvement_warning.construction_type).toBe('機械装置工事');
    expect(negative_improvement_warning.recorded_at).toBe('2024-01-15T11:30:00Z');

    // 正常な改善実績（IMP-002、IMP-004）は警告対象外
    expect(
      warning_records.find((w: any) => w.improvement_id === 'IMP-002')
    ).toBeUndefined();
    expect(
      warning_records.find((w: any) => w.improvement_id === 'IMP-004')
    ).toBeUndefined();

    // レポート全体の構造確認
    expect(result.departmental_report).toBeDefined();
    expect(result.departmental_report.warnings).toBeDefined();
    expect(Array.isArray(result.departmental_report.warnings)).toBe(true);
    expect(result.departmental_report.total_warning_count).toBe(2);

    // 査定担当者別の精度指標集計
    expect(result.by_assessor).toBeDefined();
    expect(result.by_assessor).toHaveProperty('ASS-001');
    expect(result.by_assessor).toHaveProperty('ASS-002');
    expect(result.by_assessor).toHaveProperty('ASS-003');

    // ASS-001の集計値：2件の改善実績
    // 改善度平均 = (0 + 4.5) / 2 = 2.25
    expect(result.by_assessor['ASS-001'].average_improvement_degree).toBe(2.25);
    expect(result.by_assessor['ASS-001'].total_records).toBe(2);

    // 工種別の精度指標集計
    expect(result.by_construction_type).toBeDefined();
    expect(result.by_construction_type).toHaveProperty('鉄骨工事');
    expect(result.by_construction_type).toHaveProperty('型枠工事');
    expect(result.by_construction_type).toHaveProperty('機械装置工事');

    // 「鉄骨工事」の集計値：2件
    // 改善度合計 = 0 + 4.5 = 4.5
    // 改善度平均 = 4.5 / 2 = 2.25
    expect(result.by_construction_type['鉄骨工事'].total_records).toBe(2);
    expect(result.by_construction_type['鉄骨工事'].average_improvement_degree).toBe(
      2.25
    );

    // 金額帯別の精度指標集計
    expect(result.by_amount_band).toBeDefined();
    expect(result.by_amount_band).toHaveProperty('1000万円以上5000万円未満');
    expect(result.by_amount_band).toHaveProperty('500万円以上1000万円未満');
    expect(result.by_amount_band).toHaveProperty('5000万円以上');

    // 「1000万円以上5000万円未満」の集計値：2件
    // 改善度合計 = 0 + 4.5 = 4.5
    // 改善度平均 = 4.5 / 2 = 2.25
    expect(result.by_amount_band['1000万円以上5000万円未満'].total_records).toBe(2);
    expect(
      result.by_amount_band['1000万円以上5000万円未満']
        .average_improvement_degree
    ).toBe(2.25);

    // 全体集計値
    // 改善度の合計 = 0 + (-1.5) + (-5.0) + 4.5 = -2.0
    // 改善度の平均 = -2.0 / 4 = -0.5
    expect(result.overall_stats.total_records).toBe(4);
    expect(result.overall_stats.total_improvement_degree).toBe(-2.0);
    expect(result.overall_stats.average_improvement_degree).toBe(-0.5);

    // 警告フラグの確認
    expect(result.departmental_report.has_warnings).toBe(true);
  });
});