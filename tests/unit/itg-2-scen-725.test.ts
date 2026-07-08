import { calculateConfidenceScore } from '../../src/logic/it-6-2-1-1';

describe('AI判定結果信頼度スコア付与 - 相場データとの照合完了時', () => {
  test('SCEN-725: [normal] 複数査定品目の信頼度スコアが0～100の範囲内で正常に計算される', () => {
    // テストデータ: 複数の査定品目とAI判定結果
    const assessmentItems = [
      {
        item_id: 'ITEM-001',
        category: '建築用鋼材',
        spec_info: { grade: 'SS400', thickness_mm: 12, weight_kg: 100 },
        ai_judgment: {
          estimated_price: 125000,
          condition_rating: 95,
          authenticity_score: 98
        }
      },
      {
        item_id: 'ITEM-002',
        category: '木材',
        spec_info: { wood_type: 'ヒノキ', length_m: 4.0, grade: '1等材' },
        ai_judgment: {
          estimated_price: 85000,
          condition_rating: 88,
          authenticity_score: 92
        }
      },
      {
        item_id: 'ITEM-003',
        category: 'セメント',
        spec_info: { cement_type: 'ポルトランドセメント', bag_weight_kg: 50 },
        ai_judgment: {
          estimated_price: 6500,
          condition_rating: 100,
          authenticity_score: 85
        }
      }
    ];

    // 相場データベース
    const market_rate_data = [
      {
        item_id: 'ITEM-001',
        market_price_min: 120000,
        market_price_max: 130000,
        market_price_median: 125000,
        reference_sample_count: 45,
        spec_match_degree: 98
      },
      {
        item_id: 'ITEM-002',
        market_price_min: 80000,
        market_price_max: 92000,
        market_price_median: 86000,
        reference_sample_count: 28,
        spec_match_degree: 92
      },
      {
        item_id: 'ITEM-003',
        market_price_min: 5800,
        market_price_max: 7200,
        market_price_median: 6500,
        reference_sample_count: 120,
        spec_match_degree: 95
      }
    ];

    // 信頼度スコア計算実行
    const result = calculateConfidenceScore({
      assessment_items: assessmentItems,
      market_rate_database: market_rate_data
    });

    // 検証1: 各品目に対して信頼度スコアが計算されていることを確認
    expect(result).toBeDefined();
    expect(result.confidence_scores).toBeDefined();
    expect(result.confidence_scores.length).toBe(3);

    // 検証2: 各スコアが0～100の整数値の範囲内であることを検証
    result.confidence_scores.forEach((score_entry: any) => {
      expect(score_entry.confidence_score).toBeGreaterThanOrEqual(0);
      expect(score_entry.confidence_score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score_entry.confidence_score)).toBe(true);
    });

    // 検証3: 完全一致パターン（ITEM-001: AI推定価格=市場中央値）の信頼度スコア
    const item001_score = result.confidence_scores.find((s: any) => s.item_id === 'ITEM-001');
    expect(item001_score).toBeDefined();
    // 完全一致 + 高いサンプル数 + 高いスペック一致度 → スコア91以上
    expect(item001_score.confidence_score).toBeGreaterThanOrEqual(91);
    expect(item001_score.confidence_score).toBeLessThanOrEqual(100);

    // 検証4: 部分一致パターン（ITEM-002: 乖離あり）の信頼度スコア
    const item002_score = result.confidence_scores.find((s: any) => s.item_id === 'ITEM-002');
    expect(item002_score).toBeDefined();
    // AI推定 85000 vs 市場中央値 86000 → 乖離率1.2% → 中程度スコア（75～85程度）
    expect(item002_score.confidence_score).toBeGreaterThanOrEqual(75);
    expect(item002_score.confidence_score).toBeLessThanOrEqual(88);

    // 検証5: 高サンプル数パターン（ITEM-003: サンプル数120件）の信頼度スコア
    const item003_score = result.confidence_scores.find((s: any) => s.item_id === 'ITEM-003');
    expect(item003_score).toBeDefined();
    // 完全一致 + 豊富なサンプル数（120件） + 高いスペック一致度 → スコア88以上
    expect(item003_score.confidence_score).toBeGreaterThanOrEqual(88);
    expect(item003_score.confidence_score).toBeLessThanOrEqual(100);

    // 検証6: 計算ロジックが価格乖離率を反映していることを確認
    // ITEM-001: 乖離率 = (125000 - 125000) / 125000 * 100 = 0%
    expect(item001_score.price_deviation_rate).toBe(0);
    // ITEM-002: 乖離率 = (85000 - 86000) / 86000 * 100 ≈ -1.16%
    expect(Math.abs(item002_score.price_deviation_rate - (-1.16))).toBeLessThan(0.1);

    // 検証7: 計算ロジックがスペック一致度を反映していることを確認
    result.confidence_scores.forEach((score_entry: any) => {
      expect(score_entry.spec_match_degree).toBeGreaterThanOrEqual(0);
      expect(score_entry.spec_match_degree).toBeLessThanOrEqual(100);
    });

    // 検証8: 計算ロジックがデータサンプル数を反映していることを確認
    result.confidence_scores.forEach((score_entry: any) => {
      expect(score_entry.reference_sample_count).toBeGreaterThan(0);
    });

    // 検証9: 信頼度スコアがJSON形式で正しく出力されることを確認
    expect(JSON.stringify(result)).toBeDefined();
    const json_parsed = JSON.parse(JSON.stringify(result));
    expect(json_parsed.confidence_scores).toBeDefined();
    expect(json_parsed.confidence_scores.length).toBe(3);
    json_parsed.confidence_scores.forEach((score_entry: any) => {
      expect(score_entry.item_id).toBeDefined();
      expect(score_entry.confidence_score).toBeDefined();
      expect(typeof score_entry.confidence_score).toBe('number');
    });

    // 検証10: 複数の照合パターンでスコア計算が実行されていることを確認
    expect(result.confidence_scores[0].calculation_basis).toBeDefined();
    expect(result.confidence_scores[0].calculation_basis).toContain('price_deviation');
    expect(result.confidence_scores[0].calculation_basis).toContain('spec_match');
    expect(result.confidence_scores[0].calculation_basis).toContain('sample_count');
  });
});