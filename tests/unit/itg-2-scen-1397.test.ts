import { aggregateAssessmentAccuracyByDimension } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1397: [edge] OCR読取誤り判定機能 - 発生箇所（地域/工種/金額帯）が不明確な場合、デフォルト分類が適用される
  test("発生箇所が不明確な場合、デフォルト分類が適用される", () => {
    const assessmentData = [
      {
        assessorId: "assessor_001",
        assessorName: "査定員A",
        workType: "土工",
        amountBand: "100万～500万",
        region: "東京",
        deviationRate: 5.2,
        deviationAmount: 52000,
        assessmentTime: 15,
        accuracy: 95.0,
        ocrConfidence: 92.5,
      },
      {
        assessorId: "assessor_002",
        assessorName: "査定員B",
        workType: "",
        amountBand: "500万～1000万",
        region: "大阪",
        deviationRate: 8.7,
        deviationAmount: 87000,
        assessmentTime: 18,
        accuracy: 88.5,
        ocrConfidence: 85.0,
      },
      {
        assessorId: "assessor_003",
        assessorName: "査定員C",
        workType: null,
        amountBand: undefined,
        region: "",
        deviationRate: 12.3,
        deviationAmount: 123000,
        assessmentTime: 22,
        accuracy: 82.0,
        ocrConfidence: 78.5,
      },
    ];

    const result = aggregateAssessmentAccuracyByDimension(assessmentData);

    expect(result).toBeDefined();
    expect(result.byWorkType).toBeDefined();
    expect(result.byAmountBand).toBeDefined();
    expect(result.byRegion).toBeDefined();

    const defaultWorkTypeEntry = result.byWorkType.find(
      (entry: any) => entry.dimension === "その他"
    );
    expect(defaultWorkTypeEntry).toBeDefined();
    expect(defaultWorkTypeEntry.count).toBe(2);
    expect(defaultWorkTypeEntry.averageAccuracy).toBeCloseTo(85.25, 1);

    const defaultAmountBandEntry = result.byAmountBand.find(
      (entry: any) => entry.dimension === "不明"
    );
    expect(defaultAmountBandEntry).toBeDefined();
    expect(defaultAmountBandEntry.count).toBe(1);
    expect(defaultAmountBandEntry.averageAccuracy).toBeCloseTo(82.0, 1);

    const defaultRegionEntry = result.byRegion.find(
      (entry: any) => entry.dimension === "全国"
    );
    expect(defaultRegionEntry).toBeDefined();
    expect(defaultRegionEntry.count).toBe(1);
    expect(defaultRegionEntry.averageAccuracy).toBeCloseTo(82.0, 1);

    const tokyoEntry = result.byRegion.find(
      (entry: any) => entry.dimension === "東京"
    );
    expect(tokyoEntry).toBeDefined();
    expect(tokyoEntry.count).toBe(1);
    expect(tokyoEntry.averageAccuracy).toBeCloseTo(95.0, 1);

    const osakaDimensionEntry = result.byRegion.find(
      (entry: any) => entry.dimension === "大阪"
    );
    expect(osakaDimensionEntry).toBeDefined();
    expect(osakaDimensionEntry.count).toBe(1);
    expect(osakaDimensionEntry.averageAccuracy).toBeCloseTo(88.5, 1);

    const dokoEntry = result.byWorkType.find(
      (entry: any) => entry.dimension === "土工"
    );
    expect(dokoEntry).toBeDefined();
    expect(dokoEntry.count).toBe(1);
    expect(dokoEntry.averageAccuracy).toBeCloseTo(95.0, 1);

    const band500Entry = result.byAmountBand.find(
      (entry: any) => entry.dimension === "500万～1000万"
    );
    expect(band500Entry).toBeDefined();
    expect(band500Entry.count).toBe(1);
    expect(band500Entry.averageAccuracy).toBeCloseTo(88.5, 1);

    const band100Entry = result.byAmountBand.find(
      (entry: any) => entry.dimension === "100万～500万"
    );
    expect(band100Entry).toBeDefined();
    expect(band100Entry.count).toBe(1);
    expect(band100Entry.averageAccuracy).toBeCloseTo(95.0, 1);

    expect(result.totalAssessments).toBe(3);
    expect(result.overallAverageAccuracy).toBeCloseTo(88.5, 1);
    expect(result.overallAverageDeviationRate).toBeCloseTo(8.73, 1);
  });
});