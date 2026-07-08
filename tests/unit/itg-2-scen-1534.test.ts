import { calculateAccuracyDeclineRate } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-1534: [error] 学習データ更新優先度・実施タイミング自動判定機能 - 精度低下率の計算に必要なベースラインデータが欠落した場合に判定に失敗する
  test('ベースラインデータが欠落している場合、適切なエラーメッセージを返す', () => {
    const input = {
      assessor_id: 'ASSESSOR_001',
      model_version: 'v2.1.0',
      current_accuracy: 0.82,
      baseline_accuracy: null,
      measurement_date: '2024-01-15T10:30:00Z',
    };

    expect(() => calculateAccuracyDeclineRate(input)).toThrow(/ベースラインデータ/);
  });
});