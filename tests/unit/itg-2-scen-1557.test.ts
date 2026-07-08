import { calculateFeedbackPriorityScore } from '../../src/logic/it-1-br-2-2-2-1';

describe('Feedback Priority Score Calculation', () => {
  // SCEN-1557: [normal] フィードバック優先度スコア算出機能 - 改善提案・誤記指摘・運用課題の3種類フィードバックから優先度スコアが正しく算出される
  test('should calculate priority scores correctly for all feedback types and maintain independence', () => {
    // Initialize test environment

    // Test: 改善提案タイプのフィードバックオブジェクトを作成し、算出機能に入力する
    const improvementProposalFeedback = {
      feedbackId: 'FB-001',
      feedbackType: 'improvement_proposal',
      impactScore: 80,
      implementationDifficulty: 30,
      businessValue: 85,
      createdAt: new Date('2024-02-15T10:00:00Z'),
      createdBy: 'user_emp001',
    };

    const improvementProposalResult = calculateFeedbackPriorityScore(
      improvementProposalFeedback
    );

    // 改善提案の優先度スコアが正しく計算されることを検証する
    // Formula: (impactScore * 0.4 + businessValue * 0.4) - (implementationDifficulty * 0.2)
    // = (80 * 0.4 + 85 * 0.4) - (30 * 0.2)
    // = (32 + 34) - 6
    // = 60
    expect(improvementProposalResult.priorityScore).toBe(60);
    expect(improvementProposalResult.feedbackType).toBe('improvement_proposal');
    expect(improvementProposalResult.priorityRank).toBe('high');

    // Test: 誤記指摘タイプのフィードバックオブジェクトを作成し、算出機能に入力する
    const typoFeedback = {
      feedbackId: 'FB-002',
      feedbackType: 'typo_correction',
      errorSeverity: 45,
      affectedRecords: 12,
      discoveryMethod: 'manual_review',
      createdAt: new Date('2024-02-14T14:30:00Z'),
      createdBy: 'user_emp002',
    };

    const typoResult = calculateFeedbackPriorityScore(typoFeedback);

    // 誤記指摘の優先度スコアが正しく計算されることを検証する
    // Formula: (errorSeverity * 0.5 + affectedRecords * 2) - 10
    // = (45 * 0.5 + 12 * 2) - 10
    // = (22.5 + 24) - 10
    // = 36.5
    expect(typoResult.priorityScore).toBe(36.5);
    expect(typoResult.feedbackType).toBe('typo_correction');
    expect(typoResult.priorityRank).toBe('medium');

    // Test: 運用課題タイプのフィードバックオブジェクトを作成し、算出機能に入力する
    const operationalIssueFeedback = {
      feedbackId: 'FB-003',
      feedbackType: 'operational_issue',
      frequencyCount: 8,
      userImpactScope: 'department_wide',
      timelinessUrgency: 70,
      createdAt: new Date('2024-02-13T09:15:00Z'),
      createdBy: 'user_emp003',
    };

    const operationalIssueResult = calculateFeedbackPriorityScore(
      operationalIssueFeedback
    );

    // 運用課題の優先度スコアが正しく計算されることを検証する
    // Formula: (frequencyCount * 5 + timelinessUrgency * 0.6) + scopeModifier
    // scopeModifier for 'department_wide' = 15
    // = (8 * 5 + 70 * 0.6) + 15
    // = (40 + 42) + 15
    // = 97
    expect(operationalIssueResult.priorityScore).toBe(97);
    expect(operationalIssueResult.feedbackType).toBe('operational_issue');
    expect(operationalIssueResult.priorityRank).toBe('critical');

    // Test: 3種類のフィードバックタイプ別の優先度スコアを比較し、優先度順序が適切に反映されていることを確認する
    const allScores = [
      improvementProposalResult.priorityScore,
      typoResult.priorityScore,
      operationalIssueResult.priorityScore,
    ];
    const sortedScores = [...allScores].sort((a, b) => b - a);

    // Priority order should be: operational_issue (97) > improvement_proposal (60) > typo_correction (36.5)
    expect(sortedScores[0]).toBe(97);
    expect(sortedScores[1]).toBe(60);
    expect(sortedScores[2]).toBe(36.5);

    // Test: 複数のフィードバックが混在する場合、各々のスコアが独立して正しく計算されることを検証する
    const anotherImprovementProposal = {
      feedbackId: 'FB-004',
      feedbackType: 'improvement_proposal',
      impactScore: 75,
      implementationDifficulty: 50,
      businessValue: 70,
      createdAt: new Date('2024-02-12T16:45:00Z'),
      createdBy: 'user_emp004',
    };

    const anotherResult = calculateFeedbackPriorityScore(
      anotherImprovementProposal
    );

    // Formula: (75 * 0.4 + 70 * 0.4) - (50 * 0.2)
    // = (30 + 28) - 10
    // = 48
    expect(anotherResult.priorityScore).toBe(48);
    expect(anotherResult.feedbackType).toBe('improvement_proposal');
    expect(anotherResult.priorityRank).toBe('medium');

    // Verify first improvement proposal score is still 60 (independent calculation)
    expect(improvementProposalResult.priorityScore).toBe(60);
    expect(improvementProposalResult.priorityRank).toBe('high');

    // Verify all scores are calculated independently
    expect(improvementProposalResult.priorityScore).not.toBe(
      anotherResult.priorityScore
    );
    expect(typoResult.priorityScore).not.toBe(
      operationalIssueResult.priorityScore
    );
  });
});