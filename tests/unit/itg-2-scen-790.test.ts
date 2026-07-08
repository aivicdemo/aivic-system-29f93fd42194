import { 
  calculateDivergenceWithMultipleSources,
  formatPriceSourcesForDisplay
} from "../../src/logic/it-6-2-2-1";

describe("相場乖離可視化機能 - 複数物価本出典の統一表示", () => {
  // SCEN-790
  test("複数の物価本出典が混在する場合に全出典が統一表示される", () => {
    // 前提条件: 複数の物価本出典データが存在
    const estimateAmount = 1500000;
    const estimateItem = "鉄骨造建設工事";
    
    // テストデータ: 複数出典が混在
    const priceSourcesData = [
      {
        sourceId: "PS001",
        sourceName: "建設物価本2024年1月版",
        standardPrice: 1400000,
        publicationDate: "2024-01-15",
        validityEndDate: "2024-06-30"
      },
      {
        sourceId: "PS002",
        sourceName: "工事価格指数2024年",
        standardPrice: 1450000,
        publicationDate: "2024-01-10",
        validityEndDate: "2024-12-31"
      },
      {
        sourceId: "PS003",
        sourceName: "地域別建設物価2024年",
        standardPrice: 1380000,
        publicationDate: "2024-02-01",
        validityEndDate: "2024-07-31"
      }
    ];

    const referenceData = {
      itemName: estimateItem,
      estimatedAmount: estimateAmount,
      sources: priceSourcesData,
      areaCode: "13",
      areaName: "東京都",
      constructionType: "建築工事",
      dataCount: 45,
      referenceCount: 3
    };

    // ビジネスルール: 相場乖離率を計算
    // 複数出典の平均: (1400000 + 1450000 + 1380000) / 3 = 1410000
    const expectedAveragePrice = 1410000;
    const expectedDivergenceAmount = estimateAmount - expectedAveragePrice;
    const expectedDivergenceRate = (expectedDivergenceAmount / expectedAveragePrice) * 100;

    // 関数1: 複数出典の乖離計算
    const divergenceResult = calculateDivergenceWithMultipleSources(
      estimateAmount,
      referenceData
    );

    // 期待値検証: 乖離額と乖離率が正確に計算されること
    expect(divergenceResult.divergenceAmount).toBe(90000);
    expect(divergenceResult.divergenceRate).toBeCloseTo(6.38, 1);
    expect(divergenceResult.sourceCount).toBe(3);
    expect(divergenceResult.averagePrice).toBe(expectedAveragePrice);

    // ビジネスルール: 出典情報が全て記録されること
    expect(divergenceResult.appliedSources).toHaveLength(3);
    expect(divergenceResult.appliedSources.map(s => s.sourceId)).toEqual([
      "PS001",
      "PS002",
      "PS003"
    ]);

    // 関数2: 表示用フォーマッティング
    const displayFormat = formatPriceSourcesForDisplay(
      divergenceResult.appliedSources,
      divergenceResult.divergenceRate
    );

    // 期待値検証: 出典が統一形式で表示されること
    expect(displayFormat.formattedSources).toHaveLength(3);
    
    // 各出典の形式統一性を確認
    displayFormat.formattedSources.forEach((source, index) => {
      // 出典情報が必須フィールドをすべて含むこと
      expect(source).toHaveProperty("displayName");
      expect(source).toHaveProperty("standardPrice");
      expect(source).toHaveProperty("publicationDate");
      expect(source).toHaveProperty("validityEndDate");
      expect(source).toHaveProperty("sequenceNumber");

      // 出典表示名のフォーマット: "出典名 (有効期限: YYYY-MM-DD)"
      expect(source.displayName).toMatch(/^[\u4E00-\u9FFF\w\d\s年月版]+\s\(有効期限:\s\d{4}-\d{2}-\d{2}\)$/);
      
      // シーケンス番号が連続していること (1, 2, 3, ...)
      expect(source.sequenceNumber).toBe(index + 1);

      // 金額が数値で正確に保持されること
      expect(typeof source.standardPrice).toBe("number");
      expect(source.standardPrice).toBeGreaterThan(0);
    });

    // 期待値検証: 重複がないこと
    const displayNames = displayFormat.formattedSources.map(s => s.displayName);
    const uniqueNames = new Set(displayNames);
    expect(uniqueNames.size).toBe(displayNames.length);

    // 期待値検証: レイアウトメタデータが正確であること
    expect(displayFormat.layoutMetadata).toHaveProperty("totalSourceCount");
    expect(displayFormat.layoutMetadata).toHaveProperty("maxDisplayWidth");
    expect(displayFormat.layoutMetadata).toHaveProperty("requiresScrolling");
    expect(displayFormat.layoutMetadata.totalSourceCount).toBe(3);
    expect(typeof displayFormat.layoutMetadata.maxDisplayWidth).toBe("number");
    expect(displayFormat.layoutMetadata.maxDisplayWidth).toBeGreaterThan(0);
    expect(typeof displayFormat.layoutMetadata.requiresScrolling).toBe("boolean");

    // 期待値検証: 出典統計情報が記録されること
    expect(displayFormat.sourceStatistics).toHaveProperty("lowestPrice");
    expect(displayFormat.sourceStatistics).toHaveProperty("highestPrice");
    expect(displayFormat.sourceStatistics).toHaveProperty("priceRange");
    expect(displayFormat.sourceStatistics.lowestPrice).toBe(1380000);
    expect(displayFormat.sourceStatistics.highestPrice).toBe(1450000);
    expect(displayFormat.sourceStatistics.priceRange).toBe(70000);

    // 期待値検証: 乖離パターン分類が正確であること
    expect(displayFormat.divergenceClassification).toMatch(/^(過小|標準|過大)$/);
    // 乖離率 6.38% は "過大" カテゴリ (5% < 乖離率 < 10%)
    expect(displayFormat.divergenceClassification).toBe("過大");

    // 期待値検証: 出典の信頼度スコアが計算されること
    expect(displayFormat.sourceReliabilityScores).toHaveLength(3);
    displayFormat.sourceReliabilityScores.forEach(score => {
      expect(typeof score.sourceId).toBe("string");
      expect(typeof score.reliabilityScore).toBe("number");
      expect(score.reliabilityScore).toBeGreaterThanOrEqual(0);
      expect(score.reliabilityScore).toBeLessThanOrEqual(100);
    });

    // 期待値検証: 全ユーザー識別可能性 - 出典情報が重複なく、一貫形式で表示
    const allSourceInfo = displayFormat.formattedSources.map(s => ({
      id: s.sourceId,
      name: s.displayName,
      price: s.standardPrice
    }));
    expect(allSourceInfo).toEqual([
      {
        id: "PS001",
        name: expect.stringMatching(/建設物価本2024年1月版\s\(有効期限:\s2024-06-30\)/),
        price: 1400000
      },
      {
        id: "PS002",
        name: expect.stringMatching(/工事価格指数2024年\s\(有効期限:\s2024-12-31\)/),
        price: 1450000
      },
      {
        id: "PS003",
        name: expect.stringMatching(/地域別建設物価2024年\s\(有効期限:\s2024-07-31\)/),
        price: 1380000
      }
    ]);

    // 期待値検証: レイアウト崩れなし - maxDisplayWidth が合理的範囲内
    expect(displayFormat.layoutMetadata.maxDisplayWidth).toBeLessThanOrEqual(1200);
    expect(displayFormat.layoutMetadata.maxDisplayWidth).toBeGreaterThanOrEqual(300);

    // 期待値検証: 総合表示品質スコアが計算されること
    expect(displayFormat).toHaveProperty("overallDisplayQualityScore");
    expect(typeof displayFormat.overallDisplayQualityScore).toBe("number");
    expect(displayFormat.overallDisplayQualityScore).toBeGreaterThanOrEqual(0);
    expect(displayFormat.overallDisplayQualityScore).toBeLessThanOrEqual(100);
    
    // 複数出典が統一表示されている場合、品質スコアは高い (80以上)
    expect(displayFormat.overallDisplayQualityScore).toBeGreaterThanOrEqual(85);

    // 期待値検証: ユーザー比較可能性の指標
    expect(displayFormat).toHaveProperty("userComparabilityIndex");
    expect(typeof displayFormat.userComparabilityIndex).toBe("number");
    expect(displayFormat.userComparabilityIndex).toBeGreaterThan(0);
    
    // 複数出典かつ重複なく統一形式なら比較可能性指数は高い
    expect(displayFormat.userComparabilityIndex).toBeGreaterThanOrEqual(90);
  });
});