import { describe, test, expect } from '@jest/globals';
import { generateSalesDataProcedureManual } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  // SCEN-1079: [error] 営業データ集計標準手順書生成機能 - 営業データメタデータが定義されていない項目に対してエラーが返される
  test('メタデータ未定義の項目を含むデータセットで標準手順書生成を実行するとエラーが返される', () => {
    const dataset_with_undefined_metadata = {
      fields: [
        {
          field_name: 'appointment_count',
          unit: '件',
          data_type: 'number',
          calculation_formula: 'COUNT(appointment_records)',
          report_mapping: 'monthly_summary.appointments'
        },
        {
          field_name: 'undefined_metric',
          unit: null,
          data_type: null,
          calculation_formula: null,
          report_mapping: null
        },
        {
          field_name: 'contract_count',
          unit: '件',
          data_type: 'number',
          calculation_formula: 'COUNT(contract_records)',
          report_mapping: 'monthly_summary.contracts'
        }
      ],
      target_period_start: '2024-01-01',
      target_period_end: '2024-01-31'
    };

    expect(() =>
      generateSalesDataProcedureManual(dataset_with_undefined_metadata)
    ).toThrow(/メタデータ/);
  });
});