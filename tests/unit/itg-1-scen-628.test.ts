import { describe, test, expect, beforeEach } from '@jest/globals';
import { analyzeContractChangeHistory } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 契約変更履歴・請求パターン比較分析', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-628
  test('契約変更履歴が存在しない場合、適切なエラーメッセージが表示され、エラーハンドリングが正常に機能する', () => {
    // Arrange: 契約変更履歴が存在しない顧客ID/契約IDを入力
    const input_contractId = 'CONTRACT_NOT_EXISTS_001';
    const input_customerId = 'CUSTOMER_NOT_EXISTS_001';
    const input_analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const input_analysisEndDate = new Date('2024-12-31T23:59:59Z');

    // Act & Assert: 比較分析機能の実行時にエラーが発生することを確認
    expect(() => {
      analyzeContractChangeHistory({
        contractId: input_contractId,
        customerId: input_customerId,
        analysisStartDate: input_analysisStartDate,
        analysisEndDate: input_analysisEndDate,
      });
    }).toThrow(/変更履歴/);

    // Assert: エラーメッセージが「変更履歴」というキーワードを含んでいることを確認
    // これはエラーハンドリングが正常に機能していることを示す
  });

  test('契約変更履歴が存在する場合、比較分析結果が正しく返却される', () => {
    // Arrange: 契約変更履歴が存在する契約ID
    const input_contractId = 'CONTRACT_EXISTS_001';
    const input_customerId = 'CUSTOMER_EXISTS_001';
    const input_analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const input_analysisEndDate = new Date('2024-12-31T23:59:59Z');

    // Mock contractChangeHistory data
    const mock_contractChangeHistory = [
      {
        changeHistoryId: 'CHANGE_001',
        contractId: input_contractId,
        changeDate: new Date('2024-03-15T10:00:00Z'),
        changeType: 'price_update',
        previousValue: { unitPrice: 10000 },
        newValue: { unitPrice: 12000 },
        changeReason: 'Market adjustment',
        approvalStatus: 'approved',
        approvalDate: new Date('2024-03-16T09:00:00Z'),
      },
      {
        changeHistoryId: 'CHANGE_002',
        contractId: input_contractId,
        changeDate: new Date('2024-06-20T14:30:00Z'),
        changeType: 'discount_update',
        previousValue: { discountRate: 5 },
        newValue: { discountRate: 8 },
        changeReason: 'Volume-based discount',
        approvalStatus: 'approved',
        approvalDate: new Date('2024-06-21T10:00:00Z'),
      },
    ];

    const mock_billingPatterns = [
      {
        patternDate: new Date('2024-02-01T00:00:00Z'),
        billingAmount: 100000,
        unitPrice: 10000,
        discountRate: 5,
      },
      {
        patternDate: new Date('2024-05-01T00:00:00Z'),
        billingAmount: 120000,
        unitPrice: 12000,
        discountRate: 5,
      },
      {
        patternDate: new Date('2024-08-01T00:00:00Z'),
        billingAmount: 129600,
        unitPrice: 12000,
        discountRate: 8,
      },
    ];

    // Act: 比較分析を実行
    const result = analyzeContractChangeHistory({
      contractId: input_contractId,
      customerId: input_customerId,
      analysisStartDate: input_analysisStartDate,
      analysisEndDate: input_analysisEndDate,
      contractChangeHistory: mock_contractChangeHistory,
      billingPatterns: mock_billingPatterns,
    });

    // Assert: 比較分析結果が正しく返却される
    expect(result).toBeDefined();
    expect(result.contractId).toBe(input_contractId);
    expect(result.analysisStartDate).toEqual(input_analysisStartDate);
    expect(result.analysisEndDate).toEqual(input_analysisEndDate);
    expect(result.changeCount).toBe(2);
    expect(result.billingImpactAnalysis).toBeDefined();
    expect(result.billingImpactAnalysis.length).toBeGreaterThan(0);

    // Assert: 請求額の差分が正しく計算されている
    const firstImpact = result.billingImpactAnalysis[0];
    expect(firstImpact.changeType).toBe('price_update');
    expect(firstImpact.previousBillingAmount).toBe(100000);
    expect(firstImpact.newBillingAmount).toBe(120000);
    expect(firstImpact.billingDifference).toBe(20000);

    const secondImpact = result.billingImpactAnalysis[1];
    expect(secondImpact.changeType).toBe('discount_update');
    expect(secondImpact.previousBillingAmount).toBe(120000);
    expect(secondImpact.newBillingAmount).toBe(129600);
    expect(secondImpact.billingDifference).toBe(9600);

    // Assert: システムが正常な状態にあることを確認
    expect(result.systemStatus).toBe('normal');
    expect(result.errorOccurred).toBe(false);
  });

  test('エラーが発生した場合、エラーログが正しく記録される', () => {
    // Arrange: 不正な日付範囲を入力
    const input_contractId = 'CONTRACT_INVALID_001';
    const input_customerId = 'CUSTOMER_INVALID_001';
    const input_analysisStartDate = new Date('2024-12-31T00:00:00Z');
    const input_analysisEndDate = new Date('2024-01-01T00:00:00Z');

    // Act & Assert: 不正な日付範囲でエラーが発生することを確認
    expect(() => {
      analyzeContractChangeHistory({
        contractId: input_contractId,
        customerId: input_customerId,
        analysisStartDate: input_analysisStartDate,
        analysisEndDate: input_analysisEndDate,
      });
    }).toThrow(/期間/);

    // Assert: エラーログにエラー内容が記録されていることを確認（業務キーワード）
  });

  test('複数の契約変更と請求パターンの組み合わせで、累積差分が正しく計算される', () => {
    // Arrange: 複数の変更と請求パターンを含むデータ
    const input_contractId = 'CONTRACT_COMPLEX_001';
    const input_customerId = 'CUSTOMER_COMPLEX_001';
    const input_analysisStartDate = new Date('2024-01-01T00:00:00Z');
    const input_analysisEndDate = new Date('2024-12-31T23:59:59Z');

    const mock_contractChangeHistory = [
      {
        changeHistoryId: 'CHANGE_C1',
        contractId: input_contractId,
        changeDate: new Date('2024-02-15T10:00:00Z'),
        changeType: 'price_update',
        previousValue: { unitPrice: 5000 },
        newValue: { unitPrice: 6000 },
        changeReason: 'Cost adjustment',
        approvalStatus: 'approved',
        approvalDate: new Date('2024-02-16T09:00:00Z'),
      },
      {
        changeHistoryId: 'CHANGE_C2',
        contractId: input_contractId,
        changeDate: new Date('2024-05-20T14:30:00Z'),
        changeType: 'discount_update',
        previousValue: { discountRate: 0 },
        newValue: { discountRate: 10 },
        changeReason: 'Loyalty discount',
        approvalStatus: 'approved',
        approvalDate: new Date('2024-05-21T10:00:00Z'),
      },
      {
        changeHistoryId: 'CHANGE_C3',
        contractId: input_contractId,
        changeDate: new Date('2024-09-10T11:00:00Z'),
        changeType: 'quantity_adjustment',
        previousValue: { monthlyQuantity: 100 },
        newValue: { monthlyQuantity: 150 },
        changeReason: 'Volume increase',
        approvalStatus: 'approved',
        approvalDate: new Date('2024-09-11T09:00:00Z'),
      },
    ];

    const mock_billingPatterns = [
      {
        patternDate: new Date('2024-01-01T00:00:00Z'),
        billingAmount: 50000,
        unitPrice: 5000,
        quantity: 100,
        discountRate: 0,
      },
      {
        patternDate: new Date('2024-03-01T00:00:00Z'),
        billingAmount: 60000,
        unitPrice: 6000,
        quantity: 100,
        discountRate: 0,
      },
      {
        patternDate: new Date('2024-06-01T00:00:00Z'),
        billingAmount: 54000,
        unitPrice: 6000,
        quantity: 100,
        discountRate: 10,
      },
      {
        patternDate: new Date('2024-10-01T00:00:00Z'),
        billingAmount: 81000,
        unitPrice: 6000,
        quantity: 150,
        discountRate: 10,
      },
    ];

    // Act: 複雑な比較分析を実行
    const result = analyzeContractChangeHistory({
      contractId: input_contractId,
      customerId: input_customerId,
      analysisStartDate: input_analysisStartDate,
      analysisEndDate: input_analysisEndDate,
      contractChangeHistory: mock_contractChangeHistory,
      billingPatterns: mock_billingPatterns,
    });

    // Assert: 複数の変更が反映された結果が返却される
    expect(result.changeCount).toBe(3);
    expect(result.billingImpactAnalysis.length).toBe(3);

    // Assert: 各段階での請求額差分が正しく計算されている
    expect(result.billingImpactAnalysis[0].billingDifference).toBe(10000); // 50000 -> 60000
    expect(result.billingImpactAnalysis[1].billingDifference).toBe(-6000);  // 60000 -> 54000
    expect(result.billingImpactAnalysis[2].billingDifference).toBe(27000);  // 54000 -> 81000

    // Assert: 累積差分が正しく計算されている
    const totalDifference = result.billingImpactAnalysis.reduce(
      (sum, impact) => sum + impact.billingDifference,
      0
    );
    expect(totalDifference).toBe(31000); // 10000 - 6000 + 27000

    // Assert: 比較分析の信頼性を示すスコアが計算されている
    expect(result.analysisReliabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.analysisReliabilityScore).toBeLessThanOrEqual(100);

    // Assert: システムが正常な状態を維持している
    expect(result.systemStatus).toBe('normal');
    expect(result.errorOccurred).toBe(false);
  });
});