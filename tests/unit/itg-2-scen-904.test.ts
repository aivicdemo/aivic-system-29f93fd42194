import { defineUpdateFrequencyStandard } from '../../src/logic/it-6-3-1';

describe('査定判定ロジック適用履歴と根拠記録 - 学習データ標準化', () => {
  // SCEN-904
  test('更新頻度（月次・四半期・随時）を統一基準として定義・登録する', () => {
    const input = {
      userId: 'user_001',
      standardName: '学習データ更新頻度統一基準_2024',
      updateFrequencies: [
        {
          frequencyType: 'monthly',
          displayName: '月次更新',
          updateTiming: 'last_business_day_of_month',
          targetScope: 'all_regions',
          description: '毎月末営業日に全地域の学習データを更新'
        },
        {
          frequencyType: 'quarterly',
          displayName: '四半期更新',
          updateTiming: 'last_business_day_of_quarter',
          targetScope: 'priority_regions',
          description: '四半期末営業日に優先地域の学習データを更新'
        },
        {
          frequencyType: 'adhoc',
          displayName: '随時更新',
          updateTiming: 'as_needed',
          targetScope: 'specific_regions',
          description: '物価本新版公開時など必要に応じて即座に更新'
        }
      ],
      createdBy: 'user_001',
      createdAt: '2024-01-15T09:00:00Z',
      status: 'draft'
    };

    const result = defineUpdateFrequencyStandard(input);

    expect(result).toBeDefined();
    expect(result.standardId).toBeTruthy();
    expect(result.standardName).toBe('学習データ更新頻度統一基準_2024');
    expect(result.updateFrequencies).toHaveLength(3);
    expect(result.updateFrequencies[0].frequencyType).toBe('monthly');
    expect(result.updateFrequencies[0].displayName).toBe('月次更新');
    expect(result.updateFrequencies[0].targetScope).toBe('all_regions');
    expect(result.updateFrequencies[1].frequencyType).toBe('quarterly');
    expect(result.updateFrequencies[1].displayName).toBe('四半期更新');
    expect(result.updateFrequencies[1].targetScope).toBe('priority_regions');
    expect(result.updateFrequencies[2].frequencyType).toBe('adhoc');
    expect(result.updateFrequencies[2].displayName).toBe('随時更新');
    expect(result.updateFrequencies[2].targetScope).toBe('specific_regions');
    expect(result.createdBy).toBe('user_001');
    expect(result.createdAt).toBe('2024-01-15T09:00:00Z');
    expect(result.status).toBe('draft');
    expect(result.validationStatus).toBe('passed');
    expect(result.registrationTimestamp).toBeTruthy();
    expect(result.updateFrequencies.every(freq => freq.updateTiming)).toBe(true);
    expect(result.updateFrequencies.every(freq => freq.description)).toBe(true);
  });
});