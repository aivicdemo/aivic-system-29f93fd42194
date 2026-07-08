import { recordNegotiationResult, queryNegotiationStatistics } from "../../src/logic/it-6-2-2-1";

describe("交渉結果記録・統計蓄積機能", () => {
  // SCEN-1052
  test("交渉結果が統計データとして蓄積され、後続の分析対象として参照可能になる", () => {
    // 1. 交渉結果の記録
    const negotiationInput = {
      productName: "鉄筋D10",
      category: "資材・建材",
      priceBeforeNegotiation: 85000,
      priceAfterNegotiation: 78000,
      reason: "市場競争力維持のため値下げ要求",
      handler: "査定員A",
      negotiationDate: "2024-01-15T14:30:00Z",
    };

    const recordResult = recordNegotiationResult(negotiationInput);

    // 2. 記録が正常に保存されたことを確認
    expect(recordResult.success).toBe(true);
    expect(recordResult.negotiationId).toBeDefined();
    expect(typeof recordResult.negotiationId).toBe("string");

    // 3. 記録内容の検証
    expect(recordResult.recordedData.productName).toBe("鉄筋D10");
    expect(recordResult.recordedData.category).toBe("資材・建材");
    expect(recordResult.recordedData.priceBeforeNegotiation).toBe(85000);
    expect(recordResult.recordedData.priceAfterNegotiation).toBe(78000);
    expect(recordResult.recordedData.reason).toBe("市場競争力維持のため値下げ要求");
    expect(recordResult.recordedData.handler).toBe("査定員A");
    expect(recordResult.recordedData.negotiationDate).toBe("2024-01-15T14:30:00Z");

    // 4. 価格差分の計算検証
    // 交渉前後の差分 = 85000 - 78000 = 7000（値下げ）
    expect(recordResult.priceDifference).toBe(-7000);
    // 削減率 = 7000 / 85000 = 0.0823... ≈ 8.24%
    expect(recordResult.reductionRate).toBeCloseTo(8.235, 2);

    // 5. 統計データへのアクセス・検証
    const statisticsQuery = {
      periodStart: "2024-01-01T00:00:00Z",
      periodEnd: "2024-01-31T23:59:59Z",
      category: "資材・建材",
      handler: "査定員A",
    };

    const statisticsResult = queryNegotiationStatistics(statisticsQuery);

    // 6. 統計データが参照可能なことを確認
    expect(statisticsResult.success).toBe(true);
    expect(Array.isArray(statisticsResult.records)).toBe(true);
    expect(statisticsResult.records.length).toBeGreaterThan(0);

    // 7. 蓄積された交渉結果の検証
    const recordedNegotiation = statisticsResult.records.find(
      (r: any) => r.negotiationId === recordResult.negotiationId
    );
    expect(recordedNegotiation).toBeDefined();
    expect(recordedNegotiation.productName).toBe("鉄筋D10");
    expect(recordedNegotiation.category).toBe("資材・建材");

    // 8. 詳細情報の計算・集計検証
    // 統計データの詳細項目が正確に計算されていることを確認
    expect(statisticsResult.aggregation).toBeDefined();
    expect(typeof statisticsResult.aggregation.totalNegotiations).toBe("number");
    expect(typeof statisticsResult.aggregation.totalPriceDifference).toBe("number");
    expect(typeof statisticsResult.aggregation.averageReductionRate).toBe("number");

    // 期間内の交渉件数が1件以上であることを確認
    expect(statisticsResult.aggregation.totalNegotiations).toBeGreaterThanOrEqual(1);

    // 9. フィルタリング機能の検証 - カテゴリフィルタ
    const filteredByCategory = queryNegotiationStatistics({
      periodStart: "2024-01-01T00:00:00Z",
      periodEnd: "2024-01-31T23:59:59Z",
      category: "資材・建材",
    });

    expect(filteredByCategory.success).toBe(true);
    expect(filteredByCategory.records.length).toBeGreaterThanOrEqual(1);
    // フィルタされた結果はすべて指定カテゴリであることを確認
    filteredByCategory.records.forEach((record: any) => {
      expect(record.category).toBe("資材・建材");
    });

    // 10. フィルタリング機能の検証 - 担当者フィルタ
    const filteredByHandler = queryNegotiationStatistics({
      periodStart: "2024-01-01T00:00:00Z",
      periodEnd: "2024-01-31T23:59:59Z",
      handler: "査定員A",
    });

    expect(filteredByHandler.success).toBe(true);
    expect(filteredByHandler.records.length).toBeGreaterThanOrEqual(1);
    // フィルタされた結果はすべて指定担当者であることを確認
    filteredByHandler.records.forEach((record: any) => {
      expect(record.handler).toBe("査定員A");
    });

    // 11. フィルタリング機能の検証 - 期間フィルタ
    const filteredByPeriod = queryNegotiationStatistics({
      periodStart: "2024-01-15T00:00:00Z",
      periodEnd: "2024-01-15T23:59:59Z",
    });

    expect(filteredByPeriod.success).toBe(true);
    // 期間内の交渉結果が取得できることを確認
    if (filteredByPeriod.records.length > 0) {
      filteredByPeriod.records.forEach((record: any) => {
        const recordDate = new Date(record.negotiationDate);
        const filterStart = new Date("2024-01-15T00:00:00Z");
        const filterEnd = new Date("2024-01-15T23:59:59Z");
        expect(recordDate.getTime()).toBeGreaterThanOrEqual(filterStart.getTime());
        expect(recordDate.getTime()).toBeLessThanOrEqual(filterEnd.getTime());
      });
    }

    // 12. 複合フィルタリングの検証
    const complexFilter = queryNegotiationStatistics({
      periodStart: "2024-01-01T00:00:00Z",
      periodEnd: "2024-01-31T23:59:59Z",
      category: "資材・建材",
      handler: "査定員A",
    });

    expect(complexFilter.success).toBe(true);
    expect(Array.isArray(complexFilter.records)).toBe(true);
    // すべてのレコードが複合フィルタ条件を満たすことを確認
    complexFilter.records.forEach((record: any) => {
      expect(record.category).toBe("資材・建材");
      expect(record.handler).toBe("査定員A");
    });

    // 13. 統計データの参照・分析対象としての有効性確認
    expect(statisticsResult.analysisReady).toBe(true);
    expect(statisticsResult.exportAvailable).toBe(true);

    // 14. 集計値の妥当性確認
    // 総価格差分が個別レコードの合計と一致することを確認
    let expectedTotalDifference = 0;
    statisticsResult.records.forEach((record: any) => {
      expectedTotalDifference += record.priceDifference;
    });
    expect(statisticsResult.aggregation.totalPriceDifference).toBe(expectedTotalDifference);

    // 15. 統計データの完全性確認
    expect(statisticsResult.aggregation).toHaveProperty("totalNegotiations");
    expect(statisticsResult.aggregation).toHaveProperty("totalPriceDifference");
    expect(statisticsResult.aggregation).toHaveProperty("averageReductionRate");
    expect(statisticsResult.aggregation).toHaveProperty("reasonDistribution");
    expect(statisticsResult.aggregation).toHaveProperty("categoryDistribution");
  });
});