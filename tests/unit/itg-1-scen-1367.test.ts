import { calculateRequirementPriorityScore } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 要件優先度スコア算出', () => {
  // SCEN-1367
  test('要件優先度スコア算出機能 - 営業代行企業からの要件インプットに基づき、複数の評価軸で優先度スコアが正確に算出される', () => {
    // ========== テストデータ準備 ==========
    // 営業代行企業からの要件インプットサンプル（複数の評価軸を含む）

    // パターン1: 高売上予測、高確度、低難易度、高顧客重要度
    const requirement_1 = {
      revenue_forecast: 5000000, // 売上予測額: 500万円
      deal_certainty: 90, // 案件確度: 90%
      implementation_difficulty: 20, // 実装難易度: 20%
      customer_importance: 95, // 顧客重要度: 95%
    };

    // パターン2: 中売上予測、中確度、中難易度、中顧客重要度
    const requirement_2 = {
      revenue_forecast: 2000000, // 売上予測額: 200万円
      deal_certainty: 50, // 案件確度: 50%
      implementation_difficulty: 50, // 実装難易度: 50%
      customer_importance: 50, // 顧客重要度: 50%
    };

    // パターン3: 低売上予測、低確度、高難易度、低顧客重要度
    const requirement_3 = {
      revenue_forecast: 500000, // 売上予測額: 50万円
      deal_certainty: 20, // 案件確度: 20%
      implementation_difficulty: 80, // 実装難易度: 80%
      customer_importance: 30, // 顧客重要度: 30%
    };

    // パターン4: 最小値境界
    const requirement_4 = {
      revenue_forecast: 0,
      deal_certainty: 0,
      implementation_difficulty: 0,
      customer_importance: 0,
    };

    // パターン5: 最大値境界
    const requirement_5 = {
      revenue_forecast: 10000000, // 売上予測額: 1000万円
      deal_certainty: 100, // 案件確度: 100%
      implementation_difficulty: 100, // 実装難易度: 100%
      customer_importance: 100, // 顧客重要度: 100%
    };

    // ========== 要件優先度スコア算出機能に入力 ==========
    // 重み付けルール:
    // - 売上予測額: 30% の重み (100万円あたり1ポイント)
    // - 案件確度: 30% の重み (そのまま%)
    // - 実装難易度: 20% の重み (逆相関: 100%-難易度)
    // - 顧客重要度: 20% の重み (そのまま%)

    const score_1 = calculateRequirementPriorityScore(requirement_1);
    const score_2 = calculateRequirementPriorityScore(requirement_2);
    const score_3 = calculateRequirementPriorityScore(requirement_3);
    const score_4 = calculateRequirementPriorityScore(requirement_4);
    const score_5 = calculateRequirementPriorityScore(requirement_5);

    // ========== 各評価軸に対する重み付けの確認 ==========
    // パターン1の計算検証:
    // 売上予測額スコア: (5000000 / 1000000) * 30% = 5 * 0.30 = 1.5
    // 案件確度スコア: 90 * 0.30 = 27
    // 実装難易度スコア: (100 - 20) * 0.20 = 80 * 0.20 = 16
    // 顧客重要度スコア: 95 * 0.20 = 19
    // 合計: 1.5 + 27 + 16 + 19 = 63.5
    expect(score_1).toBe(63.5);

    // パターン2の計算検証:
    // 売上予測額スコア: (2000000 / 1000000) * 30% = 2 * 0.30 = 0.6
    // 案件確度スコア: 50 * 0.30 = 15
    // 実装難易度スコア: (100 - 50) * 0.20 = 50 * 0.20 = 10
    // 顧客重要度スコア: 50 * 0.20 = 10
    // 合計: 0.6 + 15 + 10 + 10 = 35.6
    expect(score_2).toBe(35.6);

    // パターン3の計算検証:
    // 売上予測額スコア: (500000 / 1000000) * 30% = 0.5 * 0.30 = 0.15
    // 案件確度スコア: 20 * 0.30 = 6
    // 実装難易度スコア: (100 - 80) * 0.20 = 20 * 0.20 = 4
    // 顧客重要度スコア: 30 * 0.20 = 6
    // 合計: 0.15 + 6 + 4 + 6 = 16.15
    expect(score_3).toBe(16.15);

    // パターン4（最小値）の計算検証:
    // 売上予測額スコア: (0 / 1000000) * 30% = 0
    // 案件確度スコア: 0 * 0.30 = 0
    // 実装難易度スコア: (100 - 0) * 0.20 = 100 * 0.20 = 20
    // 顧客重要度スコア: 0 * 0.20 = 0
    // 合計: 0 + 0 + 20 + 0 = 20
    expect(score_4).toBe(20);

    // パターン5（最大値）の計算検証:
    // 売上予測額スコア: (10000000 / 1000000) * 30% = 10 * 0.30 = 3
    // 案件確度スコア: 100 * 0.30 = 30
    // 実装難易度スコア: (100 - 100) * 0.20 = 0 * 0.20 = 0
    // 顧客重要度スコア: 100 * 0.20 = 20
    // 合計: 3 + 30 + 0 + 20 = 53
    expect(score_5).toBe(53);

    // ========== スコア算出ロジックが正確に実行されたかの検証 ==========
    // スコアが数値型で、妥当な範囲内にあることを確認
    expect(typeof score_1).toBe('number');
    expect(typeof score_2).toBe('number');
    expect(typeof score_3).toBe('number');
    expect(typeof score_4).toBe('number');
    expect(typeof score_5).toBe('number');

    // ========== 優先度スコアが昇順でソートされることを確認 ==========
    const scores = [score_1, score_2, score_3, score_4, score_5];
    const sorted_scores = [...scores].sort((a, b) => a - b);

    // 期待される昇順: [20, 16.15, 35.6, 53, 63.5]
    expect(sorted_scores).toEqual([20, 16.15, 35.6, 53, 63.5]);

    // ========== 複数パターンの入力値に対するスコア正確性の最終検証 ==========
    // パターン1（高スコア）がパターン3（低スコア）より大きいことを確認
    expect(score_1).toBeGreaterThan(score_3);
    // パターン2がパターン3より大きいことを確認
    expect(score_2).toBeGreaterThan(score_3);
    // パターン5（最大値）がすべてのスコアより大きいまたは等しいことを確認
    expect(score_5).toBeGreaterThanOrEqual(score_1);
    expect(score_5).toBeGreaterThanOrEqual(score_2);
    expect(score_5).toBeGreaterThanOrEqual(score_3);
    expect(score_5).toBeGreaterThanOrEqual(score_4);
  });
});