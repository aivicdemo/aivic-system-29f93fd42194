import { classifyDivergencePatternsByDimension } from '../../src/logic/it-6-2-2-1';

describe('相場乖離パターン自動分類機能', () => {
  // SCEN-861: [normal] 相場乖離パターン自動分類機能 - 判定ロジック適用時に乖離パターンが地域別・工種別・金額帯別に自動分類される
  test('判定ロジック適用後、乖離パターンが地域別・工種別・金額帯別の3次元で自動分類される', () => {
    // Arrange: テスト用の査定データ（複数地域、複数工種、複数金額帯）
    const assessment_data = [
      {
        assessment_id: 'ASS001',
        region: '東京都',
        work_type: '基礎工事',
        amount_band: '500万～1000万',
        quoted_amount: 750000,
        market_amount: 700000,
        divergence_rate: 7.14,
        divergence_amount: 50000,
        divergence_pattern: 'over'
      },
      {
        assessment_id: 'ASS002',
        region: '東京都',
        work_type: '基礎工事',
        amount_band: '500万～1000万',
        quoted_amount: 680000,
        market_amount: 700000,
        divergence_rate: -2.86,
        divergence_amount: -20000,
        divergence_pattern: 'under'
      },
      {
        assessment_id: 'ASS003',
        region: '大阪府',
        work_type: '躯体工事',
        amount_band: '1000万～1500万',
        quoted_amount: 1200000,
        market_amount: 1150000,
        divergence_rate: 4.35,
        divergence_amount: 50000,
        divergence_pattern: 'over'
      },
      {
        assessment_id: 'ASS004',
        region: '大阪府',
        work_type: '躯体工事',
        amount_band: '1000万～1500万',
        quoted_amount: 1100000,
        market_amount: 1150000,
        divergence_rate: -4.35,
        divergence_amount: -50000,
        divergence_pattern: 'under'
      },
      {
        assessment_id: 'ASS005',
        region: '愛知県',
        work_type: '仕上工事',
        amount_band: '300万～500万',
        quoted_amount: 450000,
        market_amount: 400000,
        divergence_rate: 12.5,
        divergence_amount: 50000,
        divergence_pattern: 'over'
      },
      {
        assessment_id: 'ASS006',
        region: '愛知県',
        work_type: '仕上工事',
        amount_band: '300万～500万',
        quoted_amount: 395000,
        market_amount: 400000,
        divergence_rate: -1.25,
        divergence_amount: -5000,
        divergence_pattern: 'under'
      },
      {
        assessment_id: 'ASS007',
        region: '東京都',
        work_type: '躯体工事',
        amount_band: '1000万～1500万',
        quoted_amount: 1180000,
        market_amount: 1150000,
        divergence_rate: 2.61,
        divergence_amount: 30000,
        divergence_pattern: 'over'
      },
      {
        assessment_id: 'ASS008',
        region: '大阪府',
        work_type: '基礎工事',
        amount_band: '500万～1000万',
        quoted_amount: 720000,
        market_amount: 700000,
        divergence_rate: 2.86,
        divergence_amount: 20000,
        divergence_pattern: 'over'
      }
    ];

    // Act: 判定ロジックを実行して乖離パターン分類を取得
    const classification_result = classifyDivergencePatternsByDimension(assessment_data);

    // Assert: 地域別分類の検証
    expect(classification_result.by_region).toBeDefined();
    expect(Object.keys(classification_result.by_region)).toEqual(
      expect.arrayContaining(['東京都', '大阪府', '愛知県'])
    );

    // 東京都の地域別集計検証
    expect(classification_result.by_region['東京都']).toEqual({
      total_count: 3,
      over_count: 2,
      under_count: 1,
      average_divergence_rate: 5.63,
      total_divergence_amount: 80000
    });

    // 大阪府の地域別集計検証
    expect(classification_result.by_region['大阪府']).toEqual({
      total_count: 3,
      over_count: 2,
      under_count: 1,
      average_divergence_rate: 0.95,
      total_divergence_amount: 20000
    });

    // 愛知県の地域別集計検証
    expect(classification_result.by_region['愛知県']).toEqual({
      total_count: 2,
      over_count: 1,
      under_count: 1,
      average_divergence_rate: 5.625,
      total_divergence_amount: 45000
    });

    // Assert: 工種別分類の検証
    expect(classification_result.by_work_type).toBeDefined();
    expect(Object.keys(classification_result.by_work_type)).toEqual(
      expect.arrayContaining(['基礎工事', '躯体工事', '仕上工事'])
    );

    // 基礎工事の工種別集計検証
    expect(classification_result.by_work_type['基礎工事']).toEqual({
      total_count: 3,
      over_count: 2,
      under_count: 1,
      average_divergence_rate: 2.37,
      total_divergence_amount: 50000
    });

    // 躯体工事の工種別集計検証
    expect(classification_result.by_work_type['躯体工事']).toEqual({
      total_count: 3,
      over_count: 2,
      under_count: 1,
      average_divergence_rate: 0.87,
      total_divergence_amount: 30000
    });

    // 仕上工事の工種別集計検証
    expect(classification_result.by_work_type['仕上工事']).toEqual({
      total_count: 2,
      over_count: 1,
      under_count: 1,
      average_divergence_rate: 5.625,
      total_divergence_amount: 45000
    });

    // Assert: 金額帯別分類の検証
    expect(classification_result.by_amount_band).toBeDefined();
    expect(Object.keys(classification_result.by_amount_band)).toEqual(
      expect.arrayContaining(['300万～500万', '500万～1000万', '1000万～1500万'])
    );

    // 300万～500万の金額帯別集計検証
    expect(classification_result.by_amount_band['300万～500万']).toEqual({
      total_count: 2,
      over_count: 1,
      under_count: 1,
      average_divergence_rate: 5.625,
      total_divergence_amount: 45000
    });

    // 500万～1000万の金額帯別集計検証
    expect(classification_result.by_amount_band['500万～1000万']).toEqual({
      total_count: 3,
      over_count: 2,
      under_count: 1,
      average_divergence_rate: 2.37,
      total_divergence_amount: 50000
    });

    // 1000万～1500万の金額帯別集計検証
    expect(classification_result.by_amount_band['1000万～1500万']).toEqual({
      total_count: 3,
      over_count: 2,
      under_count: 1,
      average_divergence_rate: 0.87,
      total_divergence_amount: 30000
    });

    // Assert: 階層化構造の検証 - 地域+工種の2次元分類
    expect(classification_result.hierarchical_by_region_and_work_type).toBeDefined();
    expect(
      classification_result.hierarchical_by_region_and_work_type['東京都']
    ).toBeDefined();
    expect(
      classification_result.hierarchical_by_region_and_work_type['東京都']['基礎工事']
    ).toEqual({
      total_count: 2,
      over_count: 1,
      under_count: 1,
      average_divergence_rate: 2.14,
      total_divergence_amount: 30000
    });

    expect(
      classification_result.hierarchical_by_region_and_work_type['東京都']['躯体工事']
    ).toEqual({
      total_count: 1,
      over_count: 1,
      under_count: 0,
      average_divergence_rate: 2.61,
      total_divergence_amount: 30000
    });

    expect(
      classification_result.hierarchical_by_region_and_work_type['大阪府']['躯体工事']
    ).toEqual({
      total_count: 2,
      over_count: 1,
      under_count: 1,
      average_divergence_rate: 0.0,
      total_divergence_amount: 0
    });

    expect(
      classification_result.hierarchical_by_region_and_work_type['大阪府']['基礎工事']
    ).toEqual({
      total_count: 1,
      over_count: 1,
      under_count: 0,
      average_divergence_rate: 2.86,
      total_divergence_amount: 20000
    });

    expect(
      classification_result.hierarchical_by_region_and_work_type['愛知県']['仕上工事']
    ).toEqual({
      total_count: 2,
      over_count: 1,
      under_count: 1,
      average_divergence_rate: 5.625,
      total_divergence_amount: 45000
    });

    // Assert: 乖離パターン詳細情報の紐付け検証
    expect(classification_result.detailed_records).toBeDefined();
    expect(Array.isArray(classification_result.detailed_records)).toBe(true);
    expect(classification_result.detailed_records.length).toBe(8);

    // 最初のレコードの詳細情報検証
    expect(classification_result.detailed_records[0]).toEqual({
      assessment_id: 'ASS001',
      region: '東京都',
      work_type: '基礎工事',
      amount_band: '500万～1000万',
      quoted_amount: 750000,
      market_amount: 700000,
      divergence_rate: 7.14,
      divergence_amount: 50000,
      divergence_pattern: 'over',
      classification_tags: ['東京都', '基礎工事', '500万～1000万', 'over']
    });

    // 金額帯別・工種別の階層化検証
    expect(classification_result.hierarchical_by_amount_and_work_type).toBeDefined();
    expect(
      classification_result.hierarchical_by_amount_and_work_type['500万～1000万']
    ).toBeDefined();
    expect(
      classification_result.hierarchical_by_amount_and_work_type['500万～1000万']['基礎工事']
    ).toEqual({
      total_count: 3,
      over_count: 2,
      under_count: 1,
      average_divergence_rate: 2.37,
      total_divergence_amount: 50000
    });

    // Assert: 全体集計の検証
    expect(classification_result.summary).toEqual({
      total_records: 8,
      total_over_pattern: 5,
      total_under_pattern: 3,
      overall_average_divergence_rate: 3.46,
      overall_total_divergence_amount: 125000,
      unique_regions: 3,
      unique_work_types: 3,
      unique_amount_bands: 3
    });
  });
});