import { validateProductionReport } from '../../src/logic/it-1-br-1-2-1';

describe('作業完了実績の登録と次工程引き継ぎ情報の記録機能', () => {
  test('データの完全性に不備がある場合に修正を求める', () => {
    // SCEN-425
    // 作業実績報告でデータの完全性に不備がある場合の検証
    
    // 不正な作業開始時刻（25:00）、作業終了時刻（24:00）、負の実績数量（-10）、空の作業者IDを入力
    expect(() => validateProductionReport(
      "WO-001",
      -10,
      "合格",
      "25:00",
      "24:00",
      100
    )).toThrow(/実績数量/);
    
    // 作業者IDが空の場合
    expect(() => validateProductionReport(
      "",
      50,
      "合格", 
      "09:00",
      "17:00",
      100
    )).toThrow(/作業者/);
    
    // 作業開始時刻が無効な場合
    expect(() => validateProductionReport(
      "WO-001",
      50,
      "合格",
      "25:00",
      "17:00", 
      100
    )).toThrow(/作業時間/);
  });
});