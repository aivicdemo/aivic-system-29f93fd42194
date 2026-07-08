import { classifyIncidentSeverity } from '../../src/logic/it-6-2-2-1';

describe('インシデント重大度自動分類と対応優先度決定', () => {
  test('SCEN-1299: インシデント重大度を影響範囲・継続時間・ユーザー影響度から自動分類し対応優先度を決定', () => {
    // Critical: 影響範囲「全社」、継続時間「24時間以上」、ユーザー影響度「1000人以上」
    const critical_input = {
      impact_scope: '全社',
      duration_minutes: 1440,
      affected_user_count: 1500
    };
    const critical_result = classifyIncidentSeverity(critical_input);
    expect(critical_result.severity_level).toBe('Critical');
    expect(critical_result.priority_order).toBe(1);
    expect(critical_result.response_required_hours).toBe(1);

    // High: 影響範囲「部門」、継続時間「1～8時間」、ユーザー影響度「100～999人」
    const high_input = {
      impact_scope: '部門',
      duration_minutes: 300,
      affected_user_count: 500
    };
    const high_result = classifyIncidentSeverity(high_input);
    expect(high_result.severity_level).toBe('High');
    expect(high_result.priority_order).toBe(2);
    expect(high_result.response_required_hours).toBe(4);

    // Medium: 影響範囲「グループ」、継続時間「1時間未満」、ユーザー影響度「10～99人」
    const medium_input = {
      impact_scope: 'グループ',
      duration_minutes: 45,
      affected_user_count: 50
    };
    const medium_result = classifyIncidentSeverity(medium_input);
    expect(medium_result.severity_level).toBe('Medium');
    expect(medium_result.priority_order).toBe(3);
    expect(medium_result.response_required_hours).toBe(8);

    // Low: 影響範囲「個人」、継続時間「15分未満」、ユーザー影響度「1～9人」
    const low_input = {
      impact_scope: '個人',
      duration_minutes: 10,
      affected_user_count: 5
    };
    const low_result = classifyIncidentSeverity(low_input);
    expect(low_result.severity_level).toBe('Low');
    expect(low_result.priority_order).toBe(4);
    expect(low_result.response_required_hours).toBe(24);

    // 境界値テスト: Critical と High の境界（継続時間 24 時間）
    const boundary_duration_input = {
      impact_scope: '全社',
      duration_minutes: 1440,
      affected_user_count: 1000
    };
    const boundary_duration_result = classifyIncidentSeverity(boundary_duration_input);
    expect(boundary_duration_result.severity_level).toBe('Critical');

    // 境界値テスト: High と Medium の境界（ユーザー影響度 100 人）
    const boundary_user_input = {
      impact_scope: '部門',
      duration_minutes: 240,
      affected_user_count: 100
    };
    const boundary_user_result = classifyIncidentSeverity(boundary_user_input);
    expect(boundary_user_result.severity_level).toBe('High');

    // 境界値テスト: Medium と Low の境界（ユーザー影響度 10 人）
    const boundary_low_input = {
      impact_scope: 'グループ',
      duration_minutes: 30,
      affected_user_count: 10
    };
    const boundary_low_result = classifyIncidentSeverity(boundary_low_input);
    expect(boundary_low_result.severity_level).toBe('Medium');

    // エラーケース: 無効な影響範囲
    expect(() => {
      classifyIncidentSeverity({
        impact_scope: '無効',
        duration_minutes: 100,
        affected_user_count: 50
      });
    }).toThrow(/影響範囲/);

    // エラーケース: 負の継続時間
    expect(() => {
      classifyIncidentSeverity({
        impact_scope: '全社',
        duration_minutes: -100,
        affected_user_count: 500
      });
    }).toThrow(/継続時間/);

    // エラーケース: 負のユーザー影響度
    expect(() => {
      classifyIncidentSeverity({
        impact_scope: '部門',
        duration_minutes: 100,
        affected_user_count: -10
      });
    }).toThrow(/ユーザー影響度/);
  });
});