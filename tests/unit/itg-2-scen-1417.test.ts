import { describe, test, expect } from "@jest/globals";
import { getAuditTrailByDataId } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  test("SCEN-1417: 補正対象データが存在しない場合に適切なエラーメッセージが返される", () => {
    // 存在しないデータID
    const nonExistentDataId = "DATA_ID_99999";

    // 存在しないデータIDを指定して検索・補正実行
    expect(() => {
      getAuditTrailByDataId(nonExistentDataId);
    }).toThrow(/補正対象データ/);
  });
});