import { calculateEstimateItemDeviation } from '../../src/logic/it-6-3-1';

describe('見積項目相場乖離自動算出機能 - 学習データ存在有無', () => {
  // SCEN-805
  test('学習データが存在しない項目の場合、乖離算出処理がスキップされエラーが発生しない', () => {
    const estimateItemId = 'EST-ITEM-20240115-001';
    const estimateItemData = {
      id: estimateItemId,
      estimateId: 'EST-20240115-001',
      itemName: '基礎工事',
      quantity: 100,
      unitPrice: 5000,
      totalAmount: 500000,
      region: 'tokyo',
      workType: 'foundation',
      date: '2024-01-15',
      status: 'pending',
    };

    const learningDataset = {
      pastProjects: [],
      priceBook: null,
      lastUpdatedDate: null,
    };

    const result = calculateEstimateItemDeviation(
      estimateItemData,
      learningDataset
    );

    expect(result).toEqual({
      itemId: estimateItemId,
      deviationProcessed: false,
      processStatus: 'skipped',
      skipReason: 'learning_data_not_found',
      deviationRate: null,
      deviationAmount: null,
      referenceDataCount: 0,
      errorMessage: null,
      executedAt: expect.any(String),
    });

    expect(result.deviationProcessed).toBe(false);
    expect(result.processStatus).toBe('skipped');
    expect(result.skipReason).toBe('learning_data_not_found');
    expect(result.deviationRate).toBeNull();
    expect(result.deviationAmount).toBeNull();
    expect(result.referenceDataCount).toBe(0);
    expect(result.errorMessage).toBeNull();
  });

  test('学習データが存在する場合、乖離が正常に算出される', () => {
    const estimateItemId = 'EST-ITEM-20240115-002';
    const estimateItemData = {
      id: estimateItemId,
      estimateId: 'EST-20240115-002',
      itemName: '基礎工事',
      quantity: 100,
      unitPrice: 5000,
      totalAmount: 500000,
      region: 'tokyo',
      workType: 'foundation',
      date: '2024-01-15',
      status: 'pending',
    };

    const learningDataset = {
      pastProjects: [
        {
          projectId: 'PROJ-2023-001',
          region: 'tokyo',
          workType: 'foundation',
          quantity: 100,
          unitPrice: 4800,
          totalAmount: 480000,
          date: '2023-12-01',
        },
        {
          projectId: 'PROJ-2023-002',
          region: 'tokyo',
          workType: 'foundation',
          quantity: 100,
          unitPrice: 5200,
          totalAmount: 520000,
          date: '2023-11-15',
        },
      ],
      priceBook: {
        version: '2024-01',
        publishDate: '2024-01-01',
        items: [
          {
            workType: 'foundation',
            region: 'tokyo',
            standardPrice: 5000,
            effectiveDate: '2024-01-01',
          },
        ],
      },
      lastUpdatedDate: '2024-01-10',
    };

    const result = calculateEstimateItemDeviation(
      estimateItemData,
      learningDataset
    );

    expect(result.itemId).toBe(estimateItemId);
    expect(result.deviationProcessed).toBe(true);
    expect(result.processStatus).toBe('completed');
    expect(result.skipReason).toBeNull();
    expect(result.deviationRate).toBe(0);
    expect(result.deviationAmount).toBe(0);
    expect(result.referenceDataCount).toBe(2);
    expect(result.errorMessage).toBeNull();
    expect(typeof result.executedAt).toBe('string');
  });

  test('学習データが不完全（pastProjects のみ）の場合、部分的に処理される', () => {
    const estimateItemId = 'EST-ITEM-20240115-003';
    const estimateItemData = {
      id: estimateItemId,
      estimateId: 'EST-20240115-003',
      itemName: '躯体工事',
      quantity: 50,
      unitPrice: 10000,
      totalAmount: 500000,
      region: 'osaka',
      workType: 'structure',
      date: '2024-01-15',
      status: 'pending',
    };

    const learningDataset = {
      pastProjects: [
        {
          projectId: 'PROJ-2023-003',
          region: 'osaka',
          workType: 'structure',
          quantity: 50,
          unitPrice: 9500,
          totalAmount: 475000,
          date: '2023-12-20',
        },
      ],
      priceBook: null,
      lastUpdatedDate: '2024-01-10',
    };

    const result = calculateEstimateItemDeviation(
      estimateItemData,
      learningDataset
    );

    expect(result.itemId).toBe(estimateItemId);
    expect(result.deviationProcessed).toBe(true);
    expect(result.processStatus).toBe('completed');
    expect(result.referenceDataCount).toBe(1);
    expect(result.deviationRate).toBe(5.26);
    expect(result.deviationAmount).toBe(25000);
    expect(result.errorMessage).toBeNull();
  });

  test('学習データが空配列の場合、処理がスキップされ正常終了する', () => {
    const estimateItemId = 'EST-ITEM-20240115-004';
    const estimateItemData = {
      id: estimateItemId,
      estimateId: 'EST-20240115-004',
      itemName: '外装工事',
      quantity: 200,
      unitPrice: 3000,
      totalAmount: 600000,
      region: 'nagoya',
      workType: 'exterior',
      date: '2024-01-15',
      status: 'pending',
    };

    const learningDataset = {
      pastProjects: [],
      priceBook: null,
      lastUpdatedDate: null,
    };

    const result = calculateEstimateItemDeviation(
      estimateItemData,
      learningDataset
    );

    expect(result.itemId).toBe(estimateItemId);
    expect(result.deviationProcessed).toBe(false);
    expect(result.processStatus).toBe('skipped');
    expect(result.skipReason).toBe('learning_data_not_found');
    expect(result.deviationRate).toBeNull();
    expect(result.deviationAmount).toBeNull();
    expect(result.referenceDataCount).toBe(0);
    expect(result.errorMessage).toBeNull();
  });

  test('複数の見積項目を処理する際、学習データなし項目はスキップされ他の項目には影響しない', () => {
    const item1 = {
      id: 'EST-ITEM-1',
      estimateId: 'EST-20240115-005',
      itemName: '基礎工事',
      quantity: 100,
      unitPrice: 5000,
      totalAmount: 500000,
      region: 'tokyo',
      workType: 'foundation',
      date: '2024-01-15',
      status: 'pending',
    };

    const item2 = {
      id: 'EST-ITEM-2',
      estimateId: 'EST-20240115-005',
      itemName: '躯体工事',
      quantity: 50,
      unitPrice: 10000,
      totalAmount: 500000,
      region: 'osaka',
      workType: 'structure',
      date: '2024-01-15',
      status: 'pending',
    };

    const learningDatasetEmpty = {
      pastProjects: [],
      priceBook: null,
      lastUpdatedDate: null,
    };

    const learningDatasetWithData = {
      pastProjects: [
        {
          projectId: 'PROJ-2023-004',
          region: 'osaka',
          workType: 'structure',
          quantity: 50,
          unitPrice: 9500,
          totalAmount: 475000,
          date: '2023-12-20',
        },
      ],
      priceBook: null,
      lastUpdatedDate: '2024-01-10',
    };

    const result1 = calculateEstimateItemDeviation(item1, learningDatasetEmpty);
    const result2 = calculateEstimateItemDeviation(
      item2,
      learningDatasetWithData
    );

    expect(result1.processStatus).toBe('skipped');
    expect(result1.deviationProcessed).toBe(false);

    expect(result2.processStatus).toBe('completed');
    expect(result2.deviationProcessed).toBe(true);
    expect(result2.referenceDataCount).toBe(1);
  });
});