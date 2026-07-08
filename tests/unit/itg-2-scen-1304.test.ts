import { calculateProcessingTimeReductionRate } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  // SCEN-1304: [edge] 処理時間短縮率の自動計算 - 導入前後の処理時間データが完全一致する場合、短縮率0%で正確に算出される
  test('導入前後の処理時間が完全一致する場合、処理時間短縮率は正確に0%で算出される', () => {
    const before_processing_time_ms = 1000;
    const after_processing_time_ms = 1000;

    const result = calculateProcessingTimeReductionRate({
      before_processing_time_ms,
      after_processing_time_ms,
    });

    expect(typeof result).toBe('number');
    expect(result).toBe(0);
  });
});