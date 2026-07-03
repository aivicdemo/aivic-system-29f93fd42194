import { validateSalesDataForReportGeneration } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-725: [normal] 月次レポート生成前の最終検証機能 - 確定・承認済みデータが最終確認をパスし、レポート生成対象として確定される
  test('確定・承認済みデータが最終検証をすべてパスし、レポート生成対象として確定状態に遷移する', () => {
    // Precondition: 営業データが品質基準チェックを通過し、確定・承認された状態
    const approvedSalesData = {
      dataSetId: 'ds_202401_001',
      periodStartDate: '2024-01-01',
      periodEndDate: '2024-01-31',
      status: 'approved',
      customers: [
        {
          customerId: 'cust_A001',
          customerName: 'Customer A Corporation',
          serviceType: 'service_basic',
          appointmentCount: 15,
          contractAmount: 150000,
          achievementRate: 0.95,
        },
        {
          customerId: 'cust_B002',
          customerName: 'Customer B Limited',
          serviceType: 'service_premium',
          appointmentCount: 22,
          contractAmount: 220000,
          achievementRate: 1.05,
        },
      ],
      totalRecords: 2,
      validationRuleVersion: 'v1.2.1',
      approvalDate: '2024-02-01T10:30:00Z',
      approverName: 'Manager Taro',
    };

    // Trigger: 代表兼営業オペレーターが月次レポート生成前の最終検証機能を実行する
    const validationResult = validateSalesDataForReportGeneration(approvedSalesData);

    // Outcome (期待結果)
    // 1. 検証結果が成功と表示されること
    expect(validationResult.isValid).toBe(true);

    // 2. 検証完了ステータスが「適合」であること
    expect(validationResult.status).toBe('compliant');

    // 3. 対象データが月次レポート生成の処理対象として登録されていることを確認
    expect(validationResult.readyForReportGeneration).toBe(true);

    // 4. 検証スコアが 100% (すべての検証項目をパス) であること
    expect(validationResult.complianceScore).toBe(100);

    // 5. 必須項目の存在確認が完了していること
    expect(validationResult.mandatoryFieldsChecked).toBe(true);

    // 6. データの整合性チェックが完了していること
    expect(validationResult.integrityCheckCompleted).toBe(true);

    // 7. レポート生成対象として確定状態に遷移したことを確認
    expect(validationResult.reportGenerationQueueStatus).toBe('queued_for_generation');

    // 8. 検証実行日時がISO形式で記録されていること
    expect(validationResult.validationExecutedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 9. 生成されたレポートID(スケジュール登録ID)が返却されること
    expect(validationResult.reportScheduleId).toBeDefined();
    expect(validationResult.reportScheduleId).toMatch(/^rpt_sched_/);

    // 10. 月次サマリー生成予定日時が正確に計算されていること（月末+1営業日の09:00)
    expect(validationResult.scheduledGenerationTime).toBe('2024-02-02T09:00:00Z');

    // 11. 検証対象データセットの件数が正確に把握されていること
    expect(validationResult.processedRecordCount).toBe(2);

    // 12. 整合性チェック詳細：顧客ごとのデータが期待値と合致
    expect(validationResult.customerDataValidation).toEqual({
      cust_A001: {
        customerName: 'Customer A Corporation',
        appointmentCountValid: true,
        contractAmountValid: true,
        achievementRateValid: true,
      },
      cust_B002: {
        customerName: 'Customer B Limited',
        appointmentCountValid: true,
        contractAmountValid: true,
        achievementRateValid: true,
      },
    });

    // 13. 検証エラーが0件であること
    expect(validationResult.validationErrorCount).toBe(0);

    // 14. 検証警告が0件であること（すべてのデータが基準内）
    expect(validationResult.validationWarningCount).toBe(0);

    // 15. レポート生成キューに追加されたことを確認
    expect(validationResult.queuedForProcessing).toBe(true);

    // 16. 次のプロセス（レポート生成）への遷移可否が「可」であること
    expect(validationResult.canProceedToNextStep).toBe(true);
  });
});