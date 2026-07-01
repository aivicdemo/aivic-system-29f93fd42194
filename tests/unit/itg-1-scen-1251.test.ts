import { updateContractWithBillingItems } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  // SCEN-1251
  test('複数の請求対象項目を含む契約変更がすべて正確に更新される', () => {
    // 【入力】既存の契約データ（複数の請求対象項目を含む）
    const contractId = 'CONTRACT-20240115-001';
    const customerId = 'CUST-1001';
    const serviceName = 'コンサルティングサービス';
    
    // 【契約変更前のデータ】
    const originalContractData = {
      contractId: contractId,
      customerId: customerId,
      serviceName: serviceName,
      contractAmount: 100000,
      contractPeriodStart: '2024-01-01T00:00:00Z',
      contractPeriodEnd: '2024-12-31T23:59:59Z',
      billingFrequency: 'MONTHLY',
      billingAddress: 'Tokyo-01',
      billingContactEmail: 'contact@customer.example.com',
      discountRate: 0,
      minimumBillingAmount: 50000,
      maximumBillingAmount: 150000,
      lastUpdatedAt: '2024-01-01T09:00:00Z',
      lastUpdatedBy: 'OPERATOR-001'
    };

    // 【契約変更入力】複数の請求対象項目を同時に変更
    const updateInput = {
      contractId: contractId,
      changes: {
        contractAmount: 150000,  // 100,000円 → 150,000円
        billingFrequency: 'QUARTERLY',  // 月次 → 四半期
        billingAddress: 'Osaka-02',  // 請求先変更
        discountRate: 0.1,  // 割引率10%を適用
        minimumBillingAmount: 75000  // 最小請求額の変更
      },
      changedBy: 'OPERATOR-001',
      changedAt: '2024-01-15T11:00:00Z'
    };

    // 【実行】契約データ更新処理
    const result = updateContractWithBillingItems(originalContractData, updateInput);

    // 【期待結果の具体値計算】
    // 割引後請求額 = 150,000 × (1 - 0.1) = 150,000 × 0.9 = 135,000
    // 最小請求額との比較: max(135,000, 75,000) = 135,000
    const expectedFinalBillingAmount = 135000;

    // 【検証1】確認画面に変更されたすべての項目が正確に表示されること
    expect(result.confirmationScreen).toBeDefined();
    expect(result.confirmationScreen.contractId).toBe(contractId);
    expect(result.confirmationScreen.contractAmount).toBe(150000);
    expect(result.confirmationScreen.billingFrequency).toBe('QUARTERLY');
    expect(result.confirmationScreen.billingAddress).toBe('Osaka-02');
    expect(result.confirmationScreen.discountRate).toBe(0.1);
    expect(result.confirmationScreen.minimumBillingAmount).toBe(75000);

    // 【検証2】変更前後の差分が記録されていること
    expect(result.confirmationScreen.changeSummary).toEqual({
      contractAmount: { before: 100000, after: 150000 },
      billingFrequency: { before: 'MONTHLY', after: 'QUARTERLY' },
      billingAddress: { before: 'Tokyo-01', after: 'Osaka-02' },
      discountRate: { before: 0, after: 0.1 },
      minimumBillingAmount: { before: 50000, after: 75000 }
    });

    // 【検証3】変更確定後、保存されたデータベース反映内容
    const savedData = result.savedContract;
    expect(savedData.contractId).toBe(contractId);
    expect(savedData.customerId).toBe(customerId);
    expect(savedData.contractAmount).toBe(150000);
    expect(savedData.billingFrequency).toBe('QUARTERLY');
    expect(savedData.billingAddress).toBe('Osaka-02');
    expect(savedData.discountRate).toBe(0.1);
    expect(savedData.minimumBillingAmount).toBe(75000);

    // 【検証4】請求関連の計算が正確に反映されていること
    expect(savedData.calculatedBillingAmount).toBe(expectedFinalBillingAmount);

    // 【検証5】最終更新情報が記録されていること
    expect(savedData.lastUpdatedAt).toBe('2024-01-15T11:00:00Z');
    expect(savedData.lastUpdatedBy).toBe('OPERATOR-001');

    // 【検証6】変更履歴テーブルに記録が追加されていること
    expect(result.changeHistory).toBeDefined();
    expect(result.changeHistory.length).toBe(5);  // 5項目変更
    expect(result.changeHistory[0]).toEqual({
      changeId: expect.any(String),
      contractId: contractId,
      fieldName: 'contractAmount',
      beforeValue: 100000,
      afterValue: 150000,
      changedAt: '2024-01-15T11:00:00Z',
      changedBy: 'OPERATOR-001'
    });

    // 【検証7】請求関連の後続処理フラグが正常に設定されていること
    expect(result.billingProcessStatus).toEqual({
      requiresRecalculation: true,
      recalculationReason: '契約条件変更による請求額再計算',
      scheduleRecalculationDate: '2024-02-01T09:00:00Z',
      status: 'SCHEDULED'
    });

    // 【検証8】エラーが発生していないこと
    expect(result.isSuccessful).toBe(true);
    expect(result.errorMessage).toBeNull();

    // 【検証9】更新前後の契約内容の整合性確認
    expect(result.validationResult).toEqual({
      allRequiredFieldsPresent: true,
      dataTypeValidation: true,
      valueRangeValidation: true,
      logicalConsistency: true,
      contractPeriodValid: true,
      billingAmountValid: true
    });

    // 【検証10】請求金額の妥当性判定（最大請求額との比較）
    expect(savedData.calculatedBillingAmount).toBeLessThanOrEqual(150000);
    expect(savedData.calculatedBillingAmount).toBeGreaterThanOrEqual(75000);
  });
});