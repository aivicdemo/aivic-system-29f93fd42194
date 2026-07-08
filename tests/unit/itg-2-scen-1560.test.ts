import { registerOperatingGuideline } from "../../src/logic/it-6-3-1";

describe("ナレッジベース登録・分類体系化機能", () => {
  // SCEN-1560
  test("運用ガイドラインが適切な分類タグを付与された状態で登録される", () => {
    const guidelineInput = {
      contentType: "operating_guideline",
      title: "査定基準運用ガイドライン v1.0",
      body: "このガイドラインは、相場判定基準と査定手順を標準化するための運用マニュアルである。査定員は本ガイドラインに従い、属人性を排除した統一的な判定を実施すること。",
      categories: [
        {
          mainCategory: "査定プロセス",
          subCategories: ["判定基準", "乖離パターン分析"],
        },
        {
          mainCategory: "運用手順",
          subCategories: ["データ更新手順", "モデル再学習"],
        },
      ],
      registeredBy: "system_admin",
      registeredAt: "2024-12-15T10:00:00Z",
    };

    const result = registerOperatingGuideline(guidelineInput);

    // 登録完了の確認
    expect(result.guidelineId).toBeDefined();
    expect(typeof result.guidelineId).toBe("string");
    expect(result.guidelineId.length).toBeGreaterThan(0);

    // コンテンツタイプの確認
    expect(result.contentType).toBe("operating_guideline");

    // タイトルの確認
    expect(result.title).toBe("査定基準運用ガイドライン v1.0");

    // 本文内容の確認
    expect(result.body).toBe(
      "このガイドラインは、相場判定基準と査定手順を標準化するための運用マニュアルである。査定員は本ガイドラインに従い、属人性を排除した統一的な判定を実施すること。"
    );

    // 分類タグ体系の確認
    expect(result.categories).toHaveLength(2);
    expect(result.categories[0].mainCategory).toBe("査定プロセス");
    expect(result.categories[0].subCategories).toEqual([
      "判定基準",
      "乖離パターン分析",
    ]);
    expect(result.categories[0].subCategories).toHaveLength(2);

    expect(result.categories[1].mainCategory).toBe("運用手順");
    expect(result.categories[1].subCategories).toEqual([
      "データ更新手順",
      "モデル再学習",
    ]);
    expect(result.categories[1].subCategories).toHaveLength(2);

    // 階層構造の正確性を確認
    expect(result.categories[0].hierarchyLevel).toBe(1);
    expect(result.categories[0].subCategories.every((sub: string) => sub)).toBe(
      true
    );

    // 登録者情報の確認
    expect(result.registeredBy).toBe("system_admin");
    expect(result.registeredAt).toBe("2024-12-15T10:00:00Z");

    // 登録状態の確認
    expect(result.registrationStatus).toBe("completed");

    // 検索時のタグ経由ヒット可能性を確認
    expect(result.searchableKeywords).toContain("査定プロセス");
    expect(result.searchableKeywords).toContain("運用手順");
    expect(result.searchableKeywords).toContain("判定基準");
    expect(result.searchableKeywords).toContain("データ更新手順");

    // 詳細画面表示時の情報確認
    expect(result.detailView).toBeDefined();
    expect(result.detailView.categoriesDisplayFormat).toBe(
      "hierarchical_tree"
    );
    expect(result.detailView.categoryCount).toBe(2);
    expect(result.detailView.subCategoryCount).toBe(4);

    // タグの妥当性指標
    expect(result.tagValidityScore).toBeGreaterThanOrEqual(90);
    expect(result.tagValidityScore).toBeLessThanOrEqual(100);

    // 分類体系への準拠確認
    expect(result.taxonomyCompliance).toBe(true);
    expect(result.taxonomyVersion).toBe("1.0");
  });
});