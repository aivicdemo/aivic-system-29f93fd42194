import { describe, test, expect, beforeEach } from "@jest/globals";
import { structureHearingRecord } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1350
  test("ヒアリング記録が空文字列の場合に適切なエラーメッセージが返される", () => {
    const emptyHearingRecord = "";

    expect(() => {
      structureHearingRecord(emptyHearingRecord);
    }).toThrow(/ヒアリング記録/);
  });
});