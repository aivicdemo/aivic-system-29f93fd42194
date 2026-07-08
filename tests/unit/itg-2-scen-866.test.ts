import { calculateOcrDegradationRootCauses } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-866: [edge] OCR精度低下検知・補正機能 - 精度低下の原因が複数該当する場合、優先度順に根本原因を特定する
  test('複数の根本原因が同時に検知された場合、定義された優先度順序に従って特定し、最優先の原因に対して補正処理が適用され、OCR精度が改善される', () => {
    // テストシナリオ1: 画像品質低下（優先度1位）+ 照度不足（優先度2位）が同時発生
    const scenario1_input = {
      ocrPreviousAccuracy: 92.5,
      detectedRootCauses: [
        { causeCode: 'IMAGE_QUALITY_LOW', severity: 8, priority: 1 },
        { causeCode: 'ILLUMINATION_INSUFFICIENT', severity: 6, priority: 2 }
      ],
      correctionStrategies: {
        IMAGE_QUALITY_LOW: { correctionType: 'enhance_contrast', expectedImprovement: 5.2 },
        ILLUMINATION_INSUFFICIENT: { correctionType: 'adjust_brightness', expectedImprovement: 3.1 }
      }
    };

    const scenario1_result = calculateOcrDegradationRootCauses(scenario1_input);

    // 複数原因が優先度順にソートされていることを確認
    expect(scenario1_result.sortedRootCauses).toEqual([
      { causeCode: 'IMAGE_QUALITY_LOW', severity: 8, priority: 1 },
      { causeCode: 'ILLUMINATION_INSUFFICIENT', severity: 6, priority: 2 }
    ]);

    // 最優先度の根本原因が正しく特定されていることを検証
    expect(scenario1_result.primaryRootCause).toBe('IMAGE_QUALITY_LOW');

    // 最優先の原因に対する補正処理が実行されていることを確認
    expect(scenario1_result.appliedCorrection).toEqual({
      causeCode: 'IMAGE_QUALITY_LOW',
      correctionType: 'enhance_contrast'
    });

    // 補正後のOCR精度が改善されたことをアサーション
    const expectedImprovement = 5.2;
    const expectedAccuracyAfterCorrection = 92.5 + expectedImprovement;
    expect(scenario1_result.estimatedAccuracyAfterCorrection).toBe(expectedAccuracyAfterCorrection);
    expect(scenario1_result.estimatedAccuracyAfterCorrection).toBeGreaterThan(scenario1_input.ocrPreviousAccuracy);

    // テストシナリオ2: 書類の傾き（優先度3位）+ 複数言語混在（優先度4位）が同時発生
    const scenario2_input = {
      ocrPreviousAccuracy: 88.3,
      detectedRootCauses: [
        { causeCode: 'DOCUMENT_SKEW', severity: 5, priority: 3 },
        { causeCode: 'MULTIPLE_LANGUAGES', severity: 4, priority: 4 }
      ],
      correctionStrategies: {
        DOCUMENT_SKEW: { correctionType: 'deskew_rotate', expectedImprovement: 4.0 },
        MULTIPLE_LANGUAGES: { correctionType: 'language_detection', expectedImprovement: 2.5 }
      }
    };

    const scenario2_result = calculateOcrDegradationRootCauses(scenario2_input);

    // 優先度3位と4位が正しい順序でソートされていることを確認
    expect(scenario2_result.sortedRootCauses).toEqual([
      { causeCode: 'DOCUMENT_SKEW', severity: 5, priority: 3 },
      { causeCode: 'MULTIPLE_LANGUAGES', severity: 4, priority: 4 }
    ]);

    // 優先度3位が最優先として選択されていることを検証
    expect(scenario2_result.primaryRootCause).toBe('DOCUMENT_SKEW');

    // 優先度3位の原因に対する補正処理が実行されていることを確認
    expect(scenario2_result.appliedCorrection).toEqual({
      causeCode: 'DOCUMENT_SKEW',
      correctionType: 'deskew_rotate'
    });

    // 補正後のOCR精度が期待値で改善されたことをアサーション
    const expectedImprovement2 = 4.0;
    const expectedAccuracy2 = 88.3 + expectedImprovement2;
    expect(scenario2_result.estimatedAccuracyAfterCorrection).toBe(expectedAccuracy2);

    // テストシナリオ3: すべての根本原因が同時に4つ検知される複雑ケース
    const scenario3_input = {
      ocrPreviousAccuracy: 85.0,
      detectedRootCauses: [
        { causeCode: 'IMAGE_QUALITY_LOW', severity: 8, priority: 1 },
        { causeCode: 'ILLUMINATION_INSUFFICIENT', severity: 6, priority: 2 },
        { causeCode: 'DOCUMENT_SKEW', severity: 5, priority: 3 },
        { causeCode: 'MULTIPLE_LANGUAGES', severity: 4, priority: 4 }
      ],
      correctionStrategies: {
        IMAGE_QUALITY_LOW: { correctionType: 'enhance_contrast', expectedImprovement: 5.2 },
        ILLUMINATION_INSUFFICIENT: { correctionType: 'adjust_brightness', expectedImprovement: 3.1 },
        DOCUMENT_SKEW: { correctionType: 'deskew_rotate', expectedImprovement: 4.0 },
        MULTIPLE_LANGUAGES: { correctionType: 'language_detection', expectedImprovement: 2.5 }
      }
    };

    const scenario3_result = calculateOcrDegradationRootCauses(scenario3_input);

    // 4つのすべての原因が優先度順（1→2→3→4）にソートされていることを確認
    expect(scenario3_result.sortedRootCauses).toEqual([
      { causeCode: 'IMAGE_QUALITY_LOW', severity: 8, priority: 1 },
      { causeCode: 'ILLUMINATION_INSUFFICIENT', severity: 6, priority: 2 },
      { causeCode: 'DOCUMENT_SKEW', severity: 5, priority: 3 },
      { causeCode: 'MULTIPLE_LANGUAGES', severity: 4, priority: 4 }
    ]);

    // 最優先（優先度1位）の根本原因が正しく特定されていることを検証
    expect(scenario3_result.primaryRootCause).toBe('IMAGE_QUALITY_LOW');

    // 優先度1位の原因に対する補正処理が実行されていることを確認
    expect(scenario3_result.appliedCorrection).toEqual({
      causeCode: 'IMAGE_QUALITY_LOW',
      correctionType: 'enhance_contrast'
    });

    // 補正後のOCR精度が期待値で改善されたことをアサーション（優先度1位の改善値のみ適用）
    const expectedImprovement3 = 5.2;
    const expectedAccuracy3 = 85.0 + expectedImprovement3;
    expect(scenario3_result.estimatedAccuracyAfterCorrection).toBe(expectedAccuracy3);
    expect(scenario3_result.estimatedAccuracyAfterCorrection).toBe(90.2);

    // 優先度付けのロジックが一貫性を持って動作していることを複数パターンで検証
    // パターン: 優先度が異なる順序で入力されても、常に昇順にソートされることを確認
    const scenario4_input = {
      ocrPreviousAccuracy: 87.5,
      detectedRootCauses: [
        { causeCode: 'MULTIPLE_LANGUAGES', severity: 4, priority: 4 },
        { causeCode: 'IMAGE_QUALITY_LOW', severity: 8, priority: 1 },
        { causeCode: 'DOCUMENT_SKEW', severity: 5, priority: 3 },
        { causeCode: 'ILLUMINATION_INSUFFICIENT', severity: 6, priority: 2 }
      ],
      correctionStrategies: {
        IMAGE_QUALITY_LOW: { correctionType: 'enhance_contrast', expectedImprovement: 5.2 },
        ILLUMINATION_INSUFFICIENT: { correctionType: 'adjust_brightness', expectedImprovement: 3.1 },
        DOCUMENT_SKEW: { correctionType: 'deskew_rotate', expectedImprovement: 4.0 },
        MULTIPLE_LANGUAGES: { correctionType: 'language_detection', expectedImprovement: 2.5 }
      }
    };

    const scenario4_result = calculateOcrDegradationRootCauses(scenario4_input);

    // 入力順序に関わらず、優先度順（1→2→3→4）にソートされていることを確認
    expect(scenario4_result.sortedRootCauses).toEqual([
      { causeCode: 'IMAGE_QUALITY_LOW', severity: 8, priority: 1 },
      { causeCode: 'ILLUMINATION_INSUFFICIENT', severity: 6, priority: 2 },
      { causeCode: 'DOCUMENT_SKEW', severity: 5, priority: 3 },
      { causeCode: 'MULTIPLE_LANGUAGES', severity: 4, priority: 4 }
    ]);

    // 最優先度の根本原因が常に優先度1位として特定されていることを検証
    expect(scenario4_result.primaryRootCause).toBe('IMAGE_QUALITY_LOW');

    // 最優先の原因に対する補正処理が実行されていることを確認
    expect(scenario4_result.appliedCorrection).toEqual({
      causeCode: 'IMAGE_QUALITY_LOW',
      correctionType: 'enhance_contrast'
    });

    // 補正後のOCR精度が改善されたことをアサーション
    const expectedImprovement4 = 5.2;
    const expectedAccuracy4 = 87.5 + expectedImprovement4;
    expect(scenario4_result.estimatedAccuracyAfterCorrection).toBe(expectedAccuracy4);
    expect(scenario4_result.estimatedAccuracyAfterCorrection).toBe(92.7);

    // テスト結果の一貫性検証: すべてのシナリオで優先度付けのロジックが正確に機能していること
    expect(scenario1_result.primaryRootCause).toBe('IMAGE_QUALITY_LOW');
    expect(scenario2_result.primaryRootCause).toBe('DOCUMENT_SKEW');
    expect(scenario3_result.primaryRootCause).toBe('IMAGE_QUALITY_LOW');
    expect(scenario4_result.primaryRootCause).toBe('IMAGE_QUALITY_LOW');

    // 優先度順ソートが全シナリオで正しく機能していることを確認
    expect(scenario1_result.sortedRootCauses[0].priority).toBe(1);
    expect(scenario2_result.sortedRootCauses[0].priority).toBe(3);
    expect(scenario3_result.sortedRootCauses[0].priority).toBe(1);
    expect(scenario4_result.sortedRootCauses[0].priority).toBe(1);

    // OCR精度が改善されたことが全シナリオで確認されること
    expect(scenario1_result.estimatedAccuracyAfterCorrection).toBeGreaterThan(scenario1_input.ocrPreviousAccuracy);
    expect(scenario2_result.estimatedAccuracyAfterCorrection).toBeGreaterThan(scenario2_input.ocrPreviousAccuracy);
    expect(scenario3_result.estimatedAccuracyAfterCorrection).toBeGreaterThan(scenario3_input.ocrPreviousAccuracy);
    expect(scenario4_result.estimatedAccuracyAfterCorrection).toBeGreaterThan(scenario4_input.ocrPreviousAccuracy);
  });
});