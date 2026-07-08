import { filterAndValidatePastProjects } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-884
  test('過去案件データのフィルタリング・有効性判定 - データ不完全または形式不正な過去案件が除外される', () => {
    const test_input_projects = [
      {
        project_id: 'P001',
        assessment_date: '2024-01-15',
        item_name: '鉄筋工事',
        assessment_amount: 150000,
        quantity: 100,
        unit: '本',
        region: '東京',
        construction_type: '建築',
      },
      {
        project_id: 'P002',
        assessment_date: '2024-01-16',
        item_name: '型枠工事',
        assessment_amount: 200000,
        quantity: 50,
        unit: 'm2',
        region: '大阪',
        construction_type: '建築',
      },
      {
        project_id: 'P003',
        assessment_date: undefined,
        item_name: '鉄骨工事',
        assessment_amount: 300000,
        quantity: 25,
        unit: 't',
        region: '名古屋',
        construction_type: '建築',
      },
      {
        project_id: 'P004',
        assessment_date: '2024-01-17',
        item_name: undefined,
        assessment_amount: 250000,
        quantity: 30,
        unit: 'm3',
        region: '福岡',
        construction_type: '建築',
      },
      {
        project_id: 'P005',
        assessment_date: '2024-01-18',
        item_name: '溶接工事',
        assessment_amount: undefined,
        quantity: 40,
        unit: '組',
        region: '札幌',
        construction_type: '建築',
      },
      {
        project_id: 'P006',
        assessment_date: '2024-13-01',
        item_name: '配筋工事',
        assessment_amount: 180000,
        quantity: 60,
        unit: '本',
        region: '京都',
        construction_type: '建築',
      },
      {
        project_id: 'P007',
        assessment_date: '2024-01-19',
        item_name: '左官工事',
        assessment_amount: 'invalid_amount',
        quantity: 70,
        unit: 'm2',
        region: '広島',
        construction_type: '建築',
      },
      {
        project_id: 'P008',
        assessment_date: '2024-01-20',
        item_name: '防水工事',
        assessment_amount: 220000,
        quantity: 45,
        unit: 'm2',
        region: '仙台',
        construction_type: '建築',
      },
    ];

    const test_result = filterAndValidatePastProjects(test_input_projects);

    expect(test_result.valid_records).toEqual([
      {
        project_id: 'P001',
        assessment_date: '2024-01-15',
        item_name: '鉄筋工事',
        assessment_amount: 150000,
        quantity: 100,
        unit: '本',
        region: '東京',
        construction_type: '建築',
      },
      {
        project_id: 'P002',
        assessment_date: '2024-01-16',
        item_name: '型枠工事',
        assessment_amount: 200000,
        quantity: 50,
        unit: 'm2',
        region: '大阪',
        construction_type: '建築',
      },
      {
        project_id: 'P008',
        assessment_date: '2024-01-20',
        item_name: '防水工事',
        assessment_amount: 220000,
        quantity: 45,
        unit: 'm2',
        region: '仙台',
        construction_type: '建築',
      },
    ]);

    expect(test_result.excluded_records).toEqual([
      {
        project_id: 'P003',
        error_reason: '欠落項目: assessment_date',
        error_type: 'missing_required_field',
      },
      {
        project_id: 'P004',
        error_reason: '欠落項目: item_name',
        error_type: 'missing_required_field',
      },
      {
        project_id: 'P005',
        error_reason: '欠落項目: assessment_amount',
        error_type: 'missing_required_field',
      },
      {
        project_id: 'P006',
        error_reason: '不正な日付形式: 2024-13-01',
        error_type: 'invalid_date_format',
      },
      {
        project_id: 'P007',
        error_reason: '査定額が数値以外です: invalid_amount',
        error_type: 'invalid_amount_format',
      },
    ]);

    expect(test_result.valid_records.length).toBe(3);
    expect(test_result.excluded_records.length).toBe(5);
    expect(test_result.total_input_count).toBe(8);
    expect(test_result.validation_success_rate).toBe(37.5);
  });
});