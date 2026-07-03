import { describe, test, expect, beforeEach } from '@jest/globals';
import { extractBillingRulesAndDiscounts } from '../../src/logic/it-1-2-1';

describe('複数顧客の契約データから請求ルール・割引基準を抽出し運用マニュアルを生成', () => {
  // SCEN-946
  test('複数顧客の契約データから請求ルール・割引基準・例外パターンを抽出してマニュアルを生成', () => {
    const input_contracts = [
      {
        contract_id: 'C001',
        customer_id: 'CUST001',
        customer_name: '顧客A',
        service_type: 'SERVICE_BASIC',
        service_name: '基本サービス',
        base_fee: 100000,
        success_fee_rate: 0.1,
        success_fee_unit: '成約数',
        min_billing_amount: 50000,
        max_billing_amount: 500000,
        discount_type: 'VOLUME',
        discount_rate: 0.05,
        discount_threshold: 10,
        discount_unit: '成約数',
        contract_start_date: '2024-01-01',
        contract_end_date: '2024-12-31',
        billing_cycle: 'MONTHLY',
        special_conditions: '年間契約で5%割引',
        exception_patterns: [
          {
            condition: '成約数が20以上',
            adjustment: '追加5%割引',
            applicable_date_from: '2024-06-01'
          }
        ]
      },
      {
        contract_id: 'C002',
        customer_id: 'CUST002',
        customer_name: '顧客B',
        service_type: 'SERVICE_PREMIUM',
        service_name: 'プレミアムサービス',
        base_fee: 200000,
        success_fee_rate: 0.15,
        success_fee_unit: '成約金額',
        min_billing_amount: 100000,
        max_billing_amount: 1000000,
        discount_type: 'EARLY_PAYMENT',
        discount_rate: 0.03,
        discount_threshold: 30,
        discount_unit: '支払い日数',
        contract_start_date: '2024-02-01',
        contract_end_date: '2025-01-31',
        billing_cycle: 'MONTHLY',
        special_conditions: '早期支払いで3%割引',
        exception_patterns: [
          {
            condition: '年間売上が500万以上',
            adjustment: 'フラット10万円割引',
            applicable_date_from: '2024-01-01'
          }
        ]
      },
      {
        contract_id: 'C003',
        customer_id: 'CUST003',
        customer_name: '顧客C',
        service_type: 'SERVICE_BASIC',
        service_name: '基本サービス',
        base_fee: 80000,
        success_fee_rate: 0.08,
        success_fee_unit: '成約数',
        min_billing_amount: 40000,
        max_billing_amount: 400000,
        discount_type: 'VOLUME',
        discount_rate: 0.1,
        discount_threshold: 15,
        discount_unit: '成約数',
        contract_start_date: '2024-03-01',
        contract_end_date: '2024-12-31',
        billing_cycle: 'MONTHLY',
        special_conditions: '3年契約で10%割引',
        exception_patterns: [
          {
            condition: '連続成約が5件以上',
            adjustment: '単価10%UP',
            applicable_date_from: '2024-04-01'
          }
        ]
      }
    ];

    const result = extractBillingRulesAndDiscounts(input_contracts);

    expect(result).toBeDefined();
    expect(result.billing_rules).toBeDefined();
    expect(Array.isArray(result.billing_rules)).toBe(true);
    expect(result.billing_rules.length).toBe(3);

    const billing_rule_1 = result.billing_rules[0];
    expect(billing_rule_1.contract_id).toBe('C001');
    expect(billing_rule_1.customer_name).toBe('顧客A');
    expect(billing_rule_1.service_name).toBe('基本サービス');
    expect(billing_rule_1.base_fee).toBe(100000);
    expect(billing_rule_1.success_fee_rate).toBe(0.1);
    expect(billing_rule_1.success_fee_unit).toBe('成約数');
    expect(billing_rule_1.min_billing_amount).toBe(50000);
    expect(billing_rule_1.max_billing_amount).toBe(500000);
    expect(billing_rule_1.billing_cycle).toBe('MONTHLY');

    expect(result.discount_rules).toBeDefined();
    expect(Array.isArray(result.discount_rules)).toBe(true);
    expect(result.discount_rules.length).toBe(3);

    const discount_rule_1 = result.discount_rules[0];
    expect(discount_rule_1.contract_id).toBe('C001');
    expect(discount_rule_1.customer_name).toBe('顧客A');
    expect(discount_rule_1.discount_type).toBe('VOLUME');
    expect(discount_rule_1.discount_rate).toBe(0.05);
    expect(discount_rule_1.discount_threshold).toBe(10);
    expect(discount_rule_1.discount_unit).toBe('成約数');

    const discount_rule_2 = result.discount_rules[1];
    expect(discount_rule_2.contract_id).toBe('C002');
    expect(discount_rule_2.customer_name).toBe('顧客B');
    expect(discount_rule_2.discount_type).toBe('EARLY_PAYMENT');
    expect(discount_rule_2.discount_rate).toBe(0.03);
    expect(discount_rule_2.discount_threshold).toBe(30);
    expect(discount_rule_2.discount_unit).toBe('支払い日数');

    const discount_rule_3 = result.discount_rules[2];
    expect(discount_rule_3.contract_id).toBe('C003');
    expect(discount_rule_3.customer_name).toBe('顧客C');
    expect(discount_rule_3.discount_type).toBe('VOLUME');
    expect(discount_rule_3.discount_rate).toBe(0.1);
    expect(discount_rule_3.discount_threshold).toBe(15);

    expect(result.exception_patterns).toBeDefined();
    expect(Array.isArray(result.exception_patterns)).toBe(true);
    expect(result.exception_patterns.length).toBe(3);

    const exception_1 = result.exception_patterns[0];
    expect(exception_1.contract_id).toBe('C001');
    expect(exception_1.customer_name).toBe('顧客A');
    expect(exception_1.patterns).toBeDefined();
    expect(Array.isArray(exception_1.patterns)).toBe(true);
    expect(exception_1.patterns.length).toBe(1);
    expect(exception_1.patterns[0].condition).toBe('成約数が20以上');
    expect(exception_1.patterns[0].adjustment).toBe('追加5%割引');

    const exception_2 = result.exception_patterns[1];
    expect(exception_2.contract_id).toBe('C002');
    expect(exception_2.customer_name).toBe('顧客B');
    expect(exception_2.patterns.length).toBe(1);
    expect(exception_2.patterns[0].condition).toBe('年間売上が500万以上');
    expect(exception_2.patterns[0].adjustment).toBe('フラット10万円割引');

    const exception_3 = result.exception_patterns[2];
    expect(exception_3.contract_id).toBe('C003');
    expect(exception_3.customer_name).toBe('顧客C');
    expect(exception_3.patterns.length).toBe(1);

    expect(result.manual_content).toBeDefined();
    expect(typeof result.manual_content).toBe('string');
    expect(result.manual_content.length).gt(0);

    expect(result.manual_content).toMatch(/請求ルール/);
    expect(result.manual_content).toMatch(/顧客A/);
    expect(result.manual_content).toMatch(/100000/);
    expect(result.manual_content).toMatch(/基本サービス/);

    expect(result.manual_content).toMatch(/割引基準/);
    expect(result.manual_content).toMatch(/VOLUME/);
    expect(result.manual_content).toMatch(/0\.05/);
    expect(result.manual_content).toMatch(/EARLY_PAYMENT/);
    expect(result.manual_content).toMatch(/0\.03/);

    expect(result.manual_content).toMatch(/例外パターン/);
    expect(result.manual_content).toMatch(/成約数が20以上/);
    expect(result.manual_content).toMatch(/年間売上が500万以上/);
    expect(result.manual_content).toMatch(/追加5%割引/);
    expect(result.manual_content).toMatch(/フラット10万円割引/);

    expect(result.manual_format).toBeDefined();
    expect(['HTML', 'MARKDOWN', 'PDF']).toContain(result.manual_format);

    expect(result.exportable).toBe(true);
    expect(typeof result.export_file_name).toBe('string');
    expect(result.export_file_name.length).gt(0);
    expect(result.export_file_name).toMatch(/\.md$|\.html$|\.pdf$/);

    expect(result.generated_timestamp).toBeDefined();
    expect(typeof result.generated_timestamp).toBe('string');

    expect(result.validation_summary).toBeDefined();
    expect(result.validation_summary.total_contracts).toBe(3);
    expect(result.validation_summary.billing_rules_extracted).toBe(3);
    expect(result.validation_summary.discount_rules_extracted).toBe(3);
    expect(result.validation_summary.exception_patterns_extracted).toBe(3);
    expect(result.validation_summary.manual_generation_status).toBe('SUCCESS');
  });
});