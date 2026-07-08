import { recordAuditTrail, getAllModificationHistory, verifyAuditTrailIntegrity } from '../../src/logic/it-6-2-2-1';

describe('査定根拠妥当性検証・改ざん防止機能', () => {
  test('SCEN-1042: 修正履歴が10件以上ある複雑な査定案件でも全ての修正履歴が完全に記録される', () => {
    // ========== 1. テストデータの初期化 ==========
    const assessmentCaseId = 'CASE-2024-001';
    const initialAssessmentAmount = 5000000;
    const initialRationale = '標準単価を適用';
    const initialEvaluationItems = {
      priceIndex: 100,
      qualityScore: 85,
      riskLevel: 2,
    };

    // ========== 2. 11件の修正履歴を生成・記録 ==========
    const modificationRecords: Array<{
      modificationId: string;
      caseId: string;
      modifiedBy: string;
      modifiedAt: string;
      changeType: string;
      previousValue: unknown;
      newValue: unknown;
      reason: string;
      sequenceNumber: number;
    }> = [];

    const modifiers = ['assessor_001', 'assessor_002', 'department_head', 'assessor_001'];
    const changeTypes = [
      'assessmentAmount',
      'rationale',
      'evaluationItem',
      'assessmentAmount',
      'rationale',
      'evaluationItem',
      'assessmentAmount',
      'rationale',
      'evaluationItem',
      'assessmentAmount',
      'rationale',
    ];

    let currentAssessmentAmount = initialAssessmentAmount;
    let currentRationale = initialRationale;
    let currentEvaluationItems = { ...initialEvaluationItems };

    for (let i = 0; i < 11; i++) {
      const modifiedAtTime = new Date('2024-01-15T10:00:00Z');
      modifiedAtTime.setMinutes(modifiedAtTime.getMinutes() + i * 5);

      let previousValue: unknown;
      let newValue: unknown;

      if (changeTypes[i] === 'assessmentAmount') {
        previousValue = currentAssessmentAmount;
        newValue = currentAssessmentAmount + 100000 * (i + 1);
        currentAssessmentAmount = newValue as number;
      } else if (changeTypes[i] === 'rationale') {
        previousValue = currentRationale;
        newValue = `${currentRationale} - 修正${i + 1}`;
        currentRationale = newValue as string;
      } else if (changeTypes[i] === 'evaluationItem') {
        previousValue = { ...currentEvaluationItems };
        currentEvaluationItems.priceIndex = (currentEvaluationItems.priceIndex as number) + 5;
        newValue = { ...currentEvaluationItems };
      }

      const record = {
        modificationId: `MOD-${assessmentCaseId}-${String(i + 1).padStart(3, '0')}`,
        caseId: assessmentCaseId,
        modifiedBy: modifiers[i % modifiers.length],
        modifiedAt: modifiedAtTime.toISOString(),
        changeType: changeTypes[i],
        previousValue,
        newValue,
        reason: `修正理由${i + 1}`,
        sequenceNumber: i + 1,
      };

      modificationRecords.push(record);

      // ========== 3. 各修正をrecordAuditTrailで記録 ==========
      const recordResult = recordAuditTrail({
        caseId: assessmentCaseId,
        modificationId: record.modificationId,
        modifiedBy: record.modifiedBy,
        modifiedAt: record.modifiedAt,
        changeType: record.changeType,
        previousValue: record.previousValue,
        newValue: record.newValue,
        reason: record.reason,
        sequenceNumber: record.sequenceNumber,
      });

      expect(recordResult).toEqual({
        success: true,
        modificationId: record.modificationId,
        caseId: assessmentCaseId,
        sequenceNumber: record.sequenceNumber,
        recordedAt: record.modifiedAt,
      });
    }

    // ========== 4. 修正履歴一覧を取得 ==========
    const allHistories = getAllModificationHistory({
      caseId: assessmentCaseId,
      sortBy: 'sequenceNumber',
      sortOrder: 'asc',
    });

    // ========== 5. 全11件の履歴が記録されたことを検証 ==========
    expect(allHistories.totalCount).toBe(11);
    expect(allHistories.records.length).toBe(11);

    // ========== 6. 各修正履歴の詳細情報が正確に保持されることを検証 ==========
    for (let i = 0; i < 11; i++) {
      const record = allHistories.records[i];
      expect(record.modificationId).toBe(
        `MOD-${assessmentCaseId}-${String(i + 1).padStart(3, '0')}`
      );
      expect(record.caseId).toBe(assessmentCaseId);
      expect(record.sequenceNumber).toBe(i + 1);
      expect(record.modifiedBy).toBe(modifiers[i % modifiers.length]);
      expect(record.changeType).toBe(changeTypes[i]);
      expect(record.reason).toBe(`修正理由${i + 1}`);

      // タイムスタンプが正確に記録されたことを検証
      const expectedTime = new Date('2024-01-15T10:00:00Z');
      expectedTime.setMinutes(expectedTime.getMinutes() + i * 5);
      expect(record.modifiedAt).toBe(expectedTime.toISOString());

      // changeType に応じた値の変更が正確に記録されたことを検証
      if (changeTypes[i] === 'assessmentAmount') {
        expect(typeof record.previousValue).toBe('number');
        expect(typeof record.newValue).toBe('number');
        expect((record.newValue as number) - (record.previousValue as number)).toBe(
          100000 * (i + 1)
        );
      } else if (changeTypes[i] === 'rationale') {
        expect(typeof record.previousValue).toBe('string');
        expect(typeof record.newValue).toBe('string');
        expect((record.newValue as string).includes(`修正${i + 1}`)).toBe(true);
      } else if (changeTypes[i] === 'evaluationItem') {
        expect(typeof record.previousValue).toBe('object');
        expect(typeof record.newValue).toBe('object');
        const prevEval = record.previousValue as Record<string, unknown>;
        const newEval = record.newValue as Record<string, unknown>;
        expect((newEval.priceIndex as number) - (prevEval.priceIndex as number)).toBe(5);
      }
    }

    // ========== 7. ソート機能（昇順）が正常に動作することを検証 ==========
    const sortedAsc = getAllModificationHistory({
      caseId: assessmentCaseId,
      sortBy: 'sequenceNumber',
      sortOrder: 'asc',
    });

    for (let i = 0; i < sortedAsc.records.length - 1; i++) {
      expect(sortedAsc.records[i].sequenceNumber).toBeLessThanOrEqual(
        sortedAsc.records[i + 1].sequenceNumber
      );
    }

    // ========== 8. ソート機能（降順）が正常に動作することを検証 ==========
    const sortedDesc = getAllModificationHistory({
      caseId: assessmentCaseId,
      sortBy: 'sequenceNumber',
      sortOrder: 'desc',
    });

    for (let i = 0; i < sortedDesc.records.length - 1; i++) {
      expect(sortedDesc.records[i].sequenceNumber).toBeGreaterThanOrEqual(
        sortedDesc.records[i + 1].sequenceNumber
      );
    }

    // ========== 9. フィルター機能（修正者別）が正常に動作することを検証 ==========
    const filteredByAssessor001 = getAllModificationHistory({
      caseId: assessmentCaseId,
      filterBy: 'modifiedBy',
      filterValue: 'assessor_001',
    });

    expect(filteredByAssessor001.records.every((r) => r.modifiedBy === 'assessor_001')).toBe(true);
    // assessor_001 は i=0, 3, 7, 10 で出現（modifiers配列のindex 0, 1, 2, 3 で pattern repeat）
    expect(filteredByAssessor001.totalCount).toBe(4);

    // ========== 10. フィルター機能（日付範囲別）が正常に動作することを検証 ==========
    const startDate = new Date('2024-01-15T10:12:00Z').toISOString();
    const endDate = new Date('2024-01-15T10:32:00Z').toISOString();

    const filteredByDateRange = getAllModificationHistory({
      caseId: assessmentCaseId,
      filterBy: 'dateRange',
      filterValue: { startDate, endDate },
    });

    expect(
      filteredByDateRange.records.every((r) => r.modifiedAt >= startDate && r.modifiedAt <= endDate)
    ).toBe(true);

    // ========== 11. データベース整合性検証（改ざん検出）==========
    const integrityCheck = verifyAuditTrailIntegrity({
      caseId: assessmentCaseId,
      expectedRecordCount: 11,
    });

    expect(integrityCheck).toEqual({
      isValid: true,
      totalRecordsInDatabase: 11,
      checksPerformed: [
        'sequenceNumberContinuity',
        'timestampOrdering',
        'modificationIdUniqueness',
        'dataConsistency',
      ],
      checksResult: {
        sequenceNumberContinuity: true,
        timestampOrdering: true,
        modificationIdUniqueness: true,
        dataConsistency: true,
      },
      tamperedRecords: [],
      integrityStatus: 'VERIFIED',
    });

    // ========== 12. 修正履歴の詳細情報が一覧内で正確に保持されることを再確認 ==========
    const detailedCheck = allHistories.records.map((record, idx) => ({
      hasModificationId: Boolean(record.modificationId),
      hasCaseId: record.caseId === assessmentCaseId,
      hasSequenceNumber: record.sequenceNumber === idx + 1,
      hasTimestamp: Boolean(record.modifiedAt),
      hasModifier: Boolean(record.modifiedBy),
      hasChangeType: Boolean(record.changeType),
      hasPreviousValue: record.previousValue !== undefined && record.previousValue !== null,
      hasNewValue: record.newValue !== undefined && record.newValue !== null,
      hasReason: Boolean(record.reason),
    }));

    detailedCheck.forEach((check) => {
      expect(check.hasModificationId).toBe(true);
      expect(check.hasCaseId).toBe(true);
      expect(check.hasSequenceNumber).toBe(true);
      expect(check.hasTimestamp).toBe(true);
      expect(check.hasModifier).toBe(true);
      expect(check.hasChangeType).toBe(true);
      expect(check.hasPreviousValue).toBe(true);
      expect(check.hasNewValue).toBe(true);
      expect(check.hasReason).toBe(true);
    });

    // ========== 13. 修正履歴の完全性チェック ==========
    const completenessCheck = {
      totalRecordsExpected: 11,
      totalRecordsActual: allHistories.records.length,
      allRecordsPresent: allHistories.records.length === 11,
      noDataLoss: allHistories.records.every((r) => r.modificationId && r.sequenceNumber),
      sequentialOrdering: allHistories.records.every((r, idx) => r.sequenceNumber === idx + 1),
    };

    expect(completenessCheck.totalRecordsExpected).toBe(completenessCheck.totalRecordsActual);
    expect(completenessCheck.allRecordsPresent).toBe(true);
    expect(completenessCheck.noDataLoss).toBe(true);
    expect(completenessCheck.sequentialOrdering).toBe(true);
  });
});