import { recordImprovementProposalCompletion } from '../../src/logic/it-6-2-2-1';

describe('改善提案実装完了期間の営業日ベース管理機能', () => {
  // SCEN-1258
  test('承認から実装完了まで5営業日以内に完了し、完了日時と実装内容がシステムに正確に記録される', () => {
    // 承認日時: 2024-01-15 (月曜日)
    const approvalDateTime = new Date('2024-01-15T09:00:00Z');
    
    // 実装完了日時: 2024-01-22 (月曜日) - 承認から5営業日後
    // 営業日カウント: 1/15(月), 1/16(火), 1/17(水), 1/18(木), 1/19(金) = 5営業日
    const completionDateTime = new Date('2024-01-22T17:30:00Z');
    
    const proposalId = 'PROP-2024-001';
    const implementationContent = 'OCR読取精度向上のための学習データ追加：過去案件データ500件を新規に取り込み、物価本最新版2024年1月版をシステムに反映';
    const implementerName = '原価管理システム運用者A';
    
    // ビジネスルール: 承認から実装完了までが5営業日以内であることを検証
    // 営業日ベース計算: 承認日(1/15)から完了日(1/22)までの営業日数 = 5営業日
    // 土日を除外: 1/20(土), 1/21(日)を除外して計算
    const businessDaysDifference = 5;
    
    const result = recordImprovementProposalCompletion({
      proposalId: proposalId,
      approvalDateTime: approvalDateTime,
      completionDateTime: completionDateTime,
      implementationContent: implementationContent,
      implementerName: implementerName,
      businessDaysDifference: businessDaysDifference
    });

    // 期待結果: 完了日時がシステムに正確に記録される
    expect(result.completionDateTime).toEqual(completionDateTime);
    
    // 期待結果: 実装内容の詳細情報がシステムに正確に保存される
    expect(result.implementationContent).toBe('OCR読取精度向上のための学習データ追加：過去案件データ500件を新規に取り込み、物価本最新版2024年1月版をシステムに反映');
    
    // 期待結果: 完了日時には正確なタイムスタンプが付与される
    expect(result.completionTimestamp).toBe('2024-01-22T17:30:00Z');
    
    // 期待結果: 実装者情報が記録される
    expect(result.implementerName).toBe('原価管理システム運用者A');
    
    // 期待結果: 承認日から実装完了日までが5営業日以内であることをシステムで検証
    expect(result.businessDaysElapsed).toBe(5);
    expect(result.isWithinBusinessDayThreshold).toBe(true);
    
    // 期待結果: 提案ID が正確に保存される
    expect(result.proposalId).toBe('PROP-2024-001');
    
    // 期待結果: 承認日時がシステムに記録されている
    expect(result.approvalDateTime).toEqual(approvalDateTime);
    
    // 期待結果: 更新履歴が記録される（実装者、完了日時、実装内容）
    expect(result.updateHistory).toBeDefined();
    expect(result.updateHistory.length).toBeGreaterThan(0);
    expect(result.updateHistory[result.updateHistory.length - 1]).toEqual({
      timestamp: '2024-01-22T17:30:00Z',
      status: 'completed',
      updatedBy: 'システム管理者',
      implementationContent: implementationContent
    });
    
    // 期待結果: 履歴画面から参照可能な形式で保存されている
    expect(result.isHistoryAccessible).toBe(true);
    expect(result.recordStatus).toBe('completed');
  });
});