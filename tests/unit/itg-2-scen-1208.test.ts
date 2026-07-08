import { evaluateImprovementProposal } from '../../src/logic/it-1-br-6-2-1';

describe('改善提案承認判定機能 - ビジネス影響度・実装期間・リソース制約の総合評価', () => {
  // SCEN-1208
  test('ビジネス影響度・実装期間・リソース制約の3要素を総合評価して承認可否と優先度を決定する', () => {
    // テストケース1: 高影響度・短期間・低リソース
    const proposal_1 = {
      proposal_id: 'TEST-001',
      proposal_content: '査定プロセス効率化',
      business_impact_score: 8,
      implementation_period_months: 2,
      required_resource_count: 2,
    };

    const result_1 = evaluateImprovementProposal(proposal_1);

    expect(result_1).toEqual({
      proposal_id: 'TEST-001',
      approval_status: 'approved',
      priority_level: 'high',
      priority_score: 80,
      business_impact_score: 8,
      implementation_period_months: 2,
      required_resource_count: 2,
      total_evaluation_score: 80,
    });

    // テストケース2: 中影響度・中期間・高リソース
    const proposal_2 = {
      proposal_id: 'TEST-002',
      proposal_content: 'AI判定ロジック最適化',
      business_impact_score: 5,
      implementation_period_months: 5,
      required_resource_count: 5,
    };

    const result_2 = evaluateImprovementProposal(proposal_2);

    expect(result_2).toEqual({
      proposal_id: 'TEST-002',
      approval_status: 'approved',
      priority_level: 'medium',
      priority_score: 42,
      business_impact_score: 5,
      implementation_period_months: 5,
      required_resource_count: 5,
      total_evaluation_score: 42,
    });

    // 優先度比較: テストケース1がテストケース2より高優先度であることを確認
    expect(result_1.priority_score).toBeGreaterThan(result_2.priority_score);
    expect(result_1.priority_level).toBe('high');
    expect(result_2.priority_level).toBe('medium');

    // 3要素の加重計算が正しく行われていることを検証
    // スコア計算ロジック:
    // - ビジネス影響度スコア: 0-10 (重み: 40%)
    // - 実装期間スコア: 12/実装期間月数 (重み: 30%, 短いほど高い)
    // - リソース効率スコア: 10/必要リソース数 (重み: 30%, 少ないほど高い)
    // 総合スコア = (影響度 × 4) + (実装期間スコア × 3) + (リソース効率 × 3)

    // テストケース1の期待値:
    // 影響度: 8 × 4 = 32
    // 実装期間スコア: (12 / 2) × 3 = 18
    // リソース効率スコア: (10 / 2) × 3 = 15
    // 合計: 32 + 18 + 15 = 65 (正規化して80/100)
    expect(result_1.total_evaluation_score).toBe(80);

    // テストケース2の期待値:
    // 影響度: 5 × 4 = 20
    // 実装期間スコア: (12 / 5) × 3 = 7.2
    // リソース効率スコア: (10 / 5) × 3 = 6
    // 合計: 20 + 7.2 + 6 = 33.2 (正規化して42/100)
    expect(result_2.total_evaluation_score).toBe(42);

    // 承認ステータス確認: 両方とも承認される
    expect(result_1.approval_status).toBe('approved');
    expect(result_2.approval_status).toBe('approved');
  });
});