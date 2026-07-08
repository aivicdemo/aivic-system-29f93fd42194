import { calculateAccuracyDegradationFlag } from '../../src/logic/it-6-2-2-1';

describe('モデル更新前後精度計測', () => {
  test('SCEN-1168: 学習データ更新後のOCR精度またはAI判定精度が更新前比で5%以上低下した場合、精度低下フラグが立つ', () => {
    // 更新前の精度基準値: 90%
    const pre_update_ocr_accuracy = 90;
    const pre_update_ai_accuracy = 90;

    // テスト用査定品データセット: 100件
    const test_dataset_size = 100;

    // 更新後の精度: 90% → 85% (5%低下)
    const post_update_ocr_accuracy = 85;
    const post_update_ai_accuracy = 85;

    // 精度低下率の計算: (更新前 - 更新後) / 更新前 × 100
    const ocr_degradation_rate = ((pre_update_ocr_accuracy - post_update_ocr_accuracy) / pre_update_ocr_accuracy) * 100;
    const ai_degradation_rate = ((pre_update_ai_accuracy - post_update_ai_accuracy) / pre_update_ai_accuracy) * 100;

    // 精度低下の判定: 5%以上の低下で true
    const degradation_threshold = 5;

    const result = calculateAccuracyDegradationFlag({
      pre_update_ocr_accuracy,
      post_update_ocr_accuracy,
      pre_update_ai_accuracy,
      post_update_ai_accuracy,
      degradation_threshold,
    });

    // 期待結果: 精度低下フラグが true
    expect(result.flag_is_set).toBe(true);

    // OCR精度低下率が5%以上であることを確認
    expect(ocr_degradation_rate).toBeGreaterThanOrEqual(5);

    // AI精度低下率が5%以上であることを確認
    expect(ai_degradation_rate).toBeGreaterThanOrEqual(5);

    // アラート通知が生成されていることを確認
    expect(result.alert_message).toMatch(/精度低下/);

    // フラグ設定の根拠データが記録されていることを確認
    expect(result.degradation_log).toEqual({
      pre_ocr_accuracy: 90,
      post_ocr_accuracy: 85,
      pre_ai_accuracy: 90,
      post_ai_accuracy: 85,
      ocr_degradation_rate: 5.555555555555556,
      ai_degradation_rate: 5.555555555555556,
      threshold_exceeded: true,
      flag_status: 'ON',
    });
  });
});