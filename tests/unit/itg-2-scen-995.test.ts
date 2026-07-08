import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  getOptimizedReferenceCandidates,
} from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  it('SCEN-995: 最適参照候補データの優先度付け表示 - 地域・時期が完全一致する過去案件が優先表示される', () => {
    // ============================================
    // テストデータ準備
    // ============================================
    const testCaseId = 'TEST_CASE_995';
    const searchRegion = 'tokyo';
    const searchSeason = 'summer';
    const searchConstructionType = 'renovation';
    const searchAmount = 2500000;

    // 地域・時期が完全一致する過去案件（優先度：高）
    const perfectMatchCandidate1 = {
      caseId: 'CASE_001',
      region: 'tokyo',
      season: 'summer',
      constructionType: 'renovation',
      quotedAmount: 2480000,
      referenceYear: 2024,
      referenceMonth: 6,
      dataQualityScore: 95,
      caseSampleCount: 12,
      regionCoverageRate: 98,
    };

    const perfectMatchCandidate2 = {
      caseId: 'CASE_002',
      region: 'tokyo',
      season: 'summer',
      constructionType: 'renovation',
      quotedAmount: 2520000,
      referenceYear: 2024,
      referenceMonth: 7,
      dataQualityScore: 92,
      caseSampleCount: 8,
      regionCoverageRate: 95,
    };

    // 地域は一致するが時期が異なる案件（優先度：中）
    const regionMatchOnly = {
      caseId: 'CASE_003',
      region: 'tokyo',
      season: 'winter',
      constructionType: 'renovation',
      quotedAmount: 2350000,
      referenceYear: 2024,
      referenceMonth: 1,
      dataQualityScore: 88,
      caseSampleCount: 15,
      regionCoverageRate: 92,
    };

    // 時期は一致するが地域が異なる案件（優先度：中）
    const seasonMatchOnly = {
      caseId: 'CASE_004',
      region: 'osaka',
      season: 'summer',
      constructionType: 'renovation',
      quotedAmount: 2600000,
      referenceYear: 2024,
      referenceMonth: 6,
      dataQualityScore: 85,
      caseSampleCount: 10,
      regionCoverageRate: 88,
    };

    // 地域・時期ともに異なる案件（優先度：低）
    const noMatchCandidate = {
      caseId: 'CASE_005',
      region: 'kyoto',
      season: 'spring',
      constructionType: 'renovation',
      quotedAmount: 2700000,
      referenceYear: 2023,
      referenceMonth: 4,
      dataQualityScore: 80,
      caseSampleCount: 5,
      regionCoverageRate: 75,
    };

    const allCandidates = [
      noMatchCandidate,
      regionMatchOnly,
      seasonMatchOnly,
      perfectMatchCandidate2,
      perfectMatchCandidate1,
    ];

    const searchCondition = {
      region: searchRegion,
      season: searchSeason,
      constructionType: searchConstructionType,
      quotedAmount: searchAmount,
    };

    // ============================================
    // 関数実行
    // ============================================
    const result = getOptimizedReferenceCandidates(
      allCandidates,
      searchCondition
    );

    // ============================================
    // 検証：優先度付けロジック
    // ============================================

    // 検証1: 結果が空でないこと
    expect(result.length).toBeGreaterThan(0);

    // 検証2: 地域・時期が完全一致する案件が優先されていること
    const firstCandidate = result[0];
    expect(firstCandidate.region).toBe('tokyo');
    expect(firstCandidate.season).toBe('summer');

    // 検証3: 完全一致する案件2件が上位にグループ化されていること
    const perfectMatchCases = result.filter(
      (candidate: any) =>
        candidate.region === 'tokyo' && candidate.season === 'summer'
    );
    expect(perfectMatchCases.length).toBe(2);
    expect(result.indexOf(perfectMatchCases[0])).toBeLessThan(2);
    expect(result.indexOf(perfectMatchCases[1])).toBeLessThan(3);

    // 検証4: 優先度スコアが高い順に並んでいること
    for (let i = 0; i < result.length - 1; i++) {
      const currentPriority = calculatePriorityScore(
        result[i],
        searchCondition
      );
      const nextPriority = calculatePriorityScore(result[i + 1], searchCondition);
      expect(currentPriority).toBeGreaterThanOrEqual(nextPriority);
    }

    // 検証5: 最上位の候補が perfectMatchCandidate1 または perfectMatchCandidate2 であること
    const topCaseId = result[0].caseId;
    expect(
      topCaseId === 'CASE_001' || topCaseId === 'CASE_002'
    ).toBe(true);

    // 検証6: 地域・時期が完全一致しない案件が下位に配置されていること
    const noMatchIndex = result.findIndex(
      (candidate: any) => candidate.caseId === 'CASE_005'
    );
    expect(noMatchIndex).toBeGreaterThanOrEqual(2);

    // 検証7: 返却リスト全体で重複がないこと
    const caseIds = result.map((candidate: any) => candidate.caseId);
    const uniqueCaseIds = new Set(caseIds);
    expect(caseIds.length).toBe(uniqueCaseIds.size);

    // 検証8: 結果に含まれるすべての案件が入力データセットに存在すること
    result.forEach((candidate: any) => {
      const found = allCandidates.find((c) => c.caseId === candidate.caseId);
      expect(found).toBeDefined();
    });
  });
});

// ============================================
// ユーティリティ関数：優先度スコア計算
// ============================================
function calculatePriorityScore(
  candidate: any,
  searchCondition: any
): number {
  let score = 0;

  // 地域・時期が完全一致：基本スコア 100
  const regionMatch = candidate.region === searchCondition.region ? 1 : 0;
  const seasonMatch = candidate.season === searchCondition.season ? 1 : 0;
  const perfectMatch = regionMatch && seasonMatch ? 100 : 0;

  if (perfectMatch > 0) {
    score = perfectMatch;
  } else {
    // 部分一致時の加算スコア
    score += regionMatch ? 50 : 0;
    score += seasonMatch ? 50 : 0;
  }

  // データ品質スコアを反映
  score += candidate.dataQualityScore * 0.5;

  // 参照データ件数を反映
  score += Math.min(candidate.caseSampleCount * 2, 30);

  return score;
}