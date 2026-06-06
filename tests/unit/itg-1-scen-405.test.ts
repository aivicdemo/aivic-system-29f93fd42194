import { recordWorkHistory } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("必須項目が未入力の場合に適切なエラーが発生する", () => {
    // SCEN-405
    
    // 必須項目が空の場合
    expect(() => recordWorkHistory(
      "", // productionOrderId が空
      "PROC001",
      "WORKER001", 
      new Date("2024-01-15T09:00:00Z"),
      new Date("2024-01-15T17:00:00Z"),
      100,
      "合格"
    )).toThrow(/生産指示番号/);

    // 工程IDが空の場合
    expect(() => recordWorkHistory(
      "PO001",
      "", // processId が空
      "WORKER001",
      new Date("2024-01-15T09:00:00Z"), 
      new Date("2024-01-15T17:00:00Z"),
      100,
      "合格"
    )).toThrow(/工程/);

    // 作業者IDが空の場合
    expect(() => recordWorkHistory(
      "PO001",
      "PROC001",
      "", // workerId が空
      new Date("2024-01-15T09:00:00Z"),
      new Date("2024-01-15T17:00:00Z"), 
      100,
      "合格"
    )).toThrow(/作業者/);

    // 作業開始時刻が終了時刻より後の場合
    expect(() => recordWorkHistory(
      "PO001", 
      "PROC001",
      "WORKER001",
      new Date("2024-01-15T17:00:00Z"), // 開始時刻が終了時刻より後
      new Date("2024-01-15T09:00:00Z"),
      100,
      "合格"
    )).toThrow(/開始時刻/);

    // 実績数量が負の値の場合
    expect(() => recordWorkHistory(
      "PO001",
      "PROC001", 
      "WORKER001",
      new Date("2024-01-15T09:00:00Z"),
      new Date("2024-01-15T17:00:00Z"),
      -10, // 負の数量
      "合格"
    )).toThrow(/実績数量/);
  });
});