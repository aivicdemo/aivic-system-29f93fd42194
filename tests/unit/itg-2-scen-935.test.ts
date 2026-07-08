import { describe, test, expect } from '@jest/globals';
import { diagnoseOcrAccuracyDegradation } from '../../src/logic/it-6-2-1-1';

describe('OCR読取精度が閾値以下のとき精度低下原因が自動診断される', () => {
  // SCEN-935
  test('should automatically diagnose OCR accuracy degradation causes when accuracy is below threshold', () => {
    // Arrange
    const threshold = 85;
    const currentOcrAccuracy = 78; // 78% < 85% threshold
    const previousOcrAccuracy = 92;
    const accuracyDeclineRate = ((previousOcrAccuracy - currentOcrAccuracy) / previousOcrAccuracy) * 100; // 15.22%

    const ocrReadingResult = {
      totalItems: 100,
      successfulReadings: 78,
      failedReadings: 22,
      failureLocations: [
        {
          position: 'line_3_column_5',
          characterType: 'numeric',
          readValue: '12X5',
          expectedValue: '1215',
          errorType: 'character_substitution',
        },
        {
          position: 'line_7_column_2',
          characterType: 'alphabet',
          readValue: 'TOTO',
          expectedValue: 'T0T0',
          errorType: 'font_confusion',
        },
        {
          position: 'line_5_column_1_to_10',
          characterType: 'numeric',
          readValue: '[unreadable]',
          expectedValue: '98765432',
          errorType: 'background_noise',
        },
        {
          position: 'line_12_column_3',
          characterType: 'special',
          readValue: '',
          expectedValue: '¥',
          errorType: 'image_quality',
        },
        {
          position: 'line_2_column_4',
          characterType: 'alphabet',
          readValue: 'rn',
          expectedValue: 'm',
          errorType: 'font_similarity',
        },
      ],
      imageQualityScore: 62,
      contrastRatio: 1.8,
      resolutionDpi: 180,
    };

    const diagnosticRequest = {
      ocrAccuracy: currentOcrAccuracy,
      accuracyThreshold: threshold,
      readingResult: ocrReadingResult,
      diagnosticTimestamp: '2024-01-15T10:30:00Z',
      sessionId: 'sess-20240115-001',
    };

    // Act
    const diagnosticResult = diagnoseOcrAccuracyDegradation(diagnosticRequest);

    // Assert - 診断結果が構造化データで返却される
    expect(diagnosticResult).toBeDefined();
    expect(typeof diagnosticResult).toBe('object');

    // 診断結果の基本構造を検証
    expect(diagnosticResult).toHaveProperty('diagnosisId');
    expect(diagnosticResult).toHaveProperty('timestamp');
    expect(diagnosticResult).toHaveProperty('accuracyBelowThreshold');
    expect(diagnosticResult).toHaveProperty('failureLocationAnalysis');
    expect(diagnosticResult).toHaveProperty('causeCategoryClassification');
    expect(diagnosticResult).toHaveProperty('confidenceScore');
    expect(diagnosticResult).toHaveProperty('diagnosticLog');

    // 閾値判定の検証
    expect(diagnosticResult.accuracyBelowThreshold).toBe(true);
    expect(diagnosticResult.currentAccuracy).toBe(78);
    expect(diagnosticResult.thresholdAccuracy).toBe(85);
    expect(diagnosticResult.accuracyDeclineRate).toBeCloseTo(15.22, 1);

    // 読取ミス箇所の分析結果を検証
    expect(diagnosticResult.failureLocationAnalysis).toBeDefined();
    expect(Array.isArray(diagnosticResult.failureLocationAnalysis)).toBe(true);
    expect(diagnosticResult.failureLocationAnalysis.length).toBe(5);

    // 1 番目の読取ミス箇所
    expect(diagnosticResult.failureLocationAnalysis[0]).toEqual({
      position: 'line_3_column_5',
      characterType: 'numeric',
      readValue: '12X5',
      expectedValue: '1215',
      errorType: 'character_substitution',
      severity: 'medium',
    });

    // 3 番目の読取ミス箇所（背景ノイズによる読取失敗）
    expect(diagnosticResult.failureLocationAnalysis[2]).toEqual({
      position: 'line_5_column_1_to_10',
      characterType: 'numeric',
      readValue: '[unreadable]',
      expectedValue: '98765432',
      errorType: 'background_noise',
      severity: 'high',
    });

    // 原因カテゴリの分類結果を検証
    expect(diagnosticResult.causeCategoryClassification).toBeDefined();
    expect(typeof diagnosticResult.causeCategoryClassification).toBe('object');

    // 各原因カテゴリの件数と割合を検証
    expect(diagnosticResult.causeCategoryClassification.imageQuality).toEqual({
      count: 1,
      percentage: 20,
      severity: 'high',
      description: 'Image quality issues detected',
    });

    expect(diagnosticResult.causeCategoryClassification.fontIssues).toEqual({
      count: 2,
      percentage: 40,
      severity: 'medium',
      description: 'Font confusion and similarity issues',
    });

    expect(diagnosticResult.causeCategoryClassification.backgroundNoise).toEqual({
      count: 1,
      percentage: 20,
      severity: 'high',
      description: 'Background noise interference',
    });

    expect(diagnosticResult.causeCategoryClassification.characterSubstitution).toEqual({
      count: 1,
      percentage: 20,
      severity: 'medium',
      description: 'Character misread or substituted',
    });

    // 信頼度スコアを検証（読取精度と診断信頼度の組み合わせ）
    expect(diagnosticResult.confidenceScore).toBeDefined();
    expect(typeof diagnosticResult.confidenceScore).toBe('number');
    expect(diagnosticResult.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(diagnosticResult.confidenceScore).toBeLessThanOrEqual(100);

    // 信頼度スコアは、読取精度が低いほど低くなり、画像品質が低いほど低くなる
    // 現在の読取精度 78% と画像品質 62 から計算される期待値
    const expectedConfidenceScore = (78 * 0.6 + 62 * 0.4); // 71.2
    expect(diagnosticResult.confidenceScore).toBeCloseTo(expectedConfidenceScore, 0);

    // 診断ログが構造化データとして記録されている
    expect(diagnosticResult.diagnosticLog).toBeDefined();
    expect(Array.isArray(diagnosticResult.diagnosticLog)).toBe(true);
    expect(diagnosticResult.diagnosticLog.length).toBeGreaterThan(0);

    // ログエントリの構造を検証
    expect(diagnosticResult.diagnosticLog[0]).toHaveProperty('timestamp');
    expect(diagnosticResult.diagnosticLog[0]).toHaveProperty('step');
    expect(diagnosticResult.diagnosticLog[0]).toHaveProperty('message');
    expect(diagnosticResult.diagnosticLog[0]).toHaveProperty('detail');

    // ログに診断プロセスの各ステップが記録されていることを確認
    const logSteps = diagnosticResult.diagnosticLog.map((entry: any) => entry.step);
    expect(logSteps).toContain('accuracy_check');
    expect(logSteps).toContain('failure_analysis');
    expect(logSteps).toContain('cause_classification');
    expect(logSteps).toContain('confidence_evaluation');

    // 診断 ID が生成されていることを確認（UUIDまたはUUID形式の文字列）
    expect(diagnosticResult.diagnosisId).toMatch(/^[a-f0-9\-]{36}$/i);

    // タイムスタンプが ISO 8601 形式であることを確認
    expect(diagnosticResult.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 推奨アクション情報が含まれていることを確認
    expect(diagnosticResult).toHaveProperty('recommendedActions');
    expect(Array.isArray(diagnosticResult.recommendedActions)).toBe(true);
    expect(diagnosticResult.recommendedActions.length).toBeGreaterThan(0);

    // 推奨アクションの内容を検証
    const actionPriorities = diagnosticResult.recommendedActions.map((action: any) => action.priority);
    expect(actionPriorities).toContain('high');

    // 最優先の推奨アクションを確認
    const highPriorityActions = diagnosticResult.recommendedActions.filter(
      (action: any) => action.priority === 'high'
    );
    expect(highPriorityActions.length).toBeGreaterThanOrEqual(1);
    expect(highPriorityActions[0]).toHaveProperty('action');
    expect(highPriorityActions[0]).toHaveProperty('rationale');
    expect(highPriorityActions[0]).toHaveProperty('estimatedEffectiveness');

    // 診断結果サマリーの検証
    expect(diagnosticResult).toHaveProperty('summary');
    expect(diagnosticResult.summary).toMatch(/OCR/i);
    expect(diagnosticResult.summary.length).toBeGreaterThan(20);

    // 追跡可能性情報の検証
    expect(diagnosticResult).toHaveProperty('traceability');
    expect(diagnosticResult.traceability).toHaveProperty('sessionId');
    expect(diagnosticResult.traceability.sessionId).toBe('sess-20240115-001');
    expect(diagnosticResult.traceability).toHaveProperty('diagnosticTimestamp');
    expect(diagnosticResult.traceability).toHaveProperty('analyzedReadingItemCount');
    expect(diagnosticResult.traceability.analyzedReadingItemCount).toBe(100);
    expect(diagnosticResult.traceability).toHaveProperty('failureItemCount');
    expect(diagnosticResult.traceability.failureItemCount).toBe(22);
  });
});