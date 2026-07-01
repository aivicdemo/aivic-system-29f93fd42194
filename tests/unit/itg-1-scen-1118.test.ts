import { evaluateNewStaffGraduationRequirement } from '../../src/logic/it-1781935279444-2-2-1';

describe('新入スタッフ卒業要件判定機能 - 反映期限が本日の項目が即座に判定対象に含められる', () => {
  test('SCEN-1118: 反映期限が本日の項目が判定対象リストに即座に含まれ、判定ロジックが正常に適用されること', () => {
    // Arrange
    const today = new Date('2024-01-15');
    const staffId = 'STAFF_001';
    const requirementId = 'REQ_GRADUATION_001';
    
    const requirementsWithTodayDeadline = [
      {
        id: requirementId,
        staffId: staffId,
        taskName: '請求書作成業務',
        completionStatus: 'completed',
        evaluationCriteria: 'accuracy_rate >= 95',
        evaluationResult: 'pass',
        reflectionDeadline: '2024-01-15',
        priority: 'high',
        isIncludedInEvaluation: true,
      },
      {
        id: 'REQ_GRADUATION_002',
        staffId: staffId,
        taskName: '営業報告書集計業務',
        completionStatus: 'completed',
        evaluationCriteria: 'consistency_score >= 90',
        evaluationResult: 'pass',
        reflectionDeadline: '2024-01-16',
        priority: 'medium',
        isIncludedInEvaluation: false,
      },
    ];

    // Act
    const evaluationList = evaluateNewStaffGraduationRequirement({
      staffId: staffId,
      requirements: requirementsWithTodayDeadline,
      currentDate: today,
    });

    // Assert
    // 1. 反映期限が本日（2024-01-15）の項目が判定対象リストに含まれていることを確認
    const todayDeadlineItem = evaluationList.evaluationTargets.find(
      (item) => item.id === requirementId
    );
    expect(todayDeadlineItem).toBeDefined();
    expect(todayDeadlineItem?.reflectionDeadline).toBe('2024-01-15');
    expect(todayDeadlineItem?.isIncludedInEvaluation).toBe(true);

    // 2. 反映期限が本日より後（2024-01-16）の項目は判定対象リストに含まれないことを確認
    const futureDeadlineItem = evaluationList.evaluationTargets.find(
      (item) => item.id === 'REQ_GRADUATION_002'
    );
    expect(futureDeadlineItem).toBeUndefined();

    // 3. 判定対象の合計数が正しいことを確認（本日期限の1項目のみ）
    expect(evaluationList.evaluationTargets.length).toBe(1);

    // 4. 判定ロジックが正常に適用され、判定結果が生成されていることを確認
    expect(evaluationList.overallGraduationStatus).toBe('pass');
    expect(evaluationList.passedRequirements).toBe(1);
    expect(evaluationList.failedRequirements).toBe(0);

    // 5. 判定対象に含まれた項目の判定結果を確認
    expect(evaluationList.evaluationTargets[0].evaluationResult).toBe('pass');
    expect(evaluationList.evaluationTargets[0].priority).toBe('high');

    // 6. タイムスタンプが正しく記録されていることを確認
    expect(evaluationList.evaluatedAt).toBe('2024-01-15T00:00:00Z');
  });
});