import { describeMonthlySummaryTemplate } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-1230: [edge] 契約変更SLA自動管理機能 - SLA時間に到達した時点での処理完了状況が正確に判定される（境界値）
  test('SCEN-1230: 契約変更SLA境界値での処理完了状況判定が正確に実行される', () => {
    const slaHours = 24;
    const slaMilliseconds = slaHours * 60 * 60 * 1000;
    
    const contractChangeInitTime = new Date('2024-01-15T09:00:00Z');
    const contractChangeInitTimeMs = contractChangeInitTime.getTime();
    
    // タイムポイント1: SLA開始から23時間59分59秒経過
    const point1TimeMs = contractChangeInitTimeMs + (23 * 60 * 60 * 1000) + (59 * 60 * 1000) + (59 * 1000);
    const point1CheckTime = new Date(point1TimeMs);
    const elapsedMs1 = point1TimeMs - contractChangeInitTimeMs;
    
    // タイムポイント2: SLA開始からちょうど24時間経過（SLA到達時刻）
    const point2TimeMs = contractChangeInitTimeMs + slaMilliseconds;
    const point2CheckTime = new Date(point2TimeMs);
    const elapsedMs2 = point2TimeMs - contractChangeInitTimeMs;
    
    // タイムポイント3: SLA開始から24時間1秒経過
    const point3TimeMs = contractChangeInitTimeMs + slaMilliseconds + 1000;
    const point3CheckTime = new Date(point3TimeMs);
    const elapsedMs3 = point3TimeMs - contractChangeInitTimeMs;
    
    const contractChangeRecord = {
      contractChangeId: 'CC-001',
      initiatedAt: contractChangeInitTime,
      slaHours: slaHours,
      processCompletedAt: null as Date | null,
      status: 'pending' as string,
    };
    
    // テスト実行: 各タイムポイントでSLA判定を実行
    const result1 = describeMonthlySummaryTemplate({
      contractChangeRecord: contractChangeRecord,
      currentCheckTime: point1CheckTime,
      slaHours: slaHours,
    });
    
    const result2 = describeMonthlySummaryTemplate({
      contractChangeRecord: contractChangeRecord,
      currentCheckTime: point2CheckTime,
      slaHours: slaHours,
    });
    
    const result3 = describeMonthlySummaryTemplate({
      contractChangeRecord: contractChangeRecord,
      currentCheckTime: point3CheckTime,
      slaHours: slaHours,
    });
    
    // 期待値検証
    // ポイント1: 23時間59分59秒 → SLA内、処理未完了
    expect(result1.isWithinSLA).toBe(true);
    expect(result1.isCompleted).toBe(false);
    expect(result1.slaExceededFlag).toBe(false);
    expect(result1.warningFlag).toBe(false);
    expect(result1.status).toBe('processing');
    expect(result1.elapsedMilliseconds).toBe(elapsedMs1);
    expect(result1.timeRemainingMilliseconds).toBe(slaMilliseconds - elapsedMs1);
    
    // ポイント2: ちょうど24時間 → SLA到達時刻として正確に検出
    expect(result2.isWithinSLA).toBe(true);
    expect(result2.slaReachedExactly).toBe(true);
    expect(result2.isCompleted).toBe(false);
    expect(result2.slaExceededFlag).toBe(false);
    expect(result2.warningFlag).toBe(false);
    expect(result2.status).toBe('sla_reached');
    expect(result2.elapsedMilliseconds).toBe(elapsedMs2);
    expect(result2.timeRemainingMilliseconds).toBe(0);
    
    // ポイント3: 24時間1秒 → SLA超過フラグ立下、警告生成
    expect(result3.isWithinSLA).toBe(false);
    expect(result3.slaExceededFlag).toBe(true);
    expect(result3.warningFlag).toBe(true);
    expect(result3.isCompleted).toBe(false);
    expect(result3.status).toBe('sla_exceeded');
    expect(result3.elapsedMilliseconds).toBe(elapsedMs3);
    expect(result3.timeRemainingMilliseconds).toBe(0);
    expect(result3.warningMessageCode).toBe('SLA_EXCEEDED');
    expect(result3.nextStepAction).toBe('escalation_or_penalty');
    
    // SLA超過時の詳細検証
    expect(result3.excessMilliseconds).toBe(1000);
    expect(result3.autoNotificationTriggered).toBe(true);
    expect(result3.billingProcessTransitionAllowed).toBe(true);
  });
});