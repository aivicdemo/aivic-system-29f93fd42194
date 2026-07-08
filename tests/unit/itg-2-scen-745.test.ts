import { calculateQualityCheckResult } from '../../src/logic/it-6-2-1-1';

describe('查定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-745: [edge] 品質チェック自動判定機能 - 相場乖離率が許容値境界の±5%のとき合格判定される
  test('相場乖離率が許容値境界の±5%のとき合格判定される', () => {
    // 初期化: 品質チェック自動判定機能の初期状態
    const assessor_id = 'ASSESSOR_001';
    const construction_type = 'CONCRETE_WORK';
    const price_band = 'BAND_1M_5M';

    // テストケース1: 相場乖離率が+5%（許容値上限）
    const result_plus_5_percent = calculateQualityCheckResult({
      assessor_id,
      construction_type,
      price_band,
      deviation_rate_percent: 5.0,
      reference_data_count: 45,
      ocr_confidence_score: 92,
    });

    expect(result_plus_5_percent).toEqual({
      judgment: 'PASS',
      deviation_rate_percent: 5.0,
      quality_score: 85,
      reason: '相場乖離率が許容値範囲内',
      timestamp: expect.any(String),
    });

    // テストケース2: 相場乖離率が-5%（許容値下限）
    const result_minus_5_percent = calculateQualityCheckResult({
      assessor_id,
      construction_type,
      price_band,
      deviation_rate_percent: -5.0,
      reference_data_count: 45,
      ocr_confidence_score: 92,
    });

    expect(result_minus_5_percent).toEqual({
      judgment: 'PASS',
      deviation_rate_percent: -5.0,
      quality_score: 85,
      reason: '相場乖離率が許容値範囲内',
      timestamp: expect.any(String),
    });

    // 追加検証: 許容値を超える場合は不合格
    const result_exceed_positive = calculateQualityCheckResult({
      assessor_id,
      construction_type,
      price_band,
      deviation_rate_percent: 5.1,
      reference_data_count: 45,
      ocr_confidence_score: 92,
    });

    expect(result_exceed_positive.judgment).toBe('FAIL');

    const result_exceed_negative = calculateQualityCheckResult({
      assessor_id,
      construction_type,
      price_band,
      deviation_rate_percent: -5.1,
      reference_data_count: 45,
      ocr_confidence_score: 92,
    });

    expect(result_exceed_negative.judgment).toBe('FAIL');

    // 追加検証: 参照データ件数不足の場合は不合格
    const result_insufficient_data = calculateQualityCheckResult({
      assessor_id,
      construction_type,
      price_band,
      deviation_rate_percent: 0.0,
      reference_data_count: 19,
      ocr_confidence_score: 92,
    });

    expect(result_insufficient_data.judgment).toBe('FAIL');
    expect(result_insufficient_data.reason).toMatch(/参照データ件数/);

    // 追加検証: OCR信頼度が低い場合は不合格
    const result_low_ocr_confidence = calculateQualityCheckResult({
      assessor_id,
      construction_type,
      price_band,
      deviation_rate_percent: 0.0,
      reference_data_count: 45,
      ocr_confidence_score: 69,
    });

    expect(result_low_ocr_confidence.judgment).toBe('FAIL');
    expect(result_low_ocr_confidence.reason).toMatch(/OCR信頼度/);
  });
});