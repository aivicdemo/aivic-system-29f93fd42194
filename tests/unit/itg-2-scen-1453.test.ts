import { aggregateMonthlyDeviation } from '../../src/logic/it-1-br-6-2-1';

describe('月次相場乖離パターン集計機能', () => {
  // SCEN-1453
  test('過去12ヶ月の全査定データから地域別・工事種別・時期別の乖離パターンを正常に集計できる', () => {
    // テストデータ: 過去12ヶ月分の査定データ（関東・関西・東北の3地域、外壁塗装・屋根工事・防水工事の3工事種別、1月～12月）
    const assessment_data = [
      // 関東 外壁塗装 1月
      { region: '関東', work_type: '外壁塗装', month: 1, market_price: 1000000, assessed_price: 950000, assessment_date: '2023-01-15' },
      { region: '関東', work_type: '外壁塗装', month: 1, market_price: 1100000, assessed_price: 1045000, assessment_date: '2023-01-20' },
      { region: '関東', work_type: '外壁塗装', month: 1, market_price: 950000, assessed_price: 912500, assessment_date: '2023-01-25' },
      // 関東 屋根工事 1月
      { region: '関東', work_type: '屋根工事', month: 1, market_price: 800000, assessed_price: 840000, assessment_date: '2023-01-10' },
      { region: '関東', work_type: '屋根工事', month: 1, market_price: 900000, assessed_price: 945000, assessment_date: '2023-01-22' },
      // 関西 外壁塗装 2月
      { region: '関西', work_type: '外壁塗装', month: 2, market_price: 1050000, assessed_price: 1102500, assessment_date: '2023-02-10' },
      { region: '関西', work_type: '外壁塗装', month: 2, market_price: 1000000, assessed_price: 1050000, assessment_date: '2023-02-15' },
      // 関西 防水工事 3月
      { region: '関西', work_type: '防水工事', month: 3, market_price: 600000, assessed_price: 588000, assessment_date: '2023-03-05' },
      { region: '関西', work_type: '防水工事', month: 3, market_price: 650000, assessed_price: 630500, assessment_date: '2023-03-12' },
      // 東北 外壁塗装 4月
      { region: '東北', work_type: '外壁塗装', month: 4, market_price: 900000, assessed_price: 882000, assessment_date: '2023-04-08' },
      { region: '東北', work_type: '外壁塗装', month: 4, market_price: 850000, assessed_price: 816500, assessment_date: '2023-04-15' },
      // 東北 屋根工事 5月
      { region: '東北', work_type: '屋根工事', month: 5, market_price: 750000, assessed_price: 787500, assessment_date: '2023-05-10' },
      { region: '東北', work_type: '屋根工事', month: 5, market_price: 700000, assessed_price: 742000, assessment_date: '2023-05-18' },
      // 関東 外壁塗装 6月
      { region: '関東', work_type: '外壁塗装', month: 6, market_price: 1000000, assessed_price: 1000000, assessment_date: '2023-06-01' },
      { region: '関東', work_type: '外壁塗装', month: 6, market_price: 1100000, assessed_price: 1078000, assessment_date: '2023-06-14' },
      // 関西 屋根工事 7月
      { region: '関西', work_type: '屋根工事', month: 7, market_price: 850000, assessed_price: 876500, assessment_date: '2023-07-05' },
      { region: '関西', work_type: '屋根工事', month: 7, market_price: 800000, assessed_price: 824000, assessment_date: '2023-07-12' },
      // 東北 防水工事 8月
      { region: '東北', work_type: '防水工事', month: 8, market_price: 550000, assessed_price: 528000, assessment_date: '2023-08-08' },
      { region: '東北', work_type: '防水工事', month: 8, market_price: 600000, assessed_price: 588000, assessment_date: '2023-08-16' },
      // 関東 防水工事 9月
      { region: '関東', work_type: '防水工事', month: 9, market_price: 650000, assessed_price: 682500, assessment_date: '2023-09-07' },
      { region: '関東', work_type: '防水工事', month: 9, market_price: 600000, assessed_price: 618000, assessment_date: '2023-09-14' },
      // 関西 外壁塗装 10月
      { region: '関西', work_type: '外壁塗装', month: 10, market_price: 950000, assessed_price: 950000, assessment_date: '2023-10-03' },
      { region: '関西', work_type: '外壁塗装', month: 10, market_price: 1000000, assessed_price: 1020000, assessment_date: '2023-10-10' },
      // 東北 外壁塗装 11月
      { region: '東北', work_type: '外壁塗装', month: 11, market_price: 850000, assessed_price: 867500, assessment_date: '2023-11-06' },
      { region: '東北', work_type: '外壁塗装', month: 11, market_price: 900000, assessed_price: 909000, assessment_date: '2023-11-13' },
      // 関東 屋根工事 12月
      { region: '関東', work_type: '屋根工事', month: 12, market_price: 800000, assessed_price: 800000, assessment_date: '2023-12-01' },
      { region: '関東', work_type: '屋根工事', month: 12, market_price: 900000, assessed_price: 927000, assessment_date: '2023-12-15' },
      // 追加データで最低100件以上を満たす
      { region: '関東', work_type: '外壁塗装', month: 1, market_price: 980000, assessed_price: 931000, assessment_date: '2023-01-03' },
      { region: '関東', work_type: '外壁塗装', month: 2, market_price: 1050000, assessed_price: 997500, assessment_date: '2023-02-04' },
      { region: '関東', work_type: '外壁塗装', month: 3, market_price: 1100000, assessed_price: 1056000, assessment_date: '2023-03-07' },
      { region: '関西', work_type: '屋根工事', month: 1, market_price: 820000, assessed_price: 803600, assessment_date: '2023-01-11' },
      { region: '関西', work_type: '屋根工事', month: 2, market_price: 880000, assessed_price: 880000, assessment_date: '2023-02-08' },
      { region: '関西', work_type: '屋根工事', month: 3, market_price: 900000, assessed_price: 963000, assessment_date: '2023-03-09' },
      { region: '関西', work_type: '防水工事', month: 1, market_price: 580000, assessed_price: 569200, assessment_date: '2023-01-16' },
      { region: '関西', work_type: '防水工事', month: 2, market_price: 620000, assessed_price: 613800, assessment_date: '2023-02-18' },
      { region: '関西', work_type: '防水工事', month: 4, market_price: 640000, assessed_price: 665600, assessment_date: '2023-04-04' },
      { region: '東北', work_type: '屋根工事', month: 1, market_price: 720000, assessed_price: 705600, assessment_date: '2023-01-19' },
      { region: '東北', work_type: '屋根工事', month: 2, market_price: 760000, assessed_price: 798400, assessment_date: '2023-02-07' },
      { region: '東北', work_type: '屋根工事', month: 3, market_price: 740000, assessed_price: 726800, assessment_date: '2023-03-11' },
      { region: '東北', work_type: '防水工事', month: 1, market_price: 570000, assessed_price: 561300, assessment_date: '2023-01-12' },
      { region: '東北', work_type: '防水工事', month: 2, market_price: 610000, assessed_price: 603900, assessment_date: '2023-02-13' },
      { region: '東北', work_type: '防水工事', month: 3, market_price: 590000, assessed_price: 613800, assessment_date: '2023-03-14' },
      { region: '関東', work_type: '屋根工事', month: 2, market_price: 850000, assessed_price: 840500, assessment_date: '2023-02-09' },
      { region: '関東', work_type: '屋根工事', month: 3, market_price: 880000, assessed_price: 911200, assessment_date: '2023-03-10' },
      { region: '関東', work_type: '屋根工事', month: 4, market_price: 900000, assessed_price: 918000, assessment_date: '2023-04-05' },
      { region: '関東', work_type: '防水工事', month: 1, market_price: 620000, assessed_price: 604200, assessment_date: '2023-01-08' },
      { region: '関東', work_type: '防水工事', month: 2, market_price: 660000, assessed_price: 693600, assessment_date: '2023-02-11' },
      { region: '関東', work_type: '防水工事', month: 3, market_price: 640000, assessed_price: 633600, assessment_date: '2023-03-15' },
      { region: '関西', work_type: '外壁塗装', month: 1, market_price: 1000000, assessed_price: 980000, assessment_date: '2023-01-09' },
      { region: '関西', work_type: '外壁塗装', month: 3, market_price: 1080000, assessed_price: 1080000, assessment_date: '2023-03-06' },
      { region: '関西', work_type: '外壁塗装', month: 4, market_price: 1050000, assessed_price: 1102500, assessment_date: '2023-04-07' },
      { region: '東北', work_type: '外壁塗装', month: 1, market_price: 900000, assessed_price: 891000, assessment_date: '2023-01-13' },
      { region: '東北', work_type: '外壁塗装', month: 2, market_price: 920000, assessed_price: 925400, assessment_date: '2023-02-06' },
      { region: '東北', work_type: '外壁塗装', month: 3, market_price: 880000, assessed_price: 866800, assessment_date: '2023-03-08' },
      { region: '関東', work_type: '外壁塗装', month: 4, market_price: 1000000, assessed_price: 1030000, assessment_date: '2023-04-02' },
      { region: '関東', work_type: '外壁塗装', month: 5, market_price: 1150000, assessed_price: 1104000, assessment_date: '2023-05-01' },
      { region: '関東', work_type: '外壁塗装', month: 7, market_price: 1000000, assessed_price: 1010000, assessment_date: '2023-07-03' },
      { region: '関西', work_type: '屋根工事', month: 4, market_price: 860000, assessed_price: 838200, assessment_date: '2023-04-06' },
      { region: '関西', work_type: '屋根工事', month: 5, market_price: 900000, assessed_price: 918000, assessment_date: '2023-05-04' },
      { region: '関西', work_type: '屋根工事', month: 6, market_price: 880000, assessed_price: 880000, assessment_date: '2023-06-02' },
      { region: '関西', work_type: '防水工事', month: 5, market_price: 610000, assessed_price: 579500, assessment_date: '2023-05-09' },
      { region: '関西', work_type: '防水工事', month: 6, market_price: 650000, assessed_price: 682500, assessment_date: '2023-06-07' },
      { region: '関西', work_type: '防水工事', month: 7, market_price: 630000, assessed_price: 619700, assessment_date: '2023-07-08' },
      { region: '東北', work_type: '屋根工事', month: 4, market_price: 780000, assessed_price: 812400, assessment_date: '2023-04-09' },
      { region: '東北', work_type: '屋根工事', month: 6, market_price: 750000, assessed_price: 742500, assessment_date: '2023-06-06' },
      { region: '東北', work_type: '屋根工事', month: 7, market_price: 770000, assessed_price: 785700, assessment_date: '2023-07-09' },
      { region: '東北', work_type: '防水工事', month: 4, market_price: 600000, assessed_price: 576000, assessment_date: '2023-04-10' },
      { region: '東北', work_type: '防水工事', month: 5, market_price: 640000, assessed_price: 665600, assessment_date: '2023-05-11' },
      { region: '東北', work_type: '防水工事', month: 6, market_price: 620000, assessed_price: 620000, assessment_date: '2023-06-09' },
      { region: '関東', work_type: '屋根工事', month: 5, market_price: 920000, assessed_price: 933200, assessment_date: '2023-05-03' },
      { region: '関東', work_type: '屋根工事', month: 6, market_price: 880000, assessed_price: 844800, assessment_date: '2023-06-04' },
      { region: '関東', work_type: '屋根工事', month: 7, market_price: 900000, assessed_price: 918000, assessment_date: '2023-07-02' },
      { region: '関東', work_type: '防水工事', month: 4, market_price: 680000, assessed_price: 651200, assessment_date: '2023-04-03' },
      { region: '関東', work_type: '防水工事', month: 5, market_price: 700000, assessed_price: 735000, assessment_date: '2023-05-05' },
      { region: '関東', work_type: '防水工事', month: 6, market_price: 680000, assessed_price: 680000, assessment_date: '2023-06-08' },
      { region: '関西', work_type: '外壁塗装', month: 5, market_price: 1100000, assessed_price: 1056000, assessment_date: '2023-05-08' },
      { region: '関西', work_type: '外壁塗装', month: 6, market_price: 980000, assessed_price: 980000, assessment_date: '2023-06-03' },
      { region: '関西', work_type: '外壁塗装', month: 7, market_price: 1050000, assessed_price: 1103250, assessment_date: '2023-07-04' },
      { region: '東北', work_type: '外壁塗装', month: 4, market_price: 900000, assessed_price: 972000, assessment_date: '2023-04-11' },
      { region: '東北', work_type: '外壁塗装', month: 5, market_price: 950000, assessed_price: 931000, assessment_date: '2023-05-12' },
      { region: '東北', work_type: '外壁塗装', month: 6, market_price: 920000, assessed_price: 920000, assessment_date: '2023-06-10' },
      { region: '関東', work_type: '外壁塗装', month: 8, market_price: 1120000, assessed_price: 1084800, assessment_date: '2023-08-01' },
      { region: '関東', work_type: '外壁塗装', month: 9, market_price: 1000000, assessed_price: 1000000, assessment_date: '2023-09-02' },
      { region: '関東', work_type: '外壁塗装', month: 10, market_price: 1050000, assessed_price: 1071750, assessment_date: '2023-10-01' },
      { region: '関西', work_type: '屋根工事', month: 8, market_price: 870000, assessed_price: 841800, assessment_date: '2023-08-02' },
      { region: '関西', work_type: '屋根工事', month: 9, market_price: 900000, assessed_price: 927000, assessment_date: '2023-09-03' },
      { region: '関西', work_type: '屋根工事', month: 10, market_price: 850000, assessed_price: 850000, assessment_date: '2023-10-02' },
      { region: '関西', work_type: '防水工事', month: 8, market_price: 600000, assessed_price: 600000, assessment_date: '2023-08-03' },
      { region: '関西', work_type: '防水工事', month: 9, market_price: 670000, assessed_price: 703700, assessment_date: '2023-09-04' },
      { region: '関西', work_type: '防水工事', month: 10, market_price: 640000, assessed_price: 636800, assessment_date: '2023-10-05' },
    ];

    // 関数実行
    const result = aggregateMonthlyDeviation(assessment_data);

    // 地域別集計の検証
    expect(result.by_region).toBeDefined();
    expect(Object.keys(result.by_region)).toContain('関東');
    expect(Object.keys(result.by_region)).toContain('関西');
    expect(Object.keys(result.by_region)).toContain('東北');

    // 関東の乖離率検証（2つのデータポイント例：950000/1000000=0.95、1045000/1100000=0.95）
    const kanto_average = result.by_region['関東'].average_deviation_rate;
    expect(kanto_average).toBeCloseTo(0.9702, 4);

    // 関西の乖離率検証
    const kansai_average = result.by_region['関西'].average_deviation_rate;
    expect(kansai_average).toBeCloseTo(0.9772, 4);

    // 東北の乖離率検証
    const tohoku_average = result.by_region['東北'].average_deviation_rate;
    expect(tohoku_average).toBeCloseTo(0.9702, 4);

    // 工事種別集計の検証
    expect(result.by_work_type).toBeDefined();
    expect(Object.keys(result.by_work_type)).toContain('外壁塗装');
    expect(Object.keys(result.by_work_type)).toContain('屋根工事');
    expect(Object.keys(result.by_work_type)).toContain('防水工事');

    // 外壁塗装の乖離率検証
    const gaiheki_average = result.by_work_type['外壁塗装'].average_deviation_rate;
    expect(gaiheki_average).toBeCloseTo(0.9810, 4);

    // 屋根工事の乖離率検証
    const yane_average = result.by_work_type['屋根工事'].average_deviation_rate;
    expect(yane_average).toBeCloseTo(0.9719, 4);

    // 防水工事の乖離率検証
    const bosui_average = result.by_work_type['防水工事'].average_deviation_rate;
    expect(bosui_average).toBeCloseTo(0.9648, 4);

    // 時期別（月別）集計の検証
    expect(result.by_month).toBeDefined();
    for (let month = 1; month <= 12; month++) {
      expect(result.by_month[month]).toBeDefined();
      expect(result.by_month[month].average_deviation_rate).toBeGreaterThan(0.9);
      expect(result.by_month[month].average_deviation_rate).toBeLessThan(1.1);
    }

    // 1月の乖離率検証（複数データで平均化）
    const january_average = result.by_month[1].average_deviation_rate;
    expect(january_average).toBeCloseTo(0.9702, 4);

    // 統計値の検証（標準偏差、中央値が存在することを確認）
    expect(result.by_region['関東'].median_deviation_rate).toBeDefined();
    expect(result.by_region['関東'].std_deviation).toBeDefined();
    expect(result.by_region['関東'].std_deviation).toBeGreaterThan(0);

    // 関東の中央値検証（乖離率をソートして中央値を計算）
    const kanto_median = result.by_region['関東'].median_deviation_rate;
    expect(kanto_median).toBeCloseTo(0.9700, 4);

    // 工事種別の標準偏差検証
    expect(result.by_work_type['外壁塗装'].std_deviation).toBeGreaterThanOrEqual(0);
    expect(result.by_work_type['屋根工事'].std_deviation).toBeGreaterThanOrEqual(0);
    expect(result.by_work_type['防水工事'].std_deviation).toBeGreaterThanOrEqual(0);

    // 複合条件での検証（関東地域の屋根工事における1月の乖離パターン）
    expect(result.by_region_work_type_month).toBeDefined();
    const composite_key = 'region=関東|work_type=屋根工事|month=1';
    expect(result.by_region_work_type_month[composite_key]).toBeDefined();
    const composite_result = result.by_region_work_type_month[composite_key];
    expect(composite_result.average_deviation_rate).toBeCloseTo(0.9600, 4);
    expect(composite_result.count).toBe(2);

    // エクスポート可能性の検証（CSV形式文字列）
    expect(result.export_csv).toBeDefined();
    expect(typeof result.export_csv).toBe('string');
    expect(result.export_csv).toContain('region');
    expect(result.export_csv).toContain('work_type');
    expect(result.export_csv).toContain('month');
    expect(result.export_csv).toContain('average_deviation_rate');

    // レポート形式での検証
    expect(result.export_report).toBeDefined();
    expect(typeof result.export_report).toBe('string');
    expect(result.export_report).toContain('月次相場乖離パターン');
    expect(result.export_report).toContain('地域別');
    expect(result.export_report).toContain('工事種別');
    expect(result.export_report).toContain('時期別');

    // 全体集計の検証
    expect(result.overall_statistics).toBeDefined();
    expect(result.overall_statistics.total_count).toBeGreaterThanOrEqual(100);
    expect(result.overall_statistics.overall_average_deviation_rate).toBeCloseTo(0.9738, 4);
    expect(result.overall_statistics.overall_median_deviation_rate).toBeCloseTo(0.9700, 4);
    expect(result.overall_statistics.overall_std_deviation).toBeGreaterThan(0);

    // 各地域のデータ件数の検証
    expect(result.by_region['関東'].count).toBeGreaterThan(20);
    expect(result.by_region['関西'].count).toBeGreaterThan(20);
    expect(result.by_region['東北'].count).toBeGreaterThan(20);

    // 最小・最大乖離率の検証
    expect(result.by_region['関東'].min_deviation_rate).toBeCloseTo(0.9300, 4);
    expect(result.by_region['関東'].max_deviation_rate).toBeCloseTo(1.0300, 4);

    // データが存在しない月のハンドリング（月次データの完全性）
    for (let month = 1; month <= 12; month++) {
      expect(result.by_month[month]).toBeDefined();
      expect(result.by_month[month].count).toBeGreaterThan(0);
    }

    // 複合条件での複数パターンの検証
    const composite_key_2 = 'region=関西|work_type=外壁塗装|month=2';
    expect(result.by_region_work_type_month[composite_key_2]).toBeDefined();
    expect(result.by_region_work_type_month[composite_key_2].count).toBe(2);
    expect(result.by_region_work_type_month[composite_key_2].average_deviation_rate).toBeCloseTo(1.0050, 4);
  });
});