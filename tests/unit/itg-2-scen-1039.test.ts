import { recordAuditTrailWithIntegrity } from '../../src/logic/it-6-2-2-1';

describe('IT-6-2-2-1: 査定根拠の改ざん防止と監査証跡記録', () => {
  test('SCEN-1039: 査定根拠妥当性判定完了後、全プロセスが改ざん不可能な状態で記録される', () => {
    // ========== 前提条件 ==========
    // 査定案件の基本情報
    const caseId = 'CASE-20240115-001';
    const assessorId = 'ASSESSOR-0001';
    const assessorName = '査定員 山田太郎';
    const completionTime = new Date('2024-01-15T14:30:00Z');

    // 参照データ（市場相場・同等品比較）
    const referenceData = {
      marketPrice: 1500000,
      priceSource: '物価本 2024年1月版',
      equivalentComparison: [
        {
          itemId: 'ITEM-001',
          standardPrice: 1450000,
          referenceDate: '2024-01-10',
          region: '東京都',
        },
      ],
      referenceCount: 5,
      dataQualityScore: 92,
    };

    // 判定ロジック設定
    const judgmentLogic = {
      logicId: 'LOGIC-STD-001',
      logicVersion: '1.0',
      category: '建築工事',
      workType: '躯体工事',
      priceRangeMin: 1400000,
      priceRangeMax: 1600000,
      tolerancePercentage: 5.5,
      appliedCorrectionCoefficients: {
        regional: 1.02,
        seasonal: 1.01,
        scaleAdjustment: 0.98,
      },
    };

    // 査정 금액 정보
    const assessmentAmount = {
      quotedPrice: 1550000,
      standardPrice: 1500000,
      deviationAmount: 50000,
      deviationPercentage: 3.33,
    };

    // 乖離理由
    const deviationReason =
      '東京都内での施工実績に基づき、地域補正係数1.02を適用。季節調整も反映。';

    // 妥当性判定結果
    const validityJudgmentResult = {
      judgmentId: 'JUDGMENT-20240115-001',
      isValid: true,
      reviewedByLeaderId: 'LEAD-0001',
      reviewedByLeaderName: '部門長 田中花子',
      reviewCompletionTime: new Date('2024-01-15T14:35:00Z'),
      reasons: ['相場範囲内', '補正係数妥当', '参照データ十分'],
    };

    // 修正履歴（妥当性判定前の過程）
    const correctionHistory = [
      {
        timestamp: new Date('2024-01-15T14:20:00Z'),
        fieldName: '判定ロジック',
        beforeValue: 'LOGIC-STD-002',
        afterValue: 'LOGIC-STD-001',
        modifierName: '査定員 山田太郎',
        reason: '正しいロジックバージョンに修正',
      },
      {
        timestamp: new Date('2024-01-15T14:25:00Z'),
        fieldName: '地域補正係数',
        beforeValue: '1.00',
        afterValue: '1.02',
        modifierName: '査定員 山田太郎',
        reason: '東京都内での標準補正係数を適用',
      },
    ];

    // ========== 実行 ==========
    const result = recordAuditTrailWithIntegrity({
      caseId,
      assessorId,
      assessorName,
      completionTime,
      referenceData,
      judgmentLogic,
      assessmentAmount,
      deviationReason,
      validityJudgmentResult,
      correctionHistory,
    });

    // ========== 期待値の計算 ==========
    // ハッシュ値は記録されたプロセスデータ全体から再現可能
    // 検証対象: データ整合性チェックサム
    const expectedIntegrityChecksum =
      'e8f4a9c2b1d5e6f7a8b9c0d1e2f3a4b5';

    // 妥当性判定完了後の状態
    const expectedRecordedState = {
      caseId,
      assessorId,
      assessorName,
      completionTime,
      validityJudgmentApplied: true,
      validityJudgmentId: 'JUDGMENT-20240115-001',
      validityJudgmentResult: true,
      referenceDataCount: 1,
      referenceDataQuality: 92,
      marketPrice: 1500000,
      quotedPrice: 1550000,
      deviationAmount: 50000,
      deviationPercentageValue: 3.33,
      logicId: 'LOGIC-STD-001',
      logicVersion: '1.0',
      deviationReasonRecorded: true,
      correctionHistoryCount: 2,
      integrityHashMatches: true,
      immutable: true,
      tamperDetectionEnabled: true,
    };

    // ========== アサーション ==========
    // 1. 記録されたデータの構造と完全性
    expect(result.recordedData).toEqual(expectedRecordedState);

    // 2. ハッシュ値が一致（改ざんなし）
    expect(result.integrityChecksum).toBe(expectedIntegrityChecksum);

    // 3. 妥当性判定の完全記録
    expect(result.recordedData.validityJudgmentApplied).toBe(true);
    expect(result.recordedData.validityJudgmentId).toBe(
      'JUDGMENT-20240115-001'
    );
    expect(result.recordedData.validityJudgmentResult).toBe(true);

    // 4. 参照データの完全記録
    expect(result.recordedData.referenceDataCount).toBe(1);
    expect(result.recordedData.referenceDataQuality).toBe(92);
    expect(result.recordedData.marketPrice).toBe(1500000);

    // 5. 判定ロジックの完全記録
    expect(result.recordedData.logicId).toBe('LOGIC-STD-001');
    expect(result.recordedData.logicVersion).toBe('1.0');

    // 6. 査定金額と乖離情報の完全記録
    expect(result.recordedData.quotedPrice).toBe(1550000);
    expect(result.recordedData.deviationAmount).toBe(50000);
    expect(result.recordedData.deviationPercentageValue).toBe(3.33);
    expect(result.recordedData.deviationReasonRecorded).toBe(true);

    // 7. 修正履歴の完全記録
    expect(result.recordedData.correctionHistoryCount).toBe(2);

    // 8. 改ざん防止機構の有効化
    expect(result.recordedData.immutable).toBe(true);
    expect(result.recordedData.tamperDetectionEnabled).toBe(true);

    // 9. ハッシュ値の一致確認（改ざんなし）
    expect(result.recordedData.integrityHashMatches).toBe(true);

    // 10. 改ざん検出結果：検出されるべき改ざんがない
    expect(result.tamperDetectionResult).toEqual({
      tamperDetected: false,
      modifiedFields: [],
      integrityStatus: 'VERIFIED',
      verificationTimestamp: expect.any(Date),
    });

    // 11. 監査ログの記録
    expect(result.auditLog).toEqual({
      totalLogEntries: 3, // 妥当性判定 + 2件の修正履歴
      logEntriesRecorded: [
        {
          sequence: 1,
          timestamp: new Date('2024-01-15T14:20:00Z'),
          action: 'CORRECTION',
          fieldName: '判定ロジック',
          modifierName: '査定員 山田太郎',
          isRecorded: true,
        },
        {
          sequence: 2,
          timestamp: new Date('2024-01-15T14:25:00Z'),
          action: 'CORRECTION',
          fieldName: '地域補正係数',
          modifierName: '査定員 山田太郎',
          isRecorded: true,
        },
        {
          sequence: 3,
          timestamp: new Date('2024-01-15T14:35:00Z'),
          action: 'VALIDITY_JUDGMENT_COMPLETED',
          fieldName: 'validityJudgmentResult',
          modifierName: '部門長 田中花子',
          isRecorded: true,
        },
      ],
      allEntriesImmutable: true,
    });

    // 12. システムの改ざん不可能状態の確認
    expect(result.systemState).toEqual({
      dataImmutable: true,
      hashVerificationRequired: true,
      hashVerificationStatus: 'PASSED',
      modificationAttemptDetection: 'ENABLED',
      unauthorizedAccessProtection: 'ENABLED',
    });

    // 13. 修正試行時の動作検証用メタデータ
    expect(result.integrityMetadata).toEqual({
      recordingMethod: 'IMMUTABLE_LOG',
      hashAlgorithm: 'SHA256',
      blockchainLogging: true,
      encryptionEnabled: true,
      accessControlLevel: 'STRICT',
      modificationAttemptLogged: true,
    });
  });
});