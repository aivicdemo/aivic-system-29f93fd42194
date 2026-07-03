import { describe, test, expect } from '@jest/globals';
import { validateAndProcessSalesData } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1091: [normal] ドキュメント反映・更新機能 - 発見された例外ケースと改善点がドキュメントに反映され、次回業務で同一誤りが検出されない
  test('ドキュメント反映後、同一条件のテストデータが正常に処理される', () => {
    // 前提: 新入スタッフの実行結果が確認・検証され、例外ケースと改善点がドキュメントに反映されている状態
    // トリガー: 前回と同一条件のテストデータをシステムに入力して処理する
    // 期待結果: ドキュメント反映による改善が適用され、同一誤りが検出されず、請求自動化処理が正常に完了

    // テストデータ: 前回エラーが検出された営業データ（日付・金額の矛盾）
    const salesData = {
      customerId: 'CUST-001',
      salesPersonId: 'SP-001',
      contactDate: '2024-01-15',
      contactTime: '14:30',
      serviceType: 'PREMIUM',
      appointmentCount: 3,
      agreementCount: 2,
      customerFeedback: 'positive',
      contractAmount: 150000,
      invoicingAmount: 150000,
      billingRuleVersion: 'v2.1',
      documentReviewDate: '2024-01-20T09:00:00Z',
      exceptionCasesDocumented: true,
      improvementPointsDocumented: true,
    };

    // 検証ルール: ドキュメント反映後の改善版ルール
    const validationRules = {
      requiredFields: ['customerId', 'salesPersonId', 'contactDate', 'serviceType', 'appointmentCount', 'agreementCount', 'contractAmount', 'invoicingAmount'],
      dataTypeValidation: {
        customerId: 'string',
        appointmentCount: 'number',
        agreementCount: 'number',
        contractAmount: 'number',
        invoicingAmount: 'number',
      },
      rangeValidation: {
        appointmentCount: { min: 0, max: 100 },
        agreementCount: { min: 0, max: 100 },
        contractAmount: { min: 0, max: 10000000 },
        invoicingAmount: { min: 0, max: 10000000 },
      },
      consistencyRules: [
        {
          rule: 'agreementCountNotGreaterThanAppointmentCount',
          condition: (data: any) => data.agreementCount <= data.appointmentCount,
        },
        {
          rule: 'invoicingAmountNotGreaterThanContractAmount',
          condition: (data: any) => data.invoicingAmount <= data.contractAmount,
        },
        {
          rule: 'contactDateBeforeTodayOrToday',
          condition: (data: any) => new Date(data.contactDate) <= new Date('2024-01-20'),
        },
      ],
      exceptionHandling: {
        allowZeroAppointmentIfDocumented: true,
        allowInvoicingAmountEqualToContractAmount: true,
      },
    };

    // 処理実行
    const result = validateAndProcessSalesData(salesData, validationRules);

    // 期待結果の検証
    // 1. バリデーション成功
    expect(result.validationStatus).toBe('PASSED');

    // 2. 異常値が検出されない（前回検出された矛盾が修正されている）
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);

    // 3. 処理が正常に完了
    expect(result.processingStatus).toBe('COMPLETED');

    // 4. 請求額が正確に計算されている
    expect(result.calculatedBillingAmount).toBe(150000);

    // 5. ドキュメント反映による改善が適用されたことが記録されている
    expect(result.documentReflectionApplied).toBe(true);
    expect(result.exceptionCaseHandled).toBe(false); // 例外ケースが発生していない
    expect(result.improvementRuleApplied).toBe(true);

    // 6. 処理ログに改善履歴が記録されている
    expect(result.processingLog).toContain('document_improvement_applied');
    expect(result.processingLog).not.toContain('exception_case_detected');

    // 7. 顧客別・サービス別の請求額集計が正確である
    expect(result.billingAggregation).toEqual({
      customerId: 'CUST-001',
      serviceType: 'PREMIUM',
      totalBillingAmount: 150000,
      aggregationTimestamp: expect.any(String),
    });

    // 8. 前回検出された矛盾（例: 成約数 > アポ数、請求額 > 契約額）が再発していない
    expect(result.agreementCountExceedsAppointmentCount).toBe(false);
    expect(result.invoicingAmountExceedsContractAmount).toBe(false);

    // 9. 検証完了タイムスタンプが記録されている
    expect(result.validationCompletedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 10. 処理全体の完了ステータスが確認できる
    expect(result.overallStatus).toBe('SUCCESS');
  });
});