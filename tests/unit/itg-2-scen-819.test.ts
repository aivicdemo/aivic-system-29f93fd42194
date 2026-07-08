import { detectOCRReadingAnomalies } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-819: [normal] OCR読取異常値検出・フラグ付け機能
  test('OCR読取結果の不明瞭な箇所に警告フラグが付与され、手動確認を促すメッセージが表示される', () => {
    // 入力: 不明瞭な読取値を含むOCR結果
    const ocr_extraction_result = {
      estimated_date: '2024-01-15T09:30:00Z',
      ocr_items: [
        {
          item_id: 'LINE_001',
          item_name: '土工工事',
          quantity: 100,
          unit: '㎥',
          unit_price: 5000,
          amount: 500000,
          confidence_score: 0.95,
          is_unclear: false,
        },
        {
          item_id: 'LINE_002',
          item_name: 'コンク○○○', // 不明瞭な読取
          quantity: 50,
          unit: '㎥',
          unit_price: 8500,
          amount: 425000,
          confidence_score: 0.62, // 低信頼度スコア
          is_unclear: true,
        },
        {
          item_id: 'LINE_003',
          item_name: '鉄筋',
          quantity: 12,
          unit: 't',
          unit_price: 850000,
          amount: 10200000,
          confidence_score: 0.58, // 閾値以下
          is_unclear: true,
        },
      ],
      source_document_type: 'estimate_sheet',
      estimated_total_amount: 11125000,
    };

    // 実行
    const result = detectOCRReadingAnomalies(ocr_extraction_result);

    // 検証: 警告フラグが正しく付与されている
    expect(result.has_detected_anomalies).toBe(true);
    expect(result.anomaly_flags.length).toBe(2);

    // 検証: 不明瞭な箇所の詳細情報
    const unclear_item_1 = result.anomaly_flags.find(
      (f: any) => f.item_id === 'LINE_002'
    );
    expect(unclear_item_1).toBeDefined();
    expect(unclear_item_1.flag_type).toBe('LOW_CONFIDENCE');
    expect(unclear_item_1.confidence_score).toBe(0.62);
    expect(unclear_item_1.severity_level).toBe('MEDIUM');
    expect(unclear_item_1.message).toMatch(/確認/);

    const unclear_item_2 = result.anomaly_flags.find(
      (f: any) => f.item_id === 'LINE_003'
    );
    expect(unclear_item_2).toBeDefined();
    expect(unclear_item_2.flag_type).toBe('BELOW_THRESHOLD');
    expect(unclear_item_2.confidence_score).toBe(0.58);
    expect(unclear_item_2.severity_level).toBe('HIGH');

    // 検証: 手動確認を促すメッセージが画面に表示される
    expect(result.manual_review_required).toBe(true);
    expect(result.manual_review_message).toMatch(/手動確認が必要/);

    // 検証: 査定員へのアラート通知が生成される
    expect(result.alert_notification).toBeDefined();
    expect(result.alert_notification.notification_type).toBe('OCR_ANOMALY');
    expect(result.alert_notification.target_role).toBe('ASSESSOR');
    expect(result.alert_notification.priority_level).toBe('HIGH');
    expect(result.alert_notification.should_send).toBe(true);
    expect(result.alert_notification.notification_content).toMatch(/不明瞭/);

    // 検証: 異常が検出されたアイテム数
    expect(result.anomaly_count).toBe(2);
    expect(result.normal_item_count).toBe(1);

    // 検証: 全体の推奨アクション
    expect(result.recommended_action).toBe('MANUAL_VERIFICATION_REQUIRED');
  });
});