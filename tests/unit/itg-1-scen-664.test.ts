import { validateReportApprovalCriteria } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理 - レポート承認基準検証', () => {
  // SCEN-664: [error] レポート承認基準検証機能 - レポート内容が承認基準の一部に違反する場合、差戻し理由が正確に識別される
  test('承認基準違反を正確に識別し、詳細な差戻し理由を返却する', () => {
    const approvalCriteria = [
      {
        criteriaId: 'SALES_AMOUNT_RANGE',
        criteriaName: '売上金額範囲',
        minValue: 100000,
        maxValue: 5000000,
        dataType: 'number'
      },
      {
        criteriaId: 'CUSTOMER_CODE_FORMAT',
        criteriaName: '顧客コード形式',
        pattern: '^CUST[0-9]{6}$',
        dataType: 'string'
      },
      {
        criteriaId: 'REPORT_COMPLETION_RATE',
        criteriaName: 'レポート完成度',
        minValue: 80,
        maxValue: 100,
        dataType: 'number'
      },
      {
        criteriaId: 'REQUIRED_FIELDS',
        criteriaName: '必須項目',
        requiredFields: ['reportDate', 'salesAmount', 'customerCode', 'approvalStatus'],
        dataType: 'array'
      }
    ];

    const reportContent = {
      reportDate: '2024-01-15',
      salesAmount: 50000,
      customerCode: 'INVALID-CODE',
      approvalStatus: 'pending',
      completionRate: 75
    };

    const result = validateReportApprovalCriteria({
      approvalCriteria,
      reportContent
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toHaveLength(3);

    const salesAmountViolation = result.violations.find(
      (v: any) => v.criteriaId === 'SALES_AMOUNT_RANGE'
    );
    expect(salesAmountViolation).toBeDefined();
    expect(salesAmountViolation.criteriaName).toBe('売上金額範囲');
    expect(salesAmountViolation.violationType).toBe('OUT_OF_RANGE');
    expect(salesAmountViolation.expectedRange).toEqual({
      min: 100000,
      max: 5000000
    });
    expect(salesAmountViolation.actualValue).toBe(50000);
    expect(salesAmountViolation.message).toBe(
      '売上金額は100000以上5000000以下である必要があります。実際の値: 50000'
    );

    const customerCodeViolation = result.violations.find(
      (v: any) => v.criteriaId === 'CUSTOMER_CODE_FORMAT'
    );
    expect(customerCodeViolation).toBeDefined();
    expect(customerCodeViolation.criteriaName).toBe('顧客コード形式');
    expect(customerCodeViolation.violationType).toBe('FORMAT_MISMATCH');
    expect(customerCodeViolation.expectedPattern).toBe('^CUST[0-9]{6}$');
    expect(customerCodeViolation.actualValue).toBe('INVALID-CODE');
    expect(customerCodeViolation.message).toBe(
      '顧客コード形式が正しくありません。期待形式: ^CUST[0-9]{6}$、実際の値: INVALID-CODE'
    );

    const completionRateViolation = result.violations.find(
      (v: any) => v.criteriaId === 'REPORT_COMPLETION_RATE'
    );
    expect(completionRateViolation).toBeDefined();
    expect(completionRateViolation.criteriaName).toBe('レポート完成度');
    expect(completionRateViolation.violationType).toBe('OUT_OF_RANGE');
    expect(completionRateViolation.expectedRange).toEqual({
      min: 80,
      max: 100
    });
    expect(completionRateViolation.actualValue).toBe(75);
    expect(completionRateViolation.message).toBe(
      'レポート完成度は80以上100以下である必要があります。実際の値: 75'
    );

    expect(result.rejectionReasons).toBe(
      '以下の承認基準を満たしていません: 売上金額範囲 (売上金額は100000以上5000000以下である必要があります。実際の値: 50000), 顧客コード形式 (顧客コード形式が正しくありません。期待形式: ^CUST[0-9]{6}$、実際の値: INVALID-CODE), レポート完成度 (レポート完成度は80以上100以下である必要があります。実際の値: 75)'
    );
  });

  // 補助テスト: 単一違反ケース
  test('単一の承認基準違反を正確に識別する', () => {
    const approvalCriteria = [
      {
        criteriaId: 'SALES_AMOUNT_RANGE',
        criteriaName: '売上金額範囲',
        minValue: 100000,
        maxValue: 5000000,
        dataType: 'number'
      }
    ];

    const reportContent = {
      salesAmount: 6000000
    };

    const result = validateReportApprovalCriteria({
      approvalCriteria,
      reportContent
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].criteriaId).toBe('SALES_AMOUNT_RANGE');
    expect(result.violations[0].actualValue).toBe(6000000);
    expect(result.violations[0].expectedRange.max).toBe(5000000);
  });

  // 補助テスト: すべての基準を満たすケース
  test('すべての承認基準を満たす場合は合格を返却する', () => {
    const approvalCriteria = [
      {
        criteriaId: 'SALES_AMOUNT_RANGE',
        criteriaName: '売上金額範囲',
        minValue: 100000,
        maxValue: 5000000,
        dataType: 'number'
      },
      {
        criteriaId: 'CUSTOMER_CODE_FORMAT',
        criteriaName: '顧客コード形式',
        pattern: '^CUST[0-9]{6}$',
        dataType: 'string'
      },
      {
        criteriaId: 'REPORT_COMPLETION_RATE',
        criteriaName: 'レポート完成度',
        minValue: 80,
        maxValue: 100,
        dataType: 'number'
      }
    ];

    const reportContent = {
      salesAmount: 2500000,
      customerCode: 'CUST123456',
      completionRate: 95
    };

    const result = validateReportApprovalCriteria({
      approvalCriteria,
      reportContent
    });

    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.rejectionReasons).toBe('');
  });

  // 補助テスト: 必須項目欠落
  test('必須項目が欠落している場合、欠落項目を明示する', () => {
    const approvalCriteria = [
      {
        criteriaId: 'REQUIRED_FIELDS',
        criteriaName: '必須項目',
        requiredFields: ['reportDate', 'salesAmount', 'customerCode'],
        dataType: 'array'
      }
    ];

    const reportContent = {
      reportDate: '2024-01-15',
      customerCode: 'CUST123456'
    };

    const result = validateReportApprovalCriteria({
      approvalCriteria,
      reportContent
    });

    expect(result.isValid).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].criteriaId).toBe('REQUIRED_FIELDS');
    expect(result.violations[0].violationType).toBe('MISSING_REQUIRED_FIELDS');
    expect(result.violations[0].missingFields).toEqual(['salesAmount']);
  });
});