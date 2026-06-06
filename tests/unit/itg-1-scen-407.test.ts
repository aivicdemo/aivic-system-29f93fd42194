import { recordWorkHistory } from '../../src/logic/it-1-br-1-2-1';

describe('作業完了実績の登録と次工程引き継ぎ情報の記録機能', () => {
  test('作業時刻が未来日時の場合にエラーが発生する', () => {
    // SCEN-407
    const currentDate = new Date('2024-01-15T10:00:00Z');
    const futureStartTime = new Date('2024-01-16T09:00:00Z');
    const futureEndTime = new Date('2024-01-16T17:00:00Z');

    expect(() => recordWorkHistory(
      'ORDER-001',
      'PROCESS-001',
      'WORKER-001',
      futureStartTime,
      futureEndTime,
      100,
      '合格'
    )).toThrow(/未来/);
  });
});