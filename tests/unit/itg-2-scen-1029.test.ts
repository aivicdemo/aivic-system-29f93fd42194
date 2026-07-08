import { analyzeContractorQuestion } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-1029: [normal] ゼネコン質問対応自動判定機能
  test('ゼネコンからの相場乖離関連質問が自動判定され、適切なテンプレートとSLAが提示される', () => {
    const input_question_content =
      'この査定額は市場相場より大幅に低いのではないか';
    const input_contractor_id = 'CONTRACTOR_001';
    const input_question_id = 'Q_2024_001';
    const input_submission_timestamp = new Date('2024-01-15T10:30:00Z');

    const result = analyzeContractorQuestion({
      question_id: input_question_id,
      contractor_id: input_contractor_id,
      question_content: input_question_content,
      submission_timestamp: input_submission_timestamp,
    });

    // 質問が相場乖離カテゴリに自動判定されたことを確認
    expect(result.category).toBe('relative_price_deviation');

    // 判定信頼度スコアが80以上であることを確認
    expect(result.confidence_score).toBeGreaterThanOrEqual(80);
    expect(result.confidence_score).toBeLessThanOrEqual(100);

    // SLAが正確に提示されたことを確認
    expect(result.sla).toMatchObject({
      response_deadline_hours: 24,
      priority_level: 'high',
      escalation_required: false,
    });

    // 提示されたテンプレートが相場乖離対応用であることを確認
    expect(result.response_template).toBeDefined();
    expect(result.response_template.template_id).toBe(
      'TEMPLATE_PRICE_DEVIATION_001'
    );
    expect(result.response_template.category).toBe('relative_price_deviation');

    // テンプレートが社内ルール・基準に準拠していることを確認
    expect(result.response_template.includes_market_comparison).toBe(true);
    expect(result.response_template.includes_basis_explanation).toBe(true);
    expect(result.response_template.includes_alternative_quote_option).toBe(
      true
    );

    // テンプレートのフィールドが必須項目をすべて含んでいることを確認
    expect(result.response_template.required_fields).toEqual([
      'market_price_range',
      'deviation_reason',
      'supporting_data_source',
      'adjustment_possibility',
    ]);

    // 質問IDと提示されたテンプレートの対応関係が記録されたことを確認
    expect(result.question_id).toBe(input_question_id);
    expect(result.assigned_template_at).toEqual(
      new Date('2024-01-15T10:30:00Z')
    );

    // 提示されたテンプレートが標準化されたテキストを含んでいることを確認
    expect(result.response_template.template_text).toContain('市場相場');
    expect(result.response_template.template_text).toContain('乖離');

    // SLA内での対応期限が24時間以内に設定されていることを確認
    expect(result.sla.response_deadline_hours).toBe(24);

    // 回答テンプレートが複数言語対応の場合、日本語版が確実に提示されること
    expect(result.response_template.language).toBe('ja');

    // キーとなる乖離分析データへのリンクが提示されていることを確認
    expect(result.reference_deviation_data).toBeDefined();
    expect(result.reference_deviation_data.deviation_rate).toBeGreaterThan(0);
    expect(result.reference_data_availability).toBe(true);
  });
});