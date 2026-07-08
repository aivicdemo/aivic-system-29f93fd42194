import { registerGuidelineWithMultipleTags, searchGuidelineByTags } from "../../src/logic/it-6-3-1";

describe("ナレッジベース登録・分類体系化機能", () => {
  // SCEN-1562
  test("複数分類に該当するガイドラインが複数タグで正しく登録される", () => {
    const guidelineText =
      "見積査定システムの運用ガイドライン：OCR精度監視と学習データ更新手順";
    const tags = ["OCR精度", "学習データ更新", "運用手順", "品質管理"];
    const category = "運用ナレッジ";
    const createdBy = "admin_001";
    const createdAt = new Date("2024-03-15T10:30:00Z");

    // ガイドライン登録実行
    const registerResult = registerGuidelineWithMultipleTags({
      guidelineText,
      tags,
      category,
      createdBy,
      createdAt,
    });

    // 登録結果の検証
    expect(registerResult).toEqual({
      guidelineId: expect.any(String),
      text: guidelineText,
      category: category,
      tags: tags,
      tagCount: 4,
      createdBy: createdBy,
      createdAt: createdAt.toISOString(),
      status: "registered",
    });

    const guidelineId = registerResult.guidelineId;

    // 個別タグでの検索 - 「OCR精度」タグで検索
    const searchOcr = searchGuidelineByTags({
      searchTags: ["OCR精度"],
      matchMode: "any",
    });
    expect(searchOcr).toContainEqual(
      expect.objectContaining({
        guidelineId: guidelineId,
        text: guidelineText,
        matchedTags: ["OCR精度"],
      })
    );

    // 個別タグでの検索 - 「学習データ更新」タグで検索
    const searchLearning = searchGuidelineByTags({
      searchTags: ["学習データ更新"],
      matchMode: "any",
    });
    expect(searchLearning).toContainEqual(
      expect.objectContaining({
        guidelineId: guidelineId,
        text: guidelineText,
        matchedTags: ["学習データ更新"],
      })
    );

    // 個別タグでの検索 - 「運用手順」タグで検索
    const searchProcedure = searchGuidelineByTags({
      searchTags: ["運用手順"],
      matchMode: "any",
    });
    expect(searchProcedure).toContainEqual(
      expect.objectContaining({
        guidelineId: guidelineId,
        text: guidelineText,
        matchedTags: ["運用手順"],
      })
    );

    // 個別タグでの検索 - 「品質管理」タグで検索
    const searchQuality = searchGuidelineByTags({
      searchTags: ["品質管理"],
      matchMode: "any",
    });
    expect(searchQuality).toContainEqual(
      expect.objectContaining({
        guidelineId: guidelineId,
        text: guidelineText,
        matchedTags: ["品質管理"],
      })
    );

    // 複数タグ組み合わせ検索（AND模式） - 「OCR精度」AND「学習データ更新」
    const searchMultipleAnd = searchGuidelineByTags({
      searchTags: ["OCR精度", "学習データ更新"],
      matchMode: "all",
    });
    expect(searchMultipleAnd).toContainEqual(
      expect.objectContaining({
        guidelineId: guidelineId,
        text: guidelineText,
        matchedTags: ["OCR精度", "学習データ更新"],
        matchCount: 2,
      })
    );

    // 複数タグ組み合わせ検索（OR模式） - 「運用手順」OR「品質管理」
    const searchMultipleOr = searchGuidelineByTags({
      searchTags: ["運用手順", "品質管理"],
      matchMode: "any",
    });
    expect(searchMultipleOr.length).toBeGreaterThanOrEqual(1);
    expect(searchMultipleOr).toContainEqual(
      expect.objectContaining({
        guidelineId: guidelineId,
        text: guidelineText,
      })
    );

    // 3つ以上のタグ組み合わせ検索
    const searchMultipleTags = searchGuidelineByTags({
      searchTags: ["OCR精度", "学習データ更新", "運用手順"],
      matchMode: "all",
    });
    expect(searchMultipleTags).toContainEqual(
      expect.objectContaining({
        guidelineId: guidelineId,
        text: guidelineText,
        matchedTags: ["OCR精度", "学習データ更新", "運用手順"],
        matchCount: 3,
      })
    );

    // タグ関連テーブルの直接確認 - タグの重複なし検証
    const guideline = registerResult;
    const uniqueTags = [...new Set(guideline.tags)];
    expect(uniqueTags.length).toBe(guideline.tags.length);
    expect(guideline.tagCount).toBe(4);

    // すべてのタグがガイドラインに紐付いていることを確認
    expect(guideline.tags).toEqual(tags);
    expect(guideline.tags).toContain("OCR精度");
    expect(guideline.tags).toContain("学習データ更新");
    expect(guideline.tags).toContain("運用手順");
    expect(guideline.tags).toContain("品質管理");

    // ガイドライン登録時のバリデーション - タグが空の場合エラー
    expect(() =>
      registerGuidelineWithMultipleTags({
        guidelineText: "テストガイドライン",
        tags: [],
        category: "運用ナレッジ",
        createdBy: "admin_001",
        createdAt: new Date("2024-03-15T10:30:00Z"),
      })
    ).toThrow(/タグ/);

    // ガイドライン登録時のバリデーション - 重複するタグが含まれている場合、重複排除後に登録
    const registerWithDuplicateTags = registerGuidelineWithMultipleTags({
      guidelineText: "重複タグテストガイドライン",
      tags: ["OCR精度", "OCR精度", "学習データ更新"],
      category: "運用ナレッジ",
      createdBy: "admin_001",
      createdAt: new Date("2024-03-15T11:00:00Z"),
    });
    expect(registerWithDuplicateTags.tagCount).toBe(2);
    expect(registerWithDuplicateTags.tags).toEqual(["OCR精度", "学習データ更新"]);

    // 空のテキストで登録できないことを確認
    expect(() =>
      registerGuidelineWithMultipleTags({
        guidelineText: "",
        tags: ["OCR精度"],
        category: "運用ナレッジ",
        createdBy: "admin_001",
        createdAt: new Date("2024-03-15T10:30:00Z"),
      })
    ).toThrow(/ガイドライン/);
  });
});