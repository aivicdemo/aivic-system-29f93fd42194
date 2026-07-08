import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { evaluateAndApproveImprovement } from "../../src/logic/it-1-br-2-2-2-1";

describe("改善提案承認判定機能 - 評価スコアデフォルト値適用", () => {
  let systemLogs: Array<{ timestamp: string; message: string; level: string }>;

  beforeEach(() => {
    systemLogs = [];
  });

  afterEach(() => {
    systemLogs = [];
  });

  test("SCEN-1209: 評価スコアが未定義の場合、デフォルト値が適用されて判定が継続される", () => {
    // 前提条件: 評価スコアが undefined の改善提案データを作成
    const improvementProposal = {
      proposalId: "PROP-2024-001",
      proposalContent: "学習データに2024年度季節変動データを追加",
      proposerInfo: {
        proposerId: "OP-001",
        proposerName: "原価管理システム運用者A",
        proposerDepartment: "システム運用部",
      },
      proposalDate: "2024-01-15T09:00:00Z",
      businessImpactScore: undefined, // 評価スコア未定義
      implementationDifficultyScore: 45,
      riskAssessmentScore: 30,
      expectedEffectScore: 60,
      estimatedImplementationDays: 7,
    };

    // 他の必須項目は正常な値を設定
    const approvalContext = {
      departmentHeadId: "DEPT-001",
      approvalThreshold: 50, // 承認基準: 平均スコア 50 以上
      systemDefaultScores: {
        businessImpactDefault: 50, // デフォルト値
      },
      logCallback: (level: string, message: string) => {
        systemLogs.push({
          timestamp: new Date("2024-01-15T09:30:00Z").toISOString(),
          message,
          level,
        });
      },
    };

    // 実行: 改善提案承認判定処理を実行
    const result = evaluateAndApproveImprovement(
      improvementProposal,
      approvalContext
    );

    // 検証1: デフォルト値が自動適用されたことを確認
    expect(result.appliedScores.businessImpactScore).toBe(50);

    // 検証2: デフォルト値が適用されたことをシステムログで確認
    const defaultAppliedLog = systemLogs.find((log) =>
      log.message.includes("デフォルト値が適用")
    );
    expect(defaultAppliedLog).toBeDefined();
    expect(defaultAppliedLog?.level).toBe("INFO");

    // 検証3: デフォルト値を適用した状態での平均スコア計算
    // (50 + 45 + 30 + 60) / 4 = 46.25
    const expectedAverageScore = (50 + 45 + 30 + 60) / 4;
    expect(result.averageEvaluationScore).toBe(46.25);

    // 検証4: 承認判定基準(50)に基づいて却下判定されたことを確認
    expect(result.approvalDecision).toBe("REJECTED");
    expect(result.approvalReason).toContain("平均スコア");

    // 検証5: 判定処理が中断されずに完了したことを確認（エラーがない）
    expect(result.hasError).toBe(false);
    expect(result.errorMessage).toBeNull();

    // 検証6: デフォルト値適用の事実がシステムログに記録されていることを確認
    expect(systemLogs.length).toBeGreaterThan(0);
    const logMessages = systemLogs.map((log) => log.message);
    expect(logMessages.some((msg) => msg.includes("PROP-2024-001"))).toBe(true);
    expect(
      logMessages.some((msg) => msg.includes("businessImpactScore"))
    ).toBe(true);

    // 検証7: 応用ロジック: デフォルト値を除いた他スコアが全て存在することを確認
    expect(result.appliedScores.implementationDifficultyScore).toBe(45);
    expect(result.appliedScores.riskAssessmentScore).toBe(30);
    expect(result.appliedScores.expectedEffectScore).toBe(60);

    // 検証8: 判定メタデータが正常に構築されていることを確認
    expect(result.evaluationMetadata).toBeDefined();
    expect(result.evaluationMetadata.defaultsApplied).toContain(
      "businessImpactScore"
    );
    expect(result.evaluationMetadata.totalScoresCount).toBe(4);
    expect(result.evaluationMetadata.undefinedScoresCount).toBe(1);
  });
});