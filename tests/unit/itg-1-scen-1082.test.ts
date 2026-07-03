import { evaluateNewStaffIntegrated } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 新入スタッフ統合評価', () => {
  test('SCEN-1082: 3業務すべてが合格判定の場合に次フェーズ進行判定が返される', () => {
    // 準備: 新入スタッフの3業務評価データを作成
    // 業務1: 営業データ品質管理
    // 業務2: 請求自動化
    // 業務3: その他必須業務
    const staffEvaluationInput = {
      staffId: 'STAFF-20240115-001',
      evaluationPeriod: '2024-01',
      businessTasks: [
        {
          taskId: 'TASK-SALES-DATA-QUALITY',
          taskName: '営業データ品質管理',
          evaluationScore: 95,
          evaluationResult: 'PASS',
          evaluationDetails: {
            requiredItemsCompleteness: 100,
            dataTypeAccuracy: 98,
            valueRangeValidity: 92,
            passThreshold: 80
          }
        },
        {
          taskId: 'TASK-BILLING-AUTOMATION',
          taskName: '請求自動化',
          evaluationScore: 88,
          evaluationResult: 'PASS',
          evaluationDetails: {
            invoiceGenerationCorrectness: 90,
            billableItemExtraction: 87,
            amountCalculationAccuracy: 86,
            passThreshold: 80
          }
        },
        {
          taskId: 'TASK-CONTRACT-MANAGEMENT',
          taskName: 'その他必須業務（契約書管理）',
          evaluationScore: 92,
          evaluationResult: 'PASS',
          evaluationDetails: {
            versionManagementAccuracy: 94,
            documentIndexing: 91,
            customerInfoMapping: 90,
            passThreshold: 80
          }
        }
      ],
      evaluationTimestamp: '2024-01-15T09:00:00Z',
      evaluatorId: 'ADMIN-001'
    };

    // 実行: 統合評価機能で3業務の評価結果を送信
    const integrationResult = evaluateNewStaffIntegrated(staffEvaluationInput);

    // 検証1: 統合評価結果が正常に返される
    expect(integrationResult).toBeDefined();
    expect(integrationResult).toHaveProperty('phaseAdvancementDecision');

    // 検証2: 3業務すべてが合格判定
    expect(integrationResult.individualTaskResults).toHaveLength(3);
    expect(integrationResult.individualTaskResults[0].evaluationResult).toBe('PASS');
    expect(integrationResult.individualTaskResults[1].evaluationResult).toBe('PASS');
    expect(integrationResult.individualTaskResults[2].evaluationResult).toBe('PASS');

    // 検証3: 統合評価スコアが計算される（3業務の平均）
    const expectedAverageScore = (95 + 88 + 92) / 3; // 91.67
    expect(integrationResult.overallEvaluationScore).toBeCloseTo(91.67, 1);

    // 検証4: 次フェーズ進行判定が『進行許可』で返される
    expect(integrationResult.phaseAdvancementDecision).toBe('ADVANCE_TO_NEXT_PHASE');
    expect(integrationResult.phaseAdvancementReasonCode).toBe('ALL_TASKS_PASSED');

    // 検証5: 進行許可の詳細メッセージが含まれる
    expect(integrationResult.phaseAdvancementMessage).toContain('すべての業務');
    expect(integrationResult.phaseAdvancementMessage).toContain('合格');

    // 検証6: 進行許可状態（ステータス）が明確に設定されている
    expect(integrationResult.canAdvanceToNextPhase).toBe(true);

    // 検証7: 評価タイムスタンプと評価完了時刻が記録される
    expect(integrationResult.evaluationCompletedAt).toBeDefined();
    expect(new Date(integrationResult.evaluationCompletedAt).getTime()).toBeGreaterThan(0);

    // 検証8: スタッフIDが評価結果に含まれる
    expect(integrationResult.staffId).toBe('STAFF-20240115-001');

    // 検証9: 各業務のスコアが記録される
    expect(integrationResult.individualTaskResults[0].score).toBe(95);
    expect(integrationResult.individualTaskResults[1].score).toBe(88);
    expect(integrationResult.individualTaskResults[2].score).toBe(92);

    // 検証10: 次フェーズへの進行判定が明示的に true を返す
    expect(integrationResult.phaseAdvancementDecision === 'ADVANCE_TO_NEXT_PHASE').toBe(true);
  });
});