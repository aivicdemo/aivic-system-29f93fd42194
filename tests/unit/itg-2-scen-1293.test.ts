import { evaluateLearningDataQuality } from "../../src/logic/it-6-2-1-1";

describe("Learning Data Quality Evaluation and Risk Assessment", () => {
  // SCEN-1293: [normal] 学習データ品質評価と精度低下リスク判定
  test("should quantify past project data and price book coverage/freshness and determine precision decline risk level", () => {
    // Prepare test data: past project data
    const pastProjectData = {
      totalRecords: 1500,
      lastUpdateDate: new Date("2024-10-15T00:00:00Z"),
      categoryDistribution: {
        regional: {
          tokyo: 450,
          osaka: 350,
          nagoya: 300,
          other: 400,
        },
        constructionType: {
          civil: 600,
          building: 500,
          electrical: 400,
        },
        priceRange: {
          under1m: 300,
          "1m-5m": 450,
          "5m-10m": 400,
          over10m: 350,
        },
      },
    };

    // Prepare test data: price book metadata
    const priceBookMetadata = {
      itemCount: 2800,
      publicationDate: new Date("2024-09-01T00:00:00Z"),
      coverageRate: 0.92,
      version: "2024-Q3",
      includedRegions: 47,
      includedConstructionTypes: 12,
    };

    // Execute learning data quality evaluation
    const qualityResult = evaluateLearningDataQuality({
      pastProjectData,
      priceBookMetadata,
      evaluationDate: new Date("2024-12-15T00:00:00Z"),
    });

    // Verify past project data coverage quantification
    expect(qualityResult.pastProjectDataCoverage).toBeDefined();
    expect(qualityResult.pastProjectDataCoverage.totalRecords).toBe(1500);
    expect(qualityResult.pastProjectDataCoverage.regionalCoverageScore).toBe(
      0.89
    );
    expect(qualityResult.pastProjectDataCoverage.constructionTypeCoverageScore).toBe(
      0.95
    );
    expect(qualityResult.pastProjectDataCoverage.priceRangeCoverageScore).toBe(
      0.92
    );
    expect(qualityResult.pastProjectDataCoverage.overallCoverageRate).toBe(0.92);

    // Verify price book coverage quantification
    expect(qualityResult.priceBookCoverage).toBeDefined();
    expect(qualityResult.priceBookCoverage.itemCount).toBe(2800);
    expect(qualityResult.priceBookCoverage.regionalCoverageScore).toBe(1.0);
    expect(qualityResult.priceBookCoverage.constructionTypeCoverageScore).toBe(
      1.0
    );
    expect(qualityResult.priceBookCoverage.declaredCoverageRate).toBe(0.92);

    // Verify past project data freshness quantification
    expect(qualityResult.pastProjectDataFreshness).toBeDefined();
    expect(qualityResult.pastProjectDataFreshness.daysSinceLastUpdate).toBe(61);
    expect(qualityResult.pastProjectDataFreshness.freshnessScore).toBe(0.78);
    expect(qualityResult.pastProjectDataFreshness.dataAgeStatus).toBe("ACCEPTABLE");

    // Verify price book freshness quantification
    expect(qualityResult.priceBookFreshness).toBeDefined();
    expect(qualityResult.priceBookFreshness.daysSincePublication).toBe(105);
    expect(qualityResult.priceBookFreshness.yearsSincePublication).toBe(0.29);
    expect(qualityResult.priceBookFreshness.freshnessScore).toBe(0.71);
    expect(qualityResult.priceBookFreshness.publicationStatus).toBe("RECENT");

    // Verify precision decline risk level determination
    expect(qualityResult.riskAssessment).toBeDefined();
    expect(qualityResult.riskAssessment.riskLevel).toBe("LOW");
    expect(qualityResult.riskAssessment.riskScore).toBe(0.35);

    // Verify risk threshold application: coverage threshold
    expect(qualityResult.riskAssessment.coverageThresholdPassed).toBe(true);
    expect(qualityResult.riskAssessment.coverageThreshold).toBe(0.85);
    expect(qualityResult.riskAssessment.combinedCoverageScore).toBe(0.92);

    // Verify risk threshold application: freshness threshold
    expect(qualityResult.riskAssessment.freshnessThresholdPassed).toBe(true);
    expect(qualityResult.riskAssessment.freshnessThreshold).toBe(0.65);
    expect(qualityResult.riskAssessment.combinedFreshnessScore).toBe(0.745);

    // Verify composite evaluation logic
    expect(qualityResult.riskAssessment.compositeRiskFactors).toBeDefined();
    expect(
      qualityResult.riskAssessment.compositeRiskFactors.coverageImpactWeight
    ).toBe(0.6);
    expect(
      qualityResult.riskAssessment.compositeRiskFactors.freshnessImpactWeight
    ).toBe(0.4);
    expect(
      qualityResult.riskAssessment.compositeRiskFactors.coverageContribution
    ).toBe(0.552);
    expect(
      qualityResult.riskAssessment.compositeRiskFactors.freshnessContribution
    ).toBe(0.298);

    // Verify risk level boundaries for "LOW" classification
    expect(qualityResult.riskAssessment.riskLevel).toMatch(/^(HIGH|MEDIUM|LOW)$/);
    expect(qualityResult.riskAssessment.riskScore).toBeGreaterThanOrEqual(0);
    expect(qualityResult.riskAssessment.riskScore).toBeLessThanOrEqual(1.0);

    // Verify risk recommendation
    expect(qualityResult.riskAssessment.recommendation).toBe(
      "CONTINUE_CURRENT_OPERATIONS"
    );
    expect(qualityResult.riskAssessment.priorityActions).toEqual([]);

    // Verify detailed risk analysis output
    expect(qualityResult.detailedAnalysis).toBeDefined();
    expect(
      qualityResult.detailedAnalysis.weakCoverageAreas
    ).toBeInstanceOf(Array);
    expect(qualityResult.detailedAnalysis.weakCoverageAreas.length).toBe(1);
    expect(qualityResult.detailedAnalysis.weakCoverageAreas[0]).toEqual({
      dimension: "regional",
      weakArea: "other",
      coverage: 0.8,
      recommendedAction: "PRIORITIZE_DATA_COLLECTION",
    });

    expect(
      qualityResult.detailedAnalysis.freshnessAlerts
    ).toBeInstanceOf(Array);
    expect(qualityResult.detailedAnalysis.freshnessAlerts.length).toBe(1);
    expect(qualityResult.detailedAnalysis.freshnessAlerts[0]).toEqual({
      dataSource: "priceBook",
      daysOld: 105,
      freshnessScore: 0.71,
      status: "ACCEPTABLE",
      nextUpdateRecommendedDate: new Date("2025-01-14T00:00:00Z"),
    });

    // Test edge case: HIGH risk level
    const highRiskInput = {
      pastProjectData: {
        totalRecords: 120,
        lastUpdateDate: new Date("2024-06-15T00:00:00Z"),
        categoryDistribution: {
          regional: {
            tokyo: 40,
            osaka: 30,
            nagoya: 20,
            other: 30,
          },
          constructionType: {
            civil: 50,
            building: 40,
            electrical: 30,
          },
          priceRange: {
            under1m: 30,
            "1m-5m": 40,
            "5m-10m": 30,
            over10m: 20,
          },
        },
      },
      priceBookMetadata: {
        itemCount: 800,
        publicationDate: new Date("2024-01-10T00:00:00Z"),
        coverageRate: 0.68,
        version: "2024-Q1",
        includedRegions: 15,
        includedConstructionTypes: 6,
      },
      evaluationDate: new Date("2024-12-15T00:00:00Z"),
    };

    const highRiskResult = evaluateLearningDataQuality(highRiskInput);
    expect(highRiskResult.riskAssessment.riskLevel).toBe("HIGH");
    expect(highRiskResult.riskAssessment.riskScore).toBeGreaterThan(0.7);
    expect(highRiskResult.riskAssessment.recommendation).toBe(
      "URGENT_DATA_UPDATE_REQUIRED"
    );
    expect(highRiskResult.riskAssessment.priorityActions.length).toBeGreaterThan(
      0
    );

    // Test edge case: MEDIUM risk level
    const mediumRiskInput = {
      pastProjectData: {
        totalRecords: 600,
        lastUpdateDate: new Date("2024-09-20T00:00:00Z"),
        categoryDistribution: {
          regional: {
            tokyo: 200,
            osaka: 150,
            nagoya: 120,
            other: 130,
          },
          constructionType: {
            civil: 250,
            building: 200,
            electrical: 150,
          },
          priceRange: {
            under1m: 120,
            "1m-5m": 200,
            "5m-10m": 150,
            over10m: 130,
          },
        },
      },
      priceBookMetadata: {
        itemCount: 1500,
        publicationDate: new Date("2024-06-01T00:00:00Z"),
        coverageRate: 0.78,
        version: "2024-Q2",
        includedRegions: 30,
        includedConstructionTypes: 9,
      },
      evaluationDate: new Date("2024-12-15T00:00:00Z"),
    };

    const mediumRiskResult = evaluateLearningDataQuality(mediumRiskInput);
    expect(mediumRiskResult.riskAssessment.riskLevel).toBe("MEDIUM");
    expect(mediumRiskResult.riskAssessment.riskScore).toBeGreaterThanOrEqual(0.4);
    expect(mediumRiskResult.riskAssessment.riskScore).toBeLessThanOrEqual(0.7);
    expect(mediumRiskResult.riskAssessment.recommendation).toBe(
      "SCHEDULED_DATA_UPDATE_RECOMMENDED"
    );
    expect(mediumRiskResult.riskAssessment.priorityActions.length).toBeGreaterThan(
      0
    );

    // Verify numerical consistency across all metrics
    expect(
      qualityResult.riskAssessment.combinedCoverageScore
    ).toBeCloseTo(
      (qualityResult.pastProjectDataCoverage.overallCoverageRate +
        qualityResult.priceBookCoverage.declaredCoverageRate) /
        2,
      2
    );
    expect(qualityResult.riskAssessment.combinedFreshnessScore).toBeCloseTo(
      (qualityResult.pastProjectDataFreshness.freshnessScore +
        qualityResult.priceBookFreshness.freshnessScore) /
        2,
      2
    );
  });
});