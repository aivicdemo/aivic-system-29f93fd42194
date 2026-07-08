import { aggregateDashboardMetrics } from "../../src/logic/it-6-2-1-1";

describe("Dashboard Metrics Aggregation - Empty Data Handling", () => {
  // SCEN-1323
  test("should handle zero monthly results and generate empty dashboard dataset without errors", () => {
    // Precondition: No monthly assessment results for the target month
    const targetMonthStart = new Date("2024-01-01T00:00:00Z");
    const targetMonthEnd = new Date("2024-01-31T23:59:59Z");
    
    // Input: Empty assessment results dataset
    const emptyAssessmentResults = [];
    
    // Input: Target assessor groups and classifications
    const assessorGroups = ["A001", "A002", "A003"];
    const constructionTypes = ["TYPE_A", "TYPE_B", "TYPE_C"];
    const amountBands = ["BAND_0_1M", "BAND_1_5M", "BAND_5_10M"];
    
    // Aggregation parameters
    const aggregationParams = {
      startDate: targetMonthStart,
      endDate: targetMonthEnd,
      assessmentResults: emptyAssessmentResults,
      assessorGroups: assessorGroups,
      constructionTypes: constructionTypes,
      amountBands: amountBands,
      includeEmptyGroups: true
    };
    
    // Execute aggregation function
    const result = aggregateDashboardMetrics(aggregationParams);
    
    // Assertions: Verify empty dataset is properly handled
    expect(result).toEqual({
      status: "success",
      datasetStatus: "empty",
      aggregationPeriod: {
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z"
      },
      recordCount: 0,
      summaryMetrics: {
        totalAssessmentCount: 0,
        averageProcessingTime: 0,
        averageJudgmentAccuracy: 0,
        systemAvailabilityRate: 0
      },
      assessorMetrics: [],
      constructionTypeMetrics: [],
      amountBandMetrics: [],
      widgets: {
        graphWidget: {
          status: "no_data",
          data: []
        },
        kpiWidget: {
          status: "no_data",
          metrics: []
        },
        statisticsWidget: {
          status: "no_data",
          statistics: []
        }
      },
      errors: [],
      consoleWarnings: []
    });
    
    // Verify no error messages in result
    expect(result.errors).toHaveLength(0);
    expect(result.consoleWarnings).toHaveLength(0);
    
    // Verify all widgets are in "no_data" state
    expect(result.widgets.graphWidget.status).toBe("no_data");
    expect(result.widgets.kpiWidget.status).toBe("no_data");
    expect(result.widgets.statisticsWidget.status).toBe("no_data");
    
    // Verify all data arrays are empty
    expect(result.assessorMetrics).toHaveLength(0);
    expect(result.constructionTypeMetrics).toHaveLength(0);
    expect(result.amountBandMetrics).toHaveLength(0);
    
    // Verify summary metrics are zero values
    expect(result.summaryMetrics.totalAssessmentCount).toBe(0);
    expect(result.summaryMetrics.averageProcessingTime).toBe(0);
    expect(result.summaryMetrics.averageJudgmentAccuracy).toBe(0);
    expect(result.summaryMetrics.systemAvailabilityRate).toBe(0);
    
    // Verify dataset status flag indicates empty state
    expect(result.datasetStatus).toBe("empty");
    
    // Verify aggregation period is correctly recorded
    expect(result.aggregationPeriod.startDate).toBe("2024-01-01T00:00:00Z");
    expect(result.aggregationPeriod.endDate).toBe("2024-01-31T23:59:59Z");
    
    // Verify system returns success status despite empty data
    expect(result.status).toBe("success");
  });
});