import { reflectImprovementDataToDashboard } from '../../src/logic/it-6-2-1-1';

describe('改善対策実行状況と効果測定データの経営ダッシュボード反映', () => {
  // SCEN-1252: [error] 改善対策実行状況と効果測定データの経営ダッシュボード反映機能 - 改善対策の実行状況データが不完全または欠落している場合、エラーログを出力し反映を中止する
  test('必須フィールド欠落時にエラーログ出力且つダッシュボード反映中止', () => {
    const incomplete_data = {
      measure_id: 'IMP-20240601-001',
      execution_date: null,
      completion_rate: 85,
      before_accuracy: 72,
      after_accuracy: 79,
      improvement_degree: 7,
      reflected_dashboard_flag: false,
    };

    expect(() => {
      reflectImprovementDataToDashboard(incomplete_data);
    }).toThrow(/実行日/);
  });

  test('必須フィールド欠落時にエラーログ出力且つダッシュボード反映中止 - 完了率null', () => {
    const incomplete_data = {
      measure_id: 'IMP-20240601-001',
      execution_date: '2024-06-01T10:30:00Z',
      completion_rate: null,
      before_accuracy: 72,
      after_accuracy: 79,
      improvement_degree: 7,
      reflected_dashboard_flag: false,
    };

    expect(() => {
      reflectImprovementDataToDashboard(incomplete_data);
    }).toThrow(/完了率/);
  });

  test('必須フィールド欠落時にエラーログ出力且つダッシュボード反映中止 - 対策IDなし', () => {
    const incomplete_data = {
      measure_id: '',
      execution_date: '2024-06-01T10:30:00Z',
      completion_rate: 85,
      before_accuracy: 72,
      after_accuracy: 79,
      improvement_degree: 7,
      reflected_dashboard_flag: false,
    };

    expect(() => {
      reflectImprovementDataToDashboard(incomplete_data);
    }).toThrow(/対策ID/);
  });

  test('完全なデータで正常にダッシュボード反映', () => {
    const complete_data = {
      measure_id: 'IMP-20240601-001',
      execution_date: '2024-06-01T10:30:00Z',
      completion_rate: 85,
      before_accuracy: 72.5,
      after_accuracy: 79.8,
      improvement_degree: 7.3,
      reflected_dashboard_flag: false,
    };

    const result = reflectImprovementDataToDashboard(complete_data);

    expect(result).toEqual({
      measure_id: 'IMP-20240601-001',
      execution_date: '2024-06-01T10:30:00Z',
      completion_rate: 85,
      before_accuracy: 72.5,
      after_accuracy: 79.8,
      improvement_degree: 7.3,
      reflected_dashboard_flag: true,
      reflection_timestamp: '2024-06-01T10:30:00Z',
      error_log: null,
    });
  });

  test('複数の必須フィールド欠落時、最初に検出されたフィールド名でエラー', () => {
    const incomplete_data = {
      measure_id: '',
      execution_date: null,
      completion_rate: null,
      before_accuracy: 72,
      after_accuracy: 79,
      improvement_degree: 7,
      reflected_dashboard_flag: false,
    };

    expect(() => {
      reflectImprovementDataToDashboard(incomplete_data);
    }).toThrow(/対策ID/);
  });

  test('数値型フィールドが不正な型の場合エラー', () => {
    const invalid_data = {
      measure_id: 'IMP-20240601-001',
      execution_date: '2024-06-01T10:30:00Z',
      completion_rate: '85',
      before_accuracy: 72,
      after_accuracy: 79,
      improvement_degree: 7,
      reflected_dashboard_flag: false,
    };

    expect(() => {
      reflectImprovementDataToDashboard(invalid_data);
    }).toThrow(/完了率/);
  });

  test('改善度が負の値の場合エラー', () => {
    const invalid_data = {
      measure_id: 'IMP-20240601-001',
      execution_date: '2024-06-01T10:30:00Z',
      completion_rate: 85,
      before_accuracy: 72,
      after_accuracy: 65,
      improvement_degree: -7,
      reflected_dashboard_flag: false,
    };

    expect(() => {
      reflectImprovementDataToDashboard(invalid_data);
    }).toThrow(/改善度/);
  });

  test('完了率が0～100範囲外の場合エラー', () => {
    const invalid_data = {
      measure_id: 'IMP-20240601-001',
      execution_date: '2024-06-01T10:30:00Z',
      completion_rate: 105,
      before_accuracy: 72,
      after_accuracy: 79,
      improvement_degree: 7,
      reflected_dashboard_flag: false,
    };

    expect(() => {
      reflectImprovementDataToDashboard(invalid_data);
    }).toThrow(/完了率/);
  });

  test('実行日がISO形式でない場合エラー', () => {
    const invalid_data = {
      measure_id: 'IMP-20240601-001',
      execution_date: '2024/06/01 10:30',
      completion_rate: 85,
      before_accuracy: 72,
      after_accuracy: 79,
      improvement_degree: 7,
      reflected_dashboard_flag: false,
    };

    expect(() => {
      reflectImprovementDataToDashboard(invalid_data);
    }).toThrow(/実行日/);
  });
});