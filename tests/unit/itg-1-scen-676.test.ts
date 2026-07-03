import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  generateReportWithMetadata,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ一元管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-676
  it('レポート生成時にメタデータに基づき正確なデータマッピングが行われること', () => {
    // 前提: メタデータが登録されている状態
    const metadata = [
      {
        field_id: 'field_001',
        field_name: 'appointment_count',
        display_name: 'アポ数',
        data_type: 'integer',
        unit: '件',
        calculation_logic: 'COUNT(appointment_records)',
        report_mapping: {
          column_name: 'アポ数',
          column_order: 1,
          format: 'numeric',
          default_value: 0,
        },
      },
      {
        field_id: 'field_002',
        field_name: 'contract_amount',
        display_name: '契約額',
        data_type: 'decimal',
        unit: '円',
        calculation_logic: 'SUM(contract_values)',
        report_mapping: {
          column_name: '契約額',
          column_order: 2,
          format: 'currency_jpy',
          default_value: 0.0,
        },
      },
      {
        field_id: 'field_003',
        field_name: 'customer_reaction',
        display_name: '顧客反応',
        data_type: 'string',
        unit: '区分',
        calculation_logic: 'CONCAT(reaction_type)',
        report_mapping: {
          column_name: '顧客反応',
          column_order: 3,
          format: 'text',
          default_value: '未評価',
        },
      },
    ];

    // 営業データ
    const sales_data = [
      {
        customer_id: 'cust_001',
        appointment_count: 5,
        contract_amount: 500000,
        customer_reaction: '高評価',
      },
      {
        customer_id: 'cust_002',
        appointment_count: 3,
        contract_amount: 250000,
        customer_reaction: '中評価',
      },
    ];

    // レポート生成パラメータ
    const report_params = {
      data_source: 'sales_data',
      output_format: 'csv',
      report_template_id: 'template_monthly_summary',
    };

    // 実行: レポート生成を実行
    const generated_report = generateReportWithMetadata(
      metadata,
      sales_data,
      report_params
    );

    // 検証: カラム順序がメタデータの指定通りであること
    expect(generated_report.columns).toEqual([
      'アポ数',
      '契約額',
      '顧客反応',
    ]);

    // 検証: データ型がメタデータの定義に沿っていること
    expect(generated_report.column_types).toEqual([
      'numeric',
      'currency_jpy',
      'text',
    ]);

    // 検証: 最初の行のデータが正確にマッピングされていること
    expect(generated_report.rows[0]).toEqual({
      アポ数: 5,
      契約額: 500000,
      顧客反応: '高評価',
    });

    // 検証: 2番目の行のデータが正確にマッピングされていること
    expect(generated_report.rows[1]).toEqual({
      アポ数: 3,
      契約額: 250000,
      顧客反応: '中評価',
    });

    // 検証: メタデータのマッピング情報が保持されていること
    expect(generated_report.metadata_mapping).toEqual({
      field_001: {
        mapped_column: 'アポ数',
        data_type: 'integer',
        format: 'numeric',
        column_order: 1,
      },
      field_002: {
        mapped_column: '契約額',
        data_type: 'decimal',
        format: 'currency_jpy',
        column_order: 2,
      },
      field_003: {
        mapped_column: '顧客反応',
        data_type: 'string',
        format: 'text',
        column_order: 3,
      },
    });

    // 検証: 出力形式がリクエストされた形式であること
    expect(generated_report.output_format).toBe('csv');

    // 検証: レポートにメタデータの計算ロジック情報が含まれていること
    expect(generated_report.calculation_metadata).toEqual({
      appointment_count: 'COUNT(appointment_records)',
      contract_amount: 'SUM(contract_values)',
      customer_reaction: 'CONCAT(reaction_type)',
    });

    // 検証: レポートの完全性チェック - 所定のキーがすべて存在すること
    expect(Object.keys(generated_report)).toContain('columns');
    expect(Object.keys(generated_report)).toContain('column_types');
    expect(Object.keys(generated_report)).toContain('rows');
    expect(Object.keys(generated_report)).toContain('metadata_mapping');
    expect(Object.keys(generated_report)).toContain('output_format');
    expect(Object.keys(generated_report)).toContain('calculation_metadata');

    // 検証: メタデータに基づくデータ型の整合性チェック
    const first_row_types = {
      アポ数: typeof generated_report.rows[0].アポ数,
      契約額: typeof generated_report.rows[0].契約額,
      顧客反応: typeof generated_report.rows[0].顧客反応,
    };
    expect(first_row_types.アポ数).toBe('number');
    expect(first_row_types.契約額).toBe('number');
    expect(first_row_types.顧客反応).toBe('string');

    // 検証: デフォルト値がメタデータ定義に準拠していること
    expect(generated_report.default_values).toEqual({
      appointment_count: 0,
      contract_amount: 0.0,
      customer_reaction: '未評価',
    });

    // 検証: 単位情報がメタデータから正確に取得されていること
    expect(generated_report.units).toEqual({
      アポ数: '件',
      契約額: '円',
      顧客反応: '区分',
    });

    // 検証: レポートが生成されたことを示す成功フラグ
    expect(generated_report.generation_status).toBe('success');
    expect(generated_report.total_records).toBe(2);
  });
});