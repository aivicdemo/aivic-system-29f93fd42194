import { describe, test, expect } from "@jest/globals";
import { validateContractChange } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-1203: 契約変更内容の必須項目検証 - 変更前後の値が同一の場合、変更内容が無効と判定される", () => {
    // Arrange: テストデータ準備 - 変更前後の値が同一の契約変更内容
    const contractId = "CONTRACT-001";
    const changeType = "pricing";
    const previousValue = 50000;
    const newValue = 50000; // 変更前後で同一
    const changeTimestamp = new Date("2024-01-15T09:00:00Z");
    const changedBy = "OPERATOR-001";

    const testData = {
      contractId,
      changeType,
      previousValue,
      newValue,
      changeTimestamp,
      changedBy,
    };

    // Act: 契約変更内容の必須項目検証関数を実行
    const result = validateContractChange(testData);

    // Assert: 変更内容が無効（invalid）と判定されることを確認
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("invalid");
    expect(result.reason).toMatch(/同一|変更なし|no change/i);

    // エラーメッセージが含まれることを確認
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).not.toBe("");

    // 変更が受け付けられないことを示すフラグの確認
    expect(result.accepted).toBe(false);

    // 変更前後の値が同一であることをシステムが認識していることを確認
    expect(result.previousValue).toBe(previousValue);
    expect(result.newValue).toBe(newValue);
    expect(result.valuesIdentical).toBe(true);
  });
});