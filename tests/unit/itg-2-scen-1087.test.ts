import { aggregateAssessorDeviationAnalysis } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別判定ばらつき率と相場乖離傾向の自動集計・分析', () => {
  test('SCEN-1087: 配置可能査定員が1人の境界値で配置計画の実行可能性警告が表示される', () => {
    // 前提条件: 月次の査定業務が完了し、複数の査定員による判定結果が蓄積されている状態
    // トリガー: 査定部署長が月次レビューを実施するタイミング
    // 期待値: 査定員ごとの判定ばらつき率と相場乖離傾向を自動集計し、ダッシュボードで可視化

    const input_assessors = [
      {
        assessor_id: 'A001',
        name: '査定員1',
        monthly_judgments: [
          {
            judgment_id: 'J001',
            estimated_amount: 1000000,
            market_price: 950000,
            deviation_rate: -5.0,
          },
          {
            judgment_id: 'J002',
            estimated_amount: 2000000,
            market_price: 2050000,
            deviation_rate: 2.5,
          },
          {
            judgment_id: 'J003',
            estimated_amount: 1500000,
            market_price: 1480000,
            deviation_rate: -1.3,
          },
        ],
      },
      {
        assessor_id: 'A002',
        name: '査定員2',
        monthly_judgments: [
          {
            judgment_id: 'J004',
            estimated_amount: 1200000,
            market_price: 1250000,
            deviation_rate: 4.2,
          },
          {
            judgment_id: 'J005',
            estimated_amount: 1800000,
            market_price: 1750000,
            deviation_rate: -2.8,
          },
          {
            judgment_id: 'J006',
            estimated_amount: 2500000,
            market_price: 2480000,
            deviation_rate: -0.8,
          },
        ],
      },
      {
        assessor_id: 'A003',
        name: '査定員3',
        monthly_judgments: [
          {
            judgment_id: 'J007',
            estimated_amount: 900000,
            market_price: 850000,
            deviation_rate: -5.6,
          },
          {
            judgment_id: 'J008',
            estimated_amount: 1100000,
            market_price: 1200000,
            deviation_rate: 9.1,
          },
          {
            judgment_id: 'J009',
            estimated_amount: 3000000,
            market_price: 2900000,
            deviation_rate: -3.3,
          },
        ],
      },
    ];

    const placement_constraints = {
      available_assessors_count: 1,
      required_placements: [
        {
          placement_id: 'P001',
          target_department: '営業部門A',
          required_expertise: 'high_complexity',
          min_assessors_needed: 2,
        },
        {
          placement_id: 'P002',
          target_department: '営業部門B',
          required_expertise: 'medium_complexity',
          min_assessors_needed: 1,
        },
      ],
    };

    const analysis_result = aggregateAssessorDeviationAnalysis(
      input_assessors,
      placement_constraints
    );

    // assertion 1: 査定員別ばらつき率の計算検証
    // 査定員1の偏差: -5.0, 2.5, -1.3 → 平均 -1.27, 分散計算
    // 標本分散 = ((-5.0-(-1.27))^2 + (2.5-(-1.27))^2 + (-1.3-(-1.27))^2) / (3-1)
    //         = (14.2129 + 14.1129 + 0.0009) / 2 = 14.1633
    // 標本標準偏差 = sqrt(14.1633) ≈ 3.763
    // ばらつき率 = 3.763 / 1.27 ≈ 296.3
    expect(analysis_result.assessor_metrics[0].assessor_id).toBe('A001');
    expect(analysis_result.assessor_metrics[0].average_deviation_rate).toBeCloseTo(
      -1.27,
      1
    );
    expect(analysis_result.assessor_metrics[0].deviation_variance).toBeCloseTo(
      14.16,
      1
    );

    // assertion 2: 査定員2のばらつき率
    // 査定員2の偏差: 4.2, -2.8, -0.8 → 平均 0.2
    expect(analysis_result.assessor_metrics[1].assessor_id).toBe('A002');
    expect(analysis_result.assessor_metrics[1].average_deviation_rate).toBeCloseTo(
      0.2,
      1
    );

    // assertion 3: 査定員3のばらつき率
    // 査定員3の偏差: -5.6, 9.1, -3.3 → 平均 0.07
    expect(analysis_result.assessor_metrics[2].assessor_id).toBe('A003');
    expect(analysis_result.assessor_metrics[2].average_deviation_rate).toBeCloseTo(
      0.07,
      1
    );

    // assertion 4: 全体統計
    // 配置可能人数が1人に対して、配置先が2箇所（そのうち1箇所は2人必要）
    // 実行可能性判定: feasible = false
    expect(analysis_result.placement_feasibility.is_feasible).toBe(false);

    // assertion 5: 警告メッセージが生成される
    // 警告メッセージには「配置可能査定員が不足している可能性があります」を含む
    expect(analysis_result.placement_feasibility.warnings).toContainEqual(
      expect.objectContaining({
        severity: 'warning',
        code: 'insufficient_available_assessors',
      })
    );
    expect(
      analysis_result.placement_feasibility.warnings[0].message
    ).toMatch(/配置可能査定員が不足している可能性があります/);

    // assertion 6: 警告の詳細内容を検証
    const insufficiencyWarning = analysis_result.placement_feasibility.warnings.find(
      (w) => w.code === 'insufficient_available_assessors'
    );
    expect(insufficiencyWarning).toBeDefined();
    expect(insufficiencyWarning?.severity).toBe('warning');

    // assertion 7: 配置計画の詳細評価
    // 配置先P001は2人必要だが1人しか配置できない → 未充足
    expect(
      analysis_result.placement_feasibility.placement_adequacy[0]
        .placement_id
    ).toBe('P001');
    expect(
      analysis_result.placement_feasibility.placement_adequacy[0]
        .is_adequately_staffed
    ).toBe(false);
    expect(
      analysis_result.placement_feasibility.placement_adequacy[0].deficit
    ).toBe(1);

    // assertion 8: 配置先P002は1人必要で1人配置可能 → 充足可能
    expect(
      analysis_result.placement_feasibility.placement_adequacy[1]
        .placement_id
    ).toBe('P002');
    expect(
      analysis_result.placement_feasibility.placement_adequacy[1]
        .is_adequately_staffed
    ).toBe(true);
    expect(
      analysis_result.placement_feasibility.placement_adequacy[1].deficit
    ).toBe(0);

    // assertion 9: 全体リソース不足度スコア
    // リソース不足度 = 総必要人数 - 配置可能人数 = 3 - 1 = 2人分
    expect(
      analysis_result.placement_feasibility.total_resource_shortage
    ).toBe(2);

    // assertion 10: ユーザー への推奨アクション
    // 計画見直しが推奨される
    expect(
      analysis_result.placement_feasibility.recommended_action
    ).toMatch(/配置計画の見直し|応援要請|期間延長/);

    // assertion 11: 判定ばらつき率の算出
    // 全査定員の平均偏差率 = (-1.27 + 0.2 + 0.07) / 3 ≈ -0.33
    expect(
      analysis_result.overall_metrics.average_deviation_rate_across_assessors
    ).toBeCloseTo(-0.33, 1);

    // assertion 12: 判定精度指標（相場乖離の許容範囲内の件数率）
    // 許容範囲: ±5% と仮定
    // 査定員1: 3件中 3件（-5.0は範囲外だが-1.3は範囲内）→ 実質 2/3
    // 査定員2: 3件中 2件（4.2は範囲内、-2.8,-0.8は範囲内）→ 3/3
    // 査定員3: 3件中 1件（-5.6,-3.3は範囲内、9.1は範囲外）→ 2/3
    // 全体精度 = 7/9 ≈ 77.8%
    expect(
      analysis_result.overall_metrics.accuracy_within_tolerance_rate
    ).toBeCloseTo(77.78, 1);

    // assertion 13: ダッシュボード表示用データが正しく構造化されている
    expect(analysis_result.dashboard_display).toBeDefined();
    expect(
      analysis_result.dashboard_display.metrics_by_assessor
    ).toHaveLength(3);
    expect(
      analysis_result.dashboard_display.placement_feasibility_status
    ).toBe('警告: 資源不足');
  });
});