import { determineGuideCustomizationLevel } from '../../src/logic/it-6-2-2-1';

describe('導入ガイドカスタマイズ提案機能 - ガイド記載レベル自動判定', () => {
  test('SCEN-1563: 対象部署の業務複雑度と学習データ量に基づいてガイド記載レベルが自動判定される', () => {
    // ========== Test Case 1: 低複雑度 × 大量データ → 初級レベル期待 ==========
    const result_low_complexity_high_data = determineGuideCustomizationLevel({
      department_id: 'DEPT_001',
      department_name: 'Accounting Department',
      business_complexity_level: 1,
      learning_data_volume: 5000,
      historical_accuracy: 85.5,
    });
    expect(result_low_complexity_high_data.guide_level).toBe('初級');
    expect(result_low_complexity_high_data.estimated_implementation_days).toBe(14);

    // ========== Test Case 2: 中複雑度 × 中程度データ → 中級レベル期待 ==========
    const result_mid_complexity_mid_data = determineGuideCustomizationLevel({
      department_id: 'DEPT_002',
      department_name: 'Sales Division',
      business_complexity_level: 2,
      learning_data_volume: 2500,
      historical_accuracy: 78.0,
    });
    expect(result_mid_complexity_mid_data.guide_level).toBe('中級');
    expect(result_mid_complexity_mid_data.estimated_implementation_days).toBe(21);

    // ========== Test Case 3: 高複雑度 × 少量データ → 上級レベル期待 ==========
    const result_high_complexity_low_data = determineGuideCustomizationLevel({
      department_id: 'DEPT_003',
      department_name: 'Construction Management',
      business_complexity_level: 3,
      learning_data_volume: 800,
      historical_accuracy: 65.0,
    });
    expect(result_high_complexity_low_data.guide_level).toBe('上級');
    expect(result_high_complexity_low_data.estimated_implementation_days).toBe(35);

    // ========== Test Case 4: 境界値テスト - 複雑度と学習データ量の閾値付近 ==========
    // 複雑度1 × データ量5000（初級判定の上限境界）
    const result_boundary_1 = determineGuideCustomizationLevel({
      department_id: 'DEPT_004',
      department_name: 'Test Department 1',
      business_complexity_level: 1,
      learning_data_volume: 4999,
      historical_accuracy: 82.0,
    });
    expect(result_boundary_1.guide_level).toBe('初級');
    expect(result_boundary_1.estimated_implementation_days).toBe(14);

    // 複雑度2 × データ量3000（中級判定の下限境界）
    const result_boundary_2 = determineGuideCustomizationLevel({
      department_id: 'DEPT_005',
      department_name: 'Test Department 2',
      business_complexity_level: 2,
      learning_data_volume: 3000,
      historical_accuracy: 75.5,
    });
    expect(result_boundary_2.guide_level).toBe('中級');
    expect(result_boundary_2.estimated_implementation_days).toBe(21);

    // 複雑度3 × データ量1200（上級判定の上限境界）
    const result_boundary_3 = determineGuideCustomizationLevel({
      department_id: 'DEPT_006',
      department_name: 'Test Department 3',
      business_complexity_level: 3,
      learning_data_volume: 1201,
      historical_accuracy: 70.0,
    });
    expect(result_boundary_3.guide_level).toBe('上級');
    expect(result_boundary_3.estimated_implementation_days).toBe(35);

    // ========== Test Case 5: 一貫性テスト - 同じ入力で複数回実行 ==========
    const consistency_input = {
      department_id: 'DEPT_007',
      department_name: 'Consistency Test Dept',
      business_complexity_level: 2,
      learning_data_volume: 2500,
      historical_accuracy: 78.0,
    };
    const result_consistency_1 = determineGuideCustomizationLevel(consistency_input);
    const result_consistency_2 = determineGuideCustomizationLevel(consistency_input);
    const result_consistency_3 = determineGuideCustomizationLevel(consistency_input);

    expect(result_consistency_1.guide_level).toBe(result_consistency_2.guide_level);
    expect(result_consistency_2.guide_level).toBe(result_consistency_3.guide_level);
    expect(result_consistency_1.estimated_implementation_days).toBe(
      result_consistency_2.estimated_implementation_days,
    );
    expect(result_consistency_2.estimated_implementation_days).toBe(
      result_consistency_3.estimated_implementation_days,
    );

    // ========== Test Case 6: 複数部署パターンでの判定結果一貫性 ==========
    const departments_with_same_complexity = [
      {
        department_id: 'DEPT_008',
        department_name: 'Finance Dept 1',
        business_complexity_level: 1,
        learning_data_volume: 4500,
        historical_accuracy: 84.0,
      },
      {
        department_id: 'DEPT_009',
        department_name: 'Finance Dept 2',
        business_complexity_level: 1,
        learning_data_volume: 4800,
        historical_accuracy: 86.0,
      },
    ];

    const result_dept_8 = determineGuideCustomizationLevel(
      departments_with_same_complexity[0],
    );
    const result_dept_9 = determineGuideCustomizationLevel(
      departments_with_same_complexity[1],
    );

    expect(result_dept_8.guide_level).toBe('初級');
    expect(result_dept_9.guide_level).toBe('初級');
    expect(result_dept_8.guide_level).toBe(result_dept_9.guide_level);

    // ========== Test Case 7: エラーハンドリング - 無効な複雑度レベル ==========
    expect(() =>
      determineGuideCustomizationLevel({
        department_id: 'DEPT_010',
        department_name: 'Invalid Dept',
        business_complexity_level: 4,
        learning_data_volume: 2000,
        historical_accuracy: 75.0,
      }),
    ).toThrow(/複雑度/);

    // ========== Test Case 8: エラーハンドリング - 負のデータ量 ==========
    expect(() =>
      determineGuideCustomizationLevel({
        department_id: 'DEPT_011',
        department_name: 'Invalid Data Dept',
        business_complexity_level: 2,
        learning_data_volume: -100,
        historical_accuracy: 75.0,
      }),
    ).toThrow(/データ量/);

    // ========== Test Case 9: エラーハンドリング - 無効な正確度 ==========
    expect(() =>
      determineGuideCustomizationLevel({
        department_id: 'DEPT_012',
        department_name: 'Invalid Accuracy Dept',
        business_complexity_level: 2,
        learning_data_volume: 2500,
        historical_accuracy: 101.5,
      }),
    ).toThrow(/精度/);

    // ========== Test Case 10: 複雑度×データ量の異なる組み合わせ検証 ==========
    // 複雑度1 × 少量データ
    const result_complex1_low_data = determineGuideCustomizationLevel({
      department_id: 'DEPT_013',
      department_name: 'Test Combination 1',
      business_complexity_level: 1,
      learning_data_volume: 1000,
      historical_accuracy: 80.0,
    });
    expect(result_complex1_low_data.guide_level).toBe('初級');

    // 複雑度3 × 大量データ
    const result_complex3_high_data = determineGuideCustomizationLevel({
      department_id: 'DEPT_014',
      department_name: 'Test Combination 2',
      business_complexity_level: 3,
      learning_data_volume: 4500,
      historical_accuracy: 72.0,
    });
    expect(result_complex3_high_data.guide_level).toBe('上級');
    expect(result_complex3_high_data.estimated_implementation_days).toBe(35);

    // ========== Test Case 11: 推定実装日数の正確性 ==========
    const result_implementation_test = determineGuideCustomizationLevel({
      department_id: 'DEPT_015',
      department_name: 'Implementation Test',
      business_complexity_level: 2,
      learning_data_volume: 2500,
      historical_accuracy: 78.0,
    });
    expect(result_implementation_test.estimated_implementation_days).toBe(21);
    expect(typeof result_implementation_test.estimated_implementation_days).toBe('number');

    // ========== Test Case 12: レスポンス構造の完全性確認 ==========
    const result_structure_test = determineGuideCustomizationLevel({
      department_id: 'DEPT_016',
      department_name: 'Structure Test',
      business_complexity_level: 2,
      learning_data_volume: 2500,
      historical_accuracy: 78.0,
    });
    expect(result_structure_test).toHaveProperty('department_id');
    expect(result_structure_test).toHaveProperty('guide_level');
    expect(result_structure_test).toHaveProperty('estimated_implementation_days');
    expect(result_structure_test).toHaveProperty('customization_scope');
    expect(result_structure_test.department_id).toBe('DEPT_016');
  });
});