import { aggregateAccuracyIndicators } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-1452: モデル更新回帰テスト精度判定機能 - 学習データが不完全な場合にテスト失敗エラーが発生する', () => {
    // 【入力】学習データが不完全な状態（必須フィールド欠落）
    const incomplete_training_data = {
      assessor_id: 'A001',
      work_type: 'excavation',
      amount_band: 'medium',
      assessment_results: [
        {
          quote_id: 'Q001',
          estimated_amount: 1500000,
          assessed_amount: 1480000,
          // divergence_rate が欠落（必須フィールド）
          divergence_amount: undefined,
          reference_data_count: 45,
          correction_coefficient: 1.02,
          applied_logic: 'seasonal_adjustment',
          assessment_timestamp: '2024-01-15T10:30:00Z'
        }
      ],
      model_version: 'v2.1',
      evaluation_period_start: '2024-01-01T00:00:00Z',
      evaluation_period_end: '2024-01-31T23:59:59Z'
    };

    // 【実行】精度計測を試行してエラーキャッチ
    expect(() => {
      aggregateAccuracyIndicators(incomplete_training_data);
    }).toThrow(/学習データが不完全/);
  });
});