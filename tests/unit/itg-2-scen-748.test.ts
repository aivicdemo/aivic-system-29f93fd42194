import { recordAuditTrail } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-748: 修正履歴が空のとき修正履歴フィールドは空値で記録される', () => {
    const assessment_id = 'ASS-20240115-001';
    const assessor_id = 'ASSR-12345';
    const assessment_date = new Date('2024-01-15T11:00:00Z');
    const judgment_result = '承認';
    const deviation_rate = 5.2;
    const deviation_amount = 52000;
    const reference_data_count = 8;
    const correction_coefficient = 1.0;
    const correction_history = null;
    const applied_logic_id = 'LOGIC-001';
    const recorded_at = new Date('2024-01-15T11:00:00Z');

    const result = recordAuditTrail({
      assessment_id,
      assessor_id,
      assessment_date,
      judgment_result,
      deviation_rate,
      deviation_amount,
      reference_data_count,
      correction_coefficient,
      correction_history,
      applied_logic_id,
      recorded_at,
    });

    expect(result.success).toBe(true);
    expect(result.audit_trail_id).toBeDefined();
    expect(typeof result.audit_trail_id).toBe('string');
    expect(result.recorded_correction_history).toBe(null);
    expect(result.error).toBeUndefined();
  });
});