import { defineConfirmDataset } from '../../src/logic/it-6-2-2-1';

describe('AI学習データセット確定機能', () => {
  // SCEN-1491: [normal] AI学習データセット確定機能 - 過去案件データと物価本の更新が完了した場合、AI再学習に必要なデータセットが確定する
  test('過去案件データと物価本の更新が完了後、データセット確定ボタンをクリックするとAI再学習用データセットが確定される', () => {
    const input = {
      pastProjectDataUpdateStatus: 'completed',
      pastProjectDataRecordCount: 1250,
      priceBookUpdateStatus: 'completed',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3847,
      regionCoverageRate: 0.95,
      constructionTypeCoverageRate: 0.87,
      seasonalDataCoverageRate: 0.78,
      confirmationAction: 'confirm',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    const result = defineConfirmDataset(input);

    expect(result.datasetId).toMatch(/^DATASET-/);
    expect(result.status).toBe('confirmed');
    expect(result.confirmedAt).toBe('2024-02-15T14:30:00Z');
    expect(result.pastProjectDataCount).toBe(1250);
    expect(result.priceBookVersion).toBe('2024-Q2');
    expect(result.priceBookRecordCount).toBe(3847);
    expect(result.totalRecordCount).toBe(5097);
    expect(result.regionCoverageRate).toBe(0.95);
    expect(result.constructionTypeCoverageRate).toBe(0.87);
    expect(result.seasonalDataCoverageRate).toBe(0.78);
    expect(result.readyForRelearning).toBe(true);
    expect(result.confirmedBy).toBe('assessor_001');
  });

  test('過去案件データ更新が未完了の場合、エラーで処理を拒否', () => {
    const input = {
      pastProjectDataUpdateStatus: 'in_progress',
      pastProjectDataRecordCount: 1200,
      priceBookUpdateStatus: 'completed',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3847,
      regionCoverageRate: 0.95,
      constructionTypeCoverageRate: 0.87,
      seasonalDataCoverageRate: 0.78,
      confirmationAction: 'confirm',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    expect(() => defineConfirmDataset(input)).toThrow(/過去案件データ/);
  });

  test('物価本の更新が未完了の場合、エラーで処理を拒否', () => {
    const input = {
      pastProjectDataUpdateStatus: 'completed',
      pastProjectDataRecordCount: 1250,
      priceBookUpdateStatus: 'pending',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3800,
      regionCoverageRate: 0.95,
      constructionTypeCoverageRate: 0.87,
      seasonalDataCoverageRate: 0.78,
      confirmationAction: 'confirm',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    expect(() => defineConfirmDataset(input)).toThrow(/物価本/);
  });

  test('確認キャンセルアクションの場合、データセット確定を実行しない', () => {
    const input = {
      pastProjectDataUpdateStatus: 'completed',
      pastProjectDataRecordCount: 1250,
      priceBookUpdateStatus: 'completed',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3847,
      regionCoverageRate: 0.95,
      constructionTypeCoverageRate: 0.87,
      seasonalDataCoverageRate: 0.78,
      confirmationAction: 'cancel',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    const result = defineConfirmDataset(input);

    expect(result.status).toBe('cancelled');
    expect(result.readyForRelearning).toBe(false);
  });

  test('地域カバレッジ率が許容基準未満の場合、警告を含めつつ確定を進める', () => {
    const input = {
      pastProjectDataUpdateStatus: 'completed',
      pastProjectDataRecordCount: 1250,
      priceBookUpdateStatus: 'completed',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3847,
      regionCoverageRate: 0.65,
      constructionTypeCoverageRate: 0.87,
      seasonalDataCoverageRate: 0.78,
      confirmationAction: 'confirm',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    const result = defineConfirmDataset(input);

    expect(result.status).toBe('confirmed');
    expect(result.regionCoverageRate).toBe(0.65);
    expect(result.warnings).toContain('地域カバレッジ不足');
    expect(result.readyForRelearning).toBe(true);
  });

  test('工事種別カバレッジ率が許容基準未満の場合、警告を含めつつ確定を進める', () => {
    const input = {
      pastProjectDataUpdateStatus: 'completed',
      pastProjectDataRecordCount: 1250,
      priceBookUpdateStatus: 'completed',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3847,
      regionCoverageRate: 0.95,
      constructionTypeCoverageRate: 0.60,
      seasonalDataCoverageRate: 0.78,
      confirmationAction: 'confirm',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    const result = defineConfirmDataset(input);

    expect(result.status).toBe('confirmed');
    expect(result.constructionTypeCoverageRate).toBe(0.60);
    expect(result.warnings).toContain('工事種別カバレッジ不足');
    expect(result.readyForRelearning).toBe(true);
  });

  test('季節データカバレッジ率が許容基準未満の場合、警告を含めつつ確定を進める', () => {
    const input = {
      pastProjectDataUpdateStatus: 'completed',
      pastProjectDataRecordCount: 1250,
      priceBookUpdateStatus: 'completed',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3847,
      regionCoverageRate: 0.95,
      constructionTypeCoverageRate: 0.87,
      seasonalDataCoverageRate: 0.50,
      confirmationAction: 'confirm',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    const result = defineConfirmDataset(input);

    expect(result.status).toBe('confirmed');
    expect(result.seasonalDataCoverageRate).toBe(0.50);
    expect(result.warnings).toContain('季節データカバレッジ不足');
    expect(result.readyForRelearning).toBe(true);
  });

  test('複数のカバレッジ率が許容基準未満の場合、複数の警告を記録', () => {
    const input = {
      pastProjectDataUpdateStatus: 'completed',
      pastProjectDataRecordCount: 1250,
      priceBookUpdateStatus: 'completed',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3847,
      regionCoverageRate: 0.60,
      constructionTypeCoverageRate: 0.55,
      seasonalDataCoverageRate: 0.50,
      confirmationAction: 'confirm',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    const result = defineConfirmDataset(input);

    expect(result.status).toBe('confirmed');
    expect(result.warnings.length).toBe(3);
    expect(result.warnings).toContain('地域カバレッジ不足');
    expect(result.warnings).toContain('工事種別カバレッジ不足');
    expect(result.warnings).toContain('季節データカバレッジ不足');
    expect(result.readyForRelearning).toBe(true);
  });

  test('データセットIDは確定日時と確認者情報をベースに生成される', () => {
    const input = {
      pastProjectDataUpdateStatus: 'completed',
      pastProjectDataRecordCount: 1250,
      priceBookUpdateStatus: 'completed',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3847,
      regionCoverageRate: 0.95,
      constructionTypeCoverageRate: 0.87,
      seasonalDataCoverageRate: 0.78,
      confirmationAction: 'confirm',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    const result = defineConfirmDataset(input);

    expect(result.datasetId).toMatch(/^DATASET-20240215-/);
  });

  test('確定されたデータセットは再学習機能で利用可能状態になる', () => {
    const input = {
      pastProjectDataUpdateStatus: 'completed',
      pastProjectDataRecordCount: 1250,
      priceBookUpdateStatus: 'completed',
      priceBookVersion: '2024-Q2',
      priceBookRecordCount: 3847,
      regionCoverageRate: 0.95,
      constructionTypeCoverageRate: 0.87,
      seasonalDataCoverageRate: 0.78,
      confirmationAction: 'confirm',
      confirmedAt: new Date('2024-02-15T14:30:00Z'),
      confirmedBy: 'assessor_001',
    };

    const result = defineConfirmDataset(input);

    expect(result.readyForRelearning).toBe(true);
    expect(result.availableForTraining).toBe(true);
  });
});