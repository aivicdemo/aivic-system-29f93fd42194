import { calculateExpansionViabilityAndDifficultyScores } from '../../src/logic/it-6-2-2-1';

describe('展開可能性判定と期待効果の定量抽出', () => {
  // SCEN-1317
  test('学習データ不足地域の検出と運用体制構築難度が正確に定量化される', () => {
    // テストデータ: 学習データが不足している地域パターン
    const regions = [
      {
        region_code: 'R001',
        region_name: '東京都',
        training_data_count: 5,
        threshold: 50,
        existing_assessment_count: 120,
        region_characteristic_index: 0.8,
        organization_readiness_score: 0.75,
      },
      {
        region_code: 'R002',
        region_name: '北海道',
        training_data_count: 0,
        threshold: 50,
        existing_assessment_count: 0,
        region_characteristic_index: 0.6,
        organization_readiness_score: 0.4,
      },
      {
        region_code: 'R003',
        region_name: '沖縄県',
        training_data_count: 15,
        threshold: 50,
        existing_assessment_count: 30,
        region_characteristic_index: 0.9,
        organization_readiness_score: 0.5,
      },
      {
        region_code: 'R004',
        region_name: '大阪府',
        training_data_count: 200,
        threshold: 50,
        existing_assessment_count: 500,
        region_characteristic_index: 0.7,
        organization_readiness_score: 0.85,
      },
    ];

    const result = calculateExpansionViabilityAndDifficultyScores({
      regions,
      data_sufficiency_threshold: 50,
      business_complexity_weight: 0.4,
      organization_readiness_weight: 0.3,
      regional_characteristic_weight: 0.3,
    });

    // 1. 学習データ不足地域が正確に検出されることを確認
    const insufficient_regions = result.regions_analysis.filter(
      (r) => r.is_data_insufficient === true
    );
    expect(insufficient_regions.length).toBe(3);
    expect(insufficient_regions.map((r) => r.region_code).sort()).toEqual(
      ['R001', 'R002', 'R003'].sort()
    );

    // 2. 各不足地域に対して展開可能性スコア（0～100）が計算されることを確認
    insufficient_regions.forEach((region) => {
      expect(typeof region.expansion_viability_score).toBe('number');
      expect(region.expansion_viability_score).toBeGreaterThanOrEqual(0);
      expect(region.expansion_viability_score).toBeLessThanOrEqual(100);
    });

    // 3. 運用体制構築難度スコア（0～100）が各地域ごとに定量化されることを確認
    result.regions_analysis.forEach((region) => {
      expect(typeof region.operation_setup_difficulty_score).toBe('number');
      expect(region.operation_setup_difficulty_score).toBeGreaterThanOrEqual(0);
      expect(region.operation_setup_difficulty_score).toBeLessThanOrEqual(100);
    });

    // 4. スコア算出に使用されたパラメータ（データ量、既存査定実績、地域特性など）をログから検証
    result.regions_analysis.forEach((region) => {
      expect(region.calculation_parameters).toBeDefined();
      expect(region.calculation_parameters.training_data_count).toBe(
        region.training_data_count
      );
      expect(region.calculation_parameters.existing_assessment_count).toBe(
        region.existing_assessment_count
      );
      expect(region.calculation_parameters.region_characteristic_index).toBe(
        region.region_characteristic_index
      );
      expect(region.calculation_parameters.organization_readiness_score).toBe(
        region.organization_readiness_score
      );
    });

    // 5. 複数地域を同時処理した場合、各地域のスコアが独立して正確に計算されることを確認
    const viability_scores = result.regions_analysis.map(
      (r) => r.expansion_viability_score
    );
    const difficulty_scores = result.regions_analysis.map(
      (r) => r.operation_setup_difficulty_score
    );

    // スコアが互いに異なることを確認（独立計算）
    expect(new Set(viability_scores).size).toBeGreaterThan(1);
    expect(new Set(difficulty_scores).size).toBeGreaterThan(1);

    // 6. スコアが業界標準の評価基準と整合していることを確認
    // データ不足地域のスコアは低く、データ充実地域のスコアは高いことを確認
    const r001_analysis = result.regions_analysis.find(
      (r) => r.region_code === 'R001'
    );
    const r004_analysis = result.regions_analysis.find(
      (r) => r.region_code === 'R004'
    );

    expect(r001_analysis).toBeDefined();
    expect(r004_analysis).toBeDefined();

    // データが充実している地域（R004）の展開可能性スコアがデータ不足地域より高い
    if (r001_analysis && r004_analysis) {
      expect(r004_analysis.expansion_viability_score).toBeGreaterThan(
        r001_analysis.expansion_viability_score
      );
    }

    // 7. エッジケース：データ量0（R002）での計算結果が正常に処理されることを確認
    const r002_analysis = result.regions_analysis.find(
      (r) => r.region_code === 'R002'
    );
    expect(r002_analysis).toBeDefined();
    expect(r002_analysis?.is_data_insufficient).toBe(true);
    expect(r002_analysis?.expansion_viability_score).toBeDefined();
    expect(r002_analysis?.operation_setup_difficulty_score).toBeDefined();
    expect(r002_analysis?.expansion_viability_score).toBeGreaterThanOrEqual(0);
    expect(r002_analysis?.expansion_viability_score).toBeLessThanOrEqual(100);
    expect(r002_analysis?.operation_setup_difficulty_score).toBeGreaterThanOrEqual(
      0
    );
    expect(r002_analysis?.operation_setup_difficulty_score).toBeLessThanOrEqual(
      100
    );

    // 8. 総合評価スコアが出力されることを確認
    expect(typeof result.overall_expansion_viability_score).toBe('number');
    expect(result.overall_expansion_viability_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_expansion_viability_score).toBeLessThanOrEqual(100);

    expect(typeof result.overall_operation_setup_difficulty_score).toBe('number');
    expect(result.overall_operation_setup_difficulty_score).toBeGreaterThanOrEqual(
      0
    );
    expect(result.overall_operation_setup_difficulty_score).toBeLessThanOrEqual(100);

    // 9. 処理サマリーが含まれることを確認
    expect(result.summary).toBeDefined();
    expect(result.summary.total_regions_analyzed).toBe(4);
    expect(result.summary.insufficient_data_regions_count).toBe(3);
    expect(result.summary.sufficient_data_regions_count).toBe(1);
    expect(result.summary.average_expansion_viability_score).toBeGreaterThanOrEqual(
      0
    );
    expect(result.summary.average_expansion_viability_score).toBeLessThanOrEqual(
      100
    );
  });
});