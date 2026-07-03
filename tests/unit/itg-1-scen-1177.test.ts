import { validateReportAccuracyJudgment } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1177: [error] レポート数値の正確性合否判定機能 - 必須の判定根拠データが不足している場合、エラーを返す
  test('必須の判定根拠データが不足している場合、エラーを返す', () => {
    const reportData = {
      reportId: 'RPT-2024-001',
      customerId: 'CUST-001',
      reportMonth: '2024-01-01',
      reportValues: {
        appointmentCount: 10,
        contractCount: 3,
        revenue: 500000,
      },
    };

    const requiredFoundationData = {
      salesDetails: null, // 売上明細が未入力
      invoiceInfo: {
        invoiceId: 'INV-2024-001',
        amount: 500000,
        issueDate: '2024-01-15',
      },
      contractInfo: {
        contractId: 'CON-2024-001',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        serviceType: 'sales',
      },
    };

    expect(() =>
      validateReportAccuracyJudgment({
        reportData,
        foundationData: requiredFoundationData,
      })
    ).toThrow(/売上明細/);
  });

  test('複数の必須判定根拠データが不足している場合、エラーを返す', () => {
    const reportData = {
      reportId: 'RPT-2024-002',
      customerId: 'CUST-002',
      reportMonth: '2024-02-01',
      reportValues: {
        appointmentCount: 15,
        contractCount: 5,
        revenue: 750000,
      },
    };

    const requiredFoundationData = {
      salesDetails: undefined, // 売上明細が未定義
      invoiceInfo: null, // 請求書情報が未入力
      contractInfo: {
        contractId: 'CON-2024-002',
        startDate: '2024-02-01',
        endDate: '2024-12-31',
        serviceType: 'sales',
      },
    };

    expect(() =>
      validateReportAccuracyJudgment({
        reportData,
        foundationData: requiredFoundationData,
      })
    ).toThrow(/請求書情報|売上明細/);
  });

  test('判定根拠データが完全に揃っている場合、合否判定を実行する', () => {
    const reportData = {
      reportId: 'RPT-2024-003',
      customerId: 'CUST-003',
      reportMonth: '2024-03-01',
      reportValues: {
        appointmentCount: 8,
        contractCount: 2,
        revenue: 400000,
      },
    };

    const requiredFoundationData = {
      salesDetails: {
        detailId: 'SD-2024-001',
        items: [
          {
            itemId: 'ITEM-001',
            description: 'Service A',
            quantity: 2,
            unitPrice: 200000,
            amount: 400000,
          },
        ],
        totalAmount: 400000,
      },
      invoiceInfo: {
        invoiceId: 'INV-2024-003',
        amount: 400000,
        issueDate: '2024-03-15',
      },
      contractInfo: {
        contractId: 'CON-2024-003',
        startDate: '2024-03-01',
        endDate: '2024-12-31',
        serviceType: 'sales',
        unitPrice: 200000,
      },
    };

    const result = validateReportAccuracyJudgment({
      reportData,
      foundationData: requiredFoundationData,
    });

    expect(result).toEqual({
      judgeId: expect.any(String),
      reportId: 'RPT-2024-003',
      customerId: 'CUST-003',
      judgmentStatus: 'accurate',
      accuracy: 100,
      foundationDataPresent: true,
      discrepancies: [],
      executedAt: expect.any(String),
    });
  });

  test('契約情報が不足している場合、エラーを返す', () => {
    const reportData = {
      reportId: 'RPT-2024-004',
      customerId: 'CUST-004',
      reportMonth: '2024-04-01',
      reportValues: {
        appointmentCount: 12,
        contractCount: 4,
        revenue: 600000,
      },
    };

    const requiredFoundationData = {
      salesDetails: {
        detailId: 'SD-2024-002',
        items: [
          {
            itemId: 'ITEM-002',
            description: 'Service B',
            quantity: 4,
            unitPrice: 150000,
            amount: 600000,
          },
        ],
        totalAmount: 600000,
      },
      invoiceInfo: {
        invoiceId: 'INV-2024-004',
        amount: 600000,
        issueDate: '2024-04-15',
      },
      contractInfo: null, // 契約情報が未入力
    };

    expect(() =>
      validateReportAccuracyJudgment({
        reportData,
        foundationData: requiredFoundationData,
      })
    ).toThrow(/契約情報/);
  });

  test('判定根拠データの値が不正な場合、エラーを返す', () => {
    const reportData = {
      reportId: 'RPT-2024-005',
      customerId: 'CUST-005',
      reportMonth: '2024-05-01',
      reportValues: {
        appointmentCount: 6,
        contractCount: 1,
        revenue: 300000,
      },
    };

    const requiredFoundationData = {
      salesDetails: {
        detailId: 'SD-2024-003',
        items: [
          {
            itemId: 'ITEM-003',
            description: 'Service C',
            quantity: 1,
            unitPrice: 300000,
            amount: 300000,
          },
        ],
        totalAmount: 300000,
      },
      invoiceInfo: {
        invoiceId: 'INV-2024-005',
        amount: 350000, // 売上明細との金額不一致
        issueDate: '2024-05-15',
      },
      contractInfo: {
        contractId: 'CON-2024-005',
        startDate: '2024-05-01',
        endDate: '2024-12-31',
        serviceType: 'sales',
        unitPrice: 300000,
      },
    };

    expect(() =>
      validateReportAccuracyJudgment({
        reportData,
        foundationData: requiredFoundationData,
      })
    ).toThrow(/金額|不一致/);
  });
});