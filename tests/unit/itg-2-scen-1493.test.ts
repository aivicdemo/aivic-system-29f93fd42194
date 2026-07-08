import { confirmAiLearningDatasetWithZeroHistoricalData } from '../../src/logic/it-6-3-1';

describe('査定判定ロジック適用履歴と根拠記録・検索 - AI学習データセット確定機能', () => {
  test('SCEN-1493: 過去案件データが0件の場合、警告を発して処理を継続するか確認が求められる', () => {
    const input = {
      historical_project_count: 0,
      price_book_version: '2024-01-15',
      target_regions: ['Tokyo', 'Osaka'],
      user_decision: 'continue',
      timestamp: new Date('2024-01-15T11:00:00Z'),
    };

    const result = confirmAiLearningDatasetWithZeroHistoricalData(input);

    expect(result.warning_displayed).toBe(true);
    expect(result.warning_message_key).toBe('zero_historical_projects');
    expect(result.confirmation_required).toBe(true);
    expect(result.can_proceed_with_zero_data).toBe(true);
    expect(result.process_status).toBe('completed');
    expect(result.completed_at).toEqual(new Date('2024-01-15T11:00:00Z'));
    expect(result.historical_projects_used_count).toBe(0);
    expect(result.price_book_version_applied).toBe('2024-01-15');
  });

  test('SCEN-1493: 過去案件データが0件で「中止」選択時、処理は中断される', () => {
    const input = {
      historical_project_count: 0,
      price_book_version: '2024-01-15',
      target_regions: ['Tokyo'],
      user_decision: 'cancel',
      timestamp: new Date('2024-01-15T11:00:00Z'),
    };

    const result = confirmAiLearningDatasetWithZeroHistoricalData(input);

    expect(result.warning_displayed).toBe(true);
    expect(result.confirmation_required).toBe(true);
    expect(result.can_proceed_with_zero_data).toBe(false);
    expect(result.process_status).toBe('cancelled');
  });

  test('SCEN-1493: 過去案件データが1件以上の場合、警告は表示されない', () => {
    const input = {
      historical_project_count: 5,
      price_book_version: '2024-01-15',
      target_regions: ['Tokyo', 'Osaka', 'Kyoto'],
      user_decision: 'continue',
      timestamp: new Date('2024-01-15T11:00:00Z'),
    };

    const result = confirmAiLearningDatasetWithZeroHistoricalData(input);

    expect(result.warning_displayed).toBe(false);
    expect(result.confirmation_required).toBe(false);
    expect(result.can_proceed_with_zero_data).toBe(true);
    expect(result.process_status).toBe('completed');
    expect(result.historical_projects_used_count).toBe(5);
  });

  test('SCEN-1493: 必須フィールド欠落時、エラーが発生する', () => {
    const input = {
      historical_project_count: 0,
      price_book_version: '2024-01-15',
      target_regions: [],
      user_decision: '',
      timestamp: new Date('2024-01-15T11:00:00Z'),
    };

    expect(() =>
      confirmAiLearningDatasetWithZeroHistoricalData(input)
    ).toThrow(/user_decision/);
  });

  test('SCEN-1493: 無効な判定が指定された場合、エラーが発生する', () => {
    const input = {
      historical_project_count: 0,
      price_book_version: '2024-01-15',
      target_regions: ['Tokyo'],
      user_decision: 'invalid_choice',
      timestamp: new Date('2024-01-15T11:00:00Z'),
    };

    expect(() =>
      confirmAiLearningDatasetWithZeroHistoricalData(input)
    ).toThrow(/user_decision/);
  });

  test('SCEN-1493: 過去案件データが負数の場合、エラーが発生する', () => {
    const input = {
      historical_project_count: -1,
      price_book_version: '2024-01-15',
      target_regions: ['Tokyo'],
      user_decision: 'continue',
      timestamp: new Date('2024-01-15T11:00:00Z'),
    };

    expect(() =>
      confirmAiLearningDatasetWithZeroHistoricalData(input)
    ).toThrow(/historical_project_count/);
  });
});