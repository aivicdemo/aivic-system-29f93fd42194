import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fetchMock from 'jest-fetch-mock';
import { validateAndReturnAssessmentCase } from '../../src/logic/it-6-2-2-2';

fetchMock.enableMocks();

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1007
  test('[normal] 査定部署長による妥当性判定結果の確認・承認 - 自動判定結果と査定員の判定根拠に重大な乖離がある場合に差戻し判定が実行される', async () => {
    // 前提: 自動判定結果と査定員の判定根拠に重大な乖離がある見積案件がシステムに記録されている状態
    const assessmentCaseId = 'CASE-20250226-001';
    const departmentHeadUserId = 'DEPTHEAD-001';
    const assessorId = 'ASSESSOR-002';
    const quotationAmount = 5000000;
    const autoJudgmentAmount = 5200000;
    const assessorJudgmentAmount = 4500000;
    const autoJudgmentReason = '過去案件データ参照件数: 12件、相場乖離率: +4.0%、物価本出典: 2024年1月版';
    const assessorJudgmentReason = '地域補正係数を考慮し、市場相場ベース-10%が妥当と判断';
    const deviationDegreeValue = 95;
    const severityThreshold = 80;
    const expectedDeviationLevel = 'CRITICAL';
    const expectedStatusBeforeRework = 'UNDER_REVIEW';
    const expectedStatusAfterRework = 'REWORK_WAITING';
    const reworkReason = '判定根拠の食い違いが大きいため、評価基準の再確認が必要です。';
    const notificationTimestamp = new Date('2025-02-26T14:30:00Z');
    const caseDetailsResponse = {
      caseId: assessmentCaseId,
      quotationAmount,
      autoJudgmentAmount,
      autoJudgmentReason,
      assessorId,
      assessorJudgmentAmount,
      assessorJudgmentReason,
      deviationDegree: deviationDegreeValue,
      deviationLevel: expectedDeviationLevel,
      status: expectedStatusBeforeRework,
      createdAt: '2025-02-26T10:00:00Z',
      lastUpdatedAt: '2025-02-26T13:45:00Z',
    };
    const reworkExecutionResponse = {
      caseId: assessmentCaseId,
      previousStatus: expectedStatusBeforeRework,
      newStatus: expectedStatusAfterRework,
      reworkReason,
      reworkOrderedBy: departmentHeadUserId,
      reworkOrderedAt: '2025-02-26T14:31:00Z',
      notificationSentAt: notificationTimestamp.toISOString(),
      notificationRecipient: assessorId,
    };

    // 妥当性判定画面で重大乖離ケースを検索・表示するAPI呼び出し
    fetchMock.mockResponseOnce(JSON.stringify(caseDetailsResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    // 差戻し判定を実行するAPI呼び出し
    fetchMock.mockResponseOnce(JSON.stringify(reworkExecutionResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    // 業務ロジック実行: validateAndReturnAssessmentCase
    const result = await validateAndReturnAssessmentCase({
      caseId: assessmentCaseId,
      departmentHeadUserId,
      operationType: 'FETCH_CASE_DETAILS',
      deviationSeverityThreshold: severityThreshold,
    });

    // 期待結果: 検索結果から重大乖離ケースの詳細が取得される
    expect(result).toEqual({
      caseId: assessmentCaseId,
      quotationAmount,
      autoJudgmentAmount,
      autoJudgmentReason,
      assessorId,
      assessorJudgmentAmount,
      assessorJudgmentReason,
      deviationDegree: deviationDegreeValue,
      deviationLevel: expectedDeviationLevel,
      status: expectedStatusBeforeRework,
      createdAt: '2025-02-26T10:00:00Z',
      lastUpdatedAt: '2025-02-26T13:45:00Z',
    });

    // 乖離度が閾値を超えている確認
    expect(result.deviationDegree).toBeGreaterThan(severityThreshold);
    expect(result.deviationLevel).toBe(expectedDeviationLevel);

    // 差戻し処理実行: executeReworkJudgment
    const reworkResult = await validateAndReturnAssessmentCase({
      caseId: assessmentCaseId,
      departmentHeadUserId,
      operationType: 'EXECUTE_REWORK',
      reworkReason,
    });

    // 期待結果: 差戻し処理が正常に実行される
    expect(reworkResult).toEqual({
      caseId: assessmentCaseId,
      previousStatus: expectedStatusBeforeRework,
      newStatus: expectedStatusAfterRework,
      reworkReason,
      reworkOrderedBy: departmentHeadUserId,
      reworkOrderedAt: '2025-02-26T14:31:00Z',
      notificationSentAt: notificationTimestamp.toISOString(),
      notificationRecipient: assessorId,
    });

    // ステータス変更の確認
    expect(reworkResult.newStatus).toBe(expectedStatusAfterRework);
    expect(reworkResult.previousStatus).toBe(expectedStatusBeforeRework);

    // 差戻し通知が送信されたことの確認
    expect(reworkResult.notificationRecipient).toBe(assessorId);
    expect(reworkResult.notificationSentAt).toBeDefined();
    expect(new Date(reworkResult.notificationSentAt).getTime()).toBeGreaterThan(
      new Date(reworkResult.reworkOrderedAt).getTime()
    );

    // 差戻し理由が記録されたことの確認
    expect(reworkResult.reworkReason).toBe(reworkReason);

    // API呼び出し回数の確認
    expect(fetchMock.mock.calls.length).toBe(2);

    // 最初のAPI呼び出しの検証
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/assessment-cases\//);
    expect(fetchMock.mock.calls[0][1]?.method).toBe('GET');

    // 2番目のAPI呼び出しの検証
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/assessment-cases\/.+\/rework/);
    expect(fetchMock.mock.calls[1][1]?.method).toBe('POST');
  });
});