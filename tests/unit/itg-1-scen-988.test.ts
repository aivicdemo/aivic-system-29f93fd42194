import { recalculateAndModifyBillingAmount } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-988: [normal] 請求内容の再計算・修正判定 - 修正が必要と判定された場合、新請求額が修正ルール適用で正確に算出される
  test('修正が必要と判定された請求について、修正ルールが正確に適用され、新請求額が期待される金額で正確に算出されること', () => {
    // テストデータ準備: 修正が必要と判定された請求レコード
    const currentBillingAmount = 100000; // 現在の請求額（税抜）
    const taxRate = 0.1; // 税率 10%
    const discountRate = 0.05; // 割引率 5%
    const handlingFeeRate = 0.02; // 手数料率 2%

    // 修正ルール適用の判定基準
    const modificationReason = 'contract_change'; // 契約変更によるため修正が必要
    const isModificationRequired = true;

    // 修正ルールパラメータ
    const modificationRules = {
      baseAmount: 95000, // 修正後の基本額（割引適用後）
      appliedDiscountRate: 0.05, // 適用された割引率
      appliedTaxRate: 0.1, // 適用された税率
      appliedHandlingFeeRate: 0.02, // 適用された手数料率
      modificationTimestamp: '2024-01-20T10:30:00Z',
      previousAmount: 100000,
    };

    // 期待される新請求額の計算:
    // 基本額: 95000
    // 手数料: 95000 * 0.02 = 1900
    // 小計: 95000 + 1900 = 96900
    // 税金: 96900 * 0.1 = 9690
    // 新請求額（税込）: 96900 + 9690 = 106590
    const expectedNewBillingAmount = 106590;

    // 修正前後の差異
    const expectedAmountDifference = 106590 - 110000; // 現在額は税込み 110000 と仮定
    // 現在額計算: 100000 * (1 + 0.1) = 110000（税込）

    // 請求内容の再計算・修正判定ロジック実行
    const result = recalculateAndModifyBillingAmount({
      billingId: 'BILL-2024-001',
      customerId: 'CUST-001',
      currentAmount: currentBillingAmount,
      taxRate: taxRate,
      discountRate: discountRate,
      handlingFeeRate: handlingFeeRate,
      isModificationRequired: isModificationRequired,
      modificationReason: modificationReason,
      modificationRules: modificationRules,
    });

    // アサーション: 修正が必要と判定されたことを確認
    expect(result.modificationRequired).toBe(true);

    // アサーション: 新請求額が期待値と一致することを検証
    expect(result.newBillingAmount).toBe(expectedNewBillingAmount);

    // アサーション: 修正前後の金額差異が記録されていることを確認
    expect(result.amountDifference).toBe(expectedAmountDifference);

    // アサーション: 適用されたルールが記録されていることを確認
    expect(result.appliedRules).toEqual({
      discountRate: 0.05,
      taxRate: 0.1,
      handlingFeeRate: 0.02,
    });

    // アサーション: 修正日時が正確に記録されていることを確認
    expect(result.modificationTimestamp).toBe('2024-01-20T10:30:00Z');

    // アサーション: 修正理由が正確に記録されていることを確認
    expect(result.modificationReasonText).toBe('contract_change');

    // アサーション: 修正履歴オブジェクトが適切に構造化されていることを確認
    expect(result.modificationHistory).toEqual({
      previousAmount: 100000,
      newAmount: expectedNewBillingAmount,
      amountDifference: expectedAmountDifference,
      reason: 'contract_change',
      appliedRules: {
        discountRate: 0.05,
        taxRate: 0.1,
        handlingFeeRate: 0.02,
      },
      timestamp: '2024-01-20T10:30:00Z',
      recordedBy: 'system',
    });

    // アサーション: 修正ステータスが「修正完了」に更新されていることを確認
    expect(result.status).toBe('modified_completed');

    // アサーション: 新請求額の計算精度が正確（小数点以下の四捨五入）であることを確認
    expect(result.newBillingAmount % 1).toBeLessThanOrEqual(0); // 整数値であることを確認

    // アサーション: 修正対象の請求IDが正確に保持されていることを確認
    expect(result.billingId).toBe('BILL-2024-001');

    // アサーション: 顧客IDが正確に保持されていることを確認
    expect(result.customerId).toBe('CUST-001');
  });
});