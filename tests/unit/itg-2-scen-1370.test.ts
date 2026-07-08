import { calculateAccuracyDegradation } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  test('SCEN-1370: 他部署フォーマット適用時のOCR精度低下率と判定精度低下率を%で算出し許容閾値との乖離度を計算する', () => {
    // 自部署フォーマット適用時の精度実績
    const own_dept_ocr_accuracy = 92.5; // %
    const own_dept_judgment_accuracy = 88.3; // %
    const ocr_tolerance_threshold = 5.0; // %
    const judgment_tolerance_threshold = 7.0; // %

    // 他部署フォーマット適用後の精度実績
    const other_dept_ocr_accuracy = 85.2; // %
    const other_dept_judgment_accuracy = 79.5; // %

    // 関数呼び出し
    const result = calculateAccuracyDegradation({
      own_dept_ocr_accuracy,
      own_dept_judgment_accuracy,
      other_dept_ocr_accuracy,
      other_dept_judgment_accuracy,
      ocr_tolerance_threshold,
      judgment_tolerance_threshold,
    });

    // OCR精度低下率の計算: (92.5 - 85.2) = 7.3%
    const expected_ocr_degradation_rate = 7.3;
    expect(result.ocr_degradation_rate).toBe(expected_ocr_degradation_rate);

    // 判定精度低下率の計算: (88.3 - 79.5) = 8.8%
    const expected_judgment_degradation_rate = 8.8;
    expect(result.judgment_degradation_rate).toBe(expected_judgment_degradation_rate);

    // OCR精度低下率と許容閾値の乖離度: 7.3 - 5.0 = 2.3% (正の値=許容閾値超過)
    const expected_ocr_deviation_from_threshold = 2.3;
    expect(result.ocr_deviation_from_threshold).toBe(
      expected_ocr_deviation_from_threshold
    );

    // 判定精度低下率と許容閾値の乖離度: 8.8 - 7.0 = 1.8% (正の値=許容閾値超過)
    const expected_judgment_deviation_from_threshold = 1.8;
    expect(result.judgment_deviation_from_threshold).toBe(
      expected_judgment_deviation_from_threshold
    );

    // 結果が数値型で正確に計算・表示されていることを検証
    expect(typeof result.ocr_degradation_rate).toBe('number');
    expect(typeof result.judgment_degradation_rate).toBe('number');
    expect(typeof result.ocr_deviation_from_threshold).toBe('number');
    expect(typeof result.judgment_deviation_from_threshold).toBe('number');

    // 乖離度が正の値の場合は許容閾値を超過していることを判定
    expect(result.ocr_deviation_from_threshold > 0).toBe(true);
    expect(result.judgment_deviation_from_threshold > 0).toBe(true);
    expect(result.ocr_exceeds_threshold).toBe(true);
    expect(result.judgment_exceeds_threshold).toBe(true);

    // 判定結果ステータスが「超過」と正しく設定されていることを検証
    expect(result.status).toBe('超過');
  });
});