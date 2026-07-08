import { recordStructuredJudgmentResult } from '../../src/logic/it-6-2-2-1';

describe('判定結果の構造化記録', () => {
  // SCEN-842
  test('判定内容・根拠データ・適用ロジック・査定員情報が正常に構造化されて記録される', () => {
    // 入力: 判定結果の構造化記録に必要なデータセット
    const appraisalId = 'APPR-20240115-001';
    const appraiserUserId = 'USER-APP-042';
    const appraiserName = 'Suzuki Taro';
    const executionTimestamp = new Date('2024-01-15T11:30:00Z');
    const quotationItemId = 'ITEM-2024-00156';
    const quotationAmount = 2850000;
    const marketReferenceAmount = 2800000;
    const deviationRate = ((quotationAmount - marketReferenceAmount) / marketReferenceAmount) * 100; // 1.79%
    const deviationAmount = quotationAmount - marketReferenceAmount;
    const toleranceRangeMin = 2520000;
    const toleranceRangeMax = 3080000;
    const withinToleranceRange = quotationAmount >= toleranceRangeMin && quotationAmount <= toleranceRangeMax;
    const referencePastCaseCount = 12;
    const referenceMarketDataVersion = '2024-01-10';
    const appliedCorrectionFactor = 1.02;
    const appliedLogicId = 'LOGIC-MARKET-MATCH-001';
    const appliedLogicName = 'Market Price Matching Logic';
    const appliedLogicVersion = '3.2';
    const judgedStatus = 'APPROVED';
    const judgedReason = 'Within acceptable deviation range and supported by 12 historical cases.';

    // 処理: recordStructuredJudgmentResult を呼び出し
    const recordedResult = recordStructuredJudgmentResult({
      appraisalId,
      appraiserUserId,
      appraiserName,
      executionTimestamp,
      quotationItemId,
      quotationAmount,
      marketReferenceAmount,
      deviationRate,
      deviationAmount,
      toleranceRangeMin,
      toleranceRangeMax,
      withinToleranceRange,
      referencePastCaseCount,
      referenceMarketDataVersion,
      appliedCorrectionFactor,
      appliedLogicId,
      appliedLogicName,
      appliedLogicVersion,
      judgedStatus,
      judgedReason,
    });

    // 検証: 判定内容フィールドが正確に記録されている
    expect(recordedResult.judgedStatus).toBe('APPROVED');
    expect(recordedResult.judgedReason).toBe('Within acceptable deviation range and supported by 12 historical cases.');

    // 検証: 根拠データ（査定基準、比較対象等）が構造化形式で記録されている
    expect(recordedResult.evidenceData.quotationAmount).toBe(2850000);
    expect(recordedResult.evidenceData.marketReferenceAmount).toBe(2800000);
    expect(recordedResult.evidenceData.deviationRate).toBe(1.7857142857142856); // 実際の計算結果
    expect(recordedResult.evidenceData.deviationAmount).toBe(50000);
    expect(recordedResult.evidenceData.toleranceRangeMin).toBe(2520000);
    expect(recordedResult.evidenceData.toleranceRangeMax).toBe(3080000);
    expect(recordedResult.evidenceData.withinToleranceRange).toBe(true);
    expect(recordedResult.evidenceData.referencePastCaseCount).toBe(12);
    expect(recordedResult.evidenceData.referenceMarketDataVersion).toBe('2024-01-10');

    // 検証: 適用ロジック（使用した判定ルール、アルゴリズム等）が記録されている
    expect(recordedResult.appliedLogic.logicId).toBe('LOGIC-MARKET-MATCH-001');
    expect(recordedResult.appliedLogic.logicName).toBe('Market Price Matching Logic');
    expect(recordedResult.appliedLogic.logicVersion).toBe('3.2');
    expect(recordedResult.appliedLogic.correctionFactor).toBe(1.02);

    // 検証: 査定員情報（ID、名前、実行日時等）が正確に記録されている
    expect(recordedResult.appraiserInfo.userId).toBe('USER-APP-042');
    expect(recordedResult.appraiserInfo.name).toBe('Suzuki Taro');
    expect(recordedResult.appraiserInfo.executionTimestamp).toEqual(new Date('2024-01-15T11:30:00Z'));

    // 検証: 関連ID情報が正確に記録されている
    expect(recordedResult.appraisalId).toBe('APPR-20240115-001');
    expect(recordedResult.quotationItemId).toBe('ITEM-2024-00156');

    // 検証: 全フィールドが対応するデータ型で正しく記録されている
    expect(typeof recordedResult.appraisalId).toBe('string');
    expect(typeof recordedResult.quotationItemId).toBe('string');
    expect(recordedResult.appraiserInfo).toEqual(expect.objectContaining({
      userId: expect.any(String),
      name: expect.any(String),
      executionTimestamp: expect.any(Date),
    }));
    expect(recordedResult.evidenceData).toEqual(expect.objectContaining({
      quotationAmount: expect.any(Number),
      marketReferenceAmount: expect.any(Number),
      deviationRate: expect.any(Number),
      deviationAmount: expect.any(Number),
      toleranceRangeMin: expect.any(Number),
      toleranceRangeMax: expect.any(Number),
      withinToleranceRange: expect.any(Boolean),
      referencePastCaseCount: expect.any(Number),
      referenceMarketDataVersion: expect.any(String),
    }));
    expect(recordedResult.appliedLogic).toEqual(expect.objectContaining({
      logicId: expect.any(String),
      logicName: expect.any(String),
      logicVersion: expect.any(String),
      correctionFactor: expect.any(Number),
    }));

    // 検証: 構造化記録データの整合性確認（判定内容と根拠データの一貫性）
    expect(recordedResult.judgedStatus).toBe('APPROVED');
    expect(recordedResult.evidenceData.withinToleranceRange).toBe(true);
    expect(recordedResult.evidenceData.deviationRate).toBeCloseTo(1.79, 1);

    // 検証: 完全性確認（全必須フィールドが存在）
    expect(recordedResult).toHaveProperty('appraisalId');
    expect(recordedResult).toHaveProperty('quotationItemId');
    expect(recordedResult).toHaveProperty('judgedStatus');
    expect(recordedResult).toHaveProperty('judgedReason');
    expect(recordedResult).toHaveProperty('evidenceData');
    expect(recordedResult).toHaveProperty('appliedLogic');
    expect(recordedResult).toHaveProperty('appraiserInfo');
    expect(recordedResult).toHaveProperty('recordedAt');
    expect(typeof recordedResult.recordedAt).toBe('string');
  });
});