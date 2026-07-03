import { calculateCrmRequirementPriority } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - CRM要件優先度スコア算出', () => {
  // SCEN-1344: [edge] CRM要件優先度スコア算出 - スコアが 0 点または満点の境界値で、要件の分類判定が正しく切り替わる
  test('スコア0点では要件を除外に分類、満点では開発対象に分類、中間値では検討対象に分類される', () => {
    // Arrange: スコア0点（最小境界値）での入力
    const requirement_min = {
      requirement_id: 'REQ-001',
      requirement_name: 'Data mapping feature',
      priority_score: 0,
      impact_area: 'sales_data_mapping',
      estimated_effort_days: 5
    };

    // Act & Assert: スコア0点での分類結果を検証
    const result_min = calculateCrmRequirementPriority(requirement_min);
    expect(result_min).toEqual({
      requirement_id: 'REQ-001',
      requirement_name: 'Data mapping feature',
      priority_score: 0,
      classification: '除外',
      development_target: false,
      review_target: false,
      exclude_target: true,
      assigned_release_priority: null
    });

    // Arrange: スコア満点（100点、最大境界値）での入力
    const requirement_max = {
      requirement_id: 'REQ-002',
      requirement_name: 'Automated billing calculation',
      priority_score: 100,
      impact_area: 'billing_automation',
      estimated_effort_days: 20
    };

    // Act & Assert: スコア100点での分類結果を検証
    const result_max = calculateCrmRequirementPriority(requirement_max);
    expect(result_max).toEqual({
      requirement_id: 'REQ-002',
      requirement_name: 'Automated billing calculation',
      priority_score: 100,
      classification: '開発対象',
      development_target: true,
      review_target: false,
      exclude_target: false,
      assigned_release_priority: 1
    });

    // Arrange: スコア中間値（50点、検討対象の閾値）での入力
    const requirement_mid = {
      requirement_id: 'REQ-003',
      requirement_name: 'Report generation template',
      priority_score: 50,
      impact_area: 'report_generation',
      estimated_effort_days: 10
    };

    // Act & Assert: スコア50点での分類結果を検証
    const result_mid = calculateCrmRequirementPriority(requirement_mid);
    expect(result_mid).toEqual({
      requirement_id: 'REQ-003',
      requirement_name: 'Report generation template',
      priority_score: 50,
      classification: '検討対象',
      development_target: false,
      review_target: true,
      exclude_target: false,
      assigned_release_priority: null
    });

    // Arrange: スコア下位境界超過値（1点）での入力 - 除外から検討対象への切り替わり検証
    const requirement_threshold_low = {
      requirement_id: 'REQ-004',
      requirement_name: 'Minor UI improvement',
      priority_score: 1,
      impact_area: 'ui_enhancement',
      estimated_effort_days: 2
    };

    // Act & Assert: スコア1点での分類結果を検証（除外から検討対象への遷移確認）
    const result_threshold_low = calculateCrmRequirementPriority(requirement_threshold_low);
    expect(result_threshold_low.classification).not.toBe('除外');
    expect(result_threshold_low.exclude_target).toBe(false);

    // Arrange: スコア上位境界値直下（99点）での入力 - 検討対象から開発対象への切り替わり検証
    const requirement_threshold_high = {
      requirement_id: 'REQ-005',
      requirement_name: 'Critical validation rule',
      priority_score: 99,
      impact_area: 'data_validation',
      estimated_effort_days: 25
    };

    // Act & Assert: スコア99点での分類結果を検証（検討対象から開発対象への遷移確認）
    const result_threshold_high = calculateCrmRequirementPriority(requirement_threshold_high);
    expect(result_threshold_high.classification).toBe('開発対象');
    expect(result_threshold_high.development_target).toBe(true);

    // Assert: 各境界値での分類切り替わりが明確に異なることを確認
    expect(result_min.classification).toBe('除外');
    expect(result_mid.classification).toBe('検討対象');
    expect(result_max.classification).toBe('開発対象');
    expect(result_min.classification).not.toBe(result_mid.classification);
    expect(result_mid.classification).not.toBe(result_max.classification);

    // Assert: 境界値入力時にシステムエラーや予期しない例外が発生しないことを確認
    expect(result_min).toHaveProperty('requirement_id');
    expect(result_min).toHaveProperty('classification');
    expect(result_min).toHaveProperty('development_target');
    expect(result_max).toHaveProperty('requirement_id');
    expect(result_max).toHaveProperty('classification');
    expect(result_max).toHaveProperty('development_target');
    
    // Assert: 分類フラグの論理矛盾がないことを確認
    expect(
      result_min.development_target === true || 
      result_min.review_target === true || 
      result_min.exclude_target === true
    ).toBe(true);
    expect(
      result_max.development_target === true || 
      result_max.review_target === true || 
      result_max.exclude_target === true
    ).toBe(true);

    // Assert: スコア0点と満点での割り当てリリース優先度が異なることを確認
    expect(result_min.assigned_release_priority).toBeNull();
    expect(result_max.assigned_release_priority).toBe(1);
  });
});