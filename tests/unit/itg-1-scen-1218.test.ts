import { validateFinalApprovalForResponse } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1218: [normal] 回答内容の最終承認検証機能 - 回答内容が契約条件・営業データ・請求ルールと矛盾していず、根拠資料が揃っており、顧客への説明が明確な場合、承認として判定される
  test('should approve response when all validation criteria are met', () => {
    const contractData = {
      contract_id: 'CT-001',
      customer_id: 'CUS-001',
      service_id: 'SVC-001',
      billing_unit_price: 100000,
      billing_calculation_method: 'per_appointment',
      discount_rate: 0.1,
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-12-31',
    };

    const salesData = {
      sales_id: 'SALES-001',
      customer_id: 'CUS-001',
      service_id: 'SVC-001',
      appointment_count: 50,
      contract_count: 10,
      customer_response_rate: 0.8,
      sales_month: '2024-10',
    };

    const billingRule = {
      rule_id: 'RULE-001',
      service_id: 'SVC-001',
      base_calculation: 'appointment_count',
      multiplier: 100000,
      minimum_billing_amount: 500000,
      maximum_billing_amount: 5000000,
      discount_applicable: true,
    };

    const responseContent = {
      response_id: 'RESP-001',
      customer_id: 'CUS-001',
      question_category: 'billing_calculation',
      response_text: '当月のアポイント件数は50件であり、ご契約の単価100,000円を乗じて5,000,000円となります。割引率10%を適用し、最終請求額は4,500,000円です。',
      calculated_billing_amount: 4500000,
      supporting_documents: [
        { document_type: 'contract', document_id: 'DOC-001', attached: true },
        { document_type: 'sales_record', document_id: 'DOC-002', attached: true },
        { document_type: 'billing_rule', document_id: 'DOC-003', attached: true },
      ],
      explanation_clarity_score: 95,
    };

    const validationInput = {
      response_content: responseContent,
      contract_data: contractData,
      sales_data: salesData,
      billing_rule: billingRule,
    };

    const result = validateFinalApprovalForResponse(validationInput);

    expect(result.approval_status).toBe('approved');
    expect(result.contract_validation_result).toBe('consistent');
    expect(result.sales_data_validation_result).toBe('consistent');
    expect(result.billing_rule_validation_result).toBe('consistent');
    expect(result.supporting_documents_validation_result).toBe('complete');
    expect(result.explanation_clarity_validation_result).toBe('clear');
    expect(result.final_approval_decision).toBe(true);
    expect(result.calculated_amount_verification).toBe(4500000);
  });
});