import { classifyInquiry } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1190: [edge] 問い合わせ分類・優先度決定機能 - 複数カテゴリに該当する曖昧な問い合わせが適切にメインカテゴリに分類される
  test('複数カテゴリに該当する曖昧な問い合わせが最適なメインカテゴリに分類され、優先度が自動決定される', () => {
    const ambiguous_inquiry = {
      inquiry_id: 'INQ-20240215-001',
      received_at: '2024-02-15T10:30:00Z',
      content:
        '先月の請求書に記載されている営業成果数値が正しくない。アポ数が20件のはずが15件と記載されています。また、提供されたサービス品質についても確認したいのですが、成約数の計算ロジックが正確なのか、請求ルールの適用も含めて説明してください。',
      customer_id: 'CUST-0001',
      source_channel: 'email',
    };

    const classification_result = classifyInquiry(ambiguous_inquiry);

    // メインカテゴリが「請求」に分類されることを確認（最も合致度が高い）
    expect(classification_result.main_category).toBe('請求');

    // 優先度が「高」に自動決定されることを確認（請求関連は優先度高）
    expect(classification_result.priority).toBe('高');

    // サブカテゴリとして「成果数値検証」が含まれることを確認
    expect(classification_result.sub_categories).toContain('成果数値検証');

    // 関連カテゴリとして「製品品質」が含まれることを確認
    expect(classification_result.related_categories).toContain('製品品質');

    // メインカテゴリの合致度スコアが0.85以上であることを確認（複数候補の中で最高）
    expect(classification_result.main_category_score).toBeGreaterThanOrEqual(0.85);

    // 複数候補の情報が記録されていることを確認
    expect(classification_result.candidate_categories).toBeDefined();
    expect(Array.isArray(classification_result.candidate_categories)).toBe(true);
    expect(classification_result.candidate_categories.length).toBeGreaterThanOrEqual(2);

    // 候補の中に「請求」と「品質」の両方が含まれることを確認
    const candidate_names = classification_result.candidate_categories.map(
      (c: any) => c.category_name
    );
    expect(candidate_names).toContain('請求');
    expect(candidate_names).toContain('品質');

    // 各候補の合致度スコアが記録されていることを確認
    classification_result.candidate_categories.forEach((candidate: any) => {
      expect(candidate.match_score).toBeLessThanOrEqual(1.0);
      expect(candidate.match_score).toBeGreaterThanOrEqual(0);
    });

    // 分類の根拠となるキーワードが記録されていることを確認
    expect(classification_result.classification_reasoning).toBeDefined();
    expect(typeof classification_result.classification_reasoning).toBe('string');
    expect(classification_result.classification_reasoning.length).toBeGreaterThan(0);

    // 推奨対応ルートが正しく設定されることを確認
    expect(classification_result.recommended_response_route).toBeDefined();
    expect(['即座に回答', '調査後回答', '契約確認後回答']).toContain(
      classification_result.recommended_response_route
    );

    // SLA期限が正しく計算されることを確認（優先度高の場合は営業日1日以内）
    expect(classification_result.sla_deadline).toBeDefined();
    const received_date = new Date('2024-02-15T10:30:00Z');
    const deadline_date = new Date(classification_result.sla_deadline);
    const hours_difference = (deadline_date.getTime() - received_date.getTime()) / (1000 * 60 * 60);
    expect(hours_difference).toBeGreaterThan(0);
    expect(hours_difference).toBeLessThanOrEqual(24);

    // タイムスタンプが記録されていることを確認
    expect(classification_result.classified_at).toBeDefined();
    expect(new Date(classification_result.classified_at)).toBeInstanceOf(Date);

    // 後続処理への連携情報が含まれていることを確認
    expect(classification_result.for_billing_automation).toBeDefined();
    expect(classification_result.for_billing_automation).toBe(true);

    // サブカテゴリ「成果数値検証」に基づく調査項目が記録されていることを確認
    expect(classification_result.investigation_items).toBeDefined();
    expect(Array.isArray(classification_result.investigation_items)).toBe(true);
    expect(classification_result.investigation_items.length).toBeGreaterThan(0);
  });
});