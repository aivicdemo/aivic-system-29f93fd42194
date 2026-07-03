import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateProposalMaterialAgainstContract } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-755: [error] 契約書・提案資料の変更内容妥当性判定 - 変更内容が既存契約条項と矛盾する場合に登録不可と判定される
  test('should reject proposal material registration when changes contradict existing contract terms', () => {
    const existingContract = {
      contract_id: 'CNT-2024-001',
      customer_id: 'CUST-A001',
      delivery_date: '2024-06-30',
      contract_amount: 500000,
      payment_terms: '末日払い',
      service_type: 'Basic',
      monthly_fee: 50000,
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-12-31',
    };

    const newProposalMaterial = {
      proposal_id: 'PROP-2024-002',
      customer_id: 'CUST-A001',
      contract_id: 'CNT-2024-001',
      proposed_delivery_date: '2024-05-15',
      proposed_amount: 300000,
      proposed_payment_terms: '前払い',
      proposed_service_type: 'Premium',
      proposed_monthly_fee: 75000,
      change_reason: '顧客要望による仕様変更',
    };

    // 納期矛盾: 既存06-30 → 新05-15（納期前倒し且つ短縮）
    // 金額矛盾: 既存50万 → 新30万（30%削減）
    // 支払条件矛盾: 既存末日払い → 新前払い
    // サービス種別矛盾: 既存Basic → 新Premium（グレードアップ）
    // 月額矛盾: 既存5万 → 新7.5万（50%増加）

    expect(() => {
      validateProposalMaterialAgainstContract(
        newProposalMaterial,
        existingContract
      );
    }).toThrow(/納期/);
  });

  test('should reject proposal when contract amount reduction exceeds threshold', () => {
    const existingContract = {
      contract_id: 'CNT-2024-003',
      customer_id: 'CUST-B002',
      delivery_date: '2024-08-15',
      contract_amount: 1000000,
      payment_terms: '月末払い',
      service_type: 'Standard',
      monthly_fee: 100000,
      contract_start_date: '2024-02-01',
      contract_end_date: '2024-12-31',
    };

    const proposalWithAmountReduction = {
      proposal_id: 'PROP-2024-004',
      customer_id: 'CUST-B002',
      contract_id: 'CNT-2024-003',
      proposed_delivery_date: '2024-08-15',
      proposed_amount: 200000,
      proposed_payment_terms: '月末払い',
      proposed_service_type: 'Standard',
      proposed_monthly_fee: 100000,
      change_reason: 'コスト最適化',
    };

    // 金額が80%削減される（1000万 → 200万）
    expect(() => {
      validateProposalMaterialAgainstContract(
        proposalWithAmountReduction,
        existingContract
      );
    }).toThrow(/金額/);
  });

  test('should reject proposal when payment terms conflict with contract', () => {
    const existingContract = {
      contract_id: 'CNT-2024-005',
      customer_id: 'CUST-C003',
      delivery_date: '2024-07-20',
      contract_amount: 600000,
      payment_terms: '末日払い',
      service_type: 'Premium',
      monthly_fee: 60000,
      contract_start_date: '2024-01-15',
      contract_end_date: '2025-01-14',
    };

    const proposalWithPaymentTermsChange = {
      proposal_id: 'PROP-2024-006',
      customer_id: 'CUST-C003',
      contract_id: 'CNT-2024-005',
      proposed_delivery_date: '2024-07-20',
      proposed_amount: 600000,
      proposed_payment_terms: '前払い',
      proposed_service_type: 'Premium',
      proposed_monthly_fee: 60000,
      change_reason: 'キャッシュフロー改善',
    };

    // 支払い条件が末日払いから前払いに変更される
    expect(() => {
      validateProposalMaterialAgainstContract(
        proposalWithPaymentTermsChange,
        existingContract
      );
    }).toThrow(/支払条件/);
  });

  test('should successfully validate proposal material when all changes are compatible', () => {
    const existingContract = {
      contract_id: 'CNT-2024-007',
      customer_id: 'CUST-D004',
      delivery_date: '2024-09-30',
      contract_amount: 800000,
      payment_terms: '月末払い',
      service_type: 'Standard',
      monthly_fee: 80000,
      contract_start_date: '2024-03-01',
      contract_end_date: '2025-02-28',
    };

    const compatibleProposal = {
      proposal_id: 'PROP-2024-008',
      customer_id: 'CUST-D004',
      contract_id: 'CNT-2024-007',
      proposed_delivery_date: '2024-09-30',
      proposed_amount: 800000,
      proposed_payment_terms: '月末払い',
      proposed_service_type: 'Standard',
      proposed_monthly_fee: 80000,
      change_reason: '更新年度での継続契約',
    };

    // すべてのパラメータが既存契約条項と一致
    const result = validateProposalMaterialAgainstContract(
      compatibleProposal,
      existingContract
    );

    expect(result).toEqual({
      is_valid: true,
      validation_status: 'approved',
      contract_id: 'CNT-2024-007',
      proposal_id: 'PROP-2024-008',
      contradictions_detected: [],
      validation_timestamp: expect.any(String),
    });
  });

  test('should detect multiple contradictions and report all mismatches', () => {
    const existingContract = {
      contract_id: 'CNT-2024-009',
      customer_id: 'CUST-E005',
      delivery_date: '2024-10-31',
      contract_amount: 1500000,
      payment_terms: '翌月末払い',
      service_type: 'Enterprise',
      monthly_fee: 150000,
      contract_start_date: '2024-04-01',
      contract_end_date: '2025-03-31',
    };

    const proposalWithMultipleContradictions = {
      proposal_id: 'PROP-2024-010',
      customer_id: 'CUST-E005',
      contract_id: 'CNT-2024-009',
      proposed_delivery_date: '2024-09-15',
      proposed_amount: 500000,
      proposed_payment_terms: '前払い',
      proposed_service_type: 'Basic',
      proposed_monthly_fee: 50000,
      change_reason: 'サービス内容の大幅変更',
    };

    // 4つの矛盾を検出: 納期、金額、支払条件、サービス種別
    const result = validateProposalMaterialAgainstContract(
      proposalWithMultipleContradictions,
      existingContract
    );

    expect(result).toEqual({
      is_valid: false,
      validation_status: 'rejected',
      contract_id: 'CNT-2024-009',
      proposal_id: 'PROP-2024-010',
      contradictions_detected: [
        expect.objectContaining({
          field: expect.stringMatching(/納期|金額|支払条件|サービス種別/),
          existing_value: expect.any(String),
          proposed_value: expect.any(String),
          severity: expect.stringMatching(/high|critical/),
        }),
        expect.objectContaining({
          field: expect.stringMatching(/納期|金額|支払条件|サービス種別/),
          existing_value: expect.any(String),
          proposed_value: expect.any(String),
          severity: expect.stringMatching(/high|critical/),
        }),
        expect.objectContaining({
          field: expect.stringMatching(/納期|金額|支払条件|サービス種別/),
          existing_value: expect.any(String),
          proposed_value: expect.any(String),
          severity: expect.stringMatching(/high|critical/),
        }),
        expect.objectContaining({
          field: expect.stringMatching(/納期|金額|支払条件|サービス種別/),
          existing_value: expect.any(String),
          proposed_value: expect.any(String),
          severity: expect.stringMatching(/high|critical/),
        }),
      ],
      validation_timestamp: expect.any(String),
    });
  });

  test('should reject proposal when monthly fee increase exceeds contract allowance', () => {
    const existingContract = {
      contract_id: 'CNT-2024-011',
      customer_id: 'CUST-F006',
      delivery_date: '2024-11-30',
      contract_amount: 400000,
      payment_terms: '月末払い',
      service_type: 'Lite',
      monthly_fee: 40000,
      contract_start_date: '2024-05-01',
      contract_end_date: '2025-04-30',
    };

    const proposalWithFeeIncrease = {
      proposal_id: 'PROP-2024-012',
      customer_id: 'CUST-F006',
      contract_id: 'CNT-2024-011',
      proposed_delivery_date: '2024-11-30',
      proposed_amount: 600000,
      proposed_payment_terms: '月末払い',
      proposed_service_type: 'Lite',
      proposed_monthly_fee: 100000,
      change_reason: 'オプション機能追加',
    };

    // 月額が40000から100000に増加（150%増）
    expect(() => {
      validateProposalMaterialAgainstContract(
        proposalWithFeeIncrease,
        existingContract
      );
    }).toThrow(/月額料金/);
  });
});