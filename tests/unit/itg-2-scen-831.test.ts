import { calculateDivergencePriorityScore } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  // SCEN-831: [normal] 乖離根拠の検証優先度自動付与 - 許容範囲内の乖離に検証優先度『低』が付与される
  test('許容範囲内の乖離データに対して検証優先度「低」が自動付与される', () => {
    // 前提: 査定品質管理・標準化システムにログイン済み
    // トリガー: 許容範囲内の乖離データ（基準査定額との差異が±5%以内）を入力
    
    const divergence_data = {
      case_id: 'CASE-2024-001',
      estimated_amount: 1000000,
      base_estimated_amount: 1000000,
      divergence_rate_percent: 3.5,
      divergence_amount_yen: 35000,
      reference_data_count: 12,
      applicable_adjustment_factor: 1.02,
      divergence_reason: '地域別単価差異による軽微な乖離',
      assessment_date: '2024-01-15',
      tolerance_threshold_lower_percent: -5.0,
      tolerance_threshold_upper_percent: 5.0
    };

    // 期待結果: 乖離率が許容範囲内（±5%以内）であるため、検証優先度『低』が付与される
    const result = calculateDivergencePriorityScore(divergence_data);

    // 検証1: 返り値が正しい優先度スコアオブジェクトであること
    expect(result).toHaveProperty('priority_level');
    expect(result).toHaveProperty('priority_score');
    expect(result).toHaveProperty('rationale');

    // 検証2: 優先度レベルが『低』であること（structured.formula に基づく具体値）
    // 乖離率 3.5% は許容範囲（-5% ～ +5%）内であるため priority_level = 'LOW'
    expect(result.priority_level).toBe('LOW');

    // 検証3: 優先度スコアが『低』範囲の具体値であること
    // structured.formula: 優先度スコア = (|乖離率|/許容上限幅) × 100
    // = (3.5 / 5.0) × 100 = 70 (許容範囲内なので [0-40] 範囲に再スコアリング)
    // 許容範囲内：スコア 0-40、許容範囲外：スコア 41-100
    // 3.5% は許容内なので: スコア = (3.5/5.0) × 40 = 28
    expect(result.priority_score).toBe(28);

    // 検証4: 乖離率が許容範囲内であることを確認し、『低』判定の根拠が記録されていること
    expect(result.rationale).toContain('許容範囲内');
    expect(result.rationale).toContain('±5%');

    // 検証5: データベース記録用のフィールドが含まれていること
    expect(result).toHaveProperty('recorded_at');
    expect(result.recorded_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 検証6: ケース ID とトレーサビリティ情報が記録されていること
    expect(result).toHaveProperty('case_id');
    expect(result.case_id).toBe('CASE-2024-001');

    // 検証7: 乖離の詳細情報がすべて保持されていること
    expect(result).toHaveProperty('divergence_rate_percent');
    expect(result.divergence_rate_percent).toBe(3.5);

    // 検証8: 最終的な優先度判定ステータスが『LOW』で確定していることを確認
    expect(result.priority_level).toEqual('LOW');
    expect(typeof result.priority_score).toBe('number');
    expect(result.priority_score).toBeGreaterThanOrEqual(0);
    expect(result.priority_score).toBeLessThanOrEqual(40);
  });
});