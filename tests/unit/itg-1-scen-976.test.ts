import { analyzeCustomerObjections } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 請求ルール例外ケース検出と手順書更新判定', () => {
  test('SCEN-976: 複数の顧客異議を分析し、境界領域の判断基準改善が必要なルール更新対象を正確に特定', () => {
    // 準備: 複数の顧客異議レコード（境界領域の金額を含める）
    const customerObjections = [
      {
        objection_id: 'OBJ-001',
        customer_id: 'CUST-A',
        billing_amount: 100000,
        objection_amount: 105200,
        difference_percentage: 5.2,
        objection_date: '2024-01-15T10:30:00Z',
        objection_reason: '請求額計算に誤りがある',
        contract_id: 'CTR-001',
      },
      {
        objection_id: 'OBJ-002',
        customer_id: 'CUST-B',
        billing_amount: 200000,
        objection_amount: 210800,
        difference_percentage: 5.4,
        objection_date: '2024-01-15T11:15:00Z',
        objection_reason: '割引ルール適用の判定が矛盾している',
        contract_id: 'CTR-002',
      },
      {
        objection_id: 'OBJ-003',
        customer_id: 'CUST-C',
        billing_amount: 150000,
        objection_amount: 157450,
        difference_percentage: 4.97,
        objection_date: '2024-01-15T09:45:00Z',
        objection_reason: '最小請求額ルールの適用が不明確',
        contract_id: 'CTR-003',
      },
      {
        objection_id: 'OBJ-004',
        customer_id: 'CUST-D',
        billing_amount: 80000,
        objection_amount: 84200,
        difference_percentage: 5.25,
        objection_date: '2024-01-15T13:20:00Z',
        objection_reason: '金額計算ロジック不透明',
        contract_id: 'CTR-004',
      },
      {
        objection_id: 'OBJ-005',
        customer_id: 'CUST-E',
        billing_amount: 250000,
        objection_amount: 312500,
        difference_percentage: 25.0,
        objection_date: '2024-01-15T14:00:00Z',
        objection_reason: '大幅な金額相違（非境界領域）',
        contract_id: 'CTR-005',
      },
    ];

    const analysisConfig = {
      boundary_threshold_lower: -5.0,
      boundary_threshold_upper: 5.5,
      minimum_objection_count: 3,
      analysis_period_start: '2024-01-01T00:00:00Z',
      analysis_period_end: '2024-01-31T23:59:59Z',
    };

    // 実行: 複数の顧客異議データを分析エンジンに入力
    const analysisResult = analyzeCustomerObjections(
      customerObjections,
      analysisConfig
    );

    // 検証1: 境界領域内でのルール適用矛盾が正確に検出される
    expect(analysisResult.boundary_region_detected).toBe(true);

    // 検証2: 境界領域に該当する異議レコード数（±5%範囲）
    expect(analysisResult.boundary_objection_count).toBe(4);

    // 検証3: 非境界領域（25%相違）は除外される
    expect(analysisResult.excluded_outlier_count).toBe(1);

    // 検証4: 改善が必要と判定されたルール項目が特定される
    expect(analysisResult.required_improvements).toEqual([
      {
        rule_id: 'RULE-DISCOUNT-THRESHOLD',
        rule_name: '割引ルール適用判定ロジック',
        issue_type: 'ロジック矛盾',
        affected_objection_ids: ['OBJ-001', 'OBJ-002', 'OBJ-003', 'OBJ-004'],
        current_threshold: 5.0,
        recommended_threshold: 5.3,
        confidence_score: 0.92,
      },
      {
        rule_id: 'RULE-MIN-BILLING',
        rule_name: '最小請求額ルール',
        issue_type: '判定基準不明確',
        affected_objection_ids: ['OBJ-003', 'OBJ-004'],
        current_threshold: 50000,
        recommended_threshold: 55000,
        confidence_score: 0.85,
      },
      {
        rule_id: 'RULE-AMOUNT-CALC',
        rule_name: '金額計算ロジック',
        issue_type: '透明性不足',
        affected_objection_ids: ['OBJ-001', 'OBJ-002', 'OBJ-004'],
        current_threshold: 0,
        recommended_threshold: 1,
        confidence_score: 0.88,
      },
    ]);

    // 検証5: 手順書マッピング対象として特定されたルール更新項目
    expect(analysisResult.handbook_mapping_targets).toEqual([
      {
        mapping_id: 'MAP-DISCOUNT-THRESHOLD',
        rule_id: 'RULE-DISCOUNT-THRESHOLD',
        handbook_section: '請求ロジック・割引基準の明文化と運用',
        current_handbook_value: '5.0%',
        proposed_handbook_value: '5.3%',
        update_priority: 'HIGH',
        manual_review_required: true,
      },
      {
        mapping_id: 'MAP-MIN-BILLING',
        rule_id: 'RULE-MIN-BILLING',
        handbook_section: '請求ロジック・割引基準の明文化と運用',
        current_handbook_value: '50,000円',
        proposed_handbook_value: '55,000円',
        update_priority: 'MEDIUM',
        manual_review_required: true,
      },
      {
        mapping_id: 'MAP-AMOUNT-CALC',
        rule_id: 'RULE-AMOUNT-CALC',
        handbook_section: '請求額計算ルール・判定基準を文書化',
        current_handbook_value: '統一ロジック未定義',
        proposed_handbook_value: '境界値処理ロジック追加',
        update_priority: 'HIGH',
        manual_review_required: true,
      },
    ]);

    // 検証6: 非境界領域の異議（25%相違）は除外されていることを確認
    expect(
      analysisResult.excluded_objections.some(
        (obj) => obj.objection_id === 'OBJ-005'
      )
    ).toBe(true);
    expect(analysisResult.excluded_objections[0]).toEqual({
      objection_id: 'OBJ-005',
      customer_id: 'CUST-E',
      difference_percentage: 25.0,
      exclusion_reason: 'outside_boundary_range',
      outside_boundary_threshold: 5.5,
    });

    // 検証7: 統計分析の信頼度スコア（複数レコードから算出）
    expect(analysisResult.pattern_analysis_confidence).toBeGreaterThanOrEqual(
      0.8
    );
    expect(analysisResult.pattern_analysis_confidence).toBeLessThanOrEqual(1.0);

    // 検証8: 手順書更新候補出力の完全性（情報が完全に揃っていること）
    expect(analysisResult.handbook_update_proposal).toEqual({
      proposal_id: 'PROP-2024-01-976',
      analysis_date: '2024-01-15T00:00:00Z',
      affected_customer_count: 4,
      affected_objection_ids_sample: [
        'OBJ-001',
        'OBJ-002',
        'OBJ-003',
        'OBJ-004',
      ],
      total_mapping_targets: 3,
      required_updates: [
        {
          target_rule: 'RULE-DISCOUNT-THRESHOLD',
          update_type: 'threshold_adjustment',
          change_from: 5.0,
          change_to: 5.3,
          impact_area: '割引ルール判定',
          validation_status: 'pending_manual_review',
        },
        {
          target_rule: 'RULE-MIN-BILLING',
          update_type: 'threshold_adjustment',
          change_from: 50000,
          change_to: 55000,
          impact_area: '最小請求額判定',
          validation_status: 'pending_manual_review',
        },
        {
          target_rule: 'RULE-AMOUNT-CALC',
          update_type: 'logic_clarification',
          change_from: '未定義',
          change_to: '境界値処理ロジック追加',
          impact_area: '金額計算透明性',
          validation_status: 'pending_manual_review',
        },
      ],
      recommendation: '境界領域（±5%）での判定矛盾を解消するため、3つのルール更新が推奨される。手動レビュー後に手順書へ反映してください。',
      next_action: 'manual_review_required',
      estimated_impact: {
        affected_future_objections_reduction: 0.92,
        handbook_clarity_improvement: 0.88,
      },
    });

    // 検証9: エラーケース - 配列が空またはnullの場合
    expect(() => {
      analyzeCustomerObjections([], analysisConfig);
    }).toThrow(/異議データ/);

    // 検証10: エラーケース - 境界閾値の設定が無効な場合
    const invalidConfig = {
      boundary_threshold_lower: 5.0,
      boundary_threshold_upper: -5.0,
      minimum_objection_count: 3,
      analysis_period_start: '2024-01-01T00:00:00Z',
      analysis_period_end: '2024-01-31T23:59:59Z',
    };
    expect(() => {
      analyzeCustomerObjections(customerObjections, invalidConfig);
    }).toThrow(/閾値設定/);

    // 検証11: エラーケース - 分析対象レコード不足の場合
    const minimalObjections = [
      {
        objection_id: 'OBJ-001',
        customer_id: 'CUST-A',
        billing_amount: 100000,
        objection_amount: 105200,
        difference_percentage: 5.2,
        objection_date: '2024-01-15T10:30:00Z',
        objection_reason: 'テスト',
        contract_id: 'CTR-001',
      },
    ];
    expect(() => {
      analyzeCustomerObjections(minimalObjections, analysisConfig);
    }).toThrow(/最小件数/);
  });
});