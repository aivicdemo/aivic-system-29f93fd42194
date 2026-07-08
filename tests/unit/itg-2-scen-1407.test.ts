import { determineReadErrorPriority } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1407: 深刻度と影響範囲が同等の場合、先発生時刻順で優先度が決定される', () => {
    const read_error_1 = {
      error_id: 'ERR001',
      severity: 'HIGH',
      impact_scope: 'SYSTEM_WIDE',
      occurrence_timestamp: new Date('2024-01-01T10:00:00Z'),
      affected_item_count: 5,
    };

    const read_error_2 = {
      error_id: 'ERR002',
      severity: 'HIGH',
      impact_scope: 'SYSTEM_WIDE',
      occurrence_timestamp: new Date('2024-01-01T10:05:00Z'),
      affected_item_count: 5,
    };

    const read_error_3 = {
      error_id: 'ERR003',
      severity: 'HIGH',
      impact_scope: 'SYSTEM_WIDE',
      occurrence_timestamp: new Date('2024-01-01T10:10:00Z'),
      affected_item_count: 5,
    };

    const read_errors = [read_error_1, read_error_2, read_error_3];

    const priority_result = determineReadErrorPriority(read_errors);

    expect(priority_result).toEqual([
      {
        error_id: 'ERR001',
        priority_rank: 1,
        priority_score: 100,
      },
      {
        error_id: 'ERR002',
        priority_rank: 2,
        priority_score: 66,
      },
      {
        error_id: 'ERR003',
        priority_rank: 3,
        priority_score: 33,
      },
    ]);

    expect(priority_result[0].priority_rank).toBe(1);
    expect(priority_result[1].priority_rank).toBe(2);
    expect(priority_result[2].priority_rank).toBe(3);

    expect(priority_result[0].priority_score).toBe(100);
    expect(priority_result[1].priority_score).toBe(66);
    expect(priority_result[2].priority_score).toBe(33);

    expect(priority_result[0].error_id).toBe('ERR001');
    expect(priority_result[1].error_id).toBe('ERR002');
    expect(priority_result[2].error_id).toBe('ERR003');
  });
});