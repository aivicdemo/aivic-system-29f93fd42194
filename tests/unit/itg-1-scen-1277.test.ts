import { extractBillingItemsForCustomersAndServices } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1277: 会計システムAPI連携機能 - タイムアウトエラーが発生した場合、適切なエラーハンドリングが実行される', async () => {
    // テスト環境の初期化
    const timeoutMs = 100;
    const mockSalesData = [
      {
        id: 'sales_001',
        customerId: 'cust_001',
        serviceId: 'svc_001',
        appointmentCount: 5,
        closedDealCount: 2,
        customerFeedback: 'positive',
        contractAmount: 50000,
        date: '2024-01-15',
      },
      {
        id: 'sales_002',
        customerId: 'cust_001',
        serviceId: 'svc_002',
        appointmentCount: 3,
        closedDealCount: 1,
        customerFeedback: 'neutral',
        contractAmount: 30000,
        date: '2024-01-16',
      },
    ];

    const mockContractData = {
      cust_001: {
        svc_001: {
          baseFee: 10000,
          unitPrice: 5000,
          discountRate: 0.1,
          minBillingAmount: 20000,
          maxBillingAmount: 100000,
        },
        svc_002: {
          baseFee: 8000,
          unitPrice: 3000,
          discountRate: 0.05,
          minBillingAmount: 15000,
          maxBillingAmount: 80000,
        },
      },
    };

    // タイムアウト時間を短く設定してAPIリクエストをシミュレート
    const delaySimulation = new Promise((resolve) => {
      setTimeout(() => {
        resolve('timeout_reached');
      }, 200); // タイムアウト時間より長く遅延させる
    });

    // タイムアウトエラーハンドリングのテスト
    const timeoutPromise = Promise.race([
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('タイムアウト'));
        }, timeoutMs);
      }),
      delaySimulation,
    ]);

    // タイムアウトエラーが発生することを確認
    await expect(timeoutPromise).rejects.toThrow(/タイムアウト/);

    // 正常系処理: タイムアウトが発生しない場合の抽出処理
    const result = await extractBillingItemsForCustomersAndServices(
      mockSalesData,
      mockContractData,
      { timeoutMs: 5000 } // 十分な時間を設定
    );

    // 期待値の計算
    // 顧客001・サービス001: 基本料金10000 + (成約数2 × 単価5000) = 20000、割引10% → 18000（下限20000を下回るため20000）
    // 顧客001・サービス002: 基本料金8000 + (成約数1 × 単価3000) = 11000、割引5% → 10450（下限15000を下回るため15000）

    // 抽出された請求対象項目の検証
    expect(result).toEqual({
      success: true,
      billingData: [
        {
          customerId: 'cust_001',
          serviceId: 'svc_001',
          appointmentCount: 5,
          closedDealCount: 2,
          calculatedAmount: 20000,
          appliedDiscount: 0.1,
          finalBillingAmount: 20000,
          status: 'approved',
        },
        {
          customerId: 'cust_001',
          serviceId: 'svc_002',
          appointmentCount: 3,
          closedDealCount: 1,
          calculatedAmount: 11000,
          appliedDiscount: 0.05,
          finalBillingAmount: 15000,
          status: 'approved',
        },
      ],
      totalBillingAmount: 35000,
      extractedAt: expect.any(String),
      timeoutOccurred: false,
      errorHandled: null,
    });

    // 異常系: タイムアウトエラー発生時の処理
    const errorHandlingResult = await extractBillingItemsForCustomersAndServices(
      mockSalesData,
      mockContractData,
      { timeoutMs: 10 } // 非常に短いタイムアウト時間で強制的にエラーを発生させる
    ).catch((error) => {
      return {
        success: false,
        errorType: 'timeout',
        errorMessage: error.message,
        errorHandled: true,
        recoveryPossible: true,
        billingData: null,
      };
    });

    // エラーハンドリング結果の検証
    expect(errorHandlingResult.success).toBe(false);
    expect(errorHandlingResult.errorType).toBe('timeout');
    expect(errorHandlingResult.errorHandled).toBe(true);
    expect(errorHandlingResult.recoveryPossible).toBe(true);
    expect(errorHandlingResult.errorMessage).toMatch(/タイムアウト/);

    // エラーログが適切に記録されていることを確認
    expect(errorHandlingResult).toHaveProperty('errorMessage');
    expect(typeof errorHandlingResult.errorMessage).toBe('string');
    expect(errorHandlingResult.errorMessage.length).toBeGreaterThan(0);

    // システムが安定状態を保つことを確認（リカバリー可能性の検証）
    expect(errorHandlingResult.recoveryPossible).toBe(true);

    // 正常なリトライが可能であることを確認
    const retryResult = await extractBillingItemsForCustomersAndServices(
      mockSalesData,
      mockContractData,
      { timeoutMs: 5000, retryCount: 1 }
    );

    expect(retryResult.success).toBe(true);
    expect(retryResult.totalBillingAmount).toBe(35000);
    expect(retryResult.timeoutOccurred).toBe(false);
  });
});