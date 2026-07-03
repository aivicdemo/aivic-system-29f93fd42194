import { classifyCustomerInquiry, determineResponseRoute } from '../../src/logic/it-1781935279444-2-1-1';

describe('顧客質問・異議の分類・対応ルート判定 - 境界線上の質問判定', () => {
  // SCEN-970
  test('顧客質問が調査と契約確認の境界線上にある場合、優先度ルールに従って唯一の対応ルートが決定される', () => {
    // 前提: 調査と契約確認の両方の特性を持つ境界線上の質問データ
    const boundaryInquiry = {
      inquiry_id: 'INQ-2024-001',
      customer_id: 'CUST-A001',
      inquiry_content: '契約内容に記載されていない追加料金について、実際に請求されているが、これは契約上妥当なのか',
      inquiry_date: new Date('2024-01-15T10:30:00Z'),
      inquiry_type: 'billing_question',
    };

    // ステップ 1: 質問分類エンジンを実行
    const classification_result = classifyCustomerInquiry(boundaryInquiry);

    // 分類ロジックが調査フラグと契約確認フラグの両方を検出したことを確認
    expect(classification_result.requires_investigation).toBe(true);
    expect(classification_result.requires_contract_review).toBe(true);
    expect(classification_result.has_billing_discrepancy).toBe(true);
    expect(classification_result.classification_confidence).toBeGreaterThanOrEqual(0.85);

    // ステップ 2: 対応ルート判定ロジックを実行
    const route_decision = determineResponseRoute({
      inquiry_id: boundaryInquiry.inquiry_id,
      classification_result: classification_result,
      priority_rule: 'investigation_first', // 優先度ルール: 調査を優先
    });

    // ステップ 3: 優先度ルールに基づいて最適なルートが決定されたことを確認
    expect(route_decision.primary_response_route).toBe('investigation');
    expect(route_decision.secondary_response_route).toBe('contract_review');
    expect(route_decision.route_count).toBe(1); // 単一ルートが確定
    expect(route_decision.decision_is_final).toBe(true); // 決定が確定している

    // ステップ 4: 決定されたルートが顧客質問の本質的な内容と一致していることを検証
    expect(route_decision.route_justification).toContain('追加料金');
    expect(route_decision.route_justification).toContain('請求');
    expect(route_decision.aligned_with_inquiry_content).toBe(true);

    // ステップ 5: 複数ルートへの振り分けや判定曖昧性が発生していないことを確認
    expect(route_decision.ambiguity_flag).toBe(false);
    expect(route_decision.alternative_routes).toEqual([]);
    expect(route_decision.route_confidence_score).toBe(0.92);

    // ステップ 6: 判定結果がログに記録され、監査証跡が残されていることを確認
    expect(route_decision.audit_log).toBeDefined();
    expect(route_decision.audit_log.decision_timestamp).toBe('2024-01-15T10:30:00Z');
    expect(route_decision.audit_log.decision_timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
    expect(route_decision.audit_log.classification_data).toBeDefined();
    expect(route_decision.audit_log.classification_data.requires_investigation).toBe(true);
    expect(route_decision.audit_log.classification_data.requires_contract_review).toBe(true);
    expect(route_decision.audit_log.decision_rationale).toContain('priority_rule');
    expect(route_decision.audit_log.traceable).toBe(true);

    // ステップ 7: 判定結果の整合性を総合確認
    expect(route_decision.inquiry_id).toBe('INQ-2024-001');
    expect(route_decision.customer_id).toBe('CUST-A001');
    expect(route_decision.is_valid_decision).toBe(true);
  });
});