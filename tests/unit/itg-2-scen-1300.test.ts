import { classifyIncidentSeverity } from '../../src/logic/it-6-2-2-1';

describe('インシデント重大度自動分類と対応優先度決定', () => {
  // SCEN-1300
  test('継続時間が0分（即座に復旧）のインシデントは「Low」に分類される', () => {
    const incident_data = {
      incident_id: 'INC-2024-0001',
      impact_scope: 'OCR_READ_FAILURE',
      duration_minutes: 0,
      affected_user_count: 0,
      affected_estimate_count: 0,
      recovery_time_minutes: 0,
      detected_timestamp: new Date('2024-01-15T10:00:00Z'),
      resolved_timestamp: new Date('2024-01-15T10:00:00Z'),
    };

    const result = classifyIncidentSeverity(incident_data);

    expect(result.severity_level).toBe('Low');
    expect(result.priority_rank).toBe(4);
    expect(result.response_sla_hours).toBe(24);
    expect(result.classification_basis).toEqual({
      duration_factor: 'immediate_recovery',
      impact_factor: 'none',
      severity_score: 10,
    });
  });
});