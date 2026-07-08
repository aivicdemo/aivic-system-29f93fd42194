import { calculatePriorityScoreForLearningDataUpdate } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1525: [error] 学習データ更新・再学習実行スケジュール自動生成機能 - 乖離パターンの重要度が不明確な場合に優先度決定に失敗する
  test('should fail with error when divergence pattern has undefined importance', () => {
    const divergencePatterns = [
      {
        region_code: 'REGION_001',
        construction_type: 'TYPE_A',
        season_code: 'SEASON_SPRING',
        divergence_rate: 8.5,
        divergence_amount: 125000,
        importance: undefined,
        impact_score: 75,
        implementation_difficulty: 45
      }
    ];

    expect(() =>
      calculatePriorityScoreForLearningDataUpdate(divergencePatterns)
    ).toThrow(/重要度/);
  });

  test('should fail with error when divergence pattern has null importance', () => {
    const divergencePatterns = [
      {
        region_code: 'REGION_002',
        construction_type: 'TYPE_B',
        season_code: 'SEASON_SUMMER',
        divergence_rate: 12.3,
        divergence_amount: 185000,
        importance: null,
        impact_score: 82,
        implementation_difficulty: 58
      }
    ];

    expect(() =>
      calculatePriorityScoreForLearningDataUpdate(divergencePatterns)
    ).toThrow(/重要度/);
  });

  test('should fail with error when mixed dataset contains pattern with missing importance', () => {
    const divergencePatterns = [
      {
        region_code: 'REGION_003',
        construction_type: 'TYPE_C',
        season_code: 'SEASON_AUTUMN',
        divergence_rate: 5.2,
        divergence_amount: 98000,
        importance: 85,
        impact_score: 88,
        implementation_difficulty: 35
      },
      {
        region_code: 'REGION_004',
        construction_type: 'TYPE_D',
        season_code: 'SEASON_WINTER',
        divergence_rate: 15.8,
        divergence_amount: 245000,
        importance: undefined,
        impact_score: 91,
        implementation_difficulty: 62
      }
    ];

    expect(() =>
      calculatePriorityScoreForLearningDataUpdate(divergencePatterns)
    ).toThrow(/重要度/);
  });

  test('should calculate correct priority scores when all patterns have valid importance', () => {
    const divergencePatterns = [
      {
        region_code: 'REGION_005',
        construction_type: 'TYPE_E',
        season_code: 'SEASON_SPRING',
        divergence_rate: 7.5,
        divergence_amount: 112000,
        importance: 90,
        impact_score: 85,
        implementation_difficulty: 40
      },
      {
        region_code: 'REGION_006',
        construction_type: 'TYPE_F',
        season_code: 'SEASON_SUMMER',
        divergence_rate: 11.2,
        divergence_amount: 167000,
        importance: 78,
        impact_score: 72,
        implementation_difficulty: 55
      },
      {
        region_code: 'REGION_007',
        construction_type: 'TYPE_G',
        season_code: 'SEASON_AUTUMN',
        divergence_rate: 6.8,
        divergence_amount: 102000,
        importance: 65,
        impact_score: 68,
        implementation_difficulty: 48
      }
    ];

    const result = calculatePriorityScoreForLearningDataUpdate(divergencePatterns);

    expect(result).toEqual({
      status: 'success',
      schedule_generation_status: 'proceeding',
      priority_patterns: [
        {
          region_code: 'REGION_005',
          construction_type: 'TYPE_E',
          season_code: 'SEASON_SPRING',
          importance: 90,
          impact_score: 85,
          implementation_difficulty: 40,
          priority_score: 76.5
        },
        {
          region_code: 'REGION_006',
          construction_type: 'TYPE_F',
          season_code: 'SEASON_SUMMER',
          importance: 78,
          impact_score: 72,
          implementation_difficulty: 55,
          priority_score: 63.2
        },
        {
          region_code: 'REGION_007',
          construction_type: 'TYPE_G',
          season_code: 'SEASON_AUTUMN',
          importance: 65,
          impact_score: 68,
          implementation_difficulty: 48,
          priority_score: 54.6
        }
      ],
      total_patterns_processed: 3,
      failed_pattern_count: 0
    });
  });

  test('should fail with error when importance value is empty string', () => {
    const divergencePatterns = [
      {
        region_code: 'REGION_008',
        construction_type: 'TYPE_H',
        season_code: 'SEASON_WINTER',
        divergence_rate: 9.1,
        divergence_amount: 136000,
        importance: '',
        impact_score: 79,
        implementation_difficulty: 51
      }
    ];

    expect(() =>
      calculatePriorityScoreForLearningDataUpdate(divergencePatterns)
    ).toThrow(/重要度/);
  });

  test('should abort schedule generation and return error response when importance is undefined', () => {
    const divergencePatterns = [
      {
        region_code: 'REGION_009',
        construction_type: 'TYPE_I',
        season_code: 'SEASON_SPRING',
        divergence_rate: 13.4,
        divergence_amount: 201000,
        importance: undefined,
        impact_score: 86,
        implementation_difficulty: 59
      }
    ];

    expect(() =>
      calculatePriorityScoreForLearningDataUpdate(divergencePatterns)
    ).toThrow(/重要度/);
  });

  test('should process multiple valid patterns and generate ranked schedule', () => {
    const divergencePatterns = [
      {
        region_code: 'REGION_010',
        construction_type: 'TYPE_J',
        season_code: 'SEASON_SUMMER',
        divergence_rate: 4.2,
        divergence_amount: 63000,
        importance: 72,
        impact_score: 65,
        implementation_difficulty: 32
      },
      {
        region_code: 'REGION_011',
        construction_type: 'TYPE_K',
        season_code: 'SEASON_AUTUMN',
        divergence_rate: 10.5,
        divergence_amount: 157500,
        importance: 88,
        impact_score: 81,
        implementation_difficulty: 61
      },
      {
        region_code: 'REGION_012',
        construction_type: 'TYPE_L',
        season_code: 'SEASON_WINTER',
        divergence_rate: 8.9,
        divergence_amount: 133500,
        importance: 82,
        impact_score: 77,
        implementation_difficulty: 46
      }
    ];

    const result = calculatePriorityScoreForLearningDataUpdate(divergencePatterns);

    expect(result.status).toBe('success');
    expect(result.schedule_generation_status).toBe('proceeding');
    expect(result.total_patterns_processed).toBe(3);
    expect(result.failed_pattern_count).toBe(0);
    expect(result.priority_patterns.length).toBe(3);
    expect(result.priority_patterns[0].priority_score).toBeGreaterThan(
      result.priority_patterns[1].priority_score
    );
    expect(result.priority_patterns[1].priority_score).toBeGreaterThan(
      result.priority_patterns[2].priority_score
    );
  });
});