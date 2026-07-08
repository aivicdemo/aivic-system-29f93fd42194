import { analyzeRootCauseOfDeviation } from "../../src/logic/it-6-2-2-2";

describe("乖離パターン根本原因分析ダッシュボード", () => {
  test("SCEN-1474: 学習データ偏り・季節変動対応不足・過去案件欠落の3観点から根本原因を特定", () => {
    // 分析対象となる乖離データセット
    const deviationDataset = {
      datasetId: "DST-2024-001",
      analysisTargetStartDate: "2024-01-01",
      analysisTargetEndDate: "2024-03-31",
      totalEstimateCount: 300,
      totalDeviationCount: 87,
      regionCoverage: ["Tokyo", "Osaka", "Nagoya"],
      constructionTypes: ["Type_A", "Type_B", "Type_C"],
      seasonalPatternsObserved: [
        {
          season: "Winter",
          deviationRate: 35.5,
          sampleCount: 45,
          expectedCount: 30,
        },
        {
          season: "Spring",
          deviationRate: 22.3,
          sampleCount: 42,
          expectedCount: 45,
        },
      ],
      missingCasePatterns: [
        {
          region: "Nagoya",
          constructionType: "Type_C",
          expectedCaseCount: 20,
          actualCaseCount: 5,
          shortfall: 15,
        },
        {
          region: "Hokkaido",
          constructionType: "Type_A",
          expectedCaseCount: 25,
          actualCaseCount: 0,
          shortfall: 25,
        },
      ],
      learningDataBiasMetrics: {
        geographicBiasScore: 78.5,
        constructionTypeBiasScore: 65.2,
        temporalBiasScore: 81.3,
      },
    };

    // 学習データ偏りの分析を実行
    const biasAnalysisResult = {
      analysisType: "Learning_Data_Bias",
      geographicBias: {
        biasScore: 78.5,
        overRepresentedRegion: "Tokyo",
        underRepresentedRegion: "Hokkaido",
        biasLevel: "High",
        percentageOverRepresented: 42.7,
        percentageUnderRepresented: 12.3,
      },
      constructionTypeBias: {
        biasScore: 65.2,
        overRepresentedType: "Type_A",
        underRepresentedType: "Type_C",
        biasLevel: "Medium",
        percentageOverRepresented: 38.9,
        percentageUnderRepresented: 18.5,
      },
      biasImpactOnDeviation: 34.2,
      biasDescription:
        "Geographic concentration in Tokyo region causes 34.2% of observed deviation",
    };

    // 季節変動対応不足の分析を実行
    const seasonalAnalysisResult = {
      analysisType: "Seasonal_Adaptation_Insufficiency",
      seasonalPatterns: [
        {
          season: "Winter",
          detectedDeviationRate: 35.5,
          expectedRangeMin: 20.0,
          expectedRangeMax: 28.0,
          adaptationGap: 7.5,
          severity: "High",
          impactOnOverallDeviation: 18.7,
        },
        {
          season: "Spring",
          detectedDeviationRate: 22.3,
          expectedRangeMin: 18.0,
          expectedRangeMax: 26.0,
          adaptationGap: 0,
          severity: "Low",
          impactOnOverallDeviation: 0,
        },
      ],
      seasonalityIndex: 72.4,
      seasonalImpactOnDeviation: 18.7,
      seasonalDescription:
        "Winter season shows 7.5% adaptation gap, accounting for 18.7% of deviation",
    };

    // 過去案件欠落の分析を実行
    const missingCaseAnalysisResult = {
      analysisType: "Historical_Case_Shortage",
      missingPatterns: [
        {
          region: "Nagoya",
          constructionType: "Type_C",
          expectedCaseCount: 20,
          actualCaseCount: 5,
          shortfallCount: 15,
          shortfallPercentage: 75.0,
          severity: "High",
          impactOnDeviation: 12.4,
        },
        {
          region: "Hokkaido",
          constructionType: "Type_A",
          expectedCaseCount: 25,
          actualCaseCount: 0,
          shortfallCount: 25,
          shortfallPercentage: 100.0,
          severity: "Critical",
          impactOnDeviation: 21.8,
        },
      ],
      totalShortfallCount: 40,
      totalExpectedCount: 120,
      shortfallRate: 33.33,
      missingCaseImpactOnDeviation: 34.2,
      missingCaseDescription:
        "Missing case data for Hokkaido Type_A and Nagoya Type_C accounts for 34.2% of deviation",
    };

    // 根本原因分析関数を呼び出し
    const result = analyzeRootCauseOfDeviation({
      datasetId: deviationDataset.datasetId,
      biasAnalysis: biasAnalysisResult,
      seasonalAnalysis: seasonalAnalysisResult,
      missingCaseAnalysis: missingCaseAnalysisResult,
    });

    // 3観点の分析結果が統合レポートに正しく反映されたか検証
    expect(result.rootCauseReport).toBeDefined();
    expect(result.rootCauseReport.totalDeviationExplained).toBe(87.1);
    expect(result.rootCauseReport.analysisCompletionPercentage).toBe(100);

    // 根本原因が優先度付きで表示されているか検証
    expect(result.rootCauseReport.prioritizedRootCauses).toHaveLength(3);

    // 第1位：過去案件欠落（34.2%）
    expect(result.rootCauseReport.prioritizedRootCauses[0]).toEqual({
      rank: 1,
      causeType: "Historical_Case_Shortage",
      contributionPercentage: 34.2,
      severity: "Critical",
      description:
        "Missing case data for Hokkaido Type_A and Nagoya Type_C accounts for 34.2% of deviation",
      affectedRegions: ["Hokkaido", "Nagoya"],
      affectedConstructionTypes: ["Type_A", "Type_C"],
    });

    // 第2位：学習データ偏り（34.2%）
    expect(result.rootCauseReport.prioritizedRootCauses[1]).toEqual({
      rank: 2,
      causeType: "Learning_Data_Bias",
      contributionPercentage: 34.2,
      severity: "High",
      description:
        "Geographic concentration in Tokyo region causes 34.2% of observed deviation",
      affectedRegions: ["Tokyo", "Hokkaido"],
      affectedConstructionTypes: ["Type_A", "Type_C"],
    });

    // 第3位：季節変動対応不足（18.7%）
    expect(result.rootCauseReport.prioritizedRootCauses[2]).toEqual({
      rank: 3,
      causeType: "Seasonal_Adaptation_Insufficiency",
      contributionPercentage: 18.7,
      severity: "High",
      description:
        "Winter season shows 7.5% adaptation gap, accounting for 18.7% of deviation",
      affectedSeasons: ["Winter"],
      seasonalityIndex: 72.4,
    });

    // 各観点の分析結果が明確に区別できているか検証
    expect(result.detailedAnalysisByPerspective).toHaveLength(3);

    const biasDetail = result.detailedAnalysisByPerspective.find(
      (p) => p.perspective === "Learning_Data_Bias"
    );
    expect(biasDetail).toBeDefined();
    expect(biasDetail.analysisResult.geographicBias.biasScore).toBe(78.5);
    expect(biasDetail.analysisResult.constructionTypeBias.biasScore).toBe(
      65.2
    );

    const seasonalDetail = result.detailedAnalysisByPerspective.find(
      (p) => p.perspective === "Seasonal_Adaptation_Insufficiency"
    );
    expect(seasonalDetail).toBeDefined();
    expect(seasonalDetail.analysisResult.seasonalityIndex).toBe(72.4);
    expect(seasonalDetail.analysisResult.seasonalPatterns).toHaveLength(2);

    const missingCaseDetail = result.detailedAnalysisByPerspective.find(
      (p) => p.perspective === "Historical_Case_Shortage"
    );
    expect(missingCaseDetail).toBeDefined();
    expect(missingCaseDetail.analysisResult.shortfallRate).toBe(33.33);
    expect(missingCaseDetail.analysisResult.missingPatterns).toHaveLength(2);

    // 改善提案が具体的に提示されているか検証
    expect(result.improvementProposals).toHaveLength(3);

    expect(result.improvementProposals[0]).toEqual({
      proposalId: "IMP-001",
      causeType: "Historical_Case_Shortage",
      priority: "Critical",
      actionDescription:
        "Collect and integrate missing case data for Hokkaido Type_A and Nagoya Type_C",
      estimatedDataCollectionDays: 14,
      expectedDeviationReductionPercentage: 34.2,
      implementationDifficulty: "High",
      requiredResources: ["Data collection team", "Market research"],
    });

    expect(result.improvementProposals[1]).toEqual({
      proposalId: "IMP-002",
      causeType: "Learning_Data_Bias",
      priority: "High",
      actionDescription:
        "Rebalance training data geographic distribution, increasing Hokkaido representation from 12.3% to 25%",
      estimatedDataCollectionDays: 10,
      expectedDeviationReductionPercentage: 34.2,
      implementationDifficulty: "Medium",
      requiredResources: ["Data scientist", "Regional database"],
    });

    expect(result.improvementProposals[2]).toEqual({
      proposalId: "IMP-003",
      causeType: "Seasonal_Adaptation_Insufficiency",
      priority: "High",
      actionDescription:
        "Apply seasonal adjustment coefficients to Winter estimates, closing 7.5% adaptation gap",
      estimatedDataCollectionDays: 5,
      expectedDeviationReductionPercentage: 18.7,
      implementationDifficulty: "Low",
      requiredResources: ["Price index data", "Seasonal adjustment parameters"],
    });

    // 分析結果のエクスポートが正常に生成されたか検証
    expect(result.exportData).toBeDefined();
    expect(result.exportData.exportFormat).toBe("JSON");
    expect(result.exportData.fileNameGenerated).toBe(
      "root_cause_analysis_DST-2024-001_2024-03-31.json"
    );
    expect(result.exportData.exportTimestamp).toBe(
      "2024-03-31T23:59:59+09:00"
    );
    expect(result.exportData.exportedRecordCount).toBe(3);
    expect(result.exportData.exportSuccessStatus).toBe(true);
    expect(result.exportData.exportSizeBytes).toBe(8742);

    // エクスポートデータに全分析結果が含まれているか検証
    expect(result.exportData.includesRootCauseReport).toBe(true);
    expect(result.exportData.includesDetailedAnalysisByPerspective).toBe(true);
    expect(result.exportData.includesImprovementProposals).toBe(true);

    // 最終的に全体的な分析品質が高いか検証
    expect(result.analysisQualityMetrics).toBeDefined();
    expect(result.analysisQualityMetrics.dataCompleteness).toBe(100);
    expect(result.analysisQualityMetrics.analysisDepth).toBe(85.5);
    expect(result.analysisQualityMetrics.recommendationSpecificity).toBe(92.3);
    expect(result.analysisQualityMetrics.overallQualityScore).toBe(92.6);
  });
});