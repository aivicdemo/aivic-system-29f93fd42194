import { generateMonthlyImprovementReport } from '../../src/logic/it-1-br-2-2-2-1';

describe('査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード', () => {
  test('SCEN-1516: 物価本マスタ更新が0件である場合も正常に月次レポートを生成', () => {
    // テストデータの準備：物価本マスタ更新が0件の状態
    const input = {
      report_period_start: '2024-01-01',
      report_period_end: '2024-01-31',
      assessor_id: 'assessor_001',
      price_book_updates_count: 0,
      past_case_data_updates_count: 15,
      ocr_accuracy_before: 92.5,
      ocr_accuracy_after: 94.2,
      ai_judgment_accuracy_before: 88.3,
      ai_judgment_accuracy_after: 90.1,
      assessor_processing_time_before_minutes: 18,
      assessor_processing_time_after_minutes: 15,
      monthly_assessments_count: 142,
      quality_uniformity_index_before: 78.5,
      quality_uniformity_index_after: 85.3,
      system_uptime_rate: 99.8,
      data_quality_score: 92.0,
    };

    // 月次レポート生成処理を実行
    const result = generateMonthlyImprovementReport(input);

    // レポート生成がエラーなく完了したことを確認
    expect(result).toBeDefined();
    expect(result.status).toBe('completed');

    // 0件であることが適切に反映されたレポートを検証
    expect(result.price_book_updates_count).toBe(0);
    expect(result.price_book_updates_reflected).toBe(false);

    // 過去案件データの更新件数は正常に反映
    expect(result.past_case_data_updates_count).toBe(15);
    expect(result.past_case_data_updates_reflected).toBe(true);

    // OCR精度の改善度を検証（改善前：92.5% → 改善後：94.2%）
    const ocr_improvement_rate = ((94.2 - 92.5) / 92.5) * 100;
    expect(result.ocr_accuracy_improvement_rate).toBe(1.84);

    // AI判定精度の改善度を検証（改善前：88.3% → 改善後：90.1%）
    const ai_improvement_rate = ((90.1 - 88.3) / 88.3) * 100;
    expect(result.ai_judgment_accuracy_improvement_rate).toBe(2.04);

    // 処理時間短縮率を検証（改善前：18分 → 改善後：15分）
    const processing_time_reduction_rate = ((18 - 15) / 18) * 100;
    expect(result.processing_time_reduction_rate).toBe(16.67);

    // 品質均一化指標の改善度を検証（改善前：78.5 → 改善後：85.3）
    const quality_uniformity_improvement = 85.3 - 78.5;
    expect(result.quality_uniformity_improvement).toBe(6.8);

    // システム稼働率が正常に記録されたことを確認
    expect(result.system_uptime_rate).toBe(99.8);

    // データ品質スコアが正常に記録されたことを確認
    expect(result.data_quality_score).toBe(92.0);

    // 月次査定件数が正常に集計されたことを確認
    expect(result.monthly_assessments_count).toBe(142);

    // レポートのヘッダー情報を検証
    expect(result.report_header).toBeDefined();
    expect(result.report_header.report_period_start).toBe('2024-01-01');
    expect(result.report_header.report_period_end).toBe('2024-01-31');
    expect(result.report_header.assessor_id).toBe('assessor_001');
    expect(result.report_header.generation_timestamp).toBeDefined();

    // レポートのフッター情報を検証
    expect(result.report_footer).toBeDefined();
    expect(result.report_footer.total_data_items_processed).toBe(15);
    expect(result.report_footer.data_items_with_updates).toBe(15);
    expect(result.report_footer.data_items_without_updates).toBe(0);

    // 0件の更新がレポートの要約セクションに反映されたことを確認
    expect(result.summary.price_book_update_status).toBe('no_updates_in_period');
    expect(result.summary.data_quality_maintained).toBe(true);

    // 生成されたレポートのステータスが正常終了であることを確認
    expect(result.exit_status).toBe('success');
    expect(result.error_message).toBeNull();

    // レポートのメタデータを検証
    expect(result.metadata).toBeDefined();
    expect(result.metadata.report_format_version).toBe('1.0');
    expect(result.metadata.system_name).toBe('assess_quality_management');
  });
});