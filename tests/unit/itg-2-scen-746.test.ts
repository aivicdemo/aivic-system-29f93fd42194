import { recordAuditTrailOnJudgmentConfirmation } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-746: [normal] 監査証跡記録機能 - 判定確定時に判定内容・根拠・判定者・判定時刻・修正履歴が全て記録される
  test('should record complete audit trail with judgment content, rationale, judge info, timestamp, and modification history on judgment confirmation', () => {
    const judgmentConfirmationInput = {
      assessmentItemId: 'ITEM-20250526-001',
      judgmentContent: '合格',
      judgmentRationale: '相場乖離率が許容範囲内で、参照データも十分。',
      judgeUserId: 'USER-ASSESSOR-001',
      judgeUserName: '査定員太郎',
      judgmentTimestamp: new Date('2025-05-26T14:30:45Z'),
      priorJudgmentContent: '未判定',
      priorJudgmentRationale: '',
      modificationHistory: [
        {
          fieldName: 'judgmentContent',
          previousValue: '未判定',
          currentValue: '合格',
          changedAt: new Date('2025-05-26T14:30:45Z'),
          changedBy: 'USER-ASSESSOR-001',
        },
        {
          fieldName: 'judgmentRationale',
          previousValue: '',
          currentValue: '相場乖離率が許容範囲内で、参照データも十分。',
          changedAt: new Date('2025-05-26T14:30:45Z'),
          changedBy: 'USER-ASSESSOR-001',
        },
      ],
      departmentHeadApprovalStatus: '承認待ち',
      referenceDataCount: 45,
      deviationRate: 3.5,
      correctionCoefficient: 1.0,
    };

    const result = recordAuditTrailOnJudgmentConfirmation(judgmentConfirmationInput);

    expect(result).toEqual({
      auditTrailId: expect.any(String),
      assessmentItemId: 'ITEM-20250526-001',
      judgmentContent: '合格',
      judgmentRationale: '相場乖離率が許容範囲内で、参照データも十分。',
      judgeUserId: 'USER-ASSESSOR-001',
      judgeUserName: '査定員太郎',
      judgmentTimestamp: new Date('2025-05-26T14:30:45Z'),
      recordedAt: expect.any(Date),
      modificationHistory: [
        {
          fieldName: 'judgmentContent',
          previousValue: '未判定',
          currentValue: '合格',
          changedAt: new Date('2025-05-26T14:30:45Z'),
          changedBy: 'USER-ASSESSOR-001',
        },
        {
          fieldName: 'judgmentRationale',
          previousValue: '',
          currentValue: '相場乖離率が許容範囲内で、参照データも十分。',
          changedAt: new Date('2025-05-26T14:30:45Z'),
          changedBy: 'USER-ASSESSOR-001',
        },
      ],
      isCompleteRecord: true,
    });

    expect(result.auditTrailId).toMatch(/^AUDIT-/);
    expect(result.judgmentContent).toBe('合格');
    expect(result.judgeUserName).toBe('査定員太郎');
    expect(result.modificationHistory.length).toBe(2);
    expect(result.modificationHistory[0].fieldName).toBe('judgmentContent');
    expect(result.modificationHistory[0].previousValue).toBe('未判定');
    expect(result.modificationHistory[0].currentValue).toBe('合格');
    expect(result.modificationHistory[1].fieldName).toBe('judgmentRationale');
    expect(result.modificationHistory[1].previousValue).toBe('');
    expect(result.modificationHistory[1].currentValue).toBe('相場乖離率が許容範囲内で、参照データも十分。');
    expect(result.isCompleteRecord).toBe(true);
  });
});