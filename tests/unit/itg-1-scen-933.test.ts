import { evaluateStaffCompetency } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('新入スタッフ段階的育成機能 - 習熟度判定と次フェーズ推奨', () => {
  test('SCEN-933: 新入スタッフの習熟度が判定基準に基づいて段階的に評価され、次の教育フェーズが自動推奨される', () => {
    // === 前提: 新入スタッフが第1教育フェーズ（基礎知識習得）の評価を完了した状態 ===
    const staffId = 'staff-001-newbie';
    const staffName = '新入スタッフ太郎';
    const currentPhase = 1;
    const currentPhaseTitle = '基礎知識習得';
    
    // 第1フェーズの習熟度スコア: 75% (判定基準 70%以上を満たす)
    const completionScore = 75;
    const passingThreshold = 70;
    
    // === 入力: 習熟度評価タスク完了データ ===
    const competencyInput = {
      staffId,
      staffName,
      currentPhase,
      currentPhaseTitle,
      completionScore,
      passingThreshold,
      evaluatedAt: new Date('2024-02-15T09:00:00Z'),
      evaluator: 'manager-001',
    };

    // === 実行: 習熟度自動評価ロジック ===
    const result = evaluateStaffCompetency(competencyInput);

    // === 期待結果の検証 ===
    // 1. 習熟度判定が正確に実行された
    expect(result.staffId).toBe(staffId);
    expect(result.staffName).toBe(staffName);
    
    // 2. スコア 75% が判定基準 70% 以上を満たしているため、合格判定
    expect(result.isPassed).toBe(true);
    expect(result.passedThreshold).toBe(passingThreshold);
    expect(result.achievedScore).toBe(completionScore);
    
    // 3. 次のフェーズ推奨ロジックが自動実行
    // 現在フェーズが 1 (基礎知識習得) なので、次フェーズは 2 (応用スキル習得)
    expect(result.nextPhaseRecommended).toBe(true);
    expect(result.nextPhaseNumber).toBe(2);
    expect(result.nextPhaseTitle).toBe('応用スキル習得');
    
    // 4. 推奨理由が明確に生成されている
    expect(result.recommendationReason).toBe('基礎知識習得フェーズを 75% で完了しました。次の段階へ進む準備が整っています。');
    
    // 5. 推奨フェーズの詳細情報が含まれている
    expect(result.recommendedPhaseDetails).toBeDefined();
    expect(result.recommendedPhaseDetails.phaseNumber).toBe(2);
    expect(result.recommendedPhaseDetails.phaseTitle).toBe('応用スキル習得');
    expect(result.recommendedPhaseDetails.description).toBeDefined();
    expect(result.recommendedPhaseDetails.description).toContain('応用');
    expect(result.recommendedPhaseDetails.estimatedDuration).toBe('2週間');
    
    // 6. ダッシュボード表示用データが適切に構成されている
    expect(result.dashboardNotification).toBeDefined();
    expect(result.dashboardNotification.title).toBe('次のフェーズが推奨されました');
    expect(result.dashboardNotification.message).toContain('応用スキル習得');
    expect(result.dashboardNotification.actionLabel).toBe('開始する');
    expect(result.dashboardNotification.actionUrl).toContain('/phase/2');
    
    // 7. 推奨内容にフェーズ名、推奨理由、開始ボタンが含まれている
    const displayContent = result.dashboardNotification;
    expect(displayContent.title).toBeTruthy();
    expect(displayContent.message).toBeTruthy();
    expect(displayContent.actionLabel).toBeTruthy();
    
    // 8. タイムスタンプが記録されている
    expect(result.evaluatedAt).toEqual(new Date('2024-02-15T09:00:00Z'));
    expect(result.recommendedAt).toBeDefined();
    
    // === 追加検証: 習熟度進捗の履歴が保持されている ===
    expect(result.completionHistory).toBeDefined();
    expect(result.completionHistory.length).toBeGreaterThanOrEqual(1);
    expect(result.completionHistory[0].phaseNumber).toBe(1);
    expect(result.completionHistory[0].score).toBe(75);
    expect(result.completionHistory[0].status).toBe('passed');
  });
});