import { aggregateAccuracyMetrics } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: 査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-836: 学習データが存在しない場合、照合処理がスキップされ空の可視化結果が返される', () => {
    // 入力: 学習データが存在しないテストデータセット
    const ocr_read_items = [
      {
        item_id: 'item_001',
        item_name: '仮設工',
        quantity: 100,
        unit_price: 5000,
        total_amount: 500000,
        region: '東京',
        work_type: '仮設工',
        amount_band: '50万～100万'
      },
      {
        item_id: 'item_002',
        item_name: 'コンクリート工',
        quantity: 50,
        unit_price: 8000,
        total_amount: 400000,
        region: '大阪',
        work_type: 'コンクリート工',
        amount_band: '50万～100万'
      }
    ];

    const learning_data = [];

    // 実行: 照合処理を実行
    const result = aggregateAccuracyMetrics({
      ocr_read_items,
      learning_data,
      assessor_id: 'assessor_001',
      work_type_filter: null,
      amount_band_filter: null
    });

    // 期待結果: 空の可視化結果が返される
    expect(result.deviation_results).toEqual([]);
    expect(result.visualization_data).toEqual([]);
    expect(result.is_valid).toBe(false);
    expect(result.error_code).toBe(null);
    expect(result.processing_completed).toBe(true);
  });
});