import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  generateContractChangeVerificationReport,
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-874
  test('契約変更検証レポート自動生成機能 - 妥当性判定結果、契約履歴との比較内容、請求額根拠を含むレポートが標準化フォーマットで自動生成される', async () => {
    // テスト用の契約変更データを入力
    const contractChangeData = {
      contract_id: 'CONTRACT_001',
      customer_id: 'CUST_A001',
      change_type: 'rate_update',
      change_content: 'Monthly fee increased from 10000 to 12000 JPY',
      changed_at: '2024-01-15T10:30:00Z',
      changed_by: 'operator_001',
      effective_date: '2024-02-01',
    };

    const previousContractData = {
      contract_id: 'CONTRACT_001',
      monthly_fee: 10000,
      service_type: 'premium',
      start_date: '2023-01-01',
    };

    const previousBillingData = {
      contract_id: 'CONTRACT_001',
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      billed_amount: 10000,
      items: [
        {
          item_id: 'ITEM_001',
          item_name: 'Monthly Service Fee',
          quantity: 1,
          unit_price: 10000,
          subtotal: 10000,
        },
      ],
    };

    // 妥当性判定を実行
    const report = await generateContractChangeVerificationReport({
      contract_change_data: contractChangeData,
      previous_contract_data: previousContractData,
      previous_billing_data: previousBillingData,
    });

    // 期待結果: レポートが生成される
    expect(report).toBeDefined();
    expect(typeof report).toBe('object');

    // 妥当性判定結果がレポートに含まれていることを検証
    expect(report).toHaveProperty('validation_result');
    expect(report.validation_result).toBeDefined();

    const validation_result = report.validation_result;
    expect(validation_result).toHaveProperty('is_valid');
    expect(validation_result.is_valid).toBe(true);

    expect(validation_result).toHaveProperty('validation_status');
    expect(validation_result.validation_status).toBe('合格');

    expect(validation_result).toHaveProperty('findings');
    expect(Array.isArray(validation_result.findings)).toBe(true);

    // 契約履歴との比較内容がレポートに含まれていることを検証
    expect(report).toHaveProperty('contract_history_comparison');
    const contract_history_comparison = report.contract_history_comparison;

    expect(contract_history_comparison).toHaveProperty('previous_terms');
    expect(contract_history_comparison.previous_terms).toEqual({
      monthly_fee: 10000,
      service_type: 'premium',
      start_date: '2023-01-01',
    });

    expect(contract_history_comparison).toHaveProperty('new_terms');
    expect(contract_history_comparison.new_terms).toEqual({
      monthly_fee: 12000,
      service_type: 'premium',
      effective_date: '2024-02-01',
    });

    expect(contract_history_comparison).toHaveProperty('change_summary');
    expect(contract_history_comparison.change_summary).toBe('Monthly fee increased from 10000 to 12000 JPY');

    expect(contract_history_comparison).toHaveProperty('impact_analysis');
    expect(contract_history_comparison.impact_analysis).toBeDefined();

    // 請求額根拠の詳細情報がレポートに記載されていることを検証
    expect(report).toHaveProperty('billing_basis');
    const billing_basis = report.billing_basis;

    expect(billing_basis).toHaveProperty('previous_billing_period');
    expect(billing_basis.previous_billing_period).toEqual({
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      total_amount: 10000,
    });

    expect(billing_basis).toHaveProperty('projected_new_billing');
    expect(billing_basis.projected_new_billing).toEqual({
      period_start: '2024-02-01',
      period_end: '2024-02-29',
      projected_amount: 12000,
    });

    expect(billing_basis).toHaveProperty('billing_difference');
    expect(billing_basis.billing_difference).toBe(2000);

    expect(billing_basis).toHaveProperty('calculation_basis');
    expect(Array.isArray(billing_basis.calculation_basis)).toBe(true);
    expect(billing_basis.calculation_basis.length).toBeGreaterThan(0);

    // 生成されたレポートのフォーマットが標準化フォーマット仕様に準拠していることを確認
    expect(report).toHaveProperty('report_metadata');
    const report_metadata = report.report_metadata;

    expect(report_metadata).toHaveProperty('report_id');
    expect(typeof report_metadata.report_id).toBe('string');
    expect(report_metadata.report_id).toMatch(/^RPT_/);

    expect(report_metadata).toHaveProperty('report_type');
    expect(report_metadata.report_type).toBe('contract_change_verification');

    expect(report_metadata).toHaveProperty('generated_at');
    expect(typeof report_metadata.generated_at).toBe('string');

    expect(report_metadata).toHaveProperty('generated_by');
    expect(report_metadata.generated_by).toBe('operator_001');

    expect(report_metadata).toHaveProperty('version');
    expect(report_metadata.version).toBe('1.0');

    expect(report).toHaveProperty('format_compliance');
    expect(report.format_compliance).toEqual({
      is_compliant: true,
      standard_version: '1.0',
      sections_present: [
        'report_metadata',
        'validation_result',
        'contract_history_comparison',
        'billing_basis',
      ],
    });

    // 複数の契約変更パターンで同じ手順を繰り返し実行し、一貫性を検証
    const second_contract_change = {
      contract_id: 'CONTRACT_002',
      customer_id: 'CUST_B002',
      change_type: 'service_expansion',
      change_content: 'Added premium support module',
      changed_at: '2024-01-16T14:00:00Z',
      changed_by: 'operator_002',
      effective_date: '2024-02-15',
    };

    const second_previous_contract = {
      contract_id: 'CONTRACT_002',
      monthly_fee: 5000,
      service_type: 'basic',
      start_date: '2023-06-01',
    };

    const second_previous_billing = {
      contract_id: 'CONTRACT_002',
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      billed_amount: 5000,
      items: [
        {
          item_id: 'ITEM_002',
          item_name: 'Basic Service Fee',
          quantity: 1,
          unit_price: 5000,
          subtotal: 5000,
        },
      ],
    };

    const second_report = await generateContractChangeVerificationReport({
      contract_change_data: second_contract_change,
      previous_contract_data: second_previous_contract,
      previous_billing_data: second_previous_billing,
    });

    // 同じ構조의 레포트가 생성되는지 확인
    expect(second_report).toHaveProperty('report_metadata');
    expect(second_report).toHaveProperty('validation_result');
    expect(second_report).toHaveProperty('contract_history_comparison');
    expect(second_report).toHaveProperty('billing_basis');
    expect(second_report).toHaveProperty('format_compliance');

    // 보고서 메타데이터가 새로운 계약 데이터와 일치하는지 확인
    expect(second_report.report_metadata.report_type).toBe('contract_change_verification');
    expect(second_report.format_compliance.is_compliant).toBe(true);

    // 생성된 레포ート를 エクスポート(CSV/PDF等)し、ファイル形式が正常であることを確認
    expect(report).toHaveProperty('export_formats');
    const export_formats = report.export_formats;

    expect(export_formats).toHaveProperty('csv');
    expect(typeof export_formats.csv).toBe('string');
    expect(export_formats.csv.length).toBeGreaterThan(0);
    expect(export_formats.csv).toContain('contract_id,customer_id,change_type');

    expect(export_formats).toHaveProperty('pdf');
    expect(typeof export_formats.pdf).toBe('string');
    expect(export_formats.pdf.length).toBeGreaterThan(0);

    expect(export_formats).toHaveProperty('json');
    expect(typeof export_formats.json).toBe('string');
    const parsed_json = JSON.parse(export_formats.json);
    expect(parsed_json).toHaveProperty('report_metadata');
    expect(parsed_json).toHaveProperty('validation_result');

    // ファイル形式が正常であることを確認
    expect(export_formats).toHaveProperty('export_status');
    expect(export_formats.export_status).toBe('success');

    expect(export_formats).toHaveProperty('generated_files');
    expect(Array.isArray(export_formats.generated_files)).toBe(true);
    expect(export_formats.generated_files.length).toBeGreaterThanOrEqual(3);

    const file_extensions = export_formats.generated_files.map((file: string) => {
      const parts = file.split('.');
      return parts[parts.length - 1];
    });

    expect(file_extensions).toContain('csv');
    expect(file_extensions).toContain('pdf');
    expect(file_extensions).toContain('json');
  });
});