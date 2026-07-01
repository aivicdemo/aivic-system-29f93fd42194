import { analyzeExceptionCaseForHandbookAddition } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-993
  test('検出された例外ケースから手順書追加内容が自動提案される', () => {
    const exceptionCaseId = 'EXC-202401-001';
    const exceptionCaseName = '前月比で請求額が50%以上減少した契約の検出';
    const affectedProcess = '請求額計算結果検証';
    const occurrenceCount = 3;
    const lastDetectedDate = new Date('2024-01-15T10:30:00Z');
    const description = '営業データから集計した請求額が前月比で50%以上減少したケース。割引適用漏れまたは契約変更の誤入力の可能性がある。';

    const exceptionCase = {
      exceptionCaseId: exceptionCaseId,
      name: exceptionCaseName,
      affectedProcess: affectedProcess,
      occurrenceCount: occurrenceCount,
      lastDetectedDate: lastDetectedDate,
      description: description,
      detectionCondition: 'request_amount < previous_month_amount * 0.5',
      responseAction: 'Manual review before billing confirmation',
      checkpoints: [
        'Verify contract change history',
        'Confirm discount application',
        'Validate calculation logic'
      ],
      responsiblePerson: 'Representative / Billing Operator'
    };

    const proposedHandbookAddition = analyzeExceptionCaseForHandbookAddition(exceptionCase);

    expect(proposedHandbookAddition).toBeDefined();
    expect(proposedHandbookAddition.affectedProcess).toBe('請求額計算結果検証');
    expect(proposedHandbookAddition.proposedStepNumber).toBe(7);
    expect(proposedHandbookAddition.proposedStepTitle).toContain('前月比異常値検証');
    expect(proposedHandbookAddition.proposedStepDescription).toContain('前月比50%以上の減少');
    expect(proposedHandbookAddition.triggeringCondition).toBe('request_amount < previous_month_amount * 0.5');
    expect(proposedHandbookAddition.actionToTake).toBe('契約変更履歴、割引適用状況、計算ロジックを検証し、不合格時は修正指示を生成');
    expect(proposedHandbookAddition.checkpointList.length).toBe(3);
    expect(proposedHandbookAddition.checkpointList[0]).toBe('契約変更履歴を確認');
    expect(proposedHandbookAddition.checkpointList[1]).toBe('割引適用状況を確認');
    expect(proposedHandbookAddition.checkpointList[2]).toBe('計算ロジックを検証');
    expect(proposedHandbookAddition.responsibleRole).toBe('代表兼営業オペレーター');
    expect(proposedHandbookAddition.recommendedSeverity).toBe('高');
    expect(proposedHandbookAddition.frequencyInPastMonths).toBe(3);
    expect(proposedHandbookAddition.lastOccurrenceDate).toEqual(new Date('2024-01-15T10:30:00Z'));
    expect(proposedHandbookAddition.suggestedPriority).toBe('即座に反映');
    expect(proposedHandbookAddition.relatedDocuments).toContain('請求額計算ルール・判定基準を文書化');
    expect(proposedHandbookAddition.relatedDocuments).toContain('月次手順書改善会議');
    expect(proposedHandbookAddition.readinessToAdd).toBe(true);
  });
});