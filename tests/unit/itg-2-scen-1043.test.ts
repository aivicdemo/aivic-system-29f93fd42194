import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  applyUnifiedJudgmentLogic,
  type UnifiedJudgmentInput,
  type UnifiedJudgmentResult,
} from "../../src/logic/it-6-2-1-1";

describe("統一判定ロジック適用機能", () => {
  // SCEN-1043: 複数査定員の異なる判定に対して学習データ基盤の統一ロジックが正しく適用される

  let auditLogs: Array<{
    timestamp: string;
    assessorId: string;
    caseId: string;
    action: string;
    result: string;
  }> = [];

  beforeEach(() => {
    auditLogs = [];
  });

  afterEach(() => {
    auditLogs = [];
  });

  test("複数査定員の異なる判定結果に統一判定ロジックが完全に適用される", () => {
    // 【テストデータ準備】
    // 同一査定対象に対して3名の査定員による異なる判定結果を構成
    const caseId = "CASE-2024-001";
    const constructionType = "一般建築工事";
    const amountBand = "500万円～1000万円";
    const region = "東京都";

    // 査定員1: 金額過小判定（乖離率 -15%）
    const assessor1Result = {
      assessorId: "ASSESSOR-001",
      assessmentDate: "2024-01-15T10:00:00Z",
      quotedAmount: 7500000,
      assessedAmount: 7500000,
      deviationRate: -0.15,
      judgmentReason: "過去案件平均より低い",
      judgedStatus: "REJECTED",
    };

    // 査定員2: 金額適正判定（乖離率 +2%）
    const assessor2Result = {
      assessorId: "ASSESSOR-002",
      assessmentDate: "2024-01-15T10:15:00Z",
      quotedAmount: 7500000,
      assessedAmount: 8600000,
      deviationRate: 0.02,
      judgmentReason: "物価本相場内",
      judgedStatus: "APPROVED",
    };

    // 査定員3: 金額過大判定（乖離率 +25%）
    const assessor3Result = {
      assessorId: "ASSESSOR-003",
      assessmentDate: "2024-01-15T10:30:00Z",
      quotedAmount: 7500000,
      assessedAmount: 9375000,
      deviationRate: 0.25,
      judgmentReason: "地域補正を反映すると高い",
      judgedStatus: "APPROVED",
    };

    // 【統一判定ロジック設定の確認】
    // 学習データ基盤に設定された統一ロジック：
    // - 許容乖離幅: -10% ～ +15%
    // - 乖離率が許容幅内 → APPROVED
    // - 乖離率が許容幅外 → REJECTED
    const unifiedLogicConfig = {
      logicId: "LOGIC-UNIFIED-001",
      constructionType,
      amountBand,
      region,
      lowerDeviationThreshold: -0.1,
      upperDeviationThreshold: 0.15,
      lastUpdated: "2024-01-01T00:00:00Z",
    };

    // 【統一判定ロジック適用入力データ構成】
    const input: UnifiedJudgmentInput = {
      caseId,
      constructionType,
      amountBand,
      region,
      assessmentResults: [assessor1Result, assessor2Result, assessor3Result],
      unifiedLogicConfig,
      appliedBy: "SYSTEM-AUDIT",
      appliedAt: "2024-01-15T11:00:00Z",
    };

    // 【統一判定ロジック適用機能の実行】
    const result: UnifiedJudgmentResult = applyUnifiedJudgmentLogic(input);

    // 【統一ロジック適用後の判定結果が正しく出力される】
    expect(result).toBeDefined();
    expect(result.caseId).toBe(caseId);
    expect(result.unifiedJudgments).toHaveLength(3);

    // 【査定員1の結果検証】
    // 乖離率 -15% は許容幅下限 -10% を下回る → REJECTED に統一
    expect(result.unifiedJudgments[0]).toEqual({
      assessorId: "ASSESSOR-001",
      originalStatus: "REJECTED",
      unifiedStatus: "REJECTED",
      deviationRate: -0.15,
      withinTolerance: false,
      logicApplied: "LOGIC-UNIFIED-001",
      reasoning: "乖離率-15%は許容幅-10%～+15%の下限を超過、不承認",
    });

    // 【査定員2の結果検証】
    // 乖離率 +2% は許容幅内 -10% ～ +15% → APPROVED に統一
    expect(result.unifiedJudgments[1]).toEqual({
      assessorId: "ASSESSOR-002",
      originalStatus: "APPROVED",
      unifiedStatus: "APPROVED",
      deviationRate: 0.02,
      withinTolerance: true,
      logicApplied: "LOGIC-UNIFIED-001",
      reasoning: "乖離率+2%は許容幅-10%～+15%内、承認",
    });

    // 【査定員3の結果検証】
    // 乖離率 +25% は許容幅上限 +15% を超える → REJECTED に統一
    expect(result.unifiedJudgments[2]).toEqual({
      assessorId: "ASSESSOR-003",
      originalStatus: "APPROVED",
      unifiedStatus: "REJECTED",
      deviationRate: 0.25,
      withinTolerance: false,
      logicApplied: "LOGIC-UNIFIED-001",
      reasoning: "乖離率+25%は許容幅-10%～+15%の上限を超過、不承認",
    });

    // 【統一判定結果の統計情報検証】
    expect(result.summaryStatistics).toBeDefined();
    expect(result.summaryStatistics.totalAssessors).toBe(3);
    expect(result.summaryStatistics.uniformDecisions).toBe(2); // 査定員2は元々APPROVED、査定員1,3は統一結果がREJECTED
    expect(result.summaryStatistics.changedDecisions).toBe(1); // 査定員3が APPROVED → REJECTED に変更
    expect(result.summaryStatistics.uniformityRatio).toBe(0.67); // 2/3 ≈ 0.67

    // 【適用プロセスがシステムログに正しく記録される】
    expect(result.auditTrail).toBeDefined();
    expect(result.auditTrail.logicApplicationStartTime).toBe(
      "2024-01-15T11:00:00Z"
    );
    expect(result.auditTrail.logicApplicationEndTime).toBeDefined();
    expect(result.auditTrail.logicId).toBe("LOGIC-UNIFIED-001");
    expect(result.auditTrail.appliedBy).toBe("SYSTEM-AUDIT");

    // 【詳細ログエントリの検証】
    expect(result.auditTrail.detailedLogs).toHaveLength(3);
    expect(result.auditTrail.detailedLogs[0]).toEqual({
      sequence: 1,
      assessorId: "ASSESSOR-001",
      stepDescription: "統一判定ロジック LOGIC-UNIFIED-001 を適用",
      originalDeviation: -0.15,
      lowerThreshold: -0.1,
      upperThreshold: 0.15,
      evaluationResult: "下限を超過",
      decidedStatus: "REJECTED",
      timestamp: "2024-01-15T11:00:00Z",
    });

    expect(result.auditTrail.detailedLogs[1]).toEqual({
      sequence: 2,
      assessorId: "ASSESSOR-002",
      stepDescription: "統一判定ロジック LOGIC-UNIFIED-001 を適用",
      originalDeviation: 0.02,
      lowerThreshold: -0.1,
      upperThreshold: 0.15,
      evaluationResult: "許容幅内",
      decidedStatus: "APPROVED",
      timestamp: "2024-01-15T11:00:00Z",
    });

    expect(result.auditTrail.detailedLogs[2]).toEqual({
      sequence: 3,
      assessorId: "ASSESSOR-003",
      stepDescription: "統一判定ロジック LOGIC-UNIFIED-001 を適用",
      originalDeviation: 0.25,
      lowerThreshold: -0.1,
      upperThreshold: 0.15,
      evaluationResult: "上限を超過",
      decidedStatus: "REJECTED",
      timestamp: "2024-01-15T11:00:00Z",
    });

    // 【監査追跡可能性の検証】
    expect(result.auditTrail.isAuditTraceComplete).toBe(true);
    expect(result.auditTrail.totalProcessingTimeMs).toBeGreaterThan(0);
    expect(result.auditTrail.totalProcessingTimeMs).toBeLessThan(5000); // 処理時間は5秒以内
    expect(result.auditTrail.systemVersion).toBeDefined();
    expect(result.auditTrail.systemVersion).toMatch(/^v\d+\.\d+\.\d+$/);

    // 【適用ロジックの内容が記録される】
    expect(result.appliedLogicDetails).toBeDefined();
    expect(result.appliedLogicDetails.logicVersion).toBe(1);
    expect(result.appliedLogicDetails.thresholdModel).toBe(
      "DEVIATION_RANGE_UNIFORM"
    );
    expect(result.appliedLogicDetails.lastValidationDate).toBe(
      "2024-01-01T00:00:00Z"
    );

    // 【全体成功フラグの検証】
    expect(result.isSuccessful).toBe(true);
    expect(result.errorMessages).toEqual([]);
  });
});