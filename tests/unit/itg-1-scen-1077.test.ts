import { generateInvoiceCreationManual } from '../../src/logic/it-1-2-1';

describe('請求書作成標準手順書生成機能 - 複数契約タイプ対応', () => {
  // SCEN-1077
  test('複数の契約タイプ（基本契約・個別契約・変更契約）に対応した手順が生成される', () => {
    const testContracts = [
      {
        contract_id: 'BASE-001',
        contract_type: 'base_contract',
        customer_id: 'CUST-A',
        service_id: 'SVC-01',
        contract_name: '基本契約',
        billing_rule: 'fixed_monthly',
        billing_amount: 100000,
        effective_date: '2024-01-01',
        termination_date: '2024-12-31',
        discount_rate: 0,
      },
      {
        contract_id: 'IND-001',
        contract_type: 'individual_contract',
        customer_id: 'CUST-A',
        service_id: 'SVC-02',
        contract_name: '個別契約',
        billing_rule: 'performance_based',
        billing_amount: 50000,
        effective_date: '2024-02-15',
        termination_date: '2024-12-31',
        discount_rate: 5,
      },
      {
        contract_id: 'CHG-001',
        contract_type: 'change_contract',
        customer_id: 'CUST-A',
        service_id: 'SVC-01',
        contract_name: '変更契約',
        billing_rule: 'fixed_monthly',
        billing_amount: 120000,
        effective_date: '2024-06-01',
        termination_date: '2024-12-31',
        discount_rate: 10,
        original_contract_id: 'BASE-001',
        change_reason: 'price_adjustment',
      },
    ];

    const result = generateInvoiceCreationManual(testContracts);

    // 基本契約セクションの存在確認
    expect(result.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contract_type: 'base_contract',
          section_title: expect.stringContaining('基本契約'),
          section_order: 1,
          steps: expect.any(Array),
        }),
      ])
    );

    // 個別契約セクションの存在確認
    expect(result.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contract_type: 'individual_contract',
          section_title: expect.stringContaining('個別契約'),
          section_order: 2,
          steps: expect.any(Array),
        }),
      ])
    );

    // 変更契約セクションの存在確認
    expect(result.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contract_type: 'change_contract',
          section_title: expect.stringContaining('変更契約'),
          section_order: 3,
          steps: expect.any(Array),
        }),
      ])
    );

    // 各契約タイプセクションの正しい順序を検証
    const baseContractSection = result.sections.find(
      (s) => s.contract_type === 'base_contract'
    );
    const individualContractSection = result.sections.find(
      (s) => s.contract_type === 'individual_contract'
    );
    const changeContractSection = result.sections.find(
      (s) => s.contract_type === 'change_contract'
    );

    expect(baseContractSection?.section_order).toBe(1);
    expect(individualContractSection?.section_order).toBe(2);
    expect(changeContractSection?.section_order).toBe(3);

    // 標準フォーマットへの準拠確認
    expect(result).toHaveProperty('manual_id');
    expect(result).toHaveProperty('manual_title');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('created_date');
    expect(result).toHaveProperty('sections');
    expect(result).toHaveProperty('contract_type_count');
    expect(result.contract_type_count).toBe(3);

    // 各セクション内のステップ構造確認
    result.sections.forEach((section) => {
      expect(section).toHaveProperty('contract_type');
      expect(section).toHaveProperty('section_title');
      expect(section).toHaveProperty('section_order');
      expect(section).toHaveProperty('steps');
      expect(Array.isArray(section.steps)).toBe(true);

      section.steps.forEach((step) => {
        expect(step).toHaveProperty('step_number');
        expect(step).toHaveProperty('step_title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('checklist_items');
        expect(Array.isArray(step.checklist_items)).toBe(true);
      });
    });

    // 基本契約セクションの具体的な検証
    const baseSection = result.sections.find(
      (s) => s.contract_type === 'base_contract'
    );
    expect(baseSection?.steps.length).toBeGreaterThan(0);
    expect(baseSection?.steps[0]).toEqual(
      expect.objectContaining({
        step_number: 1,
        step_title: expect.any(String),
      })
    );

    // 個別契約セクションの具体的な検証
    const indSection = result.sections.find(
      (s) => s.contract_type === 'individual_contract'
    );
    expect(indSection?.steps.length).toBeGreaterThan(0);

    // 変更契約セクションの具体的な検証
    const chgSection = result.sections.find(
      (s) => s.contract_type === 'change_contract'
    );
    expect(chgSection?.steps.length).toBeGreaterThan(0);
    expect(chgSection?.original_contract_reference).toEqual('BASE-001');

    // 複数契約タイプ間の相互参照を検証
    expect(result.contract_dependencies).toBeDefined();
    expect(result.contract_dependencies).toEqual(
      expect.objectContaining({
        'CHG-001': 'BASE-001',
      })
    );

    // 競合がないことを確認
    expect(result.conflict_check_result).toBe('no_conflicts');
    expect(result.integration_status).toBe('fully_integrated');

    // 生成手順書の完全性確認
    expect(result.sections.length).toBe(3);
    expect(result.manual_id).toMatch(/^MANUAL-/);
    expect(result.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});