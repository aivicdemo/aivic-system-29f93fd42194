import { validateCorrectionDeadline } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-721: [edge] 修正期限管理と催促通知 - 修正期限が本日と同じ日時で期限超過判定の境界値テスト
  test('修正期限が現在時刻と同一のとき期限超過と判定されず、1秒後に初めて期限超過と判定される', () => {
    const now = new Date('2024-01-15T14:30:00Z');
    const correctionDeadline = new Date('2024-01-15T14:30:00Z');
    
    // ケース1: 現在時刻 = 修正期限時刻
    const result1 = validateCorrectionDeadline({
      deadline: correctionDeadline,
      currentTime: now,
    });
    
    expect(result1.isOverdue).toBe(false);
    expect(result1.shouldNotify).toBe(false);
    
    // ケース2: 現在時刻が修正期限時刻を1秒超過
    const nowPlus1Second = new Date('2024-01-15T14:30:01Z');
    const result2 = validateCorrectionDeadline({
      deadline: correctionDeadline,
      currentTime: nowPlus1Second,
    });
    
    expect(result2.isOverdue).toBe(true);
    expect(result2.shouldNotify).toBe(true);
    
    // ケース3: 修正期限が現在時刻より後の場合
    const futureDeadline = new Date('2024-01-15T14:31:00Z');
    const result3 = validateCorrectionDeadline({
      deadline: futureDeadline,
      currentTime: now,
    });
    
    expect(result3.isOverdue).toBe(false);
    expect(result3.shouldNotify).toBe(false);
    
    // ケース4: 修正期限が現在時刻より前の場合
    const pastDeadline = new Date('2024-01-15T14:29:00Z');
    const result4 = validateCorrectionDeadline({
      deadline: pastDeadline,
      currentTime: now,
    });
    
    expect(result4.isOverdue).toBe(true);
    expect(result4.shouldNotify).toBe(true);
  });
});