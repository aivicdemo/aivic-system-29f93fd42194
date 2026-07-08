import { aggregateDiagnosticAccuracyByAssessor } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1467: [error] 学習データ偏り診断機能 - 診断に必要な基礎データが破損または不整合の場合、エラーを返す
  test('should return error when diagnostic base data is corrupted or inconsistent', () => {
    // ハッピーパス: 正常なデータセット
    const valid_dataset = {
      assessor_id: 'A001',
      assessment_results: [
        {
          estimate_id: 'E001',
          divergence_rate: 5.2,
          work_type: '土木工事',
          amount_band: '500万～1000万',
          assessment_date: '2024-01-15',
        },
        {
          estimate_id: 'E002',
          divergence_rate: 3.8,
          work_type: '土木工事',
          amount_band: '500万～1000万',
          assessment_date: '2024-01-16',
        },
      ],
      feature_info: {
        work_type_count: 1,
        amount_band_count: 1,
        assessment_count: 2,
      },
      label_info: {
        correct_count: 2,
        incorrect_count: 0,
      },
    };

    const valid_result = aggregateDiagnosticAccuracyByAssessor(valid_dataset);
    expect(valid_result).toHaveProperty('assessor_id', 'A001');
    expect(valid_result).toHaveProperty('accuracy_by_assessor');
    expect(valid_result).toHaveProperty('accuracy_by_work_type');
    expect(valid_result).toHaveProperty('accuracy_by_amount_band');
    expect(typeof valid_result.accuracy_by_assessor).toBe('number');

    // エラーケース1: 破損したデータセット - assessment_results が空配列
    const corrupted_empty_results = {
      assessor_id: 'A002',
      assessment_results: [],
      feature_info: {
        work_type_count: 0,
        amount_band_count: 0,
        assessment_count: 0,
      },
      label_info: {
        correct_count: 0,
        incorrect_count: 0,
      },
    };

    expect(() =>
      aggregateDiagnosticAccuracyByAssessor(corrupted_empty_results)
    ).toThrow(/評価結果/);

    // エラーケース2: スキーマ不一致 - assessment_results 内のオブジェクトに必須フィールド divergence_rate が欠落
    const corrupted_schema_mismatch = {
      assessor_id: 'A003',
      assessment_results: [
        {
          estimate_id: 'E003',
          // divergence_rate が欠落
          work_type: '建築工事',
          amount_band: '1000万～5000万',
          assessment_date: '2024-01-17',
        },
      ],
      feature_info: {
        work_type_count: 1,
        amount_band_count: 1,
        assessment_count: 1,
      },
      label_info: {
        correct_count: 1,
        incorrect_count: 0,
      },
    };

    expect(() =>
      aggregateDiagnosticAccuracyByAssessor(corrupted_schema_mismatch)
    ).toThrow(/乖離率/);

    // エラーケース3: 型の不整合 - divergence_rate が文字列型で数値型ではない
    const corrupted_type_mismatch = {
      assessor_id: 'A004',
      assessment_results: [
        {
          estimate_id: 'E004',
          divergence_rate: '5.2' as any,
          work_type: '建築工事',
          amount_band: '1000万～5000万',
          assessment_date: '2024-01-18',
        },
      ],
      feature_info: {
        work_type_count: 1,
        amount_band_count: 1,
        assessment_count: 1,
      },
      label_info: {
        correct_count: 1,
        incorrect_count: 0,
      },
    };

    expect(() =>
      aggregateDiagnosticAccuracyByAssessor(corrupted_type_mismatch)
    ).toThrow(/型/);

    // エラーケース4: feature_info の不整合 - assessment_count が実際の assessment_results 件数と不一致
    const corrupted_feature_mismatch = {
      assessor_id: 'A005',
      assessment_results: [
        {
          estimate_id: 'E005',
          divergence_rate: 4.1,
          work_type: '土木工事',
          amount_band: '2000万～5000万',
          assessment_date: '2024-01-19',
        },
        {
          estimate_id: 'E006',
          divergence_rate: 6.3,
          work_type: '土木工事',
          amount_band: '2000万～5000万',
          assessment_date: '2024-01-20',
        },
      ],
      feature_info: {
        work_type_count: 1,
        amount_band_count: 1,
        assessment_count: 5, // 実際は 2 件だが 5 と記載
      },
      label_info: {
        correct_count: 2,
        incorrect_count: 0,
      },
    };

    expect(() =>
      aggregateDiagnosticAccuracyByAssessor(corrupted_feature_mismatch)
    ).toThrow(/整合/);

    // エラーケース5: label_info の不整合 - correct_count + incorrect_count が assessment_count と不一致
    const corrupted_label_mismatch = {
      assessor_id: 'A006',
      assessment_results: [
        {
          estimate_id: 'E007',
          divergence_rate: 3.5,
          work_type: '設備工事',
          amount_band: '100万～500万',
          assessment_date: '2024-01-21',
        },
      ],
      feature_info: {
        work_type_count: 1,
        amount_band_count: 1,
        assessment_count: 1,
      },
      label_info: {
        correct_count: 2, // 合計が 3 になるが assessment_count は 1
        incorrect_count: 1,
      },
    };

    expect(() =>
      aggregateDiagnosticAccuracyByAssessor(corrupted_label_mismatch)
    ).toThrow(/ラベル/);

    // エラーケース6: assessor_id が null または undefined
    const corrupted_missing_assessor_id = {
      assessor_id: null as any,
      assessment_results: [
        {
          estimate_id: 'E008',
          divergence_rate: 2.9,
          work_type: '土木工事',
          amount_band: '500万～1000万',
          assessment_date: '2024-01-22',
        },
      ],
      feature_info: {
        work_type_count: 1,
        amount_band_count: 1,
        assessment_count: 1,
      },
      label_info: {
        correct_count: 1,
        incorrect_count: 0,
      },
    };

    expect(() =>
      aggregateDiagnosticAccuracyByAssessor(corrupted_missing_assessor_id)
    ).toThrow(/査定員/);

    // エラーケース7: 過度な欠損値 - assessment_results 内に複数の null フィールドが存在
    const corrupted_excessive_missing_values = {
      assessor_id: 'A007',
      assessment_results: [
        {
          estimate_id: 'E009',
          divergence_rate: 7.2,
          work_type: null as any,
          amount_band: null as any,
          assessment_date: '2024-01-23',
        },
        {
          estimate_id: 'E010',
          divergence_rate: 5.5,
          work_type: '建築工事',
          amount_band: undefined as any,
          assessment_date: '2024-01-24',
        },
      ],
      feature_info: {
        work_type_count: 1,
        amount_band_count: 1,
        assessment_count: 2,
      },
      label_info: {
        correct_count: 1,
        incorrect_count: 1,
      },
    };

    expect(() =>
      aggregateDiagnosticAccuracyByAssessor(corrupted_excessive_missing_values)
    ).toThrow(/欠損/);
  });
});