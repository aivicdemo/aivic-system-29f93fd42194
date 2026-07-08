import { aggregateJudgmentAccuracy } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1047: [normal] 判定根拠表示・ダッシュボード統合機能
  test('AI自動判定結果に対して過去案件・物価本・相場データの照合結果が一元表示される', () => {
    // Arrange: テスト用の判定結果データセット
    const assessor_1_construction_type_A_amount_band_1_results = [
      {
        case_id: 'CASE-001',
        assessor_id: 'A001',
        construction_type: 'A',
        amount_band: '1',
        quote_amount: 1000000,
        judgment_amount: 950000,
        deviation_rate: -5.0,
        deviation_amount: -50000,
        past_case_count: 12,
        material_book_source: 'materialbookV2024',
        market_data_source: 'marketdataQ1',
        correction_coefficient: 0.98,
        judgment_timestamp: '2024-01-15T10:30:00Z',
        judgment_basis: 'past_case',
      },
      {
        case_id: 'CASE-002',
        assessor_id: 'A001',
        construction_type: 'A',
        amount_band: '1',
        quote_amount: 1100000,
        judgment_amount: 1080000,
        deviation_rate: -1.82,
        deviation_amount: -20000,
        past_case_count: 15,
        material_book_source: 'materialbookV2024',
        market_data_source: 'marketdataQ1',
        correction_coefficient: 0.98,
        judgment_timestamp: '2024-01-15T11:00:00Z',
        judgment_basis: 'material_book',
      },
      {
        case_id: 'CASE-003',
        assessor_id: 'A001',
        construction_type: 'A',
        amount_band: '1',
        quote_amount: 950000,
        judgment_amount: 970000,
        deviation_rate: 2.11,
        deviation_amount: 20000,
        past_case_count: 10,
        material_book_source: 'materialbookV2024',
        market_data_source: 'marketdataQ1',
        correction_coefficient: 0.98,
        judgment_timestamp: '2024-01-15T11:30:00Z',
        judgment_basis: 'market_data',
      },
    ];

    const assessor_2_construction_type_B_amount_band_2_results = [
      {
        case_id: 'CASE-004',
        assessor_id: 'B002',
        construction_type: 'B',
        amount_band: '2',
        quote_amount: 2500000,
        judgment_amount: 2450000,
        deviation_rate: -2.0,
        deviation_amount: -50000,
        past_case_count: 8,
        material_book_source: 'materialbookV2024',
        market_data_source: 'marketdataQ1',
        correction_coefficient: 1.02,
        judgment_timestamp: '2024-01-15T12:00:00Z',
        judgment_basis: 'past_case',
      },
      {
        case_id: 'CASE-005',
        assessor_id: 'B002',
        construction_type: 'B',
        amount_band: '2',
        quote_amount: 2600000,
        judgment_amount: 2620000,
        deviation_rate: 0.77,
        deviation_amount: 20000,
        past_case_count: 6,
        material_book_source: 'materialbookV2024',
        market_data_source: 'marketdataQ1',
        correction_coefficient: 1.02,
        judgment_timestamp: '2024-01-15T12:30:00Z',
        judgment_basis: 'material_book',
      },
    ];

    const combined_results = [
      ...assessor_1_construction_type_A_amount_band_1_results,
      ...assessor_2_construction_type_B_amount_band_2_results,
    ];

    // Act: 判定精度指標を集計
    const aggregated_result = aggregateJudgmentAccuracy(combined_results);

    // Assert: ダッシュボード統合画面に一元表示される判定根拠データの検証

    // 1. 全体集計の検証: 5件のケースから平均乖離率を算出
    // 平均乖離率 = ((-5.0) + (-1.82) + 2.11 + (-2.0) + 0.77) / 5 = -6.94 / 5 = -1.388
    expect(aggregated_result.overall_average_deviation_rate).toBe(-1.388);

    // 2. 査定担当者別の精度指標検証
    // 査定員A001: 3件、平均乖離率 = ((-5.0) + (-1.82) + 2.11) / 3 = -4.71 / 3 = -1.57
    expect(aggregated_result.by_assessor).toHaveProperty('A001');
    expect(aggregated_result.by_assessor.A001.average_deviation_rate).toBe(-1.57);
    expect(aggregated_result.by_assessor.A001.case_count).toBe(3);
    expect(aggregated_result.by_assessor.A001.average_past_case_reference_count).toBe(
      (12 + 15 + 10) / 3
    );
    expect(aggregated_result.by_assessor.A001.average_deviation_amount).toBe(-16666.67);

    // 査定員B002: 2件、平均乖離率 = ((-2.0) + 0.77) / 2 = -1.23 / 2 = -0.615
    expect(aggregated_result.by_assessor).toHaveProperty('B002');
    expect(aggregated_result.by_assessor.B002.average_deviation_rate).toBe(-0.615);
    expect(aggregated_result.by_assessor.B002.case_count).toBe(2);
    expect(aggregated_result.by_assessor.B002.average_past_case_reference_count).toBe(7);
    expect(aggregated_result.by_assessor.B002.average_deviation_amount).toBe(-15000);

    // 3. 工種別の精度指標検証
    // 工種A: 3件、平均乖離率 = -1.57
    expect(aggregated_result.by_construction_type).toHaveProperty('A');
    expect(aggregated_result.by_construction_type.A.average_deviation_rate).toBe(-1.57);
    expect(aggregated_result.by_construction_type.A.case_count).toBe(3);

    // 工種B: 2件、平均乖離率 = -0.615
    expect(aggregated_result.by_construction_type).toHaveProperty('B');
    expect(aggregated_result.by_construction_type.B.average_deviation_rate).toBe(-0.615);
    expect(aggregated_result.by_construction_type.B.case_count).toBe(2);

    // 4. 金額帯別の精度指標検証
    // 金額帯1: 3件、平均乖離率 = -1.57
    expect(aggregated_result.by_amount_band).toHaveProperty('1');
    expect(aggregated_result.by_amount_band['1'].average_deviation_rate).toBe(-1.57);
    expect(aggregated_result.by_amount_band['1'].case_count).toBe(3);
    expect(aggregated_result.by_amount_band['1'].average_quote_amount).toBe(
      (1000000 + 1100000 + 950000) / 3
    );

    // 金額帯2: 2件、平均乖離率 = -0.615
    expect(aggregated_result.by_amount_band).toHaveProperty('2');
    expect(aggregated_result.by_amount_band['2'].average_deviation_rate).toBe(-0.615);
    expect(aggregated_result.by_amount_band['2'].case_count).toBe(2);
    expect(aggregated_result.by_amount_band['2'].average_quote_amount).toBe(
      (2500000 + 2600000) / 2
    );

    // 5. 照合根拠の多重ソース表示検証（ダッシュボード一元表示）
    expect(aggregated_result.reference_sources).toEqual({
      past_case_count: 5,
      material_book_references: 5,
      market_data_references: 5,
    });

    // 6. 補正係数の適用状況検証
    expect(aggregated_result.by_assessor.A001.average_correction_coefficient).toBe(0.98);
    expect(aggregated_result.by_assessor.B002.average_correction_coefficient).toBe(1.02);

    // 7. 判定根拠別の分布検証（複数案件比較表示）
    expect(aggregated_result.judgment_basis_distribution).toEqual({
      past_case: 2,
      material_book: 2,
      market_data: 1,
    });

    // 8. ダッシュボード用の要約統計量検証
    expect(aggregated_result.dashboard_summary).toEqual({
      total_cases: 5,
      average_deviation_rate: -1.388,
      average_deviation_amount: -16000,
      assessor_count: 2,
      construction_type_count: 2,
      amount_band_count: 2,
      accuracy_grade:
        aggregated_result.dashboard_summary.average_deviation_rate <= -1.388 &&
        aggregated_result.dashboard_summary.average_deviation_rate >= -2.0
          ? 'B'
          : 'C',
    });

    // 9. 詳細情報へのドリルダウン検証（各ケース詳細の正確性）
    const detailed_case_001 = aggregated_result.case_details.find(
      (c) => c.case_id === 'CASE-001'
    );
    expect(detailed_case_001).toEqual({
      case_id: 'CASE-001',
      assessor_id: 'A001',
      construction_type: 'A',
      amount_band: '1',
      quote_amount: 1000000,
      judgment_amount: 950000,
      deviation_rate: -5.0,
      deviation_amount: -50000,
      past_case_reference_count: 12,
      material_book_source: 'materialbookV2024',
      market_data_source: 'marketdataQ1',
      correction_coefficient: 0.98,
      judgment_timestamp: '2024-01-15T10:30:00Z',
      judgment_basis: 'past_case',
      reference_data_credibility: 'high',
    });

    const detailed_case_005 = aggregated_result.case_details.find(
      (c) => c.case_id === 'CASE-005'
    );
    expect(detailed_case_005).toEqual({
      case_id: 'CASE-005',
      assessor_id: 'B002',
      construction_type: 'B',
      amount_band: '2',
      quote_amount: 2600000,
      judgment_amount: 2620000,
      deviation_rate: 0.77,
      deviation_amount: 20000,
      past_case_reference_count: 6,
      material_book_source: 'materialbookV2024',
      market_data_source: 'marketdataQ1',
      correction_coefficient: 1.02,
      judgment_timestamp: '2024-01-15T12:30:00Z',
      judgment_basis: 'material_book',
      reference_data_credibility: 'medium',
    });

    // 10. ダッシュボード統合表示の複数案件比較機能検証
    expect(aggregated_result.case_details).toHaveLength(5);
    expect(aggregated_result.case_details.map((c) => c.case_id)).toEqual([
      'CASE-001',
      'CASE-002',
      'CASE-003',
      'CASE-004',
      'CASE-005',
    ]);

    // 11. 一元表示データの構造整合性検証
    expect(aggregated_result).toHaveProperty('by_assessor');
    expect(aggregated_result).toHaveProperty('by_construction_type');
    expect(aggregated_result).toHaveProperty('by_amount_band');
    expect(aggregated_result).toHaveProperty('reference_sources');
    expect(aggregated_result).toHaveProperty('judgment_basis_distribution');
    expect(aggregated_result).toHaveProperty('dashboard_summary');
    expect(aggregated_result).toHaveProperty('case_details');

    // 12. ダッシュボード表示用の可視化データ正当性検証
    expect(aggregated_result.dashboard_summary.total_cases).toBe(5);
    expect(aggregated_result.dashboard_summary.assessor_count).toBe(2);
    expect(aggregated_result.dashboard_summary.construction_type_count).toBe(2);
    expect(aggregated_result.dashboard_summary.amount_band_count).toBe(2);
  });
});