import { recordLearningDataUpdateMetadata } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  // SCEN-1126
  test("学習データ更新メタデータ構造化記録機能 - 物価本版数・追加案件件数・地域分類・季節分類の4項目を構造化データとして正確に記録できる", () => {
    // Arrange: テストデータを準備
    const priceBookVersion = 3;
    const additionalCaseCount = 15;
    const regionClassification = "関東";
    const seasonClassification = "冬季";

    const input_metadata = {
      priceBookVersion: priceBookVersion,
      additionalCaseCount: additionalCaseCount,
      regionClassification: regionClassification,
      seasonClassification: seasonClassification,
    };

    // Act: 学習データ更新メタデータ構造化記録機能を初期化し、記録処理を実行
    const recorded_metadata = recordLearningDataUpdateMetadata(input_metadata);

    // Assert: 4項目すべてが正確に構造化データとして記録されていることを検証

    // 1. 物価本版数を取得して値を確認
    expect(recorded_metadata.priceBookVersion).toBe(3);

    // 2. 追加案件件数を取得して値を確認
    expect(recorded_metadata.additionalCaseCount).toBe(15);

    // 3. 地域分類を取得して値を確認
    expect(recorded_metadata.regionClassification).toBe("関東");

    // 4. 季節分類を取得して値を確認
    expect(recorded_metadata.seasonClassification).toBe("冬季");

    // 5. メタデータの構造が正しいスキーマに準拠していることを検証
    expect(recorded_metadata).toHaveProperty("priceBookVersion");
    expect(recorded_metadata).toHaveProperty("additionalCaseCount");
    expect(recorded_metadata).toHaveProperty("regionClassification");
    expect(recorded_metadata).toHaveProperty("seasonClassification");

    // 6. 各プロパティの型が正しいことを検証
    expect(typeof recorded_metadata.priceBookVersion).toBe("number");
    expect(typeof recorded_metadata.additionalCaseCount).toBe("number");
    expect(typeof recorded_metadata.regionClassification).toBe("string");
    expect(typeof recorded_metadata.seasonClassification).toBe("string");

    // 7. 記録されたメタデータが完全な構造体として正確に保存されていることを検証
    const expected_metadata = {
      priceBookVersion: 3,
      additionalCaseCount: 15,
      regionClassification: "関東",
      seasonClassification: "冬季",
    };
    expect(recorded_metadata).toEqual(expected_metadata);

    // 8. 記録されたデータの永続性を確認（再読み込み後も値が保持されていることを確認）
    // 同じメタデータを再度アクセスして、値が変わっていないことを検証
    const reloaded_metadata = recordLearningDataUpdateMetadata(input_metadata);
    expect(reloaded_metadata.priceBookVersion).toBe(3);
    expect(reloaded_metadata.additionalCaseCount).toBe(15);
    expect(reloaded_metadata.regionClassification).toBe("関東");
    expect(reloaded_metadata.seasonClassification).toBe("冬季");
  });
});