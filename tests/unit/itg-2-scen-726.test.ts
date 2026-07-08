import { calculateConfidenceScore } from '../../src/logic/it-6-2-1-1';

describe('AI判定結果信頼度スコア付与', () => {
  // SCEN-726
  test('信頼度スコアが101を超える値が計算される場合、エラーが記録される', () => {
    // 信頼度スコアが101以上になるような入力条件を設定
    // OCR読取精度が高く、AI判定精度が高く、参照データ件数が多い場合を想定
    const input = {
      ocr_accuracy_percent: 99,
      ai_judgment_accuracy_percent: 98,
      reference_data_count: 500,
      data_recency_days: 5,
      regional_match_score: 95,
    };

    // 信頼度スコア計算時にエラーが発生することを期待
    expect(() => calculateConfidenceScore(input)).toThrow(/信頼度スコア/);
  });
});