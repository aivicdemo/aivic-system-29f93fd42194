import { validateExplanationMaterialApproval } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1023
  test('査定部署長による説明資料の最終確認・承認 - 根拠の妥当性が基準を満たさない場合に差戻し判定が実行される', () => {
    const explanation_material_id = 'EXPL20240115001';
    const assessment_supervisor_user_id = 'SUP20240115001';
    const assessment_timestamp = new Date('2024-01-15T10:00:00Z');
    const deviation_rate_percent = 28.5;
    const deviation_amount_yen = 450000;
    const reference_data_count = 8;
    const correction_coefficient = 0.95;
    const assessment_basis_credibility_score = 58;
    const judgment_logic_validity_score = 52;
    const data_reference_appropriateness_score = 62;
    const overall_reasonableness_score = 57;
    const required_approval_threshold = 70;
    const sendback_reason_text = '参照データが不足しており、判定根拠の信頼性が不十分です。過去案件データを追加した上で再度提出してください。';
    const sendback_timestamp = new Date('2024-01-15T10:05:00Z');

    const result = validateExplanationMaterialApproval({
      explanation_material_id,
      assessment_supervisor_user_id,
      assessment_timestamp,
      deviation_rate_percent,
      deviation_amount_yen,
      reference_data_count,
      correction_coefficient,
      assessment_basis_credibility_score,
      judgment_logic_validity_score,
      data_reference_appropriateness_score,
      overall_reasonableness_score,
      required_approval_threshold,
      sendback_reason_text,
      sendback_timestamp,
    });

    expect(result.approval_status).toBe('SENDBACK');
    expect(result.overall_reasonableness_score).toBe(57);
    expect(result.meets_approval_criteria).toBe(false);
    expect(result.sendback_executed).toBe(true);
    expect(result.sendback_timestamp).toEqual(new Date('2024-01-15T10:05:00Z'));
    expect(result.sendback_reason).toBe(sendback_reason_text);
    expect(result.assessment_supervisor_id).toBe(assessment_supervisor_user_id);
    expect(result.notification_to_assessor_sent).toBe(true);
    expect(result.notification_type).toBe('SENDBACK_NOTICE');
    expect(result.assessor_sendback_list_updated).toBe(true);
    expect(result.required_approval_threshold).toBe(required_approval_threshold);
    expect(result.assessment_basis_credibility_score).toBe(58);
    expect(result.judgment_logic_validity_score).toBe(52);
    expect(result.data_reference_appropriateness_score).toBe(62);
  });
});