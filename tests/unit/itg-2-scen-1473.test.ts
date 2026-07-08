import { calculateDeviationRate } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1473: [edge] 季節変動・地域差による相場乖離検出 - 単一地域・単一工事種別のみのパターンでも乖離度を算出できる
  test('単一地域・単一工事種別のデータセットで相場乖離度を正常に算出できる', () => {
    // テストデータ: 東京都の外壁塗装工事のみ
    const singleRegionSingleTypeDataset = [
      {
        region_code: '13',
        region_name: '東京都',
        construction_type_code: 'WALL_PAINT',
        construction_type_name: '外壁塗装',
        unit_price: 5000,
        quantity: 100,
        total_amount: 500000,
        record_date: '2024-01-15',
        data_source: 'PAST_PROJECT',
      },
      {
        region_code: '13',
        region_name: '東京都',
        construction_type_code: 'WALL_PAINT',
        construction_type_name: '外壁塗装',
        unit_price: 5200,
        quantity: 80,
        total_amount: 416000,
        record_date: '2024-02-20',
        data_source: 'PAST_PROJECT',
      },
      {
        region_code: '13',
        region_name: '東京都',
        construction_type_code: 'WALL_PAINT',
        construction_type_name: '外壁塗装',
        unit_price: 4800,
        quantity: 120,
        total_amount: 576000,
        record_date: '2024-03-10',
        data_source: 'PAST_PROJECT',
      },
    ];

    // 査定対象見積金額（中央値基準）
    const assessment_amount = 500000;

    // 相場乖離度算出APIを実行
    const result = calculateDeviationRate({
      dataset: singleRegionSingleTypeDataset,
      assessment_amount: assessment_amount,
      reference_date: '2024-03-15',
    });

    // 結果が数値型（float）であることを検証
    expect(typeof result.deviation_rate).toBe('number');

    // 乖離度が妥当な範囲内（0～100%）であることを検証
    expect(result.deviation_rate).toBeGreaterThanOrEqual(0);
    expect(result.deviation_rate).toBeLessThanOrEqual(100);

    // 具体的な乖離度の計算値を検証
    // 基準相場額 = (500000 + 416000 + 576000) / 3 = 497333.33
    // 乖離度 = |500000 - 497333.33| / 497333.33 * 100 ≈ 0.536%
    expect(result.deviation_rate).toBeCloseTo(0.536, 1);

    // データセット情報が結果に含まれることを検証
    expect(result.dataset_info.region_count).toBe(1);
    expect(result.dataset_info.construction_type_count).toBe(1);
    expect(result.dataset_info.total_records).toBe(3);

    // 標準偏差が計算されていることを検証
    expect(typeof result.standard_deviation).toBe('number');
    expect(result.standard_deviation).toBeGreaterThanOrEqual(0);

    // 中央値・平均値が計算されていることを検証
    expect(typeof result.median_price).toBe('number');
    expect(typeof result.mean_price).toBe('number');
    expect(result.median_price).toBeCloseTo(500000, 1);
    expect(result.mean_price).toBeCloseTo(497333.33, 1);

    // エラーが発生していないことを検証
    expect(result.error_message).toBeNull();

    // ロジック実行ステータスが成功であることを検証
    expect(result.status).toBe('success');

    // 乖離度の信頼度スコアが計算されていることを検証
    expect(typeof result.confidence_score).toBe('number');
    expect(result.confidence_score).toBeGreaterThanOrEqual(0);
    expect(result.confidence_score).toBeLessThanOrEqual(100);
  });
});