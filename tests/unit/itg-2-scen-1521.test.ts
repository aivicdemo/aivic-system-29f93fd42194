import { analyzeDeviationPatternAndDecidePriority } from '../../src/logic/it-6-2-2-2';

describe('乖離パターン分析・改善サイクル自動化機能', () => {
  // SCEN-1521: [normal] 乖離パターン分析・改善サイクル自動化機能 - 地域別・工事種別・時期別に特定された乖離パターンから改善優先度を正しく決定できる
  test('地域別・工事種別・時期別の乖離パターンから総合的に改善優先度を決定する', () => {
    // テストデータ: 複数の地域別乖離パターン
    const geographicPatterns = [
      { region: '北海道', deviationType: '過大評価', deviationRate: 5.0, frequency: 12 },
      { region: '関東', deviationType: '過小評価', deviationRate: -3.0, frequency: 8 }
    ];

    // テストデータ: 複数の工事種別乖離パターン
    const constructionTypePatterns = [
      { constructionType: 'リフォーム', deviationType: '過大評価', deviationRate: 7.0, frequency: 15 },
      { constructionType: '新築', deviationType: '過小評価', deviationRate: -2.0, frequency: 5 }
    ];

    // テストデータ: 複数の時期別乖離パターン
    const seasonalPatterns = [
      { season: '春季', deviationType: '過大評価', deviationRate: 4.0, frequency: 9 },
      { season: '冬季', deviationType: '過小評価', deviationRate: -6.0, frequency: 18 }
    ];

    // 乖離パターン分析機能を実行
    const result = analyzeDeviationPatternAndDecidePriority({
      geographicPatterns,
      constructionTypePatterns,
      seasonalPatterns
    });

    // 期待結果 1: 改善優先度が決定されている
    expect(result).toHaveProperty('priorityDecisions');
    expect(Array.isArray(result.priorityDecisions)).toBe(true);

    // 期待結果 2: 優先度1位（最優先）が乖離度最大の冬季過小評価（-6%）に設定されている
    const topPriority = result.priorityDecisions[0];
    expect(topPriority.pattern).toEqual({
      season: '冬季',
      deviationType: '過小評価',
      deviationRate: -6.0,
      frequency: 18
    });
    expect(topPriority.priorityRank).toBe(1);
    expect(topPriority.priorityScore).toBe(100); // 最大優先度スコア

    // 期待結果 3: 優先度スコアが乖離度、影響範囲、発生頻度を総合的に評価して計算されている
    // 冬季（-6% × 18件）の優先度スコア: 乖離度 6 × 影響係数 1.0 × 頻度係数 1.0 = 100
    const secondPriority = result.priorityDecisions[1];
    expect(secondPriority.pattern.constructionType).toBe('リフォーム');
    expect(secondPriority.priorityRank).toBe(2);
    // リフォーム（7% × 15件）の優先度スコア: 乖離度 7 × 影響係数 1.0 × 頻度係数 (15/18) = 58.33 ≈ 58
    expect(secondPriority.priorityScore).toBe(58);

    const thirdPriority = result.priorityDecisions[2];
    expect(thirdPriority.pattern.region).toBe('北海道');
    expect(thirdPriority.priorityRank).toBe(3);
    // 北海道（5% × 12件）の優先度スコア: 乖離度 5 × 影響係数 1.0 × 頻度係数 (12/18) = 33.33 ≈ 33
    expect(thirdPriority.priorityScore).toBe(33);

    // 期待結果 4: 優先度決定結果の詳細情報が正しく表示される
    expect(topPriority).toHaveProperty('region');
    expect(topPriority).toHaveProperty('constructionType');
    expect(topPriority).toHaveProperty('season');
    expect(topPriority).toHaveProperty('deviationType');
    expect(topPriority).toHaveProperty('deviationRate');
    expect(topPriority).toHaveProperty('frequency');
    expect(topPriority).toHaveProperty('priorityScore');
    expect(topPriority).toHaveProperty('improvementAction');

    // 期待結果 5: 改善推奨アクションが優先度に基づいて提示される
    expect(topPriority.improvementAction).toBeDefined();
    expect(typeof topPriority.improvementAction).toBe('string');
    expect(topPriority.improvementAction).toMatch(/冬季/);
    expect(topPriority.improvementAction).toMatch(/査定基準/);

    // 期待結果 6: 全優先度が優先度スコアの降順に並べられている
    for (let i = 0; i < result.priorityDecisions.length - 1; i++) {
      expect(result.priorityDecisions[i].priorityScore).toBeGreaterThanOrEqual(
        result.priorityDecisions[i + 1].priorityScore
      );
    }

    // 期待結果 7: 全パターン数が合計で4件（2地域 + 2工種 + 2時期）以上含まれている
    expect(result.priorityDecisions.length).toBeGreaterThanOrEqual(4);

    // 期待結果 8: 改善推奨アクションが優先度1位・2位・3位の順に詳細化されている
    expect(result.priorityDecisions[0].improvementAction.length).toBeGreaterThan(0);
    expect(result.priorityDecisions[1].improvementAction.length).toBeGreaterThan(0);
    expect(result.priorityDecisions[2].improvementAction.length).toBeGreaterThan(0);

    // 期待結果 9: 分析結果の要約情報が提供される
    expect(result).toHaveProperty('summary');
    expect(result.summary).toHaveProperty('totalPatterns');
    expect(result.summary.totalPatterns).toBe(6); // 2 + 2 + 2
    expect(result.summary).toHaveProperty('topPriorityPattern');
    expect(result.summary.topPriorityPattern).toBe('冬季 過小評価 -6.0%');
    expect(result.summary).toHaveProperty('analysisTimestamp');
  });
});