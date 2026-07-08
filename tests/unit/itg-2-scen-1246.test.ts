import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  generateRolloutPlan,
  RolloutPlanInput,
  RolloutPlan,
} from "../../src/logic/it-6-2-1-1";

describe("新精度基準の段階的ロールアウト計画立案", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1246
  test("新精度基準に対して実装スケジュール・対象グループ・検証方法が自動立案される", () => {
    // ========== 前提 ==========
    // 改善されたAIモデルで見積査定業務を再開し、新しい判定基準が査定員に周知された状態
    // 査定部署長が改善結果を確認し、新しい精度基準を運用に反映することを決定した

    // ========== 入力 ==========
    const rolloutInput: RolloutPlanInput = {
      criteriaName: "OCR精度改善基準 v2.1",
      criteriaDescription:
        "物価本2024年版反映に伴うOCR読取精度向上基準",
      targetOCRAccuracy: 92.5,
      targetJudgmentAccuracy: 88.0,
      currentOCRAccuracy: 89.5,
      currentJudgmentAccuracy: 85.0,
      organizationStructure: [
        { groupId: "dept001", groupName: "査定部門A", priority: 1 },
        { groupId: "dept002", groupName: "査定部門B", priority: 2 },
        { groupId: "dept003", groupName: "査定部門C", priority: 3 },
      ],
      totalTeamCount: 12,
      teamCountPerPhase: 4,
      startDate: "2024-04-01",
    };

    // ========== 実行 ==========
    const result: RolloutPlan = generateRolloutPlan(rolloutInput);

    // ========== 期待結果 ==========
    // 1. 実装スケジュール（フェーズ分け）の自動生成
    expect(result.implementationSchedule).toBeDefined();
    expect(result.implementationSchedule.phases).toHaveLength(3);

    // フェーズ 1: 2024-04-01 ～ 2024-04-14（2週間）
    expect(result.implementationSchedule.phases[0]).toEqual({
      phaseNumber: 1,
      phaseName: "初期段階（パイロット）",
      startDate: "2024-04-01",
      endDate: "2024-04-14",
      plannedTeamCount: 4,
      description: "優先度1グループの対象チーム(4チーム)で検証実施",
    });

    // フェーズ 2: 2024-04-15 ～ 2024-04-28（2週間）
    expect(result.implementationSchedule.phases[1]).toEqual({
      phaseNumber: 2,
      phaseName: "拡大段階",
      startDate: "2024-04-15",
      endDate: "2024-04-28",
      plannedTeamCount: 4,
      description: "優先度2グループの対象チーム(4チーム)で検証実施",
    });

    // フェーズ 3: 2024-04-29 ～ 2024-05-12（2週間）
    expect(result.implementationSchedule.phases[2]).toEqual({
      phaseNumber: 3,
      phaseName: "全体展開段階",
      startDate: "2024-04-29",
      endDate: "2024-05-12",
      plannedTeamCount: 4,
      description: "優先度3グループの対象チーム(4チーム)で検証実施",
    });

    // 2. 対象グループの自動割り当て
    expect(result.targetGroups).toBeDefined();
    expect(result.targetGroups.totalGroupCount).toBe(3);
    expect(result.targetGroups.groupAssignments).toHaveLength(3);

    // 優先度別グループ割り当て
    expect(result.targetGroups.groupAssignments[0]).toEqual({
      phaseNumber: 1,
      groupId: "dept001",
      groupName: "査定部門A",
      assignedTeamCount: 4,
      priority: 1,
      rationale: "高優先度グループのため初期段階に割り当て",
    });

    expect(result.targetGroups.groupAssignments[1]).toEqual({
      phaseNumber: 2,
      groupId: "dept002",
      groupName: "査定部門B",
      assignedTeamCount: 4,
      priority: 2,
      rationale: "中優先度グループのため拡大段階に割り当て",
    });

    expect(result.targetGroups.groupAssignments[2]).toEqual({
      phaseNumber: 3,
      groupId: "dept003",
      groupName: "査定部門C",
      assignedTeamCount: 4,
      priority: 3,
      rationale: "低優先度グループのため全体展開段階に割り当て",
    });

    // 3. 検証方法の自動生成
    expect(result.verificationMethod).toBeDefined();
    expect(result.verificationMethod.checklistItems).toHaveLength(5);

    // チェックリスト項目の検証
    expect(result.verificationMethod.checklistItems[0]).toEqual({
      itemId: "checklist_001",
      itemName: "OCR読取精度測定",
      description: "目標精度92.5%に達しているか確認",
      passCriteria: "実測精度 >= 92.5%",
    });

    expect(result.verificationMethod.checklistItems[1]).toEqual({
      itemId: "checklist_002",
      itemName: "相場判定精度測定",
      description: "目標精度88.0%に達しているか確認",
      passCriteria: "実測精度 >= 88.0%",
    });

    expect(result.verificationMethod.checklistItems[2]).toEqual({
      itemId: "checklist_003",
      itemName: "査定時間短縮達成度",
      description: "前比10%以上の時間短縮を確認",
      passCriteria: "短縮率 >= 10%",
    });

    expect(result.verificationMethod.checklistItems[3]).toEqual({
      itemId: "checklist_004",
      itemName: "査定員の理解度テスト",
      description: "新基準・新ロジックの理解を確認",
      passCriteria: "合格率 >= 85%",
    });

    expect(result.verificationMethod.checklistItems[4]).toEqual({
      itemId: "checklist_005",
      itemName: "見積書フォーマット対応確認",
      description: "全見積書フォーマットへの対応を確認",
      passCriteria: "対応率 = 100%",
    });

    // 検証指標の確認
    expect(result.verificationMethod.qualityMetrics).toBeDefined();
    expect(result.verificationMethod.qualityMetrics).toEqual({
      ocrAccuracyImprovement: 3.0,
      judgmentAccuracyImprovement: 3.0,
      processingTimeReduction: 10.0,
      userComprehensionRate: 85.0,
      formatCoverageRate: 100.0,
    });

    // 合格基準の確認
    expect(result.verificationMethod.passCriteria).toEqual({
      minOCRAccuracy: 92.5,
      minJudgmentAccuracy: 88.0,
      minProcessingTimeReduction: 10.0,
      minComprehensionRate: 85.0,
      minFormatCoveragRate: 100.0,
      allChecklistItemsPass: true,
    });

    // 4. ロールアウト計画全体の整合性検証
    expect(result.planSummary).toBeDefined();
    expect(result.planSummary.totalPhases).toBe(3);
    expect(result.planSummary.totalImplementationDays).toBe(42);
    expect(result.planSummary.planCreatedAt).toBeDefined();
    expect(result.planSummary.planStatus).toBe("draft");

    // 5. 保存可能状態の確認
    expect(result.isSaveable).toBe(true);
    expect(result.validationErrors).toHaveLength(0);
  });
});