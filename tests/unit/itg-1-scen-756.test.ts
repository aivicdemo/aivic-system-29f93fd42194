import { validateContractChangeConsistency } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-756: [edge] 契約書・提案資料の変更内容妥当性判定 - 適用対象顧客が複数指定されている場合にすべての顧客との整合性が確認される
  test('複数顧客に対する契約変更の整合性チェック - すべての顧客で矛盾なし', () => {
    const customers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      },
      {
        customer_id: 'CUST002',
        customer_name: '顧客B',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      },
      {
        customer_id: 'CUST003',
        customer_name: '顧客C',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      }
    ];

    const change_content = {
      change_type: 'price_revision',
      new_price: 120000,
      new_delivery_days: 30,
      new_special_terms: '支払い条件：後払い30日'
    };

    const result = validateContractChangeConsistency({
      customers,
      change_content
    });

    expect(result.is_consistent).toBe(true);
    expect(result.total_customers_checked).toBe(3);
    expect(result.consistent_customers_count).toBe(3);
    expect(result.inconsistent_customers_count).toBe(0);
    expect(result.inconsistencies).toEqual([]);
    expect(result.validation_status).toBe('合格');
  });

  test('複数顧客に対する契約変更の整合性チェック - 顧客Bで納期条件が不合致', () => {
    const customers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      },
      {
        customer_id: 'CUST002',
        customer_name: '顧客B',
        contract_price: 100000,
        contract_delivery_days: 45,
        special_terms: '支払い条件：後払い30日'
      },
      {
        customer_id: 'CUST003',
        customer_name: '顧客C',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      }
    ];

    const change_content = {
      change_type: 'delivery_change',
      new_price: 100000,
      new_delivery_days: 30,
      new_special_terms: '支払い条件：後払い30日'
    };

    const result = validateContractChangeConsistency({
      customers,
      change_content
    });

    expect(result.is_consistent).toBe(false);
    expect(result.total_customers_checked).toBe(3);
    expect(result.consistent_customers_count).toBe(2);
    expect(result.inconsistent_customers_count).toBe(1);
    expect(result.inconsistencies).toHaveLength(1);
    expect(result.inconsistencies[0]).toEqual({
      customer_id: 'CUST002',
      customer_name: '顧客B',
      mismatch_field: 'contract_delivery_days',
      expected_value: 30,
      actual_value: 45,
      mismatch_reason: '契約納期が変更内容と不合致'
    });
    expect(result.validation_status).toBe('不合格');
  });

  test('複数顧客に対する契約変更の整合性チェック - 複数の顧客で異なる不合致が発生', () => {
    const customers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      },
      {
        customer_id: 'CUST002',
        customer_name: '顧客B',
        contract_price: 150000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      },
      {
        customer_id: 'CUST003',
        customer_name: '顧客C',
        contract_price: 100000,
        contract_delivery_days: 45,
        special_terms: '支払い条件：即日払い'
      }
    ];

    const change_content = {
      change_type: 'comprehensive_revision',
      new_price: 120000,
      new_delivery_days: 30,
      new_special_terms: '支払い条件：後払い30日'
    };

    const result = validateContractChangeConsistency({
      customers,
      change_content
    });

    expect(result.is_consistent).toBe(false);
    expect(result.total_customers_checked).toBe(3);
    expect(result.consistent_customers_count).toBe(1);
    expect(result.inconsistent_customers_count).toBe(2);
    expect(result.inconsistencies).toHaveLength(2);
    expect(result.inconsistencies[0]).toEqual({
      customer_id: 'CUST002',
      customer_name: '顧客B',
      mismatch_field: 'contract_price',
      expected_value: 120000,
      actual_value: 150000,
      mismatch_reason: '契約価格が変更内容と不合致'
    });
    expect(result.inconsistencies[1]).toEqual({
      customer_id: 'CUST003',
      customer_name: '顧客C',
      mismatch_field: 'contract_delivery_days',
      expected_value: 30,
      actual_value: 45,
      mismatch_reason: '契約納期が変更内容と不合致'
    });
    expect(result.validation_status).toBe('不合格');
  });

  test('複数顧客に対する契約変更の整合性チェック - 特記事項の相違が検出される', () => {
    const customers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      },
      {
        customer_id: 'CUST002',
        customer_name: '顧客B',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日・割引率10%'
      },
      {
        customer_id: 'CUST003',
        customer_name: '顧客C',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      }
    ];

    const change_content = {
      change_type: 'special_terms_update',
      new_price: 100000,
      new_delivery_days: 30,
      new_special_terms: '支払い条件：後払い30日'
    };

    const result = validateContractChangeConsistency({
      customers,
      change_content
    });

    expect(result.is_consistent).toBe(false);
    expect(result.total_customers_checked).toBe(3);
    expect(result.consistent_customers_count).toBe(2);
    expect(result.inconsistent_customers_count).toBe(1);
    expect(result.inconsistencies).toHaveLength(1);
    expect(result.inconsistencies[0]).toEqual({
      customer_id: 'CUST002',
      customer_name: '顧客B',
      mismatch_field: 'special_terms',
      expected_value: '支払い条件：後払い30日',
      actual_value: '支払い条件：後払い30日・割引率10%',
      mismatch_reason: '特記事項が変更内容と不合致'
    });
    expect(result.validation_status).toBe('不合格');
  });

  test('複数顧客に対する契約変更の整合性チェック - 顧客リストが空の場合エラー', () => {
    const customers: Array<{
      customer_id: string;
      customer_name: string;
      contract_price: number;
      contract_delivery_days: number;
      special_terms: string;
    }> = [];

    const change_content = {
      change_type: 'price_revision',
      new_price: 120000,
      new_delivery_days: 30,
      new_special_terms: '支払い条件：後払い30日'
    };

    expect(() => {
      validateContractChangeConsistency({
        customers,
        change_content
      });
    }).toThrow(/適用対象顧客/);
  });

  test('複数顧客に対する契約変更の整合性チェック - 変更内容が不完全な場合エラー', () => {
    const customers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      }
    ];

    const change_content = {
      change_type: 'price_revision',
      new_price: undefined as any,
      new_delivery_days: 30,
      new_special_terms: '支払い条件：後払い30日'
    };

    expect(() => {
      validateContractChangeConsistency({
        customers,
        change_content
      });
    }).toThrow(/変更内容/);
  });

  test('複数顧客に対する契約変更の整合性チェック - 整合性レポートに詳細情報が含まれる', () => {
    const customers = [
      {
        customer_id: 'CUST001',
        customer_name: '顧客A',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      },
      {
        customer_id: 'CUST002',
        customer_name: '顧客B',
        contract_price: 100000,
        contract_delivery_days: 30,
        special_terms: '支払い条件：後払い30日'
      }
    ];

    const change_content = {
      change_type: 'price_revision',
      new_price: 120000,
      new_delivery_days: 30,
      new_special_terms: '支払い条件：後払い30日'
    };

    const result = validateContractChangeConsistency({
      customers,
      change_content
    });

    expect(result).toHaveProperty('validation_timestamp');
    expect(result).toHaveProperty('change_type');
    expect(result.change_type).toBe('price_revision');
    expect(result).toHaveProperty('consistency_check_details');
    expect(result.consistency_check_details).toBeDefined();
    expect(typeof result.consistency_check_details).toBe('object');
  });
});