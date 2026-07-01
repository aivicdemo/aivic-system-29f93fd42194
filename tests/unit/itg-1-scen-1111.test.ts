import { validateIntegratedBusinessOperations } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質管理・請求自動化システム - 3業務統合検証', () => {
  test('SCEN-1111: 3業務中2業務が合格、1業務が未評価の場合、判定保留となること', () => {
    // Arrange
    const businessOperationA = {
      operationId: 'OP-A-001',
      operationName: '営業データ品質チェック',
      evaluationStatus: 'PASSED',
      completionTimestamp: new Date('2024-01-15T10:30:00Z'),
      evaluationDetails: {
        requiredFieldsValidation: true,
        dataTypeValidation: true,
        valueRangeValidation: true,
        anomalyDetection: false,
      },
    };

    const businessOperationB = {
      operationId: 'OP-B-001',
      operationName: '請求対象項目抽出ルール確認',
      evaluationStatus: 'PASSED',
      completionTimestamp: new Date('2024-01-15T10:45:00Z'),
      evaluationDetails: {
        contractIntegrityCheck: true,
        extractionRuleValidation: true,
        amountCalculationLogicValidation: true,
      },
    };

    const businessOperationC = {
      operationId: 'OP-C-001',
      operationName: '請求額計算結果検証',
      evaluationStatus: 'PENDING',
      completionTimestamp: null,
      evaluationDetails: {
        calculationAccuracyCheck: null,
        discountApplicationValidation: null,
        exceptionalPatternDetection: null,
      },
    };

    const integrationInput = {
      operationList: [
        businessOperationA,
        businessOperationB,
        businessOperationC,
      ],
      evaluationTimestamp: new Date('2024-01-15T11:00:00Z'),
      systemUserId: 'USER-001',
      operationContextId: 'CTX-2024-01-15-001',
    };

    // Act
    const result = validateIntegratedBusinessOperations(integrationInput);

    // Assert - 判定結果が「判定保留」であること
    expect(result.integrationJudgment).toBe('JUDGMENT_PENDING');
    expect(result.judgeableBusinessCount).toBe(2);
    expect(result.pendingBusinessCount).toBe(1);
    expect(result.failedBusinessCount).toBe(0);
    expect(result.totalBusinessCount).toBe(3);

    // Assert - 判定保留理由に未評価業務が含まれていること
    expect(result.judgementReason).toMatch(/未評価/);
    expect(result.pendingOperationIds).toContain('OP-C-001');

    // Assert - 後続処理実行フラグが false であること（請求自動化処理が実行されない）
    expect(result.canProceedToAutomatedBilling).toBe(false);

    // Assert - 各業務の評価ステータスが正確に記録されていること
    expect(result.operationEvaluationSummary).toEqual({
      passed: ['OP-A-001', 'OP-B-001'],
      pending: ['OP-C-001'],
      failed: [],
    });

    // Assert - タイムスタンプが記録されていること
    expect(result.judgementTimestamp).toEqual(
      new Date('2024-01-15T11:00:00Z')
    );

    // Assert - 判定保留中に追加の検証が必要なフィールドが明示されていること
    expect(result.requiredFollowUpActions).toContain('OP-C-001');
    expect(result.requiredFollowUpActions.length).toBeGreaterThanOrEqual(1);

    // Assert - システムログ用の判定ロジック実行記録が生成されていること
    expect(result.auditLog).toBeDefined();
    expect(result.auditLog.logTimestamp).toEqual(
      new Date('2024-01-15T11:00:00Z')
    );
    expect(result.auditLog.userId).toBe('USER-001');
    expect(result.auditLog.contextId).toBe('CTX-2024-01-15-001');
    expect(result.auditLog.judgeLogic).toMatch(/統合判定ロジック/);
  });
});