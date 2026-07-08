import { describe, test, expect, beforeEach } from '@jest/globals';
import { generatePersonnelAllocationScenarios } from '../../src/logic/it-6-2-1-1';

describe('Personnel Allocation Scenarios - Data Validation', () => {
  test('SCEN-772: Should return validation error when average processing capacity data is incomplete', () => {
    // Setup: Incomplete average processing capacity data with missing required fields
    const incompleteCapacityData = {
      assessor_id: 'A001',
      average_processing_time_minutes: undefined, // Missing required field
      monthly_processing_capacity: 45,
      capacity_index: 0.92
    };

    const demand_forecast = {
      normal_period_monthly_cases: 300,
      busy_period_monthly_cases: 500,
      very_busy_period_monthly_cases: 750
    };

    const current_personnel_count = 30;

    // Execute: Attempt to generate scenarios with incomplete data
    // Expected: Should throw validation error with business keyword
    expect(() =>
      generatePersonnelAllocationScenarios(
        [incompleteCapacityData],
        demand_forecast,
        current_personnel_count
      )
    ).toThrow(/処理能力/);
  });

  test('SCEN-772: Should return validation error when average processing capacity has null values', () => {
    // Setup: Capacity data with null required fields
    const nullCapacityData = {
      assessor_id: 'A002',
      average_processing_time_minutes: null, // Explicitly null
      monthly_processing_capacity: 50,
      capacity_index: 0.95
    };

    const demand_forecast = {
      normal_period_monthly_cases: 300,
      busy_period_monthly_cases: 500,
      very_busy_period_monthly_cases: 750
    };

    const current_personnel_count = 30;

    // Execute and verify error thrown
    expect(() =>
      generatePersonnelAllocationScenarios(
        [nullCapacityData],
        demand_forecast,
        current_personnel_count
      )
    ).toThrow(/処理能力/);
  });

  test('SCEN-772: Should return validation error when average processing capacity is empty string', () => {
    // Setup: Capacity data with empty string (invalid format)
    const invalidCapacityData = {
      assessor_id: 'A003',
      average_processing_time_minutes: '', // Empty string instead of number
      monthly_processing_capacity: 48,
      capacity_index: 0.90
    };

    const demand_forecast = {
      normal_period_monthly_cases: 300,
      busy_period_monthly_cases: 500,
      very_busy_period_monthly_cases: 750
    };

    const current_personnel_count = 30;

    // Execute and verify error thrown
    expect(() =>
      generatePersonnelAllocationScenarios(
        [invalidCapacityData],
        demand_forecast,
        current_personnel_count
      )
    ).toThrow(/処理能力/);
  });

  test('SCEN-772: Should return validation error when capacity index is missing', () => {
    // Setup: Missing capacity_index field
    const missingIndexData = {
      assessor_id: 'A004',
      average_processing_time_minutes: 35,
      monthly_processing_capacity: 52
      // capacity_index is missing
    };

    const demand_forecast = {
      normal_period_monthly_cases: 300,
      busy_period_monthly_cases: 500,
      very_busy_period_monthly_cases: 750
    };

    const current_personnel_count = 30;

    // Execute and verify error thrown
    expect(() =>
      generatePersonnelAllocationScenarios(
        [missingIndexData],
        demand_forecast,
        current_personnel_count
      )
    ).toThrow(/処理能力/);
  });

  test('SCEN-772: Should return validation error when assessor_id is null', () => {
    // Setup: Null assessor identifier
    const nullAssessorData = {
      assessor_id: null, // Required identifier is null
      average_processing_time_minutes: 38,
      monthly_processing_capacity: 46,
      capacity_index: 0.88
    };

    const demand_forecast = {
      normal_period_monthly_cases: 300,
      busy_period_monthly_cases: 500,
      very_busy_period_monthly_cases: 750
    };

    const current_personnel_count = 30;

    // Execute and verify error thrown
    expect(() =>
      generatePersonnelAllocationScenarios(
        [nullAssessorData],
        demand_forecast,
        current_personnel_count
      )
    ).toThrow(/処理能力/);
  });

  test('SCEN-772: Should return validation error when all capacity records are incomplete', () => {
    // Setup: Multiple assessor records all with missing data
    const allIncompleteData = [
      {
        assessor_id: 'A005',
        average_processing_time_minutes: undefined,
        monthly_processing_capacity: 44,
        capacity_index: 0.87
      },
      {
        assessor_id: 'A006',
        average_processing_time_minutes: 40,
        monthly_processing_capacity: null,
        capacity_index: 0.91
      }
    ];

    const demand_forecast = {
      normal_period_monthly_cases: 300,
      busy_period_monthly_cases: 500,
      very_busy_period_monthly_cases: 750
    };

    const current_personnel_count = 30;

    // Execute and verify error thrown
    expect(() =>
      generatePersonnelAllocationScenarios(
        allIncompleteData,
        demand_forecast,
        current_personnel_count
      )
    ).toThrow(/処理能力/);
  });

  test('SCEN-772: Should return validation error when monthly_processing_capacity is zero', () => {
    // Setup: Capacity data with invalid zero value for processing count
    const zeroCapacityData = {
      assessor_id: 'A007',
      average_processing_time_minutes: 36,
      monthly_processing_capacity: 0, // Invalid: zero capacity
      capacity_index: 0.89
    };

    const demand_forecast = {
      normal_period_monthly_cases: 300,
      busy_period_monthly_cases: 500,
      very_busy_period_monthly_cases: 750
    };

    const current_personnel_count = 30;

    // Execute and verify error thrown
    expect(() =>
      generatePersonnelAllocationScenarios(
        [zeroCapacityData],
        demand_forecast,
        current_personnel_count
      )
    ).toThrow(/処理能力/);
  });

  test('SCEN-772: Should return validation error when capacity_index is NaN', () => {
    // Setup: Capacity data with NaN value for index
    const nanIndexData = {
      assessor_id: 'A008',
      average_processing_time_minutes: 37,
      monthly_processing_capacity: 47,
      capacity_index: NaN // Invalid: not a number
    };

    const demand_forecast = {
      normal_period_monthly_cases: 300,
      busy_period_monthly_cases: 500,
      very_busy_period_monthly_cases: 750
    };

    const current_personnel_count = 30;

    // Execute and verify error thrown
    expect(() =>
      generatePersonnelAllocationScenarios(
        [nanIndexData],
        demand_forecast,
        current_personnel_count
      )
    ).toThrow(/処理能力/);
  });
});