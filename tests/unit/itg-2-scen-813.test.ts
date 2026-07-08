import { describe, test, expect, beforeEach } from "@jest/globals";
import { validatePastCaseDataSeasonalityAndRegionalDifference } from "../../src/logic/it-6-2-1-1";

describe("Learning Data Auto-Update and AI Judgment Logic Relearning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-813
  test("should log warning and halt relearning when past case data lacks seasonal variation or regional difference reflection", () => {
    const priceBookUpdateEvent = {
      trigger_type: "price_book_new_version",
      price_book_version: "2024-Q1-v2",
      update_date: "2024-01-15",
      effective_regions: ["Tokyo", "Osaka", "Nagoya"],
      effective_seasons: ["Q1", "Q2", "Q3", "Q4"],
    };

    const pastCaseData = {
      cases: [
        {
          case_id: "CASE-001",
          amount: 5000000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-06-10",
        },
        {
          case_id: "CASE-002",
          amount: 3500000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-06-15",
        },
        {
          case_id: "CASE-003",
          amount: 4200000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-06-20",
        },
      ],
      seasonal_variation_reflected: false,
      regional_difference_reflected: false,
      last_update_date: "2023-12-01",
    };

    const result = validatePastCaseDataSeasonalityAndRegionalDifference(
      priceBookUpdateEvent,
      pastCaseData
    );

    expect(result.is_valid).toBe(false);
    expect(result.relearning_halted).toBe(true);
    expect(result.warning_message).toMatch(/季節変動/);
    expect(result.warning_message).toMatch(/地域差/);
    expect(result.warning_message).toMatch(/再学習を中止/);
    expect(result.missing_components).toEqual({
      seasonal_variation: true,
      regional_difference: true,
    });
  });

  test("should log warning and halt relearning when only seasonal variation is missing", () => {
    const priceBookUpdateEvent = {
      trigger_type: "price_book_new_version",
      price_book_version: "2024-Q1-v2",
      update_date: "2024-01-15",
      effective_regions: ["Tokyo", "Osaka", "Nagoya"],
      effective_seasons: ["Q1", "Q2", "Q3", "Q4"],
    };

    const pastCaseData = {
      cases: [
        {
          case_id: "CASE-001",
          amount: 5000000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-06-10",
        },
        {
          case_id: "CASE-002",
          amount: 4200000,
          region: "Osaka",
          work_type: "structural_work",
          date: "2023-06-15",
        },
        {
          case_id: "CASE-003",
          amount: 4800000,
          region: "Nagoya",
          work_type: "structural_work",
          date: "2023-06-20",
        },
      ],
      seasonal_variation_reflected: false,
      regional_difference_reflected: true,
      last_update_date: "2023-12-01",
    };

    const result = validatePastCaseDataSeasonalityAndRegionalDifference(
      priceBookUpdateEvent,
      pastCaseData
    );

    expect(result.is_valid).toBe(false);
    expect(result.relearning_halted).toBe(true);
    expect(result.warning_message).toMatch(/季節変動/);
    expect(result.missing_components).toEqual({
      seasonal_variation: true,
      regional_difference: false,
    });
  });

  test("should log warning and halt relearning when only regional difference is missing", () => {
    const priceBookUpdateEvent = {
      trigger_type: "price_book_new_version",
      price_book_version: "2024-Q1-v2",
      update_date: "2024-01-15",
      effective_regions: ["Tokyo", "Osaka", "Nagoya"],
      effective_seasons: ["Q1", "Q2", "Q3", "Q4"],
    };

    const pastCaseData = {
      cases: [
        {
          case_id: "CASE-001",
          amount: 5000000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-01-10",
          season: "Q1",
        },
        {
          case_id: "CASE-002",
          amount: 5200000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-04-15",
          season: "Q2",
        },
        {
          case_id: "CASE-003",
          amount: 4800000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-07-20",
          season: "Q3",
        },
      ],
      seasonal_variation_reflected: true,
      regional_difference_reflected: false,
      last_update_date: "2023-12-01",
    };

    const result = validatePastCaseDataSeasonalityAndRegionalDifference(
      priceBookUpdateEvent,
      pastCaseData
    );

    expect(result.is_valid).toBe(false);
    expect(result.relearning_halted).toBe(true);
    expect(result.warning_message).toMatch(/地域差/);
    expect(result.missing_components).toEqual({
      seasonal_variation: false,
      regional_difference: true,
    });
  });

  test("should allow relearning to proceed when both seasonal variation and regional difference are reflected", () => {
    const priceBookUpdateEvent = {
      trigger_type: "price_book_new_version",
      price_book_version: "2024-Q1-v2",
      update_date: "2024-01-15",
      effective_regions: ["Tokyo", "Osaka", "Nagoya"],
      effective_seasons: ["Q1", "Q2", "Q3", "Q4"],
    };

    const pastCaseData = {
      cases: [
        {
          case_id: "CASE-001",
          amount: 5000000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-01-10",
          season: "Q1",
        },
        {
          case_id: "CASE-002",
          amount: 5200000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-04-15",
          season: "Q2",
        },
        {
          case_id: "CASE-003",
          amount: 4800000,
          region: "Osaka",
          work_type: "structural_work",
          date: "2023-01-20",
          season: "Q1",
        },
        {
          case_id: "CASE-004",
          amount: 4600000,
          region: "Nagoya",
          work_type: "structural_work",
          date: "2023-04-20",
          season: "Q2",
        },
      ],
      seasonal_variation_reflected: true,
      regional_difference_reflected: true,
      last_update_date: "2024-01-14",
    };

    const result = validatePastCaseDataSeasonalityAndRegionalDifference(
      priceBookUpdateEvent,
      pastCaseData
    );

    expect(result.is_valid).toBe(true);
    expect(result.relearning_halted).toBe(false);
    expect(result.missing_components).toEqual({
      seasonal_variation: false,
      regional_difference: false,
    });
  });

  test("should include system log entry with timestamp and severity level", () => {
    const priceBookUpdateEvent = {
      trigger_type: "price_book_new_version",
      price_book_version: "2024-Q1-v2",
      update_date: "2024-01-15",
      effective_regions: ["Tokyo", "Osaka"],
      effective_seasons: ["Q1", "Q2", "Q3", "Q4"],
    };

    const pastCaseData = {
      cases: [
        {
          case_id: "CASE-001",
          amount: 5000000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-06-10",
        },
      ],
      seasonal_variation_reflected: false,
      regional_difference_reflected: false,
      last_update_date: "2023-12-01",
    };

    const result = validatePastCaseDataSeasonalityAndRegionalDifference(
      priceBookUpdateEvent,
      pastCaseData
    );

    expect(result.system_log_entry).toBeDefined();
    expect(result.system_log_entry.severity_level).toBe("WARNING");
    expect(result.system_log_entry.timestamp).toBeDefined();
    expect(result.system_log_entry.component).toMatch(/学習データ|AI判定ロジック/);
  });

  test("should detect insufficient past case data coverage when region count is below threshold", () => {
    const priceBookUpdateEvent = {
      trigger_type: "price_book_new_version",
      price_book_version: "2024-Q1-v2",
      update_date: "2024-01-15",
      effective_regions: ["Tokyo", "Osaka", "Nagoya", "Kyoto", "Kobe"],
      effective_seasons: ["Q1", "Q2", "Q3", "Q4"],
    };

    const pastCaseData = {
      cases: [
        {
          case_id: "CASE-001",
          amount: 5000000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-01-10",
          season: "Q1",
        },
        {
          case_id: "CASE-002",
          amount: 5200000,
          region: "Tokyo",
          work_type: "structural_work",
          date: "2023-04-15",
          season: "Q2",
        },
      ],
      seasonal_variation_reflected: true,
      regional_difference_reflected: false,
      covered_regions: ["Tokyo"],
      coverage_rate: 0.2,
      last_update_date: "2023-12-01",
    };

    const result = validatePastCaseDataSeasonalityAndRegionalDifference(
      priceBookUpdateEvent,
      pastCaseData
    );

    expect(result.is_valid).toBe(false);
    expect(result.relearning_halted).toBe(true);
  });
});