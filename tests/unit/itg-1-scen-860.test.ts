import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateContractChangeVerificationReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能 - 契約変更検証レポート自動生成', () => {
  // SCEN-860: [normal] 契約変更検証レポートの自動生成機能 - 妥当性判定結果・過去契約履歴比較・請求額根拠を含む標準化レポートが正常に生成される
  test('should generate standardized contract change verification report with validity judgment, historical comparison, and billing basis', () => {
    const input_contract_changes = [
      {
        contract_change_id: 'CC-001',
        customer_id: 'CUST-A',
        contract_id: 'CTR-A-001',
        change_type: 'price_adjustment',
        effective_date: '2024-01-15',
        changed_fields: {
          monthly_fee: { old_value: 50000, new_value: 55000 },
          discount_rate: { old_value: 10, new_value: 8 }
        },
        change_reason: 'Service tier upgrade',
        recorded_by: 'user001',
        recorded_at: '2024-01-10T09:30:00Z'
      },
      {
        contract_change_id: 'CC-002',
        customer_id: 'CUST-B',
        contract_id: 'CTR-B-001',
        change_type: 'service_scope_change',
        effective_date: '2024-02-01',
        changed_fields: {
          service_items: { old_value: ['basic', 'support'], new_value: ['basic', 'support', 'premium'] }
        },
        change_reason: 'Customer requested additional features',
        recorded_by: 'user002',
        recorded_at: '2024-01-12T14:15:00Z'
      }
    ];

    const input_historical_contracts = [
      {
        contract_id: 'CTR-A-001',
        customer_id: 'CUST-A',
        valid_from: '2023-01-01',
        valid_to: '2024-01-14',
        monthly_fee: 50000,
        discount_rate: 10,
        service_items: ['basic', 'support']
      },
      {
        contract_id: 'CTR-B-001',
        customer_id: 'CUST-B',
        valid_from: '2023-06-01',
        valid_to: '2024-01-31',
        monthly_fee: 30000,
        discount_rate: 5,
        service_items: ['basic', 'support']
      }
    ];

    const input_billing_calculations = [
      {
        contract_id: 'CTR-A-001',
        billing_period: '2024-01',
        base_amount: 50000,
        discount_amount: 5000,
        final_amount: 45000,
        calculation_formula: 'base_amount * (1 - discount_rate / 100)'
      },
      {
        contract_id: 'CTR-B-001',
        billing_period: '2024-01',
        base_amount: 30000,
        discount_amount: 1500,
        final_amount: 28500,
        calculation_formula: 'base_amount * (1 - discount_rate / 100)'
      }
    ];

    const input_options = {
      include_validity_judgment: true,
      include_historical_comparison: true,
      include_billing_basis: true,
      report_format: 'standardized',
      language: 'ja'
    };

    const result = generateContractChangeVerificationReport({
      contract_changes: input_contract_changes,
      historical_contracts: input_historical_contracts,
      billing_calculations: input_billing_calculations,
      options: input_options
    });

    expect(result).toBeDefined();
    expect(result.report_id).toBeTruthy();
    expect(result.generated_at).toBeTruthy();
    expect(result.status).toBe('generated');

    expect(result.sections).toBeDefined();
    expect(Array.isArray(result.sections)).toBe(true);
    expect(result.sections.length).toBeGreaterThanOrEqual(3);

    const validity_section = result.sections.find(
      (s: any) => s.section_type === 'validity_judgment'
    );
    expect(validity_section).toBeDefined();
    expect(validity_section.title).toBeTruthy();
    expect(Array.isArray(validity_section.entries)).toBe(true);
    expect(validity_section.entries.length).toBe(2);

    const cc001_judgment = validity_section.entries.find(
      (e: any) => e.contract_change_id === 'CC-001'
    );
    expect(cc001_judgment).toBeDefined();
    expect(cc001_judgment.judgment_result).toBe('valid');
    expect(cc001_judgment.judgment_reason).toBeTruthy();
    expect(typeof cc001_judgment.judgment_confidence).toBe('number');
    expect(cc001_judgment.judgment_confidence).toBeGreaterThanOrEqual(0);
    expect(cc001_judgment.judgment_confidence).toBeLessThanOrEqual(100);

    const historical_section = result.sections.find(
      (s: any) => s.section_type === 'historical_comparison'
    );
    expect(historical_section).toBeDefined();
    expect(historical_section.title).toBeTruthy();
    expect(Array.isArray(historical_section.comparisons)).toBe(true);
    expect(historical_section.comparisons.length).toBe(2);

    const cc001_comparison = historical_section.comparisons.find(
      (c: any) => c.contract_id === 'CTR-A-001'
    );
    expect(cc001_comparison).toBeDefined();
    expect(cc001_comparison.old_terms).toBeDefined();
    expect(cc001_comparison.old_terms.monthly_fee).toBe(50000);
    expect(cc001_comparison.old_terms.discount_rate).toBe(10);
    expect(cc001_comparison.new_terms).toBeDefined();
    expect(cc001_comparison.new_terms.monthly_fee).toBe(55000);
    expect(cc001_comparison.new_terms.discount_rate).toBe(8);
    expect(Array.isArray(cc001_comparison.differences)).toBe(true);
    expect(cc001_comparison.differences.length).toBeGreaterThan(0);

    const billing_section = result.sections.find(
      (s: any) => s.section_type === 'billing_basis'
    );
    expect(billing_section).toBeDefined();
    expect(billing_section.title).toBeTruthy();
    expect(Array.isArray(billing_section.billing_bases)).toBe(true);
    expect(billing_section.billing_bases.length).toBe(2);

    const cc001_billing = billing_section.billing_bases.find(
      (b: any) => b.contract_id === 'CTR-A-001'
    );
    expect(cc001_billing).toBeDefined();
    expect(cc001_billing.old_calculation).toBeDefined();
    expect(cc001_billing.old_calculation.base_amount).toBe(50000);
    expect(cc001_billing.old_calculation.discount_rate).toBe(10);
    expect(cc001_billing.old_calculation.discount_amount).toBe(5000);
    expect(cc001_billing.old_calculation.final_amount).toBe(45000);
    expect(cc001_billing.new_calculation).toBeDefined();
    expect(cc001_billing.new_calculation.base_amount).toBe(55000);
    expect(cc001_billing.new_calculation.discount_rate).toBe(8);
    expect(cc001_billing.new_calculation.discount_amount).toBe(4400);
    expect(cc001_billing.new_calculation.final_amount).toBe(50600);
    expect(cc001_billing.billing_difference).toBeDefined();
    expect(cc001_billing.billing_difference.amount_change).toBe(5600);
    expect(cc001_billing.billing_difference.percentage_change).toBeCloseTo(12.44, 1);
    expect(cc001_billing.calculation_formula).toBe('base_amount * (1 - discount_rate / 100)');

    expect(result.metadata).toBeDefined();
    expect(result.metadata.report_format).toBe('standardized');
    expect(result.metadata.report_locale).toBe('ja');
    expect(result.metadata.contract_changes_count).toBe(2);
    expect(result.metadata.sections_included).toEqual(
      expect.arrayContaining(['validity_judgment', 'historical_comparison', 'billing_basis'])
    );

    expect(result.formatting).toBeDefined();
    expect(result.formatting.layout_type).toBe('standardized');
    expect(result.formatting.is_consistent).toBe(true);
    expect(result.formatting.validation_passed).toBe(true);

    expect(Array.isArray(result.classified_changes)).toBe(true);
    expect(result.classified_changes.length).toBe(2);
    
    const price_adjustment_group = result.classified_changes.filter(
      (cc: any) => cc.change_type === 'price_adjustment'
    );
    expect(price_adjustment_group.length).toBe(1);
    expect(price_adjustment_group[0].contract_change_id).toBe('CC-001');

    const service_scope_group = result.classified_changes.filter(
      (cc: any) => cc.change_type === 'service_scope_change'
    );
    expect(service_scope_group.length).toBe(1);
    expect(service_scope_group[0].contract_change_id).toBe('CC-002');
  });
});