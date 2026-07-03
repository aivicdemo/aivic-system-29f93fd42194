import { classifyComplaintAndDeterminePriority } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-969: [error] 顧客質問・異議の分類・対応ルート判定 - 複合的な請求異議の優先度付け
  test('複合的な請求異議が入力された場合、複数の分類カテゴリが抽出され、優先度付けロジックに基づいて最高優先度のルートが選択される', () => {
    const complaintInput = {
      customer_id: 'CUST-00123',
      complaint_content:
        '請求額が高い上に、請求日が間違っている。また商品の説明と異なる',
      received_date: '2024-03-15T10:30:00Z',
      complaint_priority_initial: 'high'
    };

    const result = classifyComplaintAndDeterminePriority(complaintInput);

    // 複数の分類カテゴリが抽出されることを確認
    expect(Array.isArray(result.classified_categories)).toBe(true);
    expect(result.classified_categories.length).toBeGreaterThanOrEqual(3);

    // 分類カテゴリの内容を確認（請求金額異議、請求日異議、商品説明異議を含む）
    const category_names = result.classified_categories.map(
      (c: { category_name: string }) => c.category_name
    );
    expect(category_names).toContain('billing_amount_dispute');
    expect(category_names).toContain('billing_date_dispute');
    expect(category_names).toContain('product_description_mismatch');

    // 優先度スコアが計算されていることを確認
    expect(result.classified_categories.every((c: { priority_score: number }) => typeof c.priority_score === 'number')).toBe(true);

    // 優先度スコアが0以上100以下であることを確認
    expect(
      result.classified_categories.every(
        (c: { priority_score: number }) =>
          c.priority_score >= 0 && c.priority_score <= 100
      )
    ).toBe(true);

    // 複数ルート候補の中から最高優先度のルートが選択されていることを確認
    expect(result.primary_response_route).toBeDefined();
    expect(typeof result.primary_response_route).toBe('string');

    // 最高優先度のルートに対応するカテゴリの優先度スコアが最も高いことを確認
    const primary_category = result.classified_categories.find(
      (c: { response_route: string }) =>
        c.response_route === result.primary_response_route
    );
    const all_scores = result.classified_categories.map(
      (c: { priority_score: number }) => c.priority_score
    );
    expect(primary_category.priority_score).toBe(Math.max(...all_scores));

    // 優先度が最も高いルートが1つだけ選択されていることを確認
    expect(result.primary_response_route.length).toBeGreaterThan(0);

    // 他のカテゴリが関連情報として記録されていることを確認
    expect(Array.isArray(result.secondary_categories)).toBe(true);
    expect(result.secondary_categories.length).toBeGreaterThanOrEqual(0);

    // 二次ルート情報が保持されていることを確認（複数ルート候補がある場合）
    if (result.classified_categories.length > 1) {
      expect(result.secondary_categories.length).toBeGreaterThan(0);
      expect(
        result.secondary_categories.every(
          (c: { category_name: string; priority_score: number }) =>
            typeof c.category_name === 'string' &&
            typeof c.priority_score === 'number'
        )
      ).toBe(true);
    }

    // ビジネスルール（緊急性、顧客影響度、解決難度）に基づいた優先度付けが行われたことを確認
    // 緊急性スコア、顧客影響度スコア、解決難度スコアが含まれていることを検証
    expect(
      result.classified_categories.every(
        (c: {
          urgency_score?: number;
          customer_impact_score?: number;
          resolution_difficulty?: number;
        }) =>
          typeof c.urgency_score === 'number' &&
          typeof c.customer_impact_score === 'number' &&
          typeof c.resolution_difficulty === 'number'
      )
    ).toBe(true);

    // 最終ルート割り当てが確定していることを確認
    expect(result.final_assigned_route).toBe(result.primary_response_route);

    // システムが複合異議を正常に処理したことをログで確認
    expect(result.processing_status).toBe('completed');
    expect(typeof result.classification_timestamp).toBe('string');
  });
});