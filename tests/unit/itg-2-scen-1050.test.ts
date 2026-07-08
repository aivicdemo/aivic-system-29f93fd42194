import { aggregateAssessorVarianceAndDiscrepancy } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能", () => {
  test("SCEN-1050: 相場乖離が0件の場合（完全一致）でも正常表示される", () => {
    // 相場乖離が 0 件（完全一致）のテストデータを準備
    const assessmentCases = [
      {
        case_id: "CASE-001",
        assessor_id: "ASSESSOR-001",
        estimated_price: 1000000,
        market_price: 1000000,
        discrepancy_amount: 0,
        discrepancy_rate: 0,
        construction_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-01-15",
      },
      {
        case_id: "CASE-002",
        assessor_id: "ASSESSOR-002",
        estimated_price: 500000,
        market_price: 500000,
        discrepancy_amount: 0,
        discrepancy_rate: 0,
        construction_type: "土木工事",
        region: "大阪府",
        assessment_date: "2024-01-15",
      },
      {
        case_id: "CASE-003",
        assessor_id: "ASSESSOR-001",
        estimated_price: 750000,
        market_price: 750000,
        discrepancy_amount: 0,
        discrepancy_rate: 0,
        construction_type: "建築工事",
        region: "東京都",
        assessment_date: "2024-01-15",
      },
    ];

    // 集計・分析処理を実行
    const result = aggregateAssessorVarianceAndDiscrepancy(assessmentCases);

    // 相場乖離件数が 0 件と正確に表示されることを検証
    expect(result.total_discrepancy_cases).toBe(0);

    // 判定ばらつき率が 0% であることを検証（完全一致のため）
    expect(result.variance_rate).toBe(0);

    // 査定員別の統計が正常に集計されていることを検証
    expect(result.assessor_statistics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          assessor_id: "ASSESSOR-001",
          case_count: 2,
          average_discrepancy_rate: 0,
          discrepancy_case_count: 0,
        }),
        expect.objectContaining({
          assessor_id: "ASSESSOR-002",
          case_count: 1,
          average_discrepancy_rate: 0,
          discrepancy_case_count: 0,
        }),
      ])
    );

    // ダッシュボード用統合データが正常に構成されていることを検証
    expect(result.dashboard_summary).toEqual(
      expect.objectContaining({
        total_assessment_cases: 3,
        zero_discrepancy_cases: 3,
        discrepancy_cases_with_variance: 0,
        overall_variance_rate: 0,
        critical_alert_count: 0,
      })
    );

    // 相場乖離傾向が正常に分類されていることを検証
    expect(result.discrepancy_pattern_distribution).toEqual({
      underestimated: 0,
      overestimated: 0,
      perfect_match: 3,
    });

    // エラーフラグが設定されていないことを検証
    expect(result.has_error).toBe(false);

    // エラーメッセージが空であることを検証
    expect(result.error_messages).toHaveLength(0);

    // UI レンダリング用の state が正常であることを検証
    expect(result.ui_state).toEqual(
      expect.objectContaining({
        is_rendering_complete: true,
        widget_states: expect.objectContaining({
          discrepancy_section_visible: true,
          variance_chart_visible: true,
          assessor_ranking_visible: true,
        }),
        alert_level: "normal",
      })
    );

    // 相場乖離情報セクションの詳細が正常に構成されていることを検証
    expect(result.judgment_basis_detail).toEqual(
      expect.objectContaining({
        discrepancy_count: 0,
        discrepancy_count_display_text: "0件",
        basis_reference_data: expect.any(Array),
        correction_factors_applied: expect.any(Array),
      })
    );

    // 統計的な有意性検定が正常に完了していることを検証
    expect(result.statistical_validation).toEqual(
      expect.objectContaining({
        sample_size: 3,
        is_statistically_valid: true,
        confidence_level: 95,
      })
    );
  });
});