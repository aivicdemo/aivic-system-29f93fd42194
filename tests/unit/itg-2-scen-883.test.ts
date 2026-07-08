import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { aggregateAssessmentAccuracyByDimension } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-883: [normal] 過去案件データのフィルタリング・有効性判定
  // - 地域・時期・工種が完全に合致する過去案件データが正しく抽出される

  test('過去案件データを地域・時期・工種でフィルタリングし、条件に完全に合致するデータのみが抽出される', () => {
    // Arrange: テスト用の過去案件データを準備
    const pastProjectsData = [
      {
        project_id: 'proj_001',
        region: '東京都渋谷区',
        work_type: '屋根修理',
        period_start: '2023-04-01',
        period_end: '2023-06-30',
        amount: 850000,
        quantity: 50,
        unit_price: 17000,
        assessor_id: 'assessor_A',
        assessment_accuracy: 95.5,
        deviation_rate: 2.3,
        deviation_amount: 19550,
      },
      {
        project_id: 'proj_002',
        region: '東京都渋谷区',
        work_type: '屋根修理',
        period_start: '2023-04-15',
        period_end: '2023-06-15',
        amount: 920000,
        quantity: 55,
        unit_price: 16727,
        assessor_id: 'assessor_B',
        assessment_accuracy: 92.1,
        deviation_rate: 3.5,
        deviation_amount: 32200,
      },
      {
        project_id: 'proj_003',
        region: '東京都新宿区',
        work_type: '屋根修理',
        period_start: '2023-04-01',
        period_end: '2023-06-30',
        amount: 780000,
        quantity: 45,
        unit_price: 17333,
        assessor_id: 'assessor_C',
        assessment_accuracy: 88.7,
        deviation_rate: 5.1,
        deviation_amount: 39780,
      },
      {
        project_id: 'proj_004',
        region: '東京都渋谷区',
        work_type: '外壁塗装',
        period_start: '2023-04-01',
        period_end: '2023-06-30',
        amount: 1200000,
        quantity: 120,
        unit_price: 10000,
        assessor_id: 'assessor_A',
        assessment_accuracy: 94.2,
        deviation_rate: 1.8,
        deviation_amount: 21600,
      },
      {
        project_id: 'proj_005',
        region: '東京都渋谷区',
        work_type: '屋根修理',
        period_start: '2023-07-01',
        period_end: '2023-09-30',
        amount: 900000,
        quantity: 52,
        unit_price: 17308,
        assessor_id: 'assessor_B',
        assessment_accuracy: 91.3,
        deviation_rate: 4.2,
        deviation_amount: 37800,
      },
      {
        project_id: 'proj_006',
        region: '東京都渋谷区',
        work_type: '屋根修理',
        period_start: '2023-05-10',
        period_end: '2023-06-10',
        amount: 875000,
        quantity: 51,
        unit_price: 17157,
        assessor_id: 'assessor_A',
        assessment_accuracy: 96.8,
        deviation_rate: 1.5,
        deviation_amount: 13125,
      },
    ];

    // フィルタ条件を設定
    const filter_region = '東京都渋谷区';
    const filter_period_start = '2023-04-01';
    const filter_period_end = '2023-06-30';
    const filter_work_type = '屋根修理';

    // Act: フィルタリングと集計を実行
    const result = aggregateAssessmentAccuracyByDimension({
      past_projects_data: pastProjectsData,
      filter_region,
      filter_period_start,
      filter_period_end,
      filter_work_type,
    });

    // Assert: 抽出結果の検証
    // 1. 条件に完全に合致するのはproj_001とproj_006の2件
    expect(result.filtered_projects_count).toBe(2);
    expect(result.filtered_projects).toEqual([
      {
        project_id: 'proj_001',
        region: '東京都渋谷区',
        work_type: '屋根修理',
        period_start: '2023-04-01',
        period_end: '2023-06-30',
        amount: 850000,
        quantity: 50,
        unit_price: 17000,
        assessor_id: 'assessor_A',
        assessment_accuracy: 95.5,
        deviation_rate: 2.3,
        deviation_amount: 19550,
      },
      {
        project_id: 'proj_006',
        region: '東京都渋谷区',
        work_type: '屋根修理',
        period_start: '2023-05-10',
        period_end: '2023-06-10',
        amount: 875000,
        quantity: 51,
        unit_price: 17157,
        assessor_id: 'assessor_A',
        assessment_accuracy: 96.8,
        deviation_rate: 1.5,
        deviation_amount: 13125,
      },
    ]);

    // 2. 各抽出データの属性が検索条件と完全に合致することを検証
    result.filtered_projects.forEach((project: any) => {
      expect(project.region).toBe(filter_region);
      expect(project.work_type).toBe(filter_work_type);
      // 時期の合致確認: period_startがfilter_period_start以降、period_endがfilter_period_end以前
      expect(new Date(project.period_start).getTime()).toBeGreaterThanOrEqual(
        new Date(filter_period_start).getTime()
      );
      expect(new Date(project.period_end).getTime()).toBeLessThanOrEqual(
        new Date(filter_period_end).getTime()
      );
    });

    // 3. 判定精度指標の集計結果を検証
    // 抽出されたproj_001とproj_006の判定精度の平均値
    const expected_average_accuracy = (95.5 + 96.8) / 2; // 96.15
    expect(result.average_assessment_accuracy).toBeCloseTo(96.15, 2);

    // 乖離率の平均値
    const expected_average_deviation_rate = (2.3 + 1.5) / 2; // 1.9
    expect(result.average_deviation_rate).toBeCloseTo(1.9, 2);

    // 乖離額の合計
    const expected_total_deviation_amount = 19550 + 13125; // 32675
    expect(result.total_deviation_amount).toBe(32675);

    // 4. 漏れがないことを確認
    // proj_002とproj_005は時期は合致するが、期間が完全に含まれていないのでフィルタアウト
    // proj_003は地域が異なるのでフィルタアウト
    // proj_004は工種が異なるのでフィルタアウト
    expect(result.excluded_projects_reason).toEqual({
      region_mismatch: ['proj_003'],
      work_type_mismatch: ['proj_004'],
      period_not_fully_contained: ['proj_002', 'proj_005'],
    });

    // 5. 検索結果の完全性を確認
    expect(result.search_validation).toEqual({
      has_no_duplicates: true,
      has_no_invalid_data: true,
      matches_all_filter_conditions: true,
      extraction_completeness: 1.0, // 100%
    });
  });
});