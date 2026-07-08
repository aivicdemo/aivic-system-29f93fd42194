import { classifyIncidentSeverity } from '../../src/logic/it-6-2-2-1';

describe('インシデント重大度自動分類と対応優先度決定', () => {
  test('SCEN-1301: 影響範囲がNullの場合、エラーを返す', () => {
    const incidentData = {
      incident_id: 'INC-2024-001',
      occurrence_datetime: new Date('2024-01-15T10:30:00Z'),
      category: 'システム障害',
      impact_duration_minutes: 120,
      affected_users_count: 500,
      scope: null,
      description: 'データベース接続タイムアウト'
    };

    expect(() => classifyIncidentSeverity(incidentData)).toThrow(/影響範囲/);
  });
});