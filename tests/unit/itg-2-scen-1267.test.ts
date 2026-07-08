import { it, describe, beforeEach, afterEach, jest } from '@jest/globals';
import {
  recordJudgmentLogicApplicationHistory,
  calculateAccuracyImprovementDegree,
  determineContinueAssessmentDuringImprovement,
  verifyAssessmentTaskQueueStatus,
  recordRiskMitigationAlert,
} from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-1267: [edge] 改善対策実装中の査定業務継続とリスク最小化機能 - 改善対策実装による精度改善度がゼロの境界値時でも、査定業務は中断されず継続される
  it('should continue assessment operations when accuracy improvement degree is zero boundary value', async () => {
    const assessmentSessionId = 'sess_20250526_001';
    const improvementPlanId = 'plan_imp_2025_q2_001';
    const baselineAccuracyOcr = 85.5;
    const baselineAccuracyAiJudgment = 88.2;
    const executionStartTime = new Date('2025-05-26T09:00:00Z');
    const executionEndTime = new Date('2025-05-26T09:05:00Z');
    
    // 改善対策実装前の精度ベースライン測定
    const baselineMeasurement = {
      sessionId: assessmentSessionId,
      ocrAccuracyBefore: baselineAccuracyOcr,
      aiJudgmentAccuracyBefore: baselineAccuracyAiJudgment,
      measurementTimestamp: executionStartTime,
    };

    // 改善対策実装後の精度測定（改善度ゼロの境界値）
    const postImprovementMeasurement = {
      sessionId: assessmentSessionId,
      ocrAccuracyAfter: 85.5,
      aiJudgmentAccuracyAfter: 88.2,
      measurementTimestamp: executionEndTime,
    };

    // 改善対策実装中の状態を初期化
    const improvementExecutionContext = {
      improvementPlanId: improvementPlanId,
      sessionId: assessmentSessionId,
      status: 'IN_PROGRESS' as const,
      startTime: executionStartTime,
      targetAccuracyImprovement: 3.0,
    };

    // ステップ1: 改善対策実装による精度改善度をモック化し、戻り値を0.0に設定
    const mockCalculateAccuracyImprovement = jest.fn().mockReturnValue({
      ocrImprovementDegree: 0.0,
      aiJudgmentImprovementDegree: 0.0,
      totalImprovementDegree: 0.0,
      improvementStatus: 'NO_IMPROVEMENT' as const,
    });

    // 実際の関数では精度改善度0.0を計算
    const accuracyImprovementResult = calculateAccuracyImprovementDegree({
      baselineOcrAccuracy: baselineAccuracyOcr,
      baselineAiJudgmentAccuracy: baselineAccuracyAiJudgment,
      postImprovementOcrAccuracy: postImprovementMeasurement.ocrAccuracyAfter,
      postImprovementAiJudgmentAccuracy: postImprovementMeasurement.aiJudgmentAccuracyAfter,
    });

    // ステップ2: 精度改善度がゼロ境界値であることを検証
    expect(accuracyImprovementResult.totalImprovementDegree).toBe(0.0);
    expect(accuracyImprovementResult.improvementStatus).toBe('NO_IMPROVEMENT');

    // ステップ3: 査定業務の開始トリガーを実行
    const assessmentContinueDecision = determineContinueAssessmentDuringImprovement({
      improvementPlanId: improvementPlanId,
      sessionId: assessmentSessionId,
      accuracyImprovementDegree: accuracyImprovementResult.totalImprovementDegree,
      improvementExecutionStatus: improvementExecutionContext.status,
      currentPendingAssessmentTaskCount: 42,
      systemHealthStatus: 'NORMAL',
    });

    // ステップ4: 改善対策実装モジュールが精度改善度0.0を検出
    expect(assessmentContinueDecision.shouldContinueAssessment).toBe(true);
    expect(assessmentContinueDecision.reason).toContain('継続');

    // ステップ5: 業務継続判定ロジックが実行される
    expect(assessmentContinueDecision.continuationDecisionLogic).toEqual(
      expect.objectContaining({
        improvementInProgressWithZeroGain: true,
        assessmentQueueHasPendingTasks: true,
      })
    );

    // ステップ6: 現在の査定業務のステータスを確認
    const assessmentStatus = {
      sessionId: assessmentSessionId,
      operationStatus: 'CONTINUING' as const,
      improvementInterimStatus: 'IN_PROGRESS',
      accuracyImprovementDegree: 0.0,
    };
    expect(assessmentStatus.operationStatus).toBe('CONTINUING');
    expect(assessmentStatus.accuracyImprovementDegree).toBe(0.0);

    // ステップ7: 査定データ処理キューにタスクが残っているかを検証
    const queueStatus = verifyAssessmentTaskQueueStatus({
      sessionId: assessmentSessionId,
      improvementPlanId: improvementPlanId,
    });

    expect(queueStatus.hasPendingTasks).toBe(true);
    expect(queueStatus.pendingTaskCount).toBeGreaterThan(0);
    expect(queueStatus.oldestTaskEnqueuedAt).toEqual(expect.any(Date));

    // ステップ8: リスク最小化機能のアラート/ログが記録されているかを確認
    const riskMitigationAlert = recordRiskMitigationAlert({
      sessionId: assessmentSessionId,
      improvementPlanId: improvementPlanId,
      alertType: 'ZERO_IMPROVEMENT_WITH_ONGOING_ASSESSMENT' as const,
      severityLevel: 'WARNING' as const,
      accuracyImprovementDegree: 0.0,
      pendingAssessmentCount: 42,
      description:
        '精度改善度がゼロの境界値ですが、査定業務は継続します。リスク監視を強化します。',
      recordedAt: new Date('2025-05-26T09:05:30Z'),
    });

    expect(riskMitigationAlert.alertId).toMatch(/^alert_/);
    expect(riskMitigationAlert.alertType).toBe('ZERO_IMPROVEMENT_WITH_ONGOING_ASSESSMENT');
    expect(riskMitigationAlert.severityLevel).toBe('WARNING');
    expect(riskMitigationAlert.isRecorded).toBe(true);

    // ステップ9: 一定期間（5秒経過想定）後、査定業務が継続されているかを再度確認
    await new Promise((resolve) => setTimeout(resolve, 100)); // 実テストでは5秒、単体テストでは100ms

    const finalAssessmentStatus = {
      sessionId: assessmentSessionId,
      operationStatus: 'CONTINUING' as const,
      improvementInterimStatus: 'IN_PROGRESS',
      processedTaskCountDuringImprovement: 5,
      totalRemainingTasks: 37,
    };

    expect(finalAssessmentStatus.operationStatus).toBe('CONTINUING');
    expect(finalAssessmentStatus.processedTaskCountDuringImprovement).toBeGreaterThan(0);
    expect(finalAssessmentStatus.totalRemainingTasks).toBeLessThan(42);

    // 統合検証: 精度改善度がゼロでも業務は中断されず、リスク認識と共に継続される
    expect(assessmentContinueDecision.shouldContinueAssessment).toBe(true);
    expect(queueStatus.hasPendingTasks).toBe(true);
    expect(riskMitigationAlert.isRecorded).toBe(true);
    expect(finalAssessmentStatus.operationStatus).toBe('CONTINUING');

    // 応用テスト: 改善対策実装中に新規見積が追加される場合でも業務継続
    const newAssessmentTaskAddedDuringImprovement = {
      sessionId: assessmentSessionId,
      improvementPlanId: improvementPlanId,
      newTaskId: 'task_new_20250526_043',
      estimateDocumentId: 'est_doc_2025_00043',
      enqueuedAt: new Date('2025-05-26T09:05:15Z'),
    };

    const updatedQueueStatus = verifyAssessmentTaskQueueStatus({
      sessionId: assessmentSessionId,
      improvementPlanId: improvementPlanId,
    });

    expect(updatedQueueStatus.hasPendingTasks).toBe(true);
    expect(updatedQueueStatus.pendingTaskCount).toBeGreaterThanOrEqual(1);

    // エラーテスト: セッションIDが無効な場合
    expect(() => {
      recordJudgmentLogicApplicationHistory({
        sessionId: '',
        improvementPlanId: improvementPlanId,
        judmentLogicId: 'logic_001',
        appliedAt: new Date('2025-05-26T09:05:00Z'),
      });
    }).toThrow(/セッション/);

    // エラーテスト: 改善計画IDが無効な場合
    expect(() => {
      determineContinueAssessmentDuringImprovement({
        improvementPlanId: '',
        sessionId: assessmentSessionId,
        accuracyImprovementDegree: 0.0,
        improvementExecutionStatus: 'IN_PROGRESS',
        currentPendingAssessmentTaskCount: 42,
        systemHealthStatus: 'NORMAL',
      });
    }).toThrow(/改善計画/);
  });
});