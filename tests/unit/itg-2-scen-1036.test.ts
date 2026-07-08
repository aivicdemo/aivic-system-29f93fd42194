import { recordNegotiationResultAndAccumulateLearningData } from '../../src/logic/it-6-2-2-2';

describe('交渉結果学習データ蓄積機能', () => {
  test('SCEN-1036: 交渉結果を記録時、学習データとして蓄積され次回モデル改善に利用可能となる', () => {
    const assessment_case_id = 'CASE-20240115-001';
    const price_before_negotiation = 5000000;
    const price_after_negotiation = 4800000;
    const negotiation_reason = '地域相場に基づく価格調整';
    const negotiation_counterparty = 'ゼネコンA';
    const negotiation_date = '2024-01-15T14:30:00Z';
    const assessor_id = 'ASSESSOR-001';
    const assessor_name = '鈴木太郎';

    const result = recordNegotiationResultAndAccumulateLearningData({
      assessment_case_id,
      price_before_negotiation,
      price_after_negotiation,
      negotiation_reason,
      negotiation_counterparty,
      negotiation_date,
      assessor_id,
      assessor_name,
    });

    // 交渉結果が正常に記録されたことを確認
    expect(result.success).toBe(true);
    expect(result.recorded_at).toBe('2024-01-15T14:30:00Z');

    // 交渉結果データが学習データセットに蓄積されたことを確認
    expect(result.accumulated_in_learning_data).toBe(true);
    expect(result.learning_dataset_id).toBeDefined();

    // 交渉前後の価格差分を確認
    const price_difference = price_before_negotiation - price_after_negotiation;
    const deviation_rate = (price_difference / price_before_negotiation) * 100;
    expect(price_difference).toBe(200000);
    expect(deviation_rate).toBeCloseTo(4.0, 1);

    // 記録されたデータが学習データ管理画面に反映されることを確認
    expect(result.visible_in_learning_management_screen).toBe(true);
    expect(result.learning_data_status).toBe('accumulated');

    // 次回相場判定モデル改善時に利用可能であることを確認
    expect(result.available_for_next_model_training).toBe(true);
    expect(result.training_data_category).toBe('negotiation_result');
    expect(result.training_data_region).toBeDefined();
    expect(result.training_data_work_type).toBeDefined();

    // 記録完了メッセージの確認
    expect(result.completion_message).toContain('記録完了');

    // 学習データセット内での記録確認
    expect(result.stored_in_database).toBe(true);
    expect(result.audit_trail_recorded).toBe(true);
    expect(result.assessor_recorded_id).toBe('ASSESSOR-001');
  });
});