import { selectImprovementTargets } from "../../src/logic/it-1781935279444-2-1-1";

describe("改善項目の優先度判定・選別機能", () => {
  // SCEN-927
  test("月次手順書改善会議で記録された複数の例外ケースが優先度判定ルールに基づいて選別される", () => {
    const exceptionCases = [
      {
        id: "EXC-001",
        description: "請求額計算時に割引ルール適用漏れ",
        occurrenceFrequency: 3,
        businessImpactLevel: 8,
        resolutionDifficulty: 5,
        reportedAt: new Date("2024-01-15T10:30:00Z"),
      },
      {
        id: "EXC-002",
        description: "営業データ入力時の必須項目検証エラー",
        occurrenceFrequency: 12,
        businessImpactLevel: 7,
        resolutionDifficulty: 2,
        reportedAt: new Date("2024-01-14T14:00:00Z"),
      },
      {
        id: "EXC-003",
        description: "顧客別集計ルールの曖昧性",
        occurrenceFrequency: 2,
        businessImpactLevel: 9,
        resolutionDifficulty: 7,
        reportedAt: new Date("2024-01-13T09:15:00Z"),
      },
      {
        id: "EXC-004",
        description: "契約変更時の通知タイミング遅延",
        occurrenceFrequency: 1,
        businessImpactLevel: 6,
        resolutionDifficulty: 3,
        reportedAt: new Date("2024-01-12T16:45:00Z"),
      },
      {
        id: "EXC-005",
        description: "レポート生成時のデータ形式不一致",
        occurrenceFrequency: 5,
        businessImpactLevel: 5,
        resolutionDifficulty: 4,
        reportedAt: new Date("2024-01-11T11:20:00Z"),
      },
      {
        id: "EXC-006",
        description: "会計システム連携時のAPI失敗",
        occurrenceFrequency: 4,
        businessImpactLevel: 10,
        resolutionDifficulty: 6,
        reportedAt: new Date("2024-01-10T13:50:00Z"),
      },
    ];

    const priorityThreshold = 3;
    const maxSelectableCount = 5;

    const result = selectImprovementTargets({
      exceptionCases: exceptionCases,
      priorityThreshold: priorityThreshold,
      maxSelectableCount: maxSelectableCount,
    });

    // 優先度スコア計算式: (発生頻度 × 0.3 + 業務影響度 × 0.5 + (10 - 解決難度) × 0.2) × 10
    // EXC-001: (3 × 0.3 + 8 × 0.5 + 5 × 0.2) × 10 = (0.9 + 4.0 + 1.0) × 10 = 59
    // EXC-002: (12 × 0.3 + 7 × 0.5 + 8 × 0.2) × 10 = (3.6 + 3.5 + 1.6) × 10 = 87
    // EXC-003: (2 × 0.3 + 9 × 0.5 + 3 × 0.2) × 10 = (0.6 + 4.5 + 0.6) × 10 = 57
    // EXC-004: (1 × 0.3 + 6 × 0.5 + 7 × 0.2) × 10 = (0.3 + 3.0 + 1.4) × 10 = 47
    // EXC-005: (5 × 0.3 + 5 × 0.5 + 6 × 0.2) × 10 = (1.5 + 2.5 + 1.2) × 10 = 52
    // EXC-006: (4 × 0.3 + 10 × 0.5 + 4 × 0.2) × 10 = (1.2 + 5.0 + 1.6) × 10 = 78

    // 優先度が高い順（降順）: EXC-002(87) > EXC-006(78) > EXC-001(59) > EXC-003(57) > EXC-005(52) > EXC-004(47)
    // priorityThreshold=3 以上、maxSelectableCount=5 以内

    expect(result.selectedTargets).toHaveLength(5);

    expect(result.selectedTargets[0]).toEqual({
      id: "EXC-002",
      priorityScore: 87,
      reason: "発生頻度が高く、解決が容易なため即時改善対象",
    });

    expect(result.selectedTargets[1]).toEqual({
      id: "EXC-006",
      priorityScore: 78,
      reason: "業務影響度が最高で、重大な改善対象",
    });

    expect(result.selectedTargets[2]).toEqual({
      id: "EXC-001",
      priorityScore: 59,
      reason: "業務影響度と発生頻度のバランスが良い改善対象",
    });

    expect(result.selectedTargets[3]).toEqual({
      id: "EXC-003",
      priorityScore: 57,
      reason: "業務影響度が高いが解決難度が高い改善対象",
    });

    expect(result.selectedTargets[4]).toEqual({
      id: "EXC-005",
      priorityScore: 52,
      reason: "中程度の優先度で改善対象",
    });

    expect(result.notSelectedTargets).toHaveLength(1);
    expect(result.notSelectedTargets[0]).toEqual({
      id: "EXC-004",
      priorityScore: 47,
      reason: "優先度スコアが閾値以下のため非選別",
    });

    expect(result.totalEvaluatedCount).toBe(6);
    expect(result.selectionCriteria).toEqual({
      priorityThreshold: 3,
      maxSelectableCount: 5,
      priorityCalculationMethod:
        "(occurrenceFrequency * 0.3 + businessImpactLevel * 0.5 + (10 - resolutionDifficulty) * 0.2) * 10",
    });

    // 優先度スコアが降順であることを確認
    for (let i = 0; i < result.selectedTargets.length - 1; i++) {
      expect(result.selectedTargets[i].priorityScore).toBeGreaterThanOrEqual(
        result.selectedTargets[i + 1].priorityScore
      );
    }
  });
});