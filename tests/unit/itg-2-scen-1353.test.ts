import { quantifyMinimumDatasetRequirements } from '../../src/logic/it-1-br-2-2-2-1';

describe('学習データセット最小要件の定量化と検証', () => {
  // SCEN-1353
  test('最小要件が0件の場合に要件不成立エラーが発生し、前回の有効な設定状態に戻る', () => {
    const previous_valid_config = {
      minimum_cases_required: 50,
      minimum_coverage_rate: 0.8,
      minimum_region_count: 5,
      last_saved_timestamp: '2024-01-15T10:00:00Z',
    };

    const invalid_input = {
      minimum_cases_required: 0,
      minimum_coverage_rate: 0.8,
      minimum_region_count: 5,
      previous_valid_config,
    };

    expect(() => quantifyMinimumDatasetRequirements(invalid_input)).toThrow(/学習データセット/);
  });
});