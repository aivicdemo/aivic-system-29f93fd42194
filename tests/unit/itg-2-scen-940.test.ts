import { validateIntegrityOfCriteriaAndLearningData } from '../../src/logic/it-6-2-2-1';

describe('判定基準・学習データ整合性検証機能', () => {
  // SCEN-940
  test('新規見積書処理前に判定基準と学習データの整合性が正常に検証される', () => {
    const currentCriteriaVersion = 'v2.1';
    const learningDataVersion = 'v2.1';
    const evaluationItems = ['工種別補正', '地域別補正', '金額帯別補正', '季節別補正'];
    const learningDataItems = ['工種別補正', '地域別補正', '金額帯別補正', '季節別補正'];
    const criteriaParamRanges = {
      '工種別補正': { min: 0.8, max: 1.2 },
      '地域別補正': { min: 0.9, max: 1.1 },
      '金額帯別補正': { min: 0.85, max: 1.15 },
      '季節別補正': { min: 0.95, max: 1.05 },
    };
    const learningDataParams = {
      '工種別補正': 1.0,
      '地域別補正': 0.95,
      '金額帯別補正': 1.05,
      '季節別補正': 1.0,
    };

    const result = validateIntegrityOfCriteriaAndLearningData({
      currentCriteriaVersion,
      learningDataVersion,
      evaluationItems,
      learningDataItems,
      criteriaParamRanges,
      learningDataParams,
    });

    // 条件(1): バージョン一致検証が成功する
    expect(result.versionMatchCheck).toBe(true);

    // 条件(2): 全評価項目が学習データに存在する
    expect(result.allEvaluationItemsExist).toBe(true);

    // 条件(3): パラメータが定義範囲内である
    expect(result.paramsWithinRange).toBe(true);

    // 条件(4): 整合性検証ステータスが「OK」と表示される
    expect(result.integrationCheckStatus).toBe('OK');

    // 条件(5): 検証ログに警告やエラーが記録されない
    expect(result.validationLogs).toEqual([]);

    // 条件(6): 新規見積書の処理が正常に進行できる状態
    expect(result.canProcessNewEstimate).toBe(true);

    // 整体的な整合性検証結果の検証
    expect(result).toEqual({
      versionMatchCheck: true,
      allEvaluationItemsExist: true,
      paramsWithinRange: true,
      integrationCheckStatus: 'OK',
      validationLogs: [],
      canProcessNewEstimate: true,
    });
  });

  // 境界値・エラーケース: バージョン不一致
  test('判定基準バージョンと学習データバージョンが異なる場合、ステータスが警告に変わる', () => {
    const currentCriteriaVersion = 'v2.1';
    const learningDataVersion = 'v2.0';
    const evaluationItems = ['工種別補正', '地域別補正'];
    const learningDataItems = ['工種別補正', '地域別補正'];
    const criteriaParamRanges = {
      '工種別補正': { min: 0.8, max: 1.2 },
      '地域別補正': { min: 0.9, max: 1.1 },
    };
    const learningDataParams = {
      '工種別補正': 1.0,
      '地域別補正': 0.95,
    };

    const result = validateIntegrityOfCriteriaAndLearningData({
      currentCriteriaVersion,
      learningDataVersion,
      evaluationItems,
      learningDataItems,
      criteriaParamRanges,
      learningDataParams,
    });

    expect(result.versionMatchCheck).toBe(false);
    expect(result.integrationCheckStatus).toBe('WARNING');
    expect(result.canProcessNewEstimate).toBe(false);
    expect(result.validationLogs.length).toBeGreaterThan(0);
    expect(result.validationLogs[0]).toMatch(/バージョン/);
  });

  // 境界値・エラーケース: 評価項目不足
  test('学習データに必要な評価項目が欠落している場合、エラーが記録される', () => {
    const currentCriteriaVersion = 'v2.1';
    const learningDataVersion = 'v2.1';
    const evaluationItems = ['工種別補正', '地域別補正', '金額帯別補正'];
    const learningDataItems = ['工種別補正', '地域別補正'];
    const criteriaParamRanges = {
      '工種別補正': { min: 0.8, max: 1.2 },
      '地域別補正': { min: 0.9, max: 1.1 },
      '金額帯別補正': { min: 0.85, max: 1.15 },
    };
    const learningDataParams = {
      '工種別補正': 1.0,
      '地域別補正': 0.95,
    };

    const result = validateIntegrityOfCriteriaAndLearningData({
      currentCriteriaVersion,
      learningDataVersion,
      evaluationItems,
      learningDataItems,
      criteriaParamRanges,
      learningDataParams,
    });

    expect(result.allEvaluationItemsExist).toBe(false);
    expect(result.integrationCheckStatus).toBe('ERROR');
    expect(result.canProcessNewEstimate).toBe(false);
    expect(result.validationLogs.length).toBeGreaterThan(0);
    expect(result.validationLogs[0]).toMatch(/項目/);
  });

  // 境界値・エラーケース: パラメータが範囲外
  test('学習データパラメータが判定基準の定義範囲外の場合、エラーが記録される', () => {
    const currentCriteriaVersion = 'v2.1';
    const learningDataVersion = 'v2.1';
    const evaluationItems = ['工種別補正', '地域別補正'];
    const learningDataItems = ['工種別補正', '地域別補正'];
    const criteriaParamRanges = {
      '工種別補正': { min: 0.8, max: 1.2 },
      '地域別補正': { min: 0.9, max: 1.1 },
    };
    const learningDataParams = {
      '工種別補正': 1.5,
      '地域別補正': 0.95,
    };

    const result = validateIntegrityOfCriteriaAndLearningData({
      currentCriteriaVersion,
      learningDataVersion,
      evaluationItems,
      learningDataItems,
      criteriaParamRanges,
      learningDataParams,
    });

    expect(result.paramsWithinRange).toBe(false);
    expect(result.integrationCheckStatus).toBe('ERROR');
    expect(result.canProcessNewEstimate).toBe(false);
    expect(result.validationLogs.length).toBeGreaterThan(0);
    expect(result.validationLogs[0]).toMatch(/範囲/);
  });

  // 境界値・エラーケース: 複数の不整合
  test('バージョン不一致と評価項目不足が同時に発生した場合、複数のエラーが記録される', () => {
    const currentCriteriaVersion = 'v2.2';
    const learningDataVersion = 'v2.1';
    const evaluationItems = ['工種別補正', '地域別補正', '金額帯別補正'];
    const learningDataItems = ['工種別補正', '地域別補正'];
    const criteriaParamRanges = {
      '工種別補正': { min: 0.8, max: 1.2 },
      '地域別補正': { min: 0.9, max: 1.1 },
      '金額帯別補正': { min: 0.85, max: 1.15 },
    };
    const learningDataParams = {
      '工種別補正': 1.0,
      '地域別補正': 0.95,
    };

    const result = validateIntegrityOfCriteriaAndLearningData({
      currentCriteriaVersion,
      learningDataVersion,
      evaluationItems,
      learningDataItems,
      criteriaParamRanges,
      learningDataParams,
    });

    expect(result.versionMatchCheck).toBe(false);
    expect(result.allEvaluationItemsExist).toBe(false);
    expect(result.integrationCheckStatus).toBe('ERROR');
    expect(result.canProcessNewEstimate).toBe(false);
    expect(result.validationLogs.length).toBe(2);
  });

  // 境界値: パラメータが範囲の下限に等しい
  test('学習データパラメータが判定基準の下限値と等しい場合、OK と判定される', () => {
    const currentCriteriaVersion = 'v2.1';
    const learningDataVersion = 'v2.1';
    const evaluationItems = ['工種別補正'];
    const learningDataItems = ['工種別補正'];
    const criteriaParamRanges = {
      '工種別補正': { min: 0.8, max: 1.2 },
    };
    const learningDataParams = {
      '工種別補正': 0.8,
    };

    const result = validateIntegrityOfCriteriaAndLearningData({
      currentCriteriaVersion,
      learningDataVersion,
      evaluationItems,
      learningDataItems,
      criteriaParamRanges,
      learningDataParams,
    });

    expect(result.paramsWithinRange).toBe(true);
    expect(result.integrationCheckStatus).toBe('OK');
    expect(result.canProcessNewEstimate).toBe(true);
  });

  // 境界値: パラメータが範囲の上限に等しい
  test('学習データパラメータが判定基準の上限値と等しい場合、OK と判定される', () => {
    const currentCriteriaVersion = 'v2.1';
    const learningDataVersion = 'v2.1';
    const evaluationItems = ['工種別補正'];
    const learningDataItems = ['工種別補正'];
    const criteriaParamRanges = {
      '工種別補正': { min: 0.8, max: 1.2 },
    };
    const learningDataParams = {
      '工種別補正': 1.2,
    };

    const result = validateIntegrityOfCriteriaAndLearningData({
      currentCriteriaVersion,
      learningDataVersion,
      evaluationItems,
      learningDataItems,
      criteriaParamRanges,
      learningDataParams,
    });

    expect(result.paramsWithinRange).toBe(true);
    expect(result.integrationCheckStatus).toBe('OK');
    expect(result.canProcessNewEstimate).toBe(true);
  });
});