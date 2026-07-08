import { calculateReadingErrorRateByFormatAndRegion } from '../../src/logic/it-6-2-1-1';

describe('読取誤り傾向分析機能 - フォーマット別・地域別の誤り発生率算出', () => {
  test('SCEN-1401: フォーマット別・地域別の誤り発生率が正確に算出される', () => {
    // テストデータ: 100件の読取記録
    // フォーマットA東日本: 10件中2件誤り → 20.00%
    // フォーマットA西日本: 15件中1件誤り → 6.67%
    // フォーマットB東日本: 12件中3件誤り → 25.00%
    // フォーマットB中部: 13件中2件誤り → 15.38%
    // フォーマットC東日本: 14件中1件誤り → 7.14%
    // フォーマットC西日本: 18件中4件誤り → 22.22%
    // 未分類: 18件中0件誤り → 0.00%
    // 合計: 100件中13件誤り → 全体13.00%

    const reading_records = [
      // フォーマットA東日本: 10件中2件誤り
      { format: 'A', region: '東日本', has_error: false, record_id: 'rec_001' },
      { format: 'A', region: '東日本', has_error: false, record_id: 'rec_002' },
      { format: 'A', region: '東日本', has_error: true, record_id: 'rec_003' },
      { format: 'A', region: '東日本', has_error: false, record_id: 'rec_004' },
      { format: 'A', region: '東日本', has_error: false, record_id: 'rec_005' },
      { format: 'A', region: '東日本', has_error: false, record_id: 'rec_006' },
      { format: 'A', region: '東日本', has_error: true, record_id: 'rec_007' },
      { format: 'A', region: '東日本', has_error: false, record_id: 'rec_008' },
      { format: 'A', region: '東日本', has_error: false, record_id: 'rec_009' },
      { format: 'A', region: '東日本', has_error: false, record_id: 'rec_010' },
      // フォーマットA西日本: 15件中1件誤り
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_011' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_012' },
      { format: 'A', region: '西日本', has_error: true, record_id: 'rec_013' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_014' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_015' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_016' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_017' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_018' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_019' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_020' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_021' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_022' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_023' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_024' },
      { format: 'A', region: '西日本', has_error: false, record_id: 'rec_025' },
      // フォーマットB東日本: 12件中3件誤り
      { format: 'B', region: '東日本', has_error: true, record_id: 'rec_026' },
      { format: 'B', region: '東日本', has_error: false, record_id: 'rec_027' },
      { format: 'B', region: '東日本', has_error: true, record_id: 'rec_028' },
      { format: 'B', region: '東日本', has_error: false, record_id: 'rec_029' },
      { format: 'B', region: '東日本', has_error: false, record_id: 'rec_030' },
      { format: 'B', region: '東日本', has_error: true, record_id: 'rec_031' },
      { format: 'B', region: '東日本', has_error: false, record_id: 'rec_032' },
      { format: 'B', region: '東日本', has_error: false, record_id: 'rec_033' },
      { format: 'B', region: '東日本', has_error: false, record_id: 'rec_034' },
      { format: 'B', region: '東日本', has_error: false, record_id: 'rec_035' },
      { format: 'B', region: '東日本', has_error: false, record_id: 'rec_036' },
      { format: 'B', region: '東日本', has_error: false, record_id: 'rec_037' },
      // フォーマットB中部: 13件中2件誤り
      { format: 'B', region: '中部', has_error: true, record_id: 'rec_038' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_039' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_040' },
      { format: 'B', region: '中部', has_error: true, record_id: 'rec_041' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_042' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_043' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_044' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_045' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_046' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_047' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_048' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_049' },
      { format: 'B', region: '中部', has_error: false, record_id: 'rec_050' },
      // フォーマットC東日本: 14件中1件誤り
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_051' },
      { format: 'C', region: '東日本', has_error: true, record_id: 'rec_052' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_053' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_054' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_055' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_056' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_057' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_058' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_059' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_060' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_061' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_062' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_063' },
      { format: 'C', region: '東日本', has_error: false, record_id: 'rec_064' },
      // フォーマットC西日本: 18件中4件誤り
      { format: 'C', region: '西日本', has_error: true, record_id: 'rec_065' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_066' },
      { format: 'C', region: '西日本', has_error: true, record_id: 'rec_067' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_068' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_069' },
      { format: 'C', region: '西日本', has_error: true, record_id: 'rec_070' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_071' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_072' },
      { format: 'C', region: '西日本', has_error: true, record_id: 'rec_073' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_074' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_075' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_076' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_077' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_078' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_079' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_080' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_081' },
      { format: 'C', region: '西日本', has_error: false, record_id: 'rec_082' },
      // 未分類: 18件中0件誤り
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_083' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_084' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_085' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_086' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_087' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_088' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_089' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_090' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_091' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_092' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_093' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_094' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_095' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_096' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_097' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_098' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_099' },
      { format: 'D', region: '不明', has_error: false, record_id: 'rec_100' },
    ];

    const result = calculateReadingErrorRateByFormatAndRegion(reading_records);

    // 期待値:
    // フォーマットA東日本: 20.00%
    // フォーマットA西日本: 6.67%
    // フォーマットB東日本: 25.00%
    // フォーマットB中部: 15.38%
    // フォーマットC東日本: 7.14%
    // フォーマットC西日本: 22.22%
    // フォーマットD不明: 0.00%
    // 全体: 13.00%

    // フォーマット別・地域別の誤り発生率を検証
    expect(result.error_rates_by_format_and_region).toEqual(
      expect.arrayContaining([
        {
          format: 'A',
          region: '東日本',
          error_count: 2,
          total_count: 10,
          error_rate: 20.00,
        },
        {
          format: 'A',
          region: '西日本',
          error_count: 1,
          total_count: 15,
          error_rate: 6.67,
        },
        {
          format: 'B',
          region: '東日本',
          error_count: 3,
          total_count: 12,
          error_rate: 25.00,
        },
        {
          format: 'B',
          region: '中部',
          error_count: 2,
          total_count: 13,
          error_rate: 15.38,
        },
        {
          format: 'C',
          region: '東日本',
          error_count: 1,
          total_count: 14,
          error_rate: 7.14,
        },
        {
          format: 'C',
          region: '西日本',
          error_count: 4,
          total_count: 18,
          error_rate: 22.22,
        },
        {
          format: 'D',
          region: '不明',
          error_count: 0,
          total_count: 18,
          error_rate: 0.00,
        },
      ])
    );

    // 全体誤り発生率を検証
    expect(result.overall_error_rate).toBe(13.00);

    // 全体エラー件数を検証
    expect(result.total_error_count).toBe(13);

    // 全体件数を検証
    expect(result.total_count).toBe(100);

    // 加重平均の整合性を検証
    // 各組み合わせの加重平均 = sum(error_count) / sum(total_count) * 100
    const weighted_sum = result.error_rates_by_format_and_region.reduce(
      (sum, item) => sum + item.error_count,
      0
    );
    const weighted_total = result.error_rates_by_format_and_region.reduce(
      (sum, item) => sum + item.total_count,
      0
    );
    const weighted_average = (weighted_sum / weighted_total) * 100;

    expect(weighted_average).toBe(result.overall_error_rate);

    // データの配列長を検証
    expect(result.error_rates_by_format_and_region.length).toBe(7);
  });
});