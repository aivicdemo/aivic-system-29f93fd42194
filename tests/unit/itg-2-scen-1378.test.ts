import { estimateAdditionalLearningDataVolume } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1378
  test('他部署適用時の追加学習データ量見積機能 - 精度低下度がマイナス値（改善）の場合、エラーハンドリングされる', () => {
    const current_assessment_accuracy = 85;
    const predicted_accuracy_after_application = 90;

    expect(() =>
      estimateAdditionalLearningDataVolume({
        current_assessment_accuracy,
        predicted_accuracy_after_application,
      })
    ).toThrow(/精度低下度/);
  });
});