import { analyzeAccuracyDataCorrelation } from '../../src/logic/it-6-2-2-1';

describe('学習データ更新履歴との相関分析機能', () => {
  // SCEN-1196
  test('[normal] 精度低下タイミングと学習データ変更イベントが正確に対照される', () => {
    // 準備: 複数の時間軸での精度値を記録したデータセット
    const accuracy_data_points = [
      {
        timestamp: new Date('2024-01-01T08:00:00Z'),
        ocr_accuracy: 92.5,
        ai_judgment_accuracy: 88.3,
      },
      {
        timestamp: new Date('2024-01-02T08:00:00Z'),
        ocr_accuracy: 91.8,
        ai_judgment_accuracy: 87.5,
      },
      {
        timestamp: new Date('2024-01-03T08:00:00Z'),
        ocr_accuracy: 85.2,
        ai_judgment_accuracy: 79.4,
      },
      {
        timestamp: new Date('2024-01-04T08:00:00Z'),
        ocr_accuracy: 84.9,
        ai_judgment_accuracy: 78.6,
      },
      {
        timestamp: new Date('2024-01-05T08:00:00Z'),
        ocr_accuracy: 89.7,
        ai_judgment_accuracy: 84.2,
      },
    ];

    // 準備: 学習データ更新イベントの複数件設定
    const training_data_events = [
      {
        event_id: 'evt_001',
        timestamp: new Date('2024-01-02T18:00:00Z'),
        event_type: 'データ追加',
        data_count: 150,
        region: '東京',
        work_type: '土木工事',
      },
      {
        event_id: 'evt_002',
        timestamp: new Date('2024-01-02T19:30:00Z'),
        event_type: 'データ変更',
        data_count: 50,
        region: '関西',
        work_type: '建築工事',
      },
      {
        event_id: 'evt_003',
        timestamp: new Date('2024-01-04T17:00:00Z'),
        event_type: 'データ削除',
        data_count: 30,
        region: '九州',
        work_type: '内装工事',
      },
    ];

    // 実行: 相関分析機能を実行
    const analysis_result = analyzeAccuracyDataCorrelation({
      accuracy_points: accuracy_data_points,
      training_events: training_data_events,
      accuracy_decline_threshold: 5.0,
      time_correlation_window_hours: 24,
    });

    // 検証1: 分析結果が返される
    expect(analysis_result).toBeDefined();
    expect(analysis_result.correlation_mappings).toBeDefined();
    expect(Array.isArray(analysis_result.correlation_mappings)).toBe(true);

    // 検証2: 精度低下が検出されたタイミングを確認
    // 2024-01-02 08:00 → 2024-01-03 08:00 で OCR 精度が 91.8% → 85.2% (低下 6.6%)
    // 2024-01-02 18:00, 19:30 に学習データ更新イベント
    const first_decline_mapping = analysis_result.correlation_mappings.find(
      (m: any) => m.accuracy_decline_timestamp === '2024-01-03T08:00:00Z'
    );
    expect(first_decline_mapping).toBeDefined();
    expect(first_decline_mapping.decline_magnitude).toBe(6.6);
    expect(first_decline_mapping.correlated_event_ids).toContain('evt_001');
    expect(first_decline_mapping.correlated_event_ids).toContain('evt_002');

    // 検証3: 精度低下タイミングと学習データ更新イベントの時間的相関を検証
    // evt_001 (2024-01-02 18:00) → 精度測定 (2024-01-03 08:00)
    // 時間差: 14時間 ( 許容範囲 24時間内 )
    expect(first_decline_mapping.time_gap_hours).toBe(14);
    expect(first_decline_mapping.is_within_correlation_window).toBe(true);

    // 検証4: 2つ目の精度低下ポイント (2024-01-03 08:00 → 2024-01-04 08:00)
    // OCR 精度: 85.2% → 84.9% (低下 0.3% - 閾値未満なので検出されない)
    // ただし AI 判定精度は 79.4% → 78.6% (低下 0.8% - 閾値未満)
    // 合計精度低下が判定される場合をテスト
    const second_decline_mapping = analysis_result.correlation_mappings.find(
      (m: any) => m.accuracy_decline_timestamp === '2024-01-04T08:00:00Z'
    );
    if (second_decline_mapping) {
      expect(second_decline_mapping.correlated_event_ids).toContain('evt_003');
      expect(second_decline_mapping.time_gap_hours).toBe(15);
    }

    // 検証5: 精度回復ポイント (2024-01-04 08:00 → 2024-01-05 08:00)
    // OCR 精度: 84.9% → 89.7% (上昇 4.8%)
    // 低下ではなく回復なので対照イベント無し
    const recovery_mapping = analysis_result.correlation_mappings.find(
      (m: any) => m.accuracy_decline_timestamp === '2024-01-05T08:00:00Z'
    );
    expect(recovery_mapping).toBeUndefined();

    // 検証6: 分析結果に対応関係が完全に記載されている
    expect(analysis_result.total_decline_events_detected).toBeGreaterThanOrEqual(1);
    expect(analysis_result.total_training_events_analyzed).toBe(3);

    // 検証7: マッピングの完全性確認
    // 各精度低下イベントに対して 1 つ以上の学習データイベントが対応付けられている
    analysis_result.correlation_mappings.forEach((mapping: any) => {
      expect(mapping.correlated_event_ids).toBeDefined();
      expect(Array.isArray(mapping.correlated_event_ids)).toBe(true);
      expect(mapping.correlated_event_ids.length).toBeGreaterThan(0);
      expect(mapping.time_gap_hours).toBeDefined();
      expect(mapping.is_within_correlation_window).toBe(true);
    });

    // 検証8: 相関マッピングのタイムスタンプが正確か確認
    expect(first_decline_mapping.accuracy_decline_timestamp).toBe(
      '2024-01-03T08:00:00Z'
    );
    expect(first_decline_mapping.primary_correlated_event_timestamp).toBe(
      '2024-01-02T18:00:00Z'
    );

    // 検証9: 対応関係の誤りや漏れがないことを確認
    // evt_001 が対応付けられている精度低下イベントの数 = 1
    const evt_001_mappings = analysis_result.correlation_mappings.filter(
      (m: any) => m.correlated_event_ids.includes('evt_001')
    );
    expect(evt_001_mappings.length).toBe(1);

    // 検証10: 分析結果レポートの形式確認
    expect(analysis_result.analysis_status).toBe('completed');
    expect(analysis_result.correlation_mappings.length).toBeGreaterThanOrEqual(1);
  });
});