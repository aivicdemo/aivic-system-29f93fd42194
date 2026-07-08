import { determineLearningDataCorrectionScope } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  // SCEN-1415
  test('不整合な原因分析データ（矛盾する条件）が入力された場合、エラーが返される', () => {
    const contradictory_analysis_data = {
      assessment_amount_trend: ['up', 'down'],
      learning_data_category: 'past_case_data',
      affected_regions: ['Tokyo'],
      affected_construction_types: ['Excavation'],
      data_recency_issue: false,
      sample_size_insufficient: false,
      timestamp: new Date('2024-01-15T10:30:00Z'),
      analyst_id: 'USR001',
    };

    expect(() => determineLearningDataCorrectionScope(contradictory_analysis_data)).toThrow(/矛盾/);
  });
});