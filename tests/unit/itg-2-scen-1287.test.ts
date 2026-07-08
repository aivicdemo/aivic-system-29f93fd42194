import { describe, test, expect } from "@jest/globals";
import {
  analyzeMonthlyPatterns,
  generateStaffingScenarios,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("Monthly staffing pattern analysis and scenario generation", () => {
  test("SCEN-1287: Generate 3 staffing scenarios from 12-month historical data with correct metrics", () => {
    // Prepare 12 months of historical monthly case count data
    const monthlyData = [
      { month: "2023-01", caseCount: 450 },
      { month: "2023-02", caseCount: 520 },
      { month: "2023-03", caseCount: 480 },
      { month: "2023-04", caseCount: 510 },
      { month: "2023-05", caseCount: 890 },
      { month: "2023-06", caseCount: 920 },
      { month: "2023-07", caseCount: 950 },
      { month: "2023-08", caseCount: 880 },
      { month: "2023-09", caseCount: 520 },
      { month: "2023-10", caseCount: 490 },
      { month: "2023-11", caseCount: 510 },
      { month: "2023-12", caseCount: 460 },
    ];

    // Step 1: Analyze monthly patterns from 12-month data
    const patternAnalysis = analyzeMonthlyPatterns(monthlyData);

    // Verify pattern analysis output structure
    expect(patternAnalysis).toHaveProperty("normalPeriodAvg");
    expect(patternAnalysis).toHaveProperty("mediumBusyPeriodAvg");
    expect(patternAnalysis).toHaveProperty("busyPeriodAvg");
    expect(patternAnalysis).toHaveProperty("overallAvg");
    expect(patternAnalysis).toHaveProperty("variationRate");

    // Calculate expected metrics manually:
    // Normal period months (Feb, Mar, Apr, Sep, Oct, Nov, Dec): avg = (520+480+510+520+490+510+460)/7 = 3490/7 ≈ 498.57
    // Medium busy period months (Jan, Dec): avg = (450+460)/2 = 455
    // Busy period months (May, Jun, Jul, Aug): avg = (890+920+950+880)/4 = 3640/4 = 910
    // Overall average = 6660/12 = 555
    const expectedNormalAvg = Math.round((520 + 480 + 510 + 520 + 490 + 510 + 460) / 7 * 100) / 100;
    const expectedBusyAvg = Math.round((890 + 920 + 950 + 880) / 4 * 100) / 100;
    const expectedOverallAvg = Math.round(6660 / 12 * 100) / 100;

    expect(patternAnalysis.normalPeriodAvg).toBe(expectedNormalAvg);
    expect(patternAnalysis.busyPeriodAvg).toBe(expectedBusyAvg);
    expect(patternAnalysis.overallAvg).toBe(expectedOverallAvg);

    // Step 2: Generate staffing scenarios based on pattern analysis
    const scenarios = generateStaffingScenarios(patternAnalysis, monthlyData);

    // Verify 3 scenarios are generated
    expect(scenarios).toHaveLength(3);

    // Step 3: Verify normal period scenario
    const normalScenario = scenarios.find(s => s.type === "normal");
    expect(normalScenario).toBeDefined();
    expect(normalScenario!.type).toBe("normal");
    expect(normalScenario!.averageMonthlyCount).toBe(expectedNormalAvg);
    // Expected variation rate for normal period: std dev / mean
    const normalMonthlyValues = [520, 480, 510, 520, 490, 510, 460];
    const normalMean = expectedNormalAvg;
    const normalVariance = normalMonthlyValues.reduce((sum, val) => sum + Math.pow(val - normalMean, 2), 0) / normalMonthlyValues.length;
    const normalStdDev = Math.sqrt(normalVariance);
    const expectedNormalVariationRate = Math.round((normalStdDev / normalMean) * 10000) / 10000;
    expect(normalScenario!.variationRate).toBe(expectedNormalVariationRate);
    // Expected recommended staff: ceil(average monthly count / base processing capacity per staff member)
    // Assuming base capacity = 30 cases per month per staff member
    const expectedNormalStaff = Math.ceil(expectedNormalAvg / 30);
    expect(normalScenario!.recommendedStaffCount).toBe(expectedNormalStaff);

    // Step 4: Verify medium busy period scenario
    const mediumBusyScenario = scenarios.find(s => s.type === "mediumBusy");
    expect(mediumBusyScenario).toBeDefined();
    expect(mediumBusyScenario!.type).toBe("mediumBusy");
    // Medium busy period uses data points at boundaries: Feb(520), Aug(880)
    const mediumBusyMonthlyValues = [520, 880];
    const expectedMediumBusyAvg = Math.round((520 + 880) / 2 * 100) / 100;
    expect(mediumBusyScenario!.averageMonthlyCount).toBe(expectedMediumBusyAvg);
    const mediumBusyMean = expectedMediumBusyAvg;
    const mediumBusyVariance = mediumBusyMonthlyValues.reduce((sum, val) => sum + Math.pow(val - mediumBusyMean, 2), 0) / mediumBusyMonthlyValues.length;
    const mediumBusyStdDev = Math.sqrt(mediumBusyVariance);
    const expectedMediumBusyVariationRate = Math.round((mediumBusyStdDev / mediumBusyMean) * 10000) / 10000;
    expect(mediumBusyScenario!.variationRate).toBe(expectedMediumBusyVariationRate);
    const expectedMediumBusyStaff = Math.ceil(expectedMediumBusyAvg / 30);
    expect(mediumBusyScenario!.recommendedStaffCount).toBe(expectedMediumBusyStaff);

    // Step 5: Verify busy period scenario
    const busyScenario = scenarios.find(s => s.type === "busy");
    expect(busyScenario).toBeDefined();
    expect(busyScenario!.type).toBe("busy");
    expect(busyScenario!.averageMonthlyCount).toBe(expectedBusyAvg);
    const busyMonthlyValues = [890, 920, 950, 880];
    const busyMean = expectedBusyAvg;
    const busyVariance = busyMonthlyValues.reduce((sum, val) => sum + Math.pow(val - busyMean, 2), 0) / busyMonthlyValues.length;
    const busyStdDev = Math.sqrt(busyVariance);
    const expectedBusyVariationRate = Math.round((busyStdDev / busyMean) * 10000) / 10000;
    expect(busyScenario!.variationRate).toBe(expectedBusyVariationRate);
    const expectedBusyStaff = Math.ceil(expectedBusyAvg / 30);
    expect(busyScenario!.recommendedStaffCount).toBe(expectedBusyStaff);

    // Step 6: Verify each scenario has required detail fields
    scenarios.forEach(scenario => {
      expect(scenario).toHaveProperty("type");
      expect(scenario).toHaveProperty("averageMonthlyCount");
      expect(scenario).toHaveProperty("variationRate");
      expect(scenario).toHaveProperty("recommendedStaffCount");
      expect(scenario).toHaveProperty("supportRequestTiming");
      expect(scenario).toHaveProperty("costEstimate");
      
      // Verify numeric properties are positive numbers
      expect(typeof scenario.averageMonthlyCount).toBe("number");
      expect(scenario.averageMonthlyCount).toBeGreaterThan(0);
      expect(typeof scenario.variationRate).toBe("number");
      expect(scenario.variationRate).toBeGreaterThanOrEqual(0);
      expect(typeof scenario.recommendedStaffCount).toBe("number");
      expect(scenario.recommendedStaffCount).toBeGreaterThan(0);
    });

    // Step 7: Verify variation rates reflect historical volatility correctly
    // Busy period should have lower variation rate than medium busy period
    expect(busyScenario!.variationRate).toBeLessThan(mediumBusyScenario!.variationRate);

    // Step 8: Verify staffing hierarchy: normal < mediumBusy < busy
    expect(normalScenario!.recommendedStaffCount).toBeLessThanOrEqual(mediumBusyScenario!.recommendedStaffCount);
    expect(mediumBusyScenario!.recommendedStaffCount).toBeLessThanOrEqual(busyScenario!.recommendedStaffCount);
  });
});