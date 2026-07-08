import { describe, test, expect } from "@jest/globals";
import {
  generateMonthlyReportSchedule,
  type MonthlyReportScheduleInput,
  type MonthlyReportScheduleOutput,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("Monthly Report Schedule Auto-Generation", () => {
  test("SCEN-1327: Auto-determines monthly report creation schedule and SLA baseline at month-end business day close", () => {
    // Test data: Prepare business day calendar for current month
    // Month-end business day is 2024-02-29 (last working day of February 2024)
    // SLA baseline standard values: 
    //   - standard SLA hours = 48 hours from next business day start
    //   - report start time = 09:00 JST next business day
    //   - standard processing time = 4 business days
    const input: MonthlyReportScheduleInput = {
      month_end_business_day: new Date("2024-02-29T17:00:00+09:00"), // Feb 29, 2024 at 5 PM JST (EOB)
      next_business_day_date: new Date("2024-03-01"), // March 1, 2024
      standard_sla_hours: 48,
      report_creation_standard_days: 4,
      designated_start_time_hh_mm: "09:00",
    };

    const result: MonthlyReportScheduleOutput = generateMonthlyReportSchedule(
      input
    );

    // Verify schedule start datetime is set to next business day at designated time
    // Expected: 2024-03-01 09:00 JST
    const expected_start_datetime = new Date("2024-03-01T09:00:00+09:00");
    expect(result.schedule_start_datetime).toEqual(expected_start_datetime);

    // Verify SLA baseline standard values are registered correctly
    // Expected SLA hours: 48 hours (2 days)
    expect(result.sla_hours).toBe(48);

    // Verify report creation deadline is calculated correctly based on SLA baseline
    // Start: 2024-03-01 09:00 JST + 48 hours = 2024-03-03 09:00 JST
    const expected_deadline = new Date("2024-03-03T09:00:00+09:00");
    expect(result.report_creation_deadline).toEqual(expected_deadline);

    // Verify standard processing time in business days
    expect(result.standard_processing_business_days).toBe(4);

    // Verify schedule registration timestamp is recorded
    expect(result.registered_at).toBeDefined();
    expect(typeof result.registered_at).toBe("string");

    // Verify report creation period is correctly calculated
    // Period from 2024-03-01 (start) to 2024-03-05 (4 business days later)
    const expected_target_period_end = new Date("2024-03-05");
    expect(new Date(result.target_report_period_end)).toEqual(
      expected_target_period_end
    );

    // Verify SLA baseline matches standard values (not previous month baseline)
    expect(result.sla_baseline_source).toBe("standard");

    // Verify all required schedule fields are populated
    expect(result.schedule_id).toBeDefined();
    expect(result.month).toBe(202402); // February 2024 (YYYYMM format)
    expect(result.designated_start_time).toBe("09:00");

    // Verify status is set to scheduled (not yet started)
    expect(result.status).toBe("scheduled");
  });
});