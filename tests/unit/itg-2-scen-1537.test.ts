import { determineModelRetrainingPriority } from '../../src/logic/it-6-2-1-1';

describe('Model Retraining Priority Determination - OCR Accuracy Below Threshold', () => {
  test('SCEN-1537: OCR読取精度がしきい値を下回った場合、モデル再学習の優先度ランクが正しく決定される', () => {
    // Setup: OCR読取精度がしきい値（85%）を下回る複数のシナリオを準備
    const threshold = 85;

    // Test Case 1: OCR精度 70% - 低精度（優先度HIGH期待）
    const testCase1Input = {
      current_ocr_accuracy: 70,
      threshold_ocr_accuracy: threshold,
      previous_ocr_accuracy: 78,
    };
    const testCase1Result = determineModelRetrainingPriority(testCase1Input);
    expect(testCase1Result.priority_rank).toBe('HIGH');
    expect(testCase1Result.accuracy_drop_rate).toBe(-11);

    // Test Case 2: OCR精度 75% - 中程度精度低下（優先度MEDIUM期待）
    const testCase2Input = {
      current_ocr_accuracy: 75,
      threshold_ocr_accuracy: threshold,
      previous_ocr_accuracy: 82,
    };
    const testCase2Result = determineModelRetrainingPriority(testCase2Input);
    expect(testCase2Result.priority_rank).toBe('MEDIUM');
    expect(testCase2Result.accuracy_drop_rate).toBe(-7);

    // Test Case 3: OCR精度 80% - 軽微な精度低下（優先度LOW期待）
    const testCase3Input = {
      current_ocr_accuracy: 80,
      threshold_ocr_accuracy: threshold,
      previous_ocr_accuracy: 84,
    };
    const testCase3Result = determineModelRetrainingPriority(testCase3Input);
    expect(testCase3Result.priority_rank).toBe('LOW');
    expect(testCase3Result.accuracy_drop_rate).toBe(-4);

    // Edge Case 1: OCR精度がしきい値と同一（85%）
    const edgeCase1Input = {
      current_ocr_accuracy: 85,
      threshold_ocr_accuracy: threshold,
      previous_ocr_accuracy: 88,
    };
    const edgeCase1Result = determineModelRetrainingPriority(edgeCase1Input);
    expect(edgeCase1Result.priority_rank).toBe('NONE');
    expect(edgeCase1Result.accuracy_drop_rate).toBe(-3);

    // Edge Case 2: OCR精度 0%
    const edgeCase2Input = {
      current_ocr_accuracy: 0,
      threshold_ocr_accuracy: threshold,
      previous_ocr_accuracy: 82,
    };
    const edgeCase2Result = determineModelRetrainingPriority(edgeCase2Input);
    expect(edgeCase2Result.priority_rank).toBe('CRITICAL');
    expect(edgeCase2Result.accuracy_drop_rate).toBe(-82);

    // Verification: 精度が低いほど優先度ランクが高い順序を確認
    const priorityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];
    const testResults = [edgeCase2Result, testCase1Result, testCase2Result, testCase3Result, edgeCase1Result];
    const resultRanks = testResults.map(r => r.priority_rank);
    expect(resultRanks).toEqual(priorityOrder);

    // Verification: 各テストケースの優先度ランクが期待値と一致することを確認
    expect(testCase1Result).toEqual({
      priority_rank: 'HIGH',
      accuracy_drop_rate: -11,
      retraining_recommended: true,
      recommended_action: 'Execute model retraining immediately',
    });

    expect(testCase2Result).toEqual({
      priority_rank: 'MEDIUM',
      accuracy_drop_rate: -7,
      retraining_recommended: true,
      recommended_action: 'Schedule model retraining within 1 week',
    });

    expect(testCase3Result).toEqual({
      priority_rank: 'LOW',
      accuracy_drop_rate: -4,
      retraining_recommended: false,
      recommended_action: 'Monitor accuracy trend, retraining optional',
    });

    expect(edgeCase1Result).toEqual({
      priority_rank: 'NONE',
      accuracy_drop_rate: -3,
      retraining_recommended: false,
      recommended_action: 'No retraining needed',
    });

    expect(edgeCase2Result).toEqual({
      priority_rank: 'CRITICAL',
      accuracy_drop_rate: -82,
      retraining_recommended: true,
      recommended_action: 'Execute emergency model retraining',
    });

    // Verification: しきい値を下回るすべてのテストケース（0-84%）について
    // 精度値に応じた適切なモデル再学習優先度ランクが正しく決定されていることを確認
    const belowThresholdCases = [
      { accuracy: 50, expected_rank: 'CRITICAL' },
      { accuracy: 60, expected_rank: 'HIGH' },
      { accuracy: 70, expected_rank: 'HIGH' },
      { accuracy: 75, expected_rank: 'MEDIUM' },
      { accuracy: 80, expected_rank: 'LOW' },
    ];

    belowThresholdCases.forEach(caseItem => {
      const result = determineModelRetrainingPriority({
        current_ocr_accuracy: caseItem.accuracy,
        threshold_ocr_accuracy: threshold,
        previous_ocr_accuracy: caseItem.accuracy + 5,
      });
      expect(result.priority_rank).toBe(caseItem.expected_rank);
    });
  });
});