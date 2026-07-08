import { recordVerificationProcessStep, retrieveVerificationProcessHistory, validateAuditTrail } from '../../src/logic/it-6-2-2-1';

describe('検証プロセス履歴の一元管理・監査記録機能', () => {
  test('SCEN-1391: 検証プロセス内の各ステップの実施者・実施日時・入力パラメータが追跡可能な状態で保持される', () => {
    // ========== Setup: テストデータの準備 ==========
    const verificationProcessId = 'VP-20240115-001';
    const processName = '相場判定ロジック検証';
    const step1Implementer = 'user-査定員-A';
    const step1Timestamp = new Date('2024-01-15T09:30:00Z');
    const step1InputParams = {
      targetRegion: '東京都',
      constructionType: '一般土木',
      priceData: { min: 1000000, max: 5000000 }
    };

    const step2Implementer = 'user-部署長-B';
    const step2Timestamp = new Date('2024-01-15T10:15:00Z');
    const step2InputParams = {
      approvalStatus: 'approved',
      reviewNotes: '基準範囲内で妥当'
    };

    const step3Implementer = 'user-運用者-C';
    const step3Timestamp = new Date('2024-01-15T11:00:00Z');
    const step3InputParams = {
      modelVersion: 'v2.1',
      learningDataUpdateCount: 450,
      deploymentEnv: 'production'
    };

    // ========== Step 1: 最初の検証ステップを記録 ==========
    const step1Record = recordVerificationProcessStep({
      verificationProcessId,
      processName,
      stepSequence: 1,
      stepName: '初期検証_査定員確認',
      implementerId: step1Implementer,
      implementedAt: step1Timestamp,
      inputParameters: step1InputParams,
      outputResult: {
        status: 'in_progress',
        validationPassed: true,
        notes: '過去案件データとの照合完了'
      }
    });

    // ========== Assertion 1: 第1ステップ記録の完全性 ==========
    expect(step1Record).toEqual({
      verificationProcessId,
      processName,
      stepSequence: 1,
      stepName: '初期検証_査定員確認',
      implementerId: step1Implementer,
      implementedAt: step1Timestamp,
      inputParameters: step1InputParams,
      outputResult: {
        status: 'in_progress',
        validationPassed: true,
        notes: '過去案件データとの照合完了'
      },
      recordedAt: expect.any(Date),
      auditHash: expect.any(String),
      immutable: true
    });
    expect(step1Record.auditHash).toBeTruthy();
    expect(step1Record.immutable).toBe(true);

    // ========== Step 2: 第2ステップを記録 ==========
    const step2Record = recordVerificationProcessStep({
      verificationProcessId,
      processName,
      stepSequence: 2,
      stepName: '部署長承認_判定基準確認',
      implementerId: step2Implementer,
      implementedAt: step2Timestamp,
      inputParameters: step2InputParams,
      outputResult: {
        status: 'approved',
        validationPassed: true,
        notes: '判定基準の統一性を確認'
      }
    });

    // ========== Assertion 2: 第2ステップ記録の完全性 ==========
    expect(step2Record).toEqual({
      verificationProcessId,
      processName,
      stepSequence: 2,
      stepName: '部署長承認_判定基準確認',
      implementerId: step2Implementer,
      implementedAt: step2Timestamp,
      inputParameters: step2InputParams,
      outputResult: {
        status: 'approved',
        validationPassed: true,
        notes: '判定基準の統一性を確認'
      },
      recordedAt: expect.any(Date),
      auditHash: expect.any(String),
      immutable: true
    });

    // ========== Step 3: 第3ステップを記録（運用者による最終確認） ==========
    const step3Record = recordVerificationProcessStep({
      verificationProcessId,
      processName,
      stepSequence: 3,
      stepName: '運用者確認_本番デプロイ',
      implementerId: step3Implementer,
      implementedAt: step3Timestamp,
      inputParameters: step3InputParams,
      outputResult: {
        status: 'completed',
        validationPassed: true,
        notes: 'モデル更新後の精度測定完了、本番適用可'
      }
    });

    // ========== Assertion 3: 第3ステップ記録の完全性 ==========
    expect(step3Record).toEqual({
      verificationProcessId,
      processName,
      stepSequence: 3,
      stepName: '運用者確認_本番デプロイ',
      implementerId: step3Implementer,
      implementedAt: step3Timestamp,
      inputParameters: step3InputParams,
      outputResult: {
        status: 'completed',
        validationPassed: true,
        notes: 'モデル更新後の精度測定完了、本番適用可'
      },
      recordedAt: expect.any(Date),
      auditHash: expect.any(String),
      immutable: true
    });

    // ========== Step 4: 検証プロセス全体の履歴を取得 ==========
    const processHistory = retrieveVerificationProcessHistory({
      verificationProcessId,
      includeDetailedParams: true,
      sortOrder: 'asc'
    });

    // ========== Assertion 4: 取得した履歴の完全性・順序性 ==========
    expect(processHistory).toEqual({
      verificationProcessId,
      processName,
      totalSteps: 3,
      completedSteps: 3,
      overallStatus: 'completed',
      steps: [
        {
          stepSequence: 1,
          stepName: '初期検証_査定員確認',
          implementerId: step1Implementer,
          implementedAt: step1Timestamp,
          inputParameters: step1InputParams,
          outputResult: {
            status: 'in_progress',
            validationPassed: true,
            notes: '過去案件データとの照合完了'
          }
        },
        {
          stepSequence: 2,
          stepName: '部署長承認_判定基準確認',
          implementerId: step2Implementer,
          implementedAt: step2Timestamp,
          inputParameters: step2InputParams,
          outputResult: {
            status: 'approved',
            validationPassed: true,
            notes: '判定基準の統一性を確認'
          }
        },
        {
          stepSequence: 3,
          stepName: '運用者確認_本番デプロイ',
          implementerId: step3Implementer,
          implementedAt: step3Timestamp,
          inputParameters: step3InputParams,
          outputResult: {
            status: 'completed',
            validationPassed: true,
            notes: 'モデル更新後の精度測定完了、本番適用可'
          }
        }
      ],
      retrievedAt: expect.any(Date)
    });

    // ========== Assertion 5: ステップの時系列順序を検証 ==========
    expect(processHistory.steps[0].implementedAt.getTime()).toBeLessThan(
      processHistory.steps[1].implementedAt.getTime()
    );
    expect(processHistory.steps[1].implementedAt.getTime()).toBeLessThan(
      processHistory.steps[2].implementedAt.getTime()
    );

    // ========== Step 5: 入力パラメータが完全に保持されていることを検証 ==========
    expect(processHistory.steps[0].inputParameters).toEqual(step1InputParams);
    expect(processHistory.steps[1].inputParameters).toEqual(step2InputParams);
    expect(processHistory.steps[2].inputParameters).toEqual(step3InputParams);

    // ========== Step 6: 実施者情報の追跡可能性を検証 ==========
    const implementerIds = processHistory.steps.map(step => step.implementerId);
    expect(implementerIds).toEqual([step1Implementer, step2Implementer, step3Implementer]);
    expect(implementerIds).toContain('user-査定員-A');
    expect(implementerIds).toContain('user-部署長-B');
    expect(implementerIds).toContain('user-運用者-C');

    // ========== Step 7: 複数の検証プロセスの追跡可能性を確認 ==========
    const verificationProcessId2 = 'VP-20240115-002';
    const processName2 = '過去案件データクリーニング検証';
    
    const process2Step1 = recordVerificationProcessStep({
      verificationProcessId: verificationProcessId2,
      processName: processName2,
      stepSequence: 1,
      stepName: 'データ品質チェック',
      implementerId: 'user-データエンジニア-D',
      implementedAt: new Date('2024-01-15T09:00:00Z'),
      inputParameters: {
        datasetId: 'DS-2024-Q1',
        recordCount: 5000,
        validationRules: ['deduplication', 'nullcheck', 'typevalidation']
      },
      outputResult: {
        status: 'in_progress',
        validationPassed: true,
        recordsChecked: 5000,
        errorsFound: 12
      }
    });

    const process2Step2 = recordVerificationProcessStep({
      verificationProcessId: verificationProcessId2,
      processName: processName2,
      stepSequence: 2,
      stepName: '品質確認_承認',
      implementerId: 'user-QA管理者-E',
      implementedAt: new Date('2024-01-15T10:30:00Z'),
      inputParameters: {
        errorThreshold: 20,
        approvalCriteria: 'errors_below_threshold'
      },
      outputResult: {
        status: 'approved',
        validationPassed: true,
        notes: 'エラー件数が閾値以下、承認可'
      }
    });

    // ========== Assertion 6: 複数プロセスの個別追跡可能性 ==========
    expect(process2Step1.verificationProcessId).toBe(verificationProcessId2);
    expect(process2Step2.verificationProcessId).toBe(verificationProcessId2);
    expect(process2Step1.implementerId).toBe('user-データエンジニア-D');
    expect(process2Step2.implementerId).toBe('user-QA管理者-E');

    // ========== Step 8: 監査ログ機能による改ざん防止検証 ==========
    const auditTrailValidation = validateAuditTrail({
      verificationProcessId,
      steps: [step1Record, step2Record, step3Record],
      validateIntegrity: true,
      checkImmutability: true
    });

    // ========== Assertion 7: 監査ログが改ざんなく正確に記録されていることを検証 ==========
    expect(auditTrailValidation).toEqual({
      isValid: true,
      integrityCheckPassed: true,
      immutabilityCheckPassed: true,
      stepCount: 3,
      allStepsVerified: true,
      timestampSequenceValid: true,
      hashChainValid: true,
      violations: []
    });

    // ========== Assertion 8: 監査ログの改ざん検出テスト（intentional tampering detection） ==========
    const tamperedStep = {
      ...step1Record,
      inputParameters: {
        ...step1InputParams,
        priceData: { min: 999999, max: 5000001 } // 意図的な改変
      }
    };

    const tamperedAuditTrail = validateAuditTrail({
      verificationProcessId,
      steps: [tamperedStep, step2Record, step3Record],
      validateIntegrity: true,
      checkImmutability: true
    });

    // ========== Assertion 9: 改ざんが検出されることを確認 ==========
    expect(tamperedAuditTrail.isValid).toBe(false);
    expect(tamperedAuditTrail.integrityCheckPassed).toBe(false);
    expect(tamperedAuditTrail.violations).toContain(expect.stringMatching(/改ざん|整合性|ハッシュ/));

    // ========== Assertion 10: 完全な監査証跡の確認 ==========
    const auditRecords = [step1Record, step2Record, step3Record];
    const hasCompleteAudit = auditRecords.every(record => 
      record.verificationProcessId &&
      record.stepSequence &&
      record.stepName &&
      record.implementerId &&
      record.implementedAt &&
      record.inputParameters &&
      record.outputResult &&
      record.recordedAt &&
      record.auditHash &&
      record.immutable === true
    );
    expect(hasCompleteAudit).toBe(true);

    // ========== Assertion 11: 監査ログから全プロセス情報が復元可能であることを検証 ==========
    const reconstructedProcess = {
      verificationProcessId,
      processName,
      totalSteps: auditRecords.length,
      executionTimeline: auditRecords.map(record => ({
        sequenceNumber: record.stepSequence,
        stepName: record.stepName,
        executor: record.implementerId,
        executionTime: record.implementedAt,
        inputSnapshot: record.inputParameters,
        outputSnapshot: record.outputResult,
        recordingTime: record.recordedAt,
        integrityHash: record.auditHash
      }))
    };

    expect(reconstructedProcess.executionTimeline.length).toBe(3);
    expect(reconstructedProcess.executionTimeline[0].executor).toBe(step1Implementer);
    expect(reconstructedProcess.executionTimeline[1].executor).toBe(step2Implementer);
    expect(reconstructedProcess.executionTimeline[2].executor).toBe(step3Implementer);
    expect(reconstructedProcess.executionTimeline[0].executionTime).toEqual(step1Timestamp);
    expect(reconstructedProcess.executionTimeline[1].executionTime).toEqual(step2Timestamp);
    expect(reconstructedProcess.executionTimeline[2].executionTime).toEqual(step3Timestamp);
  });
});