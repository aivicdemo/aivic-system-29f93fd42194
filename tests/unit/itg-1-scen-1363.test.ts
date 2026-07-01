import { validateBackofficeRequirements } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - バックオフィス入力項目検証", () => {
  test("SCEN-1363: バックオフィス入力項目が0件の場合、すべてのバックオフィス要件が充足されていないと判定される", () => {
    // Arrange: バックオフィス入力項目が0件の状態を準備
    const backofficeInputItems = [];

    // 期待されるバックオフィス要件（定義済み標準）
    const expectedRequiredItems = [
      "項目名",
      "単位",
      "データ型",
      "計算ロジック",
      "レポートマッピング",
      "必須フラグ",
      "検証ルール",
      "デフォルト値",
    ];

    // Act: バックオフィス要件充足判定の検証関数を実行
    const validationResult = validateBackofficeRequirements(
      backofficeInputItems
    );

    // Assert: 検証結果のステータスが「要件未充足」であることを確認
    expect(validationResult.status).toBe("要件未充足");

    // 不足している全要件がリストアップされていることを確認
    expect(validationResult.missingRequirements.length).toBe(
      expectedRequiredItems.length
    );
    expect(validationResult.missingRequirements).toEqual(
      expectedRequiredItems
    );

    // 充足率が0%であることを確認
    expect(validationResult.fulfillmentRate).toBe(0);

    // 充足されている要件数が0件であることを確認
    expect(validationResult.fulfilledCount).toBe(0);

    // 不足している要件数が8件（すべての要件）であることを確認
    expect(validationResult.missingCount).toBe(8);

    // 詳細メッセージにバックオフィス入力項目の不足が明記されていることを確認
    expect(validationResult.message).toMatch(/入力項目/);
    expect(validationResult.message).toMatch(/0件/);
  });
});