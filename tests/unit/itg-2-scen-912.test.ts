import { calculatePriceAdjustmentCoefficient } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析機能', () => {
  // SCEN-912: [error] 物価変動補正係数計算 - 過去案件データが統一形式に整備されていない場合にエラーを返す
  test('過去案件データが統一形式に整備されていない場合、データフォーマットエラーを返す', () => {
    const inconsistentDateFormatsData = [
      {
        project_id: 'P001',
        project_date: '2023-01-15',
        amount: 1000000,
        currency: 'JPY',
      },
      {
        project_id: 'P002',
        project_date: '15/01/2023',
        amount: 1200000,
        currency: 'JPY',
      },
      {
        project_id: 'P003',
        project_date: '2023年01月15日',
        amount: 950000,
        currency: 'JPY',
      },
    ];

    expect(() => {
      calculatePriceAdjustmentCoefficient(inconsistentDateFormatsData);
    }).toThrow(/データフォーマット/);
  });

  test('通貨単位が統一されていない過去案件データでエラーを返す', () => {
    const inconsistentCurrencyData = [
      {
        project_id: 'P001',
        project_date: '2023-01-15',
        amount: 1000000,
        currency: 'JPY',
      },
      {
        project_id: 'P002',
        project_date: '2023-02-20',
        amount: 1200000,
        currency: '円',
      },
      {
        project_id: 'P003',
        project_date: '2023-03-10',
        amount: 950000,
        currency: '¥',
      },
    ];

    expect(() => {
      calculatePriceAdjustmentCoefficient(inconsistentCurrencyData);
    }).toThrow(/通貨単位/);
  });

  test('数値形式が統一されていない過去案件データでエラーを返す', () => {
    const inconsistentNumberFormatsData = [
      {
        project_id: 'P001',
        project_date: '2023-01-15',
        amount: 1000000,
        currency: 'JPY',
      },
      {
        project_id: 'P002',
        project_date: '2023-02-20',
        amount: 1200000.5,
        currency: 'JPY',
      },
      {
        project_id: 'P003',
        project_date: '2023-03-10',
        amount: 950000.12,
        currency: 'JPY',
      },
    ];

    expect(() => {
      calculatePriceAdjustmentCoefficient(inconsistentNumberFormatsData);
    }).toThrow(/数値形式/);
  });

  test('複数の形式不統一を含む過去案件データでエラーを返す', () => {
    const multipleInconsistenciesData = [
      {
        project_id: 'P001',
        project_date: '2023-01-15',
        amount: 1000000,
        currency: 'JPY',
      },
      {
        project_id: 'P002',
        project_date: '20/02/2023',
        amount: 1200000.5,
        currency: '円',
      },
      {
        project_id: 'P003',
        project_date: '2023年03月10日',
        amount: 950000.15,
        currency: '¥',
      },
    ];

    expect(() => {
      calculatePriceAdjustmentCoefficient(multipleInconsistenciesData);
    }).toThrow(/整備/);
  });

  test('統一形式に整備された過去案件データの場合、正常に処理される', () => {
    const consistentFormattedData = [
      {
        project_id: 'P001',
        project_date: '2023-01-15',
        amount: 1000000,
        currency: 'JPY',
      },
      {
        project_id: 'P002',
        project_date: '2023-02-20',
        amount: 1200000,
        currency: 'JPY',
      },
      {
        project_id: 'P003',
        project_date: '2023-03-10',
        amount: 950000,
        currency: 'JPY',
      },
    ];

    const result = calculatePriceAdjustmentCoefficient(consistentFormattedData);
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThan(0);
  });

  test('空の過去案件データでエラーを返す', () => {
    const emptyData: unknown[] = [];

    expect(() => {
      calculatePriceAdjustmentCoefficient(emptyData);
    }).toThrow(/データ/);
  });

  test('必須フィールドが不足している過去案件データでエラーを返す', () => {
    const missingFieldsData = [
      {
        project_id: 'P001',
        amount: 1000000,
      },
      {
        project_id: 'P002',
        project_date: '2023-02-20',
      },
    ];

    expect(() => {
      calculatePriceAdjustmentCoefficient(missingFieldsData);
    }).toThrow(/フィールド/);
  });
});