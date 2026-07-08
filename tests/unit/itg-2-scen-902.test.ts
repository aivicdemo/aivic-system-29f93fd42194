import { standardizeLearnDataGranularity } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-902: [normal] 学習データ標準化・形式統一 - 見積項目・地域・時期の各粒度を混在状態から統一粒度に変換する
  test("should standardize mixed-granularity learning data into unified format", () => {
    const input = {
      estimateItems: [
        { id: "item_001", name: "鉄筋", unitGranularity: "細粒度_kg", quantity: 100, unit: "kg" },
        { id: "item_002", name: "型枠工", unitGranularity: "粗粒度_式", quantity: 1, unit: "式" },
        { id: "item_003", name: "コンクリート", unitGranularity: "細粒度_m3", quantity: 50, unit: "m3" },
        { id: "item_004", name: "足場工", unitGranularity: "粗粒度_式", quantity: 1, unit: "式" },
      ],
      regionData: [
        { id: "region_001", name: "東京都渋谷区", granularity: "市区町村レベル", code: "13104" },
        { id: "region_002", name: "神奈川県", granularity: "都道府県レベル", code: "14" },
        { id: "region_003", name: "埼玉県さいたま市大宮区", granularity: "市区町村レベル", code: "11101" },
        { id: "region_004", name: "千葉県", granularity: "都道府県レベル", code: "12" },
      ],
      timeData: [
        { id: "time_001", period: "2024年1月", granularity: "月単位" },
        { id: "time_002", period: "2024年", granularity: "年単位" },
        { id: "time_003", period: "2024年2月", granularity: "月単位" },
        { id: "time_004", period: "2023年", granularity: "年単位" },
      ],
      targetGranularity: {
        estimateItemGranularity: "標準粒度",
        regionGranularity: "都道府県レベル",
        timeGranularity: "年単位",
      },
    };

    const result = standardizeLearnDataGranularity(input);

    // 見積項目の粒度統一検証
    expect(result.standardizedEstimateItems).toBeDefined();
    expect(result.standardizedEstimateItems.length).toBe(4);
    result.standardizedEstimateItems.forEach((item) => {
      expect(item.unitGranularity).toBe("標準粒度");
    });

    // 地域情報の粒度統一検証
    expect(result.standardizedRegionData).toBeDefined();
    expect(result.standardizedRegionData.length).toBe(4);
    result.standardizedRegionData.forEach((region) => {
      expect(region.granularity).toBe("都道府県レベル");
      expect(/^[0-9]{2}$/).test(region.code);
    });

    // 時期情報の粒度統一検証
    expect(result.standardizedTimeData).toBeDefined();
    expect(result.standardizedTimeData.length).toBe(4);
    result.standardizedTimeData.forEach((time) => {
      expect(time.granularity).toBe("年単位");
      expect(/^\d{4}年$/).test(time.period);
    });

    // 地域統一: 市区町村レベルは都道府県コードへ変換
    const tokyoRegion = result.standardizedRegionData.find(
      (r) => r.originalName === "東京都渋谷区" || r.originalName === "東京都"
    );
    expect(tokyoRegion).toBeDefined();
    expect(tokyoRegion!.code).toBe("13");

    const saitamaRegion = result.standardizedRegionData.find(
      (r) => r.originalName === "埼玉県さいたま市大宮区" || r.originalName === "埼玉県"
    );
    expect(saitamaRegion).toBeDefined();
    expect(saitamaRegion!.code).toBe("11");

    // 時期統一: 月単位は年単位へ変換
    const january2024Time = result.standardizedTimeData.find(
      (t) => t.originalPeriod === "2024年1月" || t.originalPeriod === "2024年"
    );
    expect(january2024Time).toBeDefined();
    expect(january2024Time!.period).toBe("2024年");
    expect(january2024Time!.granularity).toBe("年単位");

    const february2024Time = result.standardizedTimeData.find(
      (t) => t.originalPeriod === "2024年2月" || t.originalPeriod === "2024年"
    );
    expect(february2024Time).toBeDefined();
    expect(february2024Time!.period).toBe("2024年");

    // 変換ログ・履歴の記録検証
    expect(result.conversionLog).toBeDefined();
    expect(result.conversionLog.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(result.conversionLog.processedEstimateItems).toBe(4);
    expect(result.conversionLog.processedRegions).toBe(4);
    expect(result.conversionLog.processedTimes).toBe(4);
    expect(result.conversionLog.status).toBe("成功");
    expect(result.conversionLog.errorCount).toBe(0);

    // データ一貫性の確認: 複数回実行での安定性
    const input2 = {
      estimateItems: [
        { id: "item_005", name: "躯体工", unitGranularity: "粗粒度_式", quantity: 1, unit: "式" },
        { id: "item_006", name: "鋼材", unitGranularity: "細粒度_t", quantity: 10, unit: "t" },
      ],
      regionData: [
        { id: "region_005", name: "大阪府大阪市北区", granularity: "市区町村レベル", code: "27101" },
        { id: "region_006", name: "京都府", granularity: "都道府県レベル", code: "26" },
      ],
      timeData: [
        { id: "time_005", period: "2024年3月", granularity: "月単位" },
        { id: "time_006", period: "2023年", granularity: "年単位" },
      ],
      targetGranularity: {
        estimateItemGranularity: "標準粒度",
        regionGranularity: "都道府県レベル",
        timeGranularity: "年単位",
      },
    };

    const result2 = standardizeLearnDataGranularity(input2);

    // 2 回目の実行でも同じ形式で統一されていることを確認
    expect(result2.standardizedEstimateItems.length).toBe(2);
    result2.standardizedEstimateItems.forEach((item) => {
      expect(item.unitGranularity).toBe("標準粒度");
    });

    expect(result2.standardizedRegionData.length).toBe(2);
    result2.standardizedRegionData.forEach((region) => {
      expect(region.granularity).toBe("都道府県レベル");
    });

    expect(result2.standardizedTimeData.length).toBe(2);
    result2.standardizedTimeData.forEach((time) => {
      expect(time.granularity).toBe("年単位");
    });

    // 大阪は 27 に統一
    const osakaRegion = result2.standardizedRegionData.find(
      (r) => r.originalName === "大阪府大阪市北区" || r.originalName === "大阪府"
    );
    expect(osakaRegion).toBeDefined();
    expect(osakaRegion!.code).toBe("27");

    // 3 月も年単位に統一
    const march2024Time = result2.standardizedTimeData.find(
      (t) => t.originalPeriod === "2024年3月" || t.originalPeriod === "2024年"
    );
    expect(march2024Time).toBeDefined();
    expect(march2024Time!.period).toBe("2024年");
    expect(march2024Time!.granularity).toBe("年単位");

    // 変換ログも記録されていることを確認
    expect(result2.conversionLog.status).toBe("成功");
    expect(result2.conversionLog.errorCount).toBe(0);
    expect(result2.conversionLog.processedEstimateItems).toBe(2);
    expect(result2.conversionLog.processedRegions).toBe(2);
    expect(result2.conversionLog.processedTimes).toBe(2);

    // 全体の統一性確認
    expect(result.standardizedEstimateItems.every((item) => item.unitGranularity === "標準粒度")).toBe(true);
    expect(result.standardizedRegionData.every((region) => region.granularity === "都道府県レベル")).toBe(true);
    expect(result.standardizedTimeData.every((time) => time.granularity === "年単位")).toBe(true);
  });
});