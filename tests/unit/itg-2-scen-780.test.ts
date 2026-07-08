import { determineDataImprovementPriority } from '../../src/logic/it-6-2-2-2';

describe('学習データ改善優先度自動判定機能', () => {
  test('SCEN-780: 精度低下検知とフィードバック件数超過が同時に発生した場合に優先度が適切に判定される', () => {
    // 【前提】学習データ改善優先度自動判定機能にアクセスし、テスト用モデルの精度メトリクスを低下状態に設定
    // 前月比で5%以上低下を再現: 前月精度 85%, 当月精度 80% → 低下率 5.88%
    const current_accuracy = 80;
    const previous_accuracy = 85;
    const accuracy_decline_rate = ((previous_accuracy - current_accuracy) / previous_accuracy) * 100;

    // フィードバック件数を閾値超過状態に設定
    // 許容件数を50件と仮定、超過は50 * 1.2 = 60件
    const allowable_feedback_count = 50;
    const current_feedback_count = 60;

    // 判定処理を実行
    const result = determineDataImprovementPriority({
      model_id: 'test_model_001',
      current_ocr_accuracy: current_accuracy,
      previous_ocr_accuracy: previous_accuracy,
      accuracy_decline_threshold: 5,
      current_feedback_count: current_feedback_count,
      allowable_feedback_count: allowable_feedback_count,
      evaluation_timestamp: new Date('2024-12-15T09:00:00Z')
    });

    // 【判定結果の優先度レベルを確認】
    // 精度低下検知 + フィードバック件数超過 → 優先度は『高（High）』
    expect(result.priority_level).toBe('High');

    // 【判定結果に含まれる理由コードを確認】
    // 『ACCURACY_DECLINE』と『FEEDBACK_OVERFLOW』の両方が含まれていること
    expect(result.reason_codes).toContain('ACCURACY_DECLINE');
    expect(result.reason_codes).toContain('FEEDBACK_OVERFLOW');
    expect(result.reason_codes.length).toBe(2);

    // 【判定結果のタイムスタンプが現在時刻と一致していることを確認】
    expect(result.judgment_timestamp).toEqual(new Date('2024-12-15T09:00:00Z'));

    // 【判定結果が正常に記録されていることを確認】
    expect(result.model_id).toBe('test_model_001');
    expect(result.accuracy_decline_rate).toBe(accuracy_decline_rate);
    expect(result.feedback_overflow_rate).toBe(20); // (60 - 50) / 50 * 100 = 20%
    expect(result.is_recorded).toBe(true);
  });
});