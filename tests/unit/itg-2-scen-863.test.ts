import { classifyDivergencePattern } from '../../src/logic/it-6-2-2-1';

describe('相場乖離パターン自動分類機能', () => {
  test('SCEN-863: 地域・工種・金額帯のいずれかがマスタに存在しない場合にエラーを返却する', () => {
    // マスタデータ準備
    const regionMaster = [
      { region_code: 'R001', region_name: '東京都' },
      { region_code: 'R002', region_name: '大阪府' },
      { region_code: 'R003', region_name: '愛知県' },
    ];

    const constructionTypeMaster = [
      { construction_type_code: 'C001', construction_type_name: '土木工事' },
      { construction_type_code: 'C002', construction_type_name: '建築工事' },
      { construction_type_code: 'C003', construction_type_name: '設備工事' },
    ];

    const amountRangeMaster = [
      { amount_range_code: 'A001', min_amount: 0, max_amount: 1000000 },
      { amount_range_code: 'A002', min_amount: 1000001, max_amount: 5000000 },
      { amount_range_code: 'A003', min_amount: 5000001, max_amount: 100000000 },
    ];

    // テスト1: 地域がマスタに存在しない場合
    const regionMasterWithoutR002 = [
      { region_code: 'R001', region_name: '東京都' },
      { region_code: 'R003', region_name: '愛知県' },
    ];

    const assessmentDataWithMissingRegion = {
      assessment_id: 'ASS001',
      region_code: 'R002',
      construction_type_code: 'C001',
      amount: 2500000,
      divergence_rate: 15.5,
      divergence_amount: 375000,
      reference_data_count: 12,
      base_price_source: '物価本V2.1',
      correction_coefficient: 1.05,
    };

    const resultRegionError = classifyDivergencePattern(
      assessmentDataWithMissingRegion,
      regionMasterWithoutR002,
      constructionTypeMaster,
      amountRangeMaster
    );

    expect(resultRegionError).toEqual({
      success: false,
      error_code: 'MASTER_NOT_FOUND',
      error_message: '地域R002がマスタに存在しません',
      missing_parameter_type: '地域',
      missing_parameter_value: 'R002',
    });

    // テスト2: 工種がマスタに存在しない場合（同じエラー条件下での再実行で一貫性確認）
    const constructionTypeMasterWithoutC002 = [
      { construction_type_code: 'C001', construction_type_name: '土木工事' },
      { construction_type_code: 'C003', construction_type_name: '設備工事' },
    ];

    const assessmentDataWithMissingConstructionType = {
      assessment_id: 'ASS002',
      region_code: 'R001',
      construction_type_code: 'C002',
      amount: 3000000,
      divergence_rate: 22.3,
      divergence_amount: 669000,
      reference_data_count: 8,
      base_price_source: '物価本V2.1',
      correction_coefficient: 1.02,
    };

    const resultConstructionTypeError = classifyDivergencePattern(
      assessmentDataWithMissingConstructionType,
      regionMaster,
      constructionTypeMasterWithoutC002,
      amountRangeMaster
    );

    expect(resultConstructionTypeError).toEqual({
      success: false,
      error_code: 'MASTER_NOT_FOUND',
      error_message: '工種C002がマスタに存在しません',
      missing_parameter_type: '工種',
      missing_parameter_value: 'C002',
    });

    // テスト3: 金額帯がマスタに存在しない場合
    const amountRangeMasterWithoutA002 = [
      { amount_range_code: 'A001', min_amount: 0, max_amount: 1000000 },
      { amount_range_code: 'A003', min_amount: 5000001, max_amount: 100000000 },
    ];

    const assessmentDataWithMissingAmountRange = {
      assessment_id: 'ASS003',
      region_code: 'R002',
      construction_type_code: 'C001',
      amount: 2500000,
      divergence_rate: 18.7,
      divergence_amount: 467500,
      reference_data_count: 10,
      base_price_source: '物価本V2.1',
      correction_coefficient: 1.03,
    };

    const resultAmountRangeError = classifyDivergencePattern(
      assessmentDataWithMissingAmountRange,
      regionMaster,
      constructionTypeMaster,
      amountRangeMasterWithoutA002
    );

    expect(resultAmountRangeError).toEqual({
      success: false,
      error_code: 'MASTER_NOT_FOUND',
      error_message: '金額帯A002がマスタに存在しません',
      missing_parameter_type: '金額帯',
      missing_parameter_value: 'A002',
    });

    // テスト4: 同じ地域エラー条件での再実行で一貫性確認
    const resultRegionErrorRetry = classifyDivergencePattern(
      assessmentDataWithMissingRegion,
      regionMasterWithoutR002,
      constructionTypeMaster,
      amountRangeMaster
    );

    expect(resultRegionErrorRetry).toEqual({
      success: false,
      error_code: 'MASTER_NOT_FOUND',
      error_message: '地域R002がマスタに存在しません',
      missing_parameter_type: '地域',
      missing_parameter_value: 'R002',
    });

    // テスト5: 複数パラメータの妥当性を確認した正常系（マスタに全て存在）
    const assessmentDataValid = {
      assessment_id: 'ASS004',
      region_code: 'R001',
      construction_type_code: 'C001',
      amount: 2500000,
      divergence_rate: 15.5,
      divergence_amount: 375000,
      reference_data_count: 12,
      base_price_source: '物価本V2.1',
      correction_coefficient: 1.05,
    };

    const resultSuccess = classifyDivergencePattern(
      assessmentDataValid,
      regionMaster,
      constructionTypeMaster,
      amountRangeMaster
    );

    expect(resultSuccess).toEqual({
      success: true,
      assessment_id: 'ASS004',
      region_code: 'R001',
      construction_type_code: 'C001',
      amount_range_code: 'A002',
      divergence_pattern: '過大',
      divergence_rate: 15.5,
      divergence_amount: 375000,
      pattern_classification: 'HIGH_DIVERGENCE',
      classification_timestamp: expect.any(String),
    });
  });
});