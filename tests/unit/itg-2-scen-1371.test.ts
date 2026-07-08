import { calculateOCRAccuracyDeclineRate } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1371: [error] 精度低下度定量化機能 - OCR精度低下率の計算時に査定部署基準精度がnullの場合に精度差分計算エラーを返す
  test('should return error when standard accuracy is null during OCR accuracy decline rate calculation', () => {
    const currentOCRAccuracy = 85;
    const standardAccuracy = null;

    expect(() => {
      calculateOCRAccuracyDeclineRate({
        currentAccuracy: currentOCRAccuracy,
        standardAccuracy: standardAccuracy,
      });
    }).toThrow(/査定部署基準精度/);
  });
});