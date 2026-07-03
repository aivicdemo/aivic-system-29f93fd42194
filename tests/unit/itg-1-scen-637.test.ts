import { describe, test, expect } from "@jest/globals";
import { visualizeDifference } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-637
  test("無効な契約IDが指定された場合はエラーメッセージが返却される", () => {
    // 無効な契約ID（存在しないID）を入力
    expect(() => {
      visualizeDifference({
        contractId: "CONTRACT_NONEXISTENT_999999",
      });
    }).toThrow(/契約ID/);

    // 不正な形式の契約ID（空文字列）を入力
    expect(() => {
      visualizeDifference({
        contractId: "",
      });
    }).toThrow(/契約ID/);

    // 不正な形式の契約ID（null/undefined として扱われる場合）
    expect(() => {
      visualizeDifference({
        contractId: undefined as any,
      });
    }).toThrow(/契約ID/);

    // 正常な形式で存在する契約ID場合は正常に処理される
    const result = visualizeDifference({
      contractId: "CONTRACT_VALID_001",
    });
    expect(result).toBeDefined();
    expect(result.contractId).toBe("CONTRACT_VALID_001");
    expect(result.hasDifference).toEqual(expect.any(Boolean));
    expect(result.previousConditions).toEqual(expect.any(Object));
    expect(result.currentConditions).toEqual(expect.any(Object));
    expect(result.differences).toEqual(expect.any(Array));
  });
});