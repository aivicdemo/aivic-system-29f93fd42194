import { classifyIncidentSeverity, determineResponsePriority } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1302: インシデント重大度自動分類と対応優先度決定 - 全ユーザー影響・4時間以上継続のインシデントはCriticalに分類される', () => {
    // テストデータ準備: 全ユーザー影響かつ継続時間4時間以上のインシデント
    const incident_data = {
      incident_id: 'INC-20250526-001',
      start_time: new Date('2025-05-26T08:00:00Z'),
      end_time: new Date('2025-05-26T12:30:00Z'),
      affected_user_count: 150,
      total_user_count: 150,
      impact_scope: 'all_users',
      duration_minutes: 270
    };

    // インシデント重大度自動分類機能に入力
    const severity_classification_result = classifyIncidentSeverity({
      affected_user_count: incident_data.affected_user_count,
      total_user_count: incident_data.total_user_count,
      duration_minutes: incident_data.duration_minutes,
      impact_scope: incident_data.impact_scope
    });

    // 分類結果の重大度レベルを取得
    expect(severity_classification_result.severity_level).toBe('Critical');
    expect(severity_classification_result.is_all_users_affected).toBe(true);
    expect(severity_classification_result.meets_duration_threshold).toBe(true);

    // 対応優先度決定機能により優先度が決定されることを確認
    const priority_determination_result = determineResponsePriority({
      severity_level: severity_classification_result.severity_level,
      affected_user_count: incident_data.affected_user_count,
      total_user_count: incident_data.total_user_count,
      duration_minutes: incident_data.duration_minutes
    });

    // 決定された対応優先度を取得
    expect(priority_determination_result.response_priority_level).toBe(1);
    expect(priority_determination_result.priority_rank).toBe('最優先');
    expect(priority_determination_result.recommended_action).toBeDefined();
    expect(priority_determination_result.sla_minutes).toBe(30);
  });
});