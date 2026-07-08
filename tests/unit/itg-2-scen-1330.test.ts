import { detectQuotationAnomalies } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  test('SCEN-1330: 見積金額乖離検出・異常値通知機能 - AI-OCR読取項目が学習データの相場範囲から乖離した場合、乖離額・乖離率・補正係数が正常に記録される', () => {
    // テストデータ: AI-OCR読取項目が学習データの相場範囲から乖離した査定品情報
    const input = {
      quotation_id: 'Q20240115001',
      ocr_read_amount: 1500000, // AI-OCR読取金額
      market_median: 1000000, // 相場中央値（学習データから算出）
      market_q1: 900000, // 第1四分位数（相場範囲下限）
      market_q3: 1100000, // 第3四分位数（相場範囲上限）
      construction_type: '鉄骨工事',
      region: '東京都',
      period: '2024-01',
      reference_data_count: 45, // 参照データ件数
      application_timestamp: '2024-01-15T11:30:00Z',
    };

    // 見積金額乖離検出・異常値通知機能を実行
    const result = detectQuotationAnomalies(input);

    // 乖離額: 実際の読取値と相場中央値の差分
    const expected_deviation_amount = 1500000 - 1000000; // 500,000円
    expect(result.deviation_amount).toBe(500000);

    // 乖離率: (乖離額 / 相場中央値) × 100
    const expected_deviation_rate = (500000 / 1000000) * 100; // 50%
    expect(result.deviation_rate).toBe(50);

    // 補正係数: 乖離額に基づく補正パラメータ
    // 補正係数 = 1 + (乖離額 / 相場中央値)
    const expected_correction_coefficient = 1 + (500000 / 1000000); // 1.5
    expect(result.correction_coefficient).toBeCloseTo(1.5, 5);

    // 計算された乖離額、乖離率、補正係数がデータベースに記録されていることを確認
    expect(result.recorded_in_database).toBe(true);

    // 記録されたデータの構造を確認
    expect(result.database_record).toEqual({
      quotation_id: 'Q20240115001',
      deviation_amount: 500000,
      deviation_rate: 50,
      correction_coefficient: 1.5,
      market_median: 1000000,
      ocr_read_amount: 1500000,
      construction_type: '鉄骨工事',
      region: '東京都',
      period: '2024-01',
      reference_data_count: 45,
      recorded_at: '2024-01-15T11:30:00Z',
    });

    // 乖離度合いに応じて異常値として適切にフラグ付けされていることを確認
    // 乖離率が30%以上の場合: HIGH警告フラグ
    // 乖離率が15%以上30%未満の場合: MEDIUM注意フラグ
    // 乖離率が15%未満の場合: LOW正常フラグ
    expect(result.alert_flag).toBe('HIGH');
    expect(result.is_anomaly).toBe(true);
    expect(result.alert_message).toBe('乖離率が50%に達しています。要注意。');

    // 複数項目の乖離パターン検証（複合条件テスト）
    const input_multiple = {
      quotation_id: 'Q20240115002',
      ocr_read_amount: 950000, // 過小見積
      market_median: 1000000,
      market_q1: 900000,
      market_q3: 1100000,
      construction_type: '土木工事',
      region: '大阪府',
      period: '2024-01',
      reference_data_count: 38,
      application_timestamp: '2024-01-15T12:00:00Z',
    };

    const result_multiple = detectQuotationAnomalies(input_multiple);

    // 乖離額（負数）: 950,000 - 1,000,000 = -50,000
    expect(result_multiple.deviation_amount).toBe(-50000);

    // 乖離率（絶対値）: |-50,000 / 1,000,000| × 100 = 5%
    expect(result_multiple.deviation_rate).toBe(5);

    // 補正係数: 1 + (-50,000 / 1,000,000) = 0.95
    expect(result_multiple.correction_coefficient).toBeCloseTo(0.95, 5);

    // 乖離率5%は許容範囲内なので LOW フラグ
    expect(result_multiple.alert_flag).toBe('LOW');
    expect(result_multiple.is_anomaly).toBe(false);

    // 境界値テスト: 乖離率がちょうど15%の場合
    const input_boundary = {
      quotation_id: 'Q20240115003',
      ocr_read_amount: 1150000, // 15%乖離
      market_median: 1000000,
      market_q1: 900000,
      market_q3: 1100000,
      construction_type: '建築工事',
      region: '福岡県',
      period: '2024-01',
      reference_data_count: 52,
      application_timestamp: '2024-01-15T13:00:00Z',
    };

    const result_boundary = detectQuotationAnomalies(input_boundary);

    // 乖離額: 1,150,000 - 1,000,000 = 150,000
    expect(result_boundary.deviation_amount).toBe(150000);

    // 乖離率: (150,000 / 1,000,000) × 100 = 15%
    expect(result_boundary.deviation_rate).toBe(15);

    // 補正係数: 1 + (150,000 / 1,000,000) = 1.15
    expect(result_boundary.correction_coefficient).toBeCloseTo(1.15, 5);

    // 乖離率が15%の場合は MEDIUM フラグ（15%以上30%未満）
    expect(result_boundary.alert_flag).toBe('MEDIUM');
    expect(result_boundary.is_anomaly).toBe(true);

    // 異常値通知対象フラグの確認
    expect(result_boundary.notification_required).toBe(true);
    expect(result_boundary.database_record.recorded_at).toBe('2024-01-15T13:00:00Z');
  });
});