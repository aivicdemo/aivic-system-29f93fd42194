import { recordWorkHistory } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("データの整合性に不備がある場合に修正を求める", () => {
    // SCEN-426
    
    // 作業開始時刻が終了時刻より後の場合のテスト
    expect(() => recordWorkHistory(
      "PROD-001",
      "PROC-001", 
      "WORKER-001",
      new Date("2024-01-15T10:00:00"),
      new Date("2024-01-15T09:00:00"), // 開始時刻より前の終了時刻
      50,
      "合格"
    )).toThrow(/開始時刻/);

    // 生産数量が負の値の場合のテスト
    expect(() => recordWorkHistory(
      "PROD-001",
      "PROC-001",
      "WORKER-001", 
      new Date("2024-01-15T09:00:00"),
      new Date("2024-01-15T17:00:00"),
      -50, // 負の値
      "合格"
    )).toThrow(/数量/);

    // 正常なケースの確認
    const validResult = recordWorkHistory(
      "PROD-001",
      "PROC-001",
      "WORKER-001",
      new Date("2024-01-15T09:00:00"),
      new Date("2024-01-15T17:00:00"),
      50,
      "合格"
    );

    expect(validResult.isValid).toBe(true);
    expect(validResult.historyId).toBeDefined();
    expect(validResult.recordedAt).toBeDefined();
  });
});