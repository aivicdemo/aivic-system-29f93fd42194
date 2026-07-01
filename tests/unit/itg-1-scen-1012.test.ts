import { determineBackdatedBillingApplicationScope } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1012: 請求ルール変更時の遡及適用判定 - 変更前後の契約・営業データを照合し、請求額の再計算対象が正確に決定される', () => {
    // テストデータ：旧ルール適用時の契約・営業データ
    const oldBillingRule = {
      ruleId: 'RULE_OLD_001',
      effectiveDate: '2024-01-01',
      basePrice: 100000,
      discountRate: 0.1,
      bonusPerApo: 5000,
      bonusPerContract: 10000,
    };

    const newBillingRule = {
      ruleId: 'RULE_NEW_001',
      effectiveDate: '2024-06-01',
      basePrice: 120000,
      discountRate: 0.15,
      bonusPerApo: 7000,
      bonusPerContract: 15000,
    };

    // 旧ルール適用時の契約データ
    const contractsWithOldRule = [
      {
        contractId: 'CONTRACT_001',
        customerId: 'CUST_A',
        serviceId: 'SVC_001',
        startDate: '2024-01-15',
        endDate: '2024-12-31',
        appliedRuleId: 'RULE_OLD_001',
        billingAmount_old: 108000, // basePrice(100000) - discount(10000) + bonus(18000) = 108000
      },
      {
        contractId: 'CONTRACT_002',
        customerId: 'CUST_B',
        serviceId: 'SVC_002',
        startDate: '2024-03-01',
        endDate: '2024-12-31',
        appliedRuleId: 'RULE_OLD_001',
        billingAmount_old: 108000,
      },
      {
        contractId: 'CONTRACT_003',
        customerId: 'CUST_C',
        serviceId: 'SVC_001',
        startDate: '2024-08-01',
        endDate: '2024-12-31',
        appliedRuleId: 'RULE_OLD_001',
        billingAmount_old: 108000,
      },
      {
        contractId: 'CONTRACT_004',
        customerId: 'CUST_D',
        serviceId: 'SVC_003',
        startDate: '2024-07-15',
        endDate: '2024-12-31',
        appliedRuleId: 'RULE_OLD_001',
        billingAmount_old: 108000,
      },
    ];

    // 営業データ（月別成果）
    const salesData = [
      { contractId: 'CONTRACT_001', month: '2024-01', apoCount: 2, contractCount: 1 },
      { contractId: 'CONTRACT_001', month: '2024-02', apoCount: 2, contractCount: 1 },
      { contractId: 'CONTRACT_002', month: '2024-03', apoCount: 3, contractCount: 1 },
      { contractId: 'CONTRACT_002', month: '2024-04', apoCount: 2, contractCount: 0 },
      { contractId: 'CONTRACT_003', month: '2024-08', apoCount: 1, contractCount: 1 },
      { contractId: 'CONTRACT_003', month: '2024-09', apoCount: 2, contractCount: 1 },
      { contractId: 'CONTRACT_004', month: '2024-07', apoCount: 3, contractCount: 0 },
      { contractId: 'CONTRACT_004', month: '2024-08', apoCount: 2, contractCount: 1 },
    ];

    // 遡及適用判定ロジック実行
    const ruleChangeRequest = {
      newRuleId: 'RULE_NEW_001',
      newRuleEffectiveDate: '2024-06-01',
      oldRuleId: 'RULE_OLD_001',
      changeReason: 'ボーナス単価改定に伴う請求ルール変更',
    };

    const result = determineBackdatedBillingApplicationScope({
      ruleChangeRequest,
      contracts: contractsWithOldRule,
      salesData,
      oldBillingRule,
      newBillingRule,
    });

    // 期待結果の計算
    // 遡及適用対象：新ルール有効日（2024-06-01）以前に開始された契約で、新ルール有効日以降に営業成果がある契約
    // CONTRACT_001: 開始日2024-01-15（新ルール前）、営業成果あり（1月-2月は新ルール前） → 遡及適用対象外（成果が新ルール前）
    // CONTRACT_002: 開始日2024-03-01（新ルール前）、営業成果あり（3月-4月は新ルール前） → 遡及適用対象外（成果が新ルール前）
    // CONTRACT_003: 開始日2024-08-01（新ルール後）、営業成果あり（8月-9月は新ルール後） → 遡及適用対象外（契約開始が新ルール後）
    // CONTRACT_004: 開始日2024-07-15（新ルール後）、営業成果あり（7月-8月は新ルール後） → 遡及適用対象外（契約開始が新ルール後）

    // 実際の遡及適用判定では、新ルール有効日前に契約開始かつ新ルール有効日前の営業データについて新ルール適用判定
    // 本シナリオでは新ルール有効日（2024-06-01）を基準に判定

    // 新ルール適用時の請求額計算
    // CONTRACT_001: 旧データは新ルール前なので、遡及適用判定により5月分以降のデータのみ新ルール適用
    // 実際の再計算：該当月度なし（5月データ不在） → 再計算対象外
    // CONTRACT_002: 同様に5月以降のデータが必要だが、営業成果が4月までなので再計算対象外

    // 遡及適用対象の判定ロジック：
    // 契約開始日 < 新ルール有効日 かつ 契約終了日 >= 新ルール有効日 かつ 新ルール有効日以降の営業成果あり
    const expectedBackdatedContracts = [];
    const expectedNonBackdatedContracts = ['CONTRACT_001', 'CONTRACT_002', 'CONTRACT_003', 'CONTRACT_004'];
    const expectedRecalculationTargets = [];

    // アサーション：遡及適用対象の契約を確認
    expect(result.backdatedApplicationContracts).toEqual(expectedBackdatedContracts);
    expect(result.backdatedApplicationContracts.length).toBe(0);

    // アサーション：再計算対象外の契約を確認
    expect(result.nonBackdatedContracts.sort()).toEqual(expectedNonBackdatedContracts.sort());
    expect(result.nonBackdatedContracts.length).toBe(4);

    // アサーション：再計算対象として正確に決定された契約の件数
    expect(result.recalculationTargets.length).toBe(0);

    // アサーション：対象外とされた契約が正確に除外されていることを確認
    expect(result.excludedContracts).toContain('CONTRACT_001');
    expect(result.excludedContracts).toContain('CONTRACT_002');
    expect(result.excludedContracts).toContain('CONTRACT_003');
    expect(result.excludedContracts).toContain('CONTRACT_004');

    // 請求額差分の検証（遡及適用対象がない場合は差分なし）
    expect(result.billingAmountDifferences).toEqual([]);

    // ルール変更の有効性確認
    expect(result.ruleChangeValidation.isValid).toBe(true);
    expect(result.ruleChangeValidation.changeReason).toBe('ボーナス単価改定に伴う請求ルール変更');

    // 処理結果サマリーの確認
    expect(result.summary).toEqual({
      totalContractCount: 4,
      backdatedApplicationCount: 0,
      nonBackdatedApplicationCount: 4,
      recalculationRequiredCount: 0,
      totalBillingAmountDifference: 0,
    });
  });
});