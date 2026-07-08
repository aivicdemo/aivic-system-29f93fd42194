import { analyzeAppraisalDeviation } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-839: 相場乖離総合判定と承認・修正決定 - 複合条件（乖離率超過 AND 参照データ件数不足）で修正指示判定が正常に下される', () => {
    // 前提: 見積査定員がシステムの自動判定結果を確認し、相場乖離の根拠を検証している状態
    // 発生条件: 乖離率が基準値を超過する かつ 参照データ件数が不足している複合条件下で判定
    const testCase = {
      estimateId: 'EST-20240115-001',
      deviationRate: 15.5, // 基準値を超過（15%超）
      deviationAmount: 125000, // 乖離額（円）
      referenceDataCount: 3, // 最小要件未満（最小5件）
      requiredMinReferenceCount: 5,
      deviationRateThreshold: 15.0,
      appliedCorrectionFactor: 1.08,
      referenceDataRegion: '東京都',
      referenceDataConstructionType: '新築工事',
      evaluatorId: 'EMP-00001',
      evaluationTimestamp: new Date('2024-01-15T14:30:00Z'),
    };

    const result = analyzeAppraisalDeviation({
      estimateId: testCase.estimateId,
      deviationRate: testCase.deviationRate,
      deviationAmount: testCase.deviationAmount,
      referenceDataCount: testCase.referenceDataCount,
      requiredMinReferenceCount: testCase.requiredMinReferenceCount,
      deviationRateThreshold: testCase.deviationRateThreshold,
      appliedCorrectionFactor: testCase.appliedCorrectionFactor,
      referenceDataRegion: testCase.referenceDataRegion,
      referenceDataConstructionType: testCase.referenceDataConstructionType,
      evaluatorId: testCase.evaluatorId,
      evaluationTimestamp: testCase.evaluationTimestamp,
    });

    // 期待結果: 複合条件（乖離率超過 AND 参照データ件数不足）で修正指示判定が下される
    expect(result.judgmentResult).toBe('MODIFICATION_REQUIRED');
    expect(result.requiresModification).toBe(true);

    // 修正指示フラグが立てられていることを確認
    expect(result.modificationFlagSet).toBe(true);

    // ステータスが承認待ち状態に遷移していることを確認
    expect(result.status).toBe('PENDING_APPROVAL');

    // 乖離率が基準値を超過していることを検証
    expect(result.deviationRateExceeded).toBe(true);
    expect(result.deviationRate).toBe(15.5);
    expect(result.deviationRateThreshold).toBe(15.0);

    // 参照データ件数が最小要件を下回っていることを検証
    expect(result.referenceDataInsufficient).toBe(true);
    expect(result.referenceDataCount).toBe(3);
    expect(result.requiredMinReferenceCount).toBe(5);

    // 修正指示の根拠が適切に記録されていることを検証
    expect(result.judgmentReason).toContain('乖離率超過');
    expect(result.judgmentReason).toContain('参照データ件数不足');
    expect(result.judgmentReason).toContain('15.5%');
    expect(result.judgmentReason).toContain('3件');

    // 決定根拠データが構造化されて記録されていることを確認
    expect(result.decisionBasis).toEqual({
      deviationRateExceedance: {
        detected: true,
        actualRate: 15.5,
        thresholdRate: 15.0,
        exceedanceAmount: 0.5,
      },
      referenceDataInsufficiency: {
        detected: true,
        actualCount: 3,
        requiredCount: 5,
        shortfall: 2,
      },
      correctionFactorApplied: 1.08,
      region: '東京都',
      constructionType: '新築工事',
    });

    // 修正指示内容が正確に記録されていることを検証
    expect(result.modificationInstruction).toEqual({
      instructionId: expect.any(String),
      instructionType: 'PRICE_ADJUSTMENT',
      reason: '相場乖離率超過 かつ 参照データ件数不足による修正必須',
      suggestedAdjustmentAmount: expect.any(Number),
      priority: 'HIGH',
      targetEvaluator: testCase.evaluatorId,
      issuedAt: expect.any(String),
      expiresAt: expect.any(String),
    });

    // 修正指示の期日が適切に設定されていることを確認（発行から2営業日以内）
    const instructionIssuedDate = new Date(result.modificationInstruction.issuedAt);
    const instructionExpiresDate = new Date(result.modificationInstruction.expiresAt);
    const daysDifference = Math.ceil(
      (instructionExpiresDate.getTime() - instructionIssuedDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDifference).toBeLessThanOrEqual(2);

    // 修正指示フラグと承認待ちステータスが同期していることを確認
    expect(result.modificationFlagSet && result.status === 'PENDING_APPROVAL').toBe(true);

    // 監査証跡として評価者情報と評価時刻が記録されていることを確認
    expect(result.auditTrail).toEqual({
      evaluatorId: testCase.evaluatorId,
      evaluationTimestamp: testCase.evaluationTimestamp.toISOString(),
      modificationDecisionTimestamp: expect.any(String),
      judgmentRecordId: expect.any(String),
    });

    // 提案された調整額が乖離額に基づいて計算されていることを検証
    const expectedAdjustmentAmount = testCase.deviationAmount;
    expect(result.modificationInstruction.suggestedAdjustmentAmount).toBe(expectedAdjustmentAmount);
  });
});