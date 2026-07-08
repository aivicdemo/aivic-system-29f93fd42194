import { calculateDimensionalCoverageRates } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-927
  test("データ品質検証・承認基準判定機能 - 地域・工種・時期の各次元においてカバー率を個別に算出し報告できる", () => {
    // 準備: 査定データサンプルセット
    // 地域別：3地域（東京、大阪、福岡）
    // 工種別：5工種（建築、土木、設備、造園、その他）
    // 時期別：4時期（Q1, Q2, Q3, Q4）
    const assessmentDataSample = [
      {
        id: "data_001",
        region: "tokyo",
        constructionType: "building",
        period: "Q1",
        amount: 1500000,
        quantity: 10,
      },
      {
        id: "data_002",
        region: "tokyo",
        constructionType: "building",
        period: "Q1",
        amount: 2000000,
        quantity: 15,
      },
      {
        id: "data_003",
        region: "osaka",
        constructionType: "civil",
        period: "Q2",
        amount: 1800000,
        quantity: 12,
      },
      {
        id: "data_004",
        region: "osaka",
        constructionType: "equipment",
        period: "Q2",
        amount: 2200000,
        quantity: 20,
      },
      {
        id: "data_005",
        region: "fukuoka",
        constructionType: "landscape",
        period: "Q3",
        amount: 900000,
        quantity: 5,
      },
      {
        id: "data_006",
        region: "tokyo",
        constructionType: "other",
        period: "Q4",
        amount: 1200000,
        quantity: 8,
      },
      {
        id: "data_007",
        region: "osaka",
        constructionType: "building",
        period: "Q1",
        amount: 1600000,
        quantity: 11,
      },
      {
        id: "data_008",
        region: "fukuoka",
        constructionType: "civil",
        period: "Q2",
        amount: 1100000,
        quantity: 7,
      },
      {
        id: "data_009",
        region: "tokyo",
        constructionType: "equipment",
        period: "Q3",
        amount: 2100000,
        quantity: 18,
      },
      {
        id: "data_010",
        region: "osaka",
        constructionType: "landscape",
        period: "Q4",
        amount: 950000,
        quantity: 6,
      },
    ];

    const totalDataCount = assessmentDataSample.length; // 10

    // 地域別のカバー率算出
    // 東京: data_001, data_002, data_006, data_009 = 4件
    // 大阪: data_003, data_004, data_007, data_010 = 4件
    // 福岡: data_005, data_008 = 2件
    const regionCoverageRates = calculateDimensionalCoverageRates(
      assessmentDataSample,
      "region"
    );

    // 期待値: 地域別カバー率
    // 東京: 4/10 = 0.4 = 40%
    // 大阪: 4/10 = 0.4 = 40%
    // 福岡: 2/10 = 0.2 = 20%
    expect(regionCoverageRates).toEqual({
      dimension: "region",
      coverageByValue: {
        tokyo: 0.4,
        osaka: 0.4,
        fukuoka: 0.2,
      },
      totalCoverage: 1.0,
    });

    // 工種別のカバー率算出
    // building: data_001, data_002, data_007 = 3件
    // civil: data_003, data_008 = 2件
    // equipment: data_004, data_009 = 2件
    // landscape: data_005, data_010 = 2件
    // other: data_006 = 1件
    const constructionTypeCoverageRates = calculateDimensionalCoverageRates(
      assessmentDataSample,
      "constructionType"
    );

    // 期待値: 工種別カバー率
    // building: 3/10 = 0.3 = 30%
    // civil: 2/10 = 0.2 = 20%
    // equipment: 2/10 = 0.2 = 20%
    // landscape: 2/10 = 0.2 = 20%
    // other: 1/10 = 0.1 = 10%
    expect(constructionTypeCoverageRates).toEqual({
      dimension: "constructionType",
      coverageByValue: {
        building: 0.3,
        civil: 0.2,
        equipment: 0.2,
        landscape: 0.2,
        other: 0.1,
      },
      totalCoverage: 1.0,
    });

    // 時期別のカバー率算出
    // Q1: data_001, data_002, data_007 = 3件
    // Q2: data_003, data_004, data_008 = 3件
    // Q3: data_005, data_009 = 2件
    // Q4: data_006, data_010 = 2件
    const periodCoverageRates = calculateDimensionalCoverageRates(
      assessmentDataSample,
      "period"
    );

    // 期待値: 時期別カバー率
    // Q1: 3/10 = 0.3 = 30%
    // Q2: 3/10 = 0.3 = 30%
    // Q3: 2/10 = 0.2 = 20%
    // Q4: 2/10 = 0.2 = 20%
    expect(periodCoverageRates).toEqual({
      dimension: "period",
      coverageByValue: {
        Q1: 0.3,
        Q2: 0.3,
        Q3: 0.2,
        Q4: 0.2,
      },
      totalCoverage: 1.0,
    });

    // 3つのカバー率結果が個別に分離した状態であることを確認
    expect(regionCoverageRates.dimension).toBe("region");
    expect(constructionTypeCoverageRates.dimension).toBe("constructionType");
    expect(periodCoverageRates.dimension).toBe("period");

    // 各次元のカバー率が独立していることを確認
    expect(Object.keys(regionCoverageRates.coverageByValue)).toEqual([
      "tokyo",
      "osaka",
      "fukuoka",
    ]);
    expect(Object.keys(constructionTypeCoverageRates.coverageByValue)).toEqual([
      "building",
      "civil",
      "equipment",
      "landscape",
      "other",
    ]);
    expect(Object.keys(periodCoverageRates.coverageByValue)).toEqual([
      "Q1",
      "Q2",
      "Q3",
      "Q4",
    ]);

    // レポート生成機能で独立した項目として出力されることを確認
    const reportOutput = {
      regionalCoverageReport: regionCoverageRates,
      constructionTypeCoverageReport: constructionTypeCoverageRates,
      periodCoverageReport: periodCoverageRates,
      generatedAt: "2024-02-15T10:30:00Z",
    };

    expect(reportOutput.regionalCoverageReport).toBeDefined();
    expect(reportOutput.constructionTypeCoverageReport).toBeDefined();
    expect(reportOutput.periodCoverageReport).toBeDefined();

    // レポント内で各次元のカバー率が明確に区分されていることを確認
    expect(reportOutput.regionalCoverageReport.dimension).not.toBe(
      reportOutput.constructionTypeCoverageReport.dimension
    );
    expect(reportOutput.constructionTypeCoverageReport.dimension).not.toBe(
      reportOutput.periodCoverageReport.dimension
    );

    // 各カバー率の計算式が正確である（対象データ数/全データ数）ことを検証
    // 地域別：東京 4/10 = 0.4
    expect(regionCoverageRates.coverageByValue.tokyo).toBe(4 / 10);
    // 地域別：大阪 4/10 = 0.4
    expect(regionCoverageRates.coverageByValue.osaka).toBe(4 / 10);
    // 地域別：福岡 2/10 = 0.2
    expect(regionCoverageRates.coverageByValue.fukuoka).toBe(2 / 10);

    // 工種別：building 3/10 = 0.3
    expect(constructionTypeCoverageRates.coverageByValue.building).toBe(3 / 10);
    // 工種別：civil 2/10 = 0.2
    expect(constructionTypeCoverageRates.coverageByValue.civil).toBe(2 / 10);
    // 工種別：equipment 2/10 = 0.2
    expect(constructionTypeCoverageRates.coverageByValue.equipment).toBe(2 / 10);
    // 工種別：landscape 2/10 = 0.2
    expect(constructionTypeCoverageRates.coverageByValue.landscape).toBe(2 / 10);
    // 工種別：other 1/10 = 0.1
    expect(constructionTypeCoverageRates.coverageByValue.other).toBe(1 / 10);

    // 時期別：Q1 3/10 = 0.3
    expect(periodCoverageRates.coverageByValue.Q1).toBe(3 / 10);
    // 時期別：Q2 3/10 = 0.3
    expect(periodCoverageRates.coverageByValue.Q2).toBe(3 / 10);
    // 時期別：Q3 2/10 = 0.2
    expect(periodCoverageRates.coverageByValue.Q3).toBe(2 / 10);
    // 時期別：Q4 2/10 = 0.2
    expect(periodCoverageRates.coverageByValue.Q4).toBe(2 / 10);

    // 複数回のレポート生成で結果の一貫性があることを確認
    const secondReportOutput = {
      regionalCoverageReport: calculateDimensionalCoverageRates(
        assessmentDataSample,
        "region"
      ),
      constructionTypeCoverageReport: calculateDimensionalCoverageRates(
        assessmentDataSample,
        "constructionType"
      ),
      periodCoverageReport: calculateDimensionalCoverageRates(
        assessmentDataSample,
        "period"
      ),
      generatedAt: "2024-02-15T11:45:00Z",
    };

    expect(secondReportOutput.regionalCoverageReport).toEqual(
      regionCoverageRates
    );
    expect(secondReportOutput.constructionTypeCoverageReport).toEqual(
      constructionTypeCoverageRates
    );
    expect(secondReportOutput.periodCoverageReport).toEqual(periodCoverageRates);

    // 総合カバー率が1.0（100%）であることを確認（すべてのデータが分類されている）
    expect(regionCoverageRates.totalCoverage).toBe(1.0);
    expect(constructionTypeCoverageRates.totalCoverage).toBe(1.0);
    expect(periodCoverageRates.totalCoverage).toBe(1.0);
  });
});