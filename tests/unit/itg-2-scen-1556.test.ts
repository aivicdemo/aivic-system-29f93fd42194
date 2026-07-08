import { aggregateAndVisualizeJudgmentAccuracy } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1556: [error] 見積査定員による運用マニュアル検証と合否判定 - 検証中にシステムデータの不整合が検出された場合、エラーが適切に通知される
  test('should detect and report system data inconsistencies during verification process with detailed error information', () => {
    // Arrange: テスト用の不整合データセットを準備
    const verificationDataset = {
      assessorRecords: [
        {
          assessor_id: 'A001',
          name: '査定員A',
          work_category: '土工',
          amount_band: '100-500万',
          judgement_count: 45,
          accuracy_rate: 94.5,
          deviation_pattern: 'normal',
          processing_time_minutes: 12,
          last_updated: '2024-01-15T10:00:00Z'
        },
        {
          assessor_id: 'A001', // 重複するID - 不整合
          name: '査定員A_duplicate',
          work_category: '土工',
          amount_band: '100-500万',
          judgement_count: 30,
          accuracy_rate: 88.2,
          deviation_pattern: 'abnormal',
          processing_time_minutes: 15,
          last_updated: '2024-01-15T09:30:00Z'
        }
      ],
      categoryStandards: [
        {
          category_code: 'CAT001',
          category_name: '土工',
          accuracy_threshold: 90,
          deviation_rate_upper_limit: 15,
          deviation_rate_lower_limit: -15
        },
        {
          category_code: 'CAT001', // 重複するコード - 不整合
          category_name: '土工_conflicted',
          accuracy_threshold: 85,
          deviation_rate_upper_limit: 20,
          deviation_rate_lower_limit: -20
        }
      ],
      amountBandDefinitions: [
        {
          band_id: 'BAND001',
          band_name: '100-500万',
          lower_bound: 1000000,
          upper_bound: 5000000,
          sample_size_requirement: 20
        },
        {
          band_id: 'BAND001', // 重複するID - 不整合
          band_name: '100-500万_conflicted',
          lower_bound: 1200000,
          upper_bound: 4800000,
          sample_size_requirement: 25
        }
      ],
      contradictoryRules: [
        {
          rule_id: 'RULE001',
          assessor_id: 'A001',
          category_code: 'CAT001',
          band_id: 'BAND001',
          min_accuracy: 90,
          max_accuracy: 85 // 矛盾: min > max
        }
      ]
    };

    // Act & Assert: システムがデータ不整合を検出してエラーをスロー
    expect(() =>
      aggregateAndVisualizeJudgmentAccuracy(verificationDataset)
    ).toThrow(/重複ID/);
  });

  test('should throw detailed error with inconsistent category standards', () => {
    const verificationDataset = {
      assessorRecords: [
        {
          assessor_id: 'A002',
          name: '査定員B',
          work_category: '躯体',
          amount_band: '500万-1000万',
          judgement_count: 38,
          accuracy_rate: 91.3,
          deviation_pattern: 'normal',
          processing_time_minutes: 14,
          last_updated: '2024-01-15T11:00:00Z'
        }
      ],
      categoryStandards: [
        {
          category_code: 'CAT002',
          category_name: '躯体',
          accuracy_threshold: 90,
          deviation_rate_upper_limit: 12,
          deviation_rate_lower_limit: -12
        },
        {
          category_code: 'CAT002', // 重複するコード
          category_name: '躯体_conflicted',
          accuracy_threshold: 85,
          deviation_rate_upper_limit: 18,
          deviation_rate_lower_limit: -18
        }
      ],
      amountBandDefinitions: [
        {
          band_id: 'BAND002',
          band_name: '500万-1000万',
          lower_bound: 5000000,
          upper_bound: 10000000,
          sample_size_requirement: 25
        }
      ],
      contradictoryRules: []
    };

    expect(() =>
      aggregateAndVisualizeJudgmentAccuracy(verificationDataset)
    ).toThrow(/カテゴリ標準/);
  });

  test('should throw error when amount band definitions have overlapping IDs', () => {
    const verificationDataset = {
      assessorRecords: [
        {
          assessor_id: 'A003',
          name: '査定員C',
          work_category: '仕上げ',
          amount_band: '1000万以上',
          judgement_count: 52,
          accuracy_rate: 96.1,
          deviation_pattern: 'normal',
          processing_time_minutes: 11,
          last_updated: '2024-01-15T12:00:00Z'
        }
      ],
      categoryStandards: [
        {
          category_code: 'CAT003',
          category_name: '仕上げ',
          accuracy_threshold: 92,
          deviation_rate_upper_limit: 10,
          deviation_rate_lower_limit: -10
        }
      ],
      amountBandDefinitions: [
        {
          band_id: 'BAND003',
          band_name: '1000万以上',
          lower_bound: 10000000,
          upper_bound: 100000000,
          sample_size_requirement: 30
        },
        {
          band_id: 'BAND003', // 重複するID
          band_name: '1000万以上_conflicted',
          lower_bound: 12000000,
          upper_bound: 90000000,
          sample_size_requirement: 35
        }
      ],
      contradictoryRules: []
    };

    expect(() =>
      aggregateAndVisualizeJudgmentAccuracy(verificationDataset)
    ).toThrow(/金額帯ID/);
  });

  test('should throw error when accuracy threshold contradicts min/max accuracy rule', () => {
    const verificationDataset = {
      assessorRecords: [
        {
          assessor_id: 'A004',
          name: '査定員D',
          work_category: '防水',
          amount_band: '50-100万',
          judgement_count: 28,
          accuracy_rate: 87.5,
          deviation_pattern: 'low_accuracy',
          processing_time_minutes: 16,
          last_updated: '2024-01-15T13:00:00Z'
        }
      ],
      categoryStandards: [
        {
          category_code: 'CAT004',
          category_name: '防水',
          accuracy_threshold: 90,
          deviation_rate_upper_limit: 14,
          deviation_rate_lower_limit: -14
        }
      ],
      amountBandDefinitions: [
        {
          band_id: 'BAND004',
          band_name: '50-100万',
          lower_bound: 500000,
          upper_bound: 1000000,
          sample_size_requirement: 15
        }
      ],
      contradictoryRules: [
        {
          rule_id: 'RULE002',
          assessor_id: 'A004',
          category_code: 'CAT004',
          band_id: 'BAND004',
          min_accuracy: 92,
          max_accuracy: 88 // 矛盾: min > max
        }
      ]
    };

    expect(() =>
      aggregateAndVisualizeJudgmentAccuracy(verificationDataset)
    ).toThrow(/精度条件矛盾/);
  });

  test('should successfully aggregate and visualize accuracy metrics when data is consistent', () => {
    const verificationDataset = {
      assessorRecords: [
        {
          assessor_id: 'A001',
          name: '査定員A',
          work_category: '土工',
          amount_band: '100-500万',
          judgement_count: 45,
          accuracy_rate: 94.5,
          deviation_pattern: 'normal',
          processing_time_minutes: 12,
          last_updated: '2024-01-15T10:00:00Z'
        },
        {
          assessor_id: 'A002',
          name: '査定員B',
          work_category: '土工',
          amount_band: '100-500万',
          judgement_count: 42,
          accuracy_rate: 92.8,
          deviation_pattern: 'normal',
          processing_time_minutes: 13,
          last_updated: '2024-01-15T10:30:00Z'
        },
        {
          assessor_id: 'A003',
          name: '査定員C',
          work_category: '躯体',
          amount_band: '500万-1000万',
          judgement_count: 38,
          accuracy_rate: 91.3,
          deviation_pattern: 'normal',
          processing_time_minutes: 14,
          last_updated: '2024-01-15T11:00:00Z'
        }
      ],
      categoryStandards: [
        {
          category_code: 'CAT001',
          category_name: '土工',
          accuracy_threshold: 90,
          deviation_rate_upper_limit: 15,
          deviation_rate_lower_limit: -15
        },
        {
          category_code: 'CAT002',
          category_name: '躯体',
          accuracy_threshold: 90,
          deviation_rate_upper_limit: 12,
          deviation_rate_lower_limit: -12
        }
      ],
      amountBandDefinitions: [
        {
          band_id: 'BAND001',
          band_name: '100-500万',
          lower_bound: 1000000,
          upper_bound: 5000000,
          sample_size_requirement: 20
        },
        {
          band_id: 'BAND002',
          band_name: '500万-1000万',
          lower_bound: 5000000,
          upper_bound: 10000000,
          sample_size_requirement: 25
        }
      ],
      contradictoryRules: []
    };

    const result = aggregateAndVisualizeJudgmentAccuracy(verificationDataset);

    // 期待結果: 集計データが正常に生成される
    expect(result).toBeDefined();
    expect(result.aggregation_status).toBe('success');

    // 査定員別精度集計: A001, A002, A003の平均精度
    expect(result.assessor_aggregates).toHaveLength(3);

    const assessorA001 = result.assessor_aggregates.find(
      (a: any) => a.assessor_id === 'A001'
    );
    expect(assessorA001).toBeDefined();
    expect(assessorA001.accuracy_rate).toBe(94.5);
    expect(assessorA001.judgement_count).toBe(45);

    // 工種別精度集計: 土工（A001, A002）の平均, 躯体（A003）の平均
    expect(result.category_aggregates).toBeDefined();

    const dojin_category = result.category_aggregates.find(
      (c: any) => c.category_name === '土工'
    );
    expect(dojin_category).toBeDefined();
    // 土工: (94.5 + 92.8) / 2 = 93.65
    expect(dojin_category.average_accuracy_rate).toBeCloseTo(93.65, 1);
    expect(dojin_category.total_judgement_count).toBe(87); // 45 + 42

    const kytai_category = result.category_aggregates.find(
      (c: any) => c.category_name === '躯体'
    );
    expect(kytai_category).toBeDefined();
    expect(kytai_category.average_accuracy_rate).toBe(91.3);
    expect(kytai_category.total_judgement_count).toBe(38);

    // 金額帯別精度集計
    expect(result.amount_band_aggregates).toBeDefined();

    const band100_500 = result.amount_band_aggregates.find(
      (b: any) => b.band_name === '100-500万'
    );
    expect(band100_500).toBeDefined();
    // 100-500万: (94.5 + 92.8) / 2 = 93.65
    expect(band100_500.average_accuracy_rate).toBeCloseTo(93.65, 1);
    expect(band100_500.total_judgement_count).toBe(87);

    const band500_1000 = result.amount_band_aggregates.find(
      (b: any) => b.band_name === '500万-1000万'
    );
    expect(band500_1000).toBeDefined();
    expect(band500_1000.average_accuracy_rate).toBe(91.3);
    expect(band500_1000.total_judgement_count).toBe(38);

    // 可視化データが生成されている
    expect(result.visualization_data).toBeDefined();
    expect(result.visualization_data.chart_type).toBe('multi_dimensional_accuracy');
    expect(result.visualization_data.dimensions).toContain('assessor');
    expect(result.visualization_data.dimensions).toContain('category');
    expect(result.visualization_data.dimensions).toContain('amount_band');
  });
});