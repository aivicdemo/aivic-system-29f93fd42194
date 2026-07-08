import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { getImprovementThemesForAuditor } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1078
  test('改善テーマが優先度の高い順でソートされ、同一優先度では登録日時の新しい順で表示される', () => {
    // 前提: 複数の改善テーマが登録されている状態
    // トリガー: 改善テーマ一覧を表示・ソートする
    // 結果: 優先度の高い順（高→中→低）、同一優先度は登録日時の新しい順でソート

    const improvementThemesInput = [
      {
        themeId: 'theme_001',
        themeName: '地域別データ不足対応',
        priority: 'medium',
        createdAt: '2024-01-10T09:00:00Z',
        auditorId: 'auditor_A',
        auditorName: '新人査定員',
      },
      {
        themeId: 'theme_002',
        themeName: '季節変動補正係数調整',
        priority: 'high',
        createdAt: '2024-01-15T14:30:00Z',
        auditorId: 'auditor_B',
        auditorName: '経験者査定員',
      },
      {
        themeId: 'theme_003',
        themeName: '工種別判定ロジック統一',
        priority: 'low',
        createdAt: '2024-01-12T10:15:00Z',
        auditorId: 'auditor_C',
        auditorName: '中堅査定員',
      },
      {
        themeId: 'theme_004',
        themeName: '金額帯別判定基準明確化',
        priority: 'high',
        createdAt: '2024-01-14T11:45:00Z',
        auditorId: 'auditor_A',
        auditorName: '新人査定員',
      },
      {
        themeId: 'theme_005',
        themeName: '相場乖離率許容値検証',
        priority: 'medium',
        createdAt: '2024-01-16T15:20:00Z',
        auditorId: 'auditor_D',
        auditorName: '査定部署長',
      },
    ];

    // 期待結果:
    // 優先度high（theme_002: 2024-01-15, theme_004: 2024-01-14）
    //  → theme_002が先（新しい）
    // 優先度medium（theme_001: 2024-01-10, theme_005: 2024-01-16）
    //  → theme_005が先（新しい）
    // 優先度low（theme_003: 2024-01-12）
    //  → theme_003

    const result = getImprovementThemesForAuditor(improvementThemesInput);

    expect(result).toEqual([
      {
        themeId: 'theme_002',
        themeName: '季節変動補正係数調整',
        priority: 'high',
        createdAt: '2024-01-15T14:30:00Z',
        auditorId: 'auditor_B',
        auditorName: '経験者査定員',
      },
      {
        themeId: 'theme_004',
        themeName: '金額帯別判定基準明確化',
        priority: 'high',
        createdAt: '2024-01-14T11:45:00Z',
        auditorId: 'auditor_A',
        auditorName: '新人査定員',
      },
      {
        themeId: 'theme_005',
        themeName: '相場乖離率許容値検証',
        priority: 'medium',
        createdAt: '2024-01-16T15:20:00Z',
        auditorId: 'auditor_D',
        auditorName: '査定部署長',
      },
      {
        themeId: 'theme_001',
        themeName: '地域別データ不足対応',
        priority: 'medium',
        createdAt: '2024-01-10T09:00:00Z',
        auditorId: 'auditor_A',
        auditorName: '新人査定員',
      },
      {
        themeId: 'theme_003',
        themeName: '工種別判定ロジック統一',
        priority: 'low',
        createdAt: '2024-01-12T10:15:00Z',
        auditorId: 'auditor_C',
        auditorName: '中堅査定員',
      },
    ]);

    // 詳細検証: ソート順序の正確性
    expect(result[0].priority).toBe('high');
    expect(result[0].createdAt).toBe('2024-01-15T14:30:00Z');
    expect(result[1].priority).toBe('high');
    expect(result[1].createdAt).toBe('2024-01-14T11:45:00Z');
    expect(result[2].priority).toBe('medium');
    expect(result[2].createdAt).toBe('2024-01-16T15:20:00Z');
    expect(result[3].priority).toBe('medium');
    expect(result[3].createdAt).toBe('2024-01-10T09:00:00Z');
    expect(result[4].priority).toBe('low');

    // 優先度順が正しいことを確認
    const priorityOrder = result.map((theme) => theme.priority);
    expect(priorityOrder).toEqual(['high', 'high', 'medium', 'medium', 'low']);

    // 同一優先度内で登録日時が新しい順であることを確認
    const highPriorityThemes = result.filter((t) => t.priority === 'high');
    expect(new Date(highPriorityThemes[0].createdAt).getTime()).toBeGreaterThan(
      new Date(highPriorityThemes[1].createdAt).getTime()
    );

    const mediumPriorityThemes = result.filter((t) => t.priority === 'medium');
    expect(new Date(mediumPriorityThemes[0].createdAt).getTime()).toBeGreaterThan(
      new Date(mediumPriorityThemes[1].createdAt).getTime()
    );
  });
});