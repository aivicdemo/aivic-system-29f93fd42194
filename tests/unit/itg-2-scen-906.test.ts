import { describe, test, expect } from '@jest/globals';
import { cleanOutliersFromHistoricalData } from '../../src/logic/it-6-2-1-1';

describe('IT-6-2-1-1: Learning Data Cleaning - Statistical Outlier Removal', () => {
  test('SCEN-906: Remove statistical outliers from multi-year historical project data', () => {
    // Prepare test data: 3+ years of historical project data across multiple categories
    const historical_data = [
      // Category A: Foundation Work - Year 1
      { id: 'PRJ001', category: 'foundation', amount: 1500000, date: '2022-01-15' },
      { id: 'PRJ002', category: 'foundation', amount: 1520000, date: '2022-02-10' },
      { id: 'PRJ003', category: 'foundation', amount: 1480000, date: '2022-03-05' },
      { id: 'PRJ004', category: 'foundation', amount: 1510000, date: '2022-04-20' },
      { id: 'PRJ005', category: 'foundation', amount: 1495000, date: '2022-05-12' },
      // Category A: Foundation Work - Year 2
      { id: 'PRJ006', category: 'foundation', amount: 1505000, date: '2023-01-18' },
      { id: 'PRJ007', category: 'foundation', amount: 1525000, date: '2023-02-14' },
      { id: 'PRJ008', category: 'foundation', amount: 1490000, date: '2023-03-22' },
      { id: 'PRJ009', category: 'foundation', amount: 1515000, date: '2023-04-10' },
      { id: 'PRJ010', category: 'foundation', amount: 5000000, date: '2023-05-30' }, // OUTLIER
      // Category A: Foundation Work - Year 3
      { id: 'PRJ011', category: 'foundation', amount: 1520000, date: '2024-01-25' },
      { id: 'PRJ012', category: 'foundation', amount: 1485000, date: '2024-02-28' },
      { id: 'PRJ013', category: 'foundation', amount: 1510000, date: '2024-03-15' },
      { id: 'PRJ014', category: 'foundation', amount: 1500000, date: '2024-04-09' },
      { id: 'PRJ015', category: 'foundation', amount: 500000, date: '2024-05-20' }, // OUTLIER
      // Category B: Wall Work - Year 1
      { id: 'PRJ016', category: 'wall', amount: 2000000, date: '2022-01-12' },
      { id: 'PRJ017', category: 'wall', amount: 2050000, date: '2022-02-08' },
      { id: 'PRJ018', category: 'wall', amount: 1980000, date: '2022-03-10' },
      { id: 'PRJ019', category: 'wall', amount: 2020000, date: '2022-04-15' },
      { id: 'PRJ020', category: 'wall', amount: 2010000, date: '2022-05-25' },
      // Category B: Wall Work - Year 2
      { id: 'PRJ021', category: 'wall', amount: 2030000, date: '2023-01-20' },
      { id: 'PRJ022', category: 'wall', amount: 2000000, date: '2023-02-12' },
      { id: 'PRJ023', category: 'wall', amount: 1990000, date: '2023-03-18' },
      { id: 'PRJ024', category: 'wall', amount: 2040000, date: '2023-04-22' },
      { id: 'PRJ025', category: 'wall', amount: 8500000, date: '2023-05-28' }, // OUTLIER
      // Category B: Wall Work - Year 3
      { id: 'PRJ026', category: 'wall', amount: 2015000, date: '2024-01-30' },
      { id: 'PRJ027', category: 'wall', amount: 2005000, date: '2024-02-25' },
      { id: 'PRJ028', category: 'wall', amount: 1995000, date: '2024-03-20' },
      { id: 'PRJ029', category: 'wall', amount: 2025000, date: '2024-04-12' },
      { id: 'PRJ030', category: 'wall', amount: 300000, date: '2024-05-15' }, // OUTLIER
    ];

    const outlier_method = 'iqr'; // Use Interquartile Range method
    const iqr_multiplier = 1.5;

    // Execute outlier detection and removal
    const result = cleanOutliersFromHistoricalData(
      historical_data,
      outlier_method,
      iqr_multiplier
    );

    // Verify outlier detection accuracy
    expect(result.detected_outliers).toBeDefined();
    expect(result.detected_outliers.length).toBe(4);

    // Verify detected outliers are correctly identified
    const outlier_ids = result.detected_outliers.map((o: { id: string }) => o.id);
    expect(outlier_ids).toContain('PRJ010'); // 5,000,000 in foundation
    expect(outlier_ids).toContain('PRJ015'); // 500,000 in foundation
    expect(outlier_ids).toContain('PRJ025'); // 8,500,000 in wall
    expect(outlier_ids).toContain('PRJ030'); // 300,000 in wall

    // Verify outlier percentage is within acceptable range (5-10% of total)
    const outlier_percentage = (result.detected_outliers.length / historical_data.length) * 100;
    expect(outlier_percentage).toBeGreaterThanOrEqual(5);
    expect(outlier_percentage).toBeLessThanOrEqual(15); // Allow up to 15% for test robustness

    // Verify clean dataset excludes outliers
    expect(result.cleaned_data).toBeDefined();
    expect(result.cleaned_data.length).toBe(26); // 30 - 4 outliers
    const cleaned_ids = result.cleaned_data.map((d: { id: string }) => d.id);
    expect(cleaned_ids).not.toContain('PRJ010');
    expect(cleaned_ids).not.toContain('PRJ015');
    expect(cleaned_ids).not.toContain('PRJ025');
    expect(cleaned_ids).not.toContain('PRJ030');

    // Verify statistical indicators before and after cleaning
    const before_stats = result.statistics_before;
    const after_stats = result.statistics_after;

    // Foundation work statistics (15 records before, 12 after)
    expect(before_stats.foundation).toBeDefined();
    expect(before_stats.foundation.mean).toBeCloseTo(1736333.33, 0); // Includes outliers
    expect(before_stats.foundation.median).toBe(1510000);
    expect(before_stats.foundation.stddev).toBeGreaterThan(900000); // High due to outliers

    expect(after_stats.foundation).toBeDefined();
    expect(after_stats.foundation.mean).toBeCloseTo(1505416.67, 0); // Normalized
    expect(after_stats.foundation.median).toBe(1510000);
    expect(after_stats.foundation.stddev).toBeLessThan(20000); // Much lower, normalized

    // Wall work statistics (15 records before, 11 after)
    expect(before_stats.wall).toBeDefined();
    expect(before_stats.wall.mean).toBeCloseTo(2605333.33, 0); // Includes outliers
    expect(before_stats.wall.median).toBe(2015000);
    expect(before_stats.wall.stddev).toBeGreaterThan(1300000); // High due to outliers

    expect(after_stats.wall).toBeDefined();
    expect(after_stats.wall.mean).toBeCloseTo(2014545.45, 0); // Normalized
    expect(after_stats.wall.median).toBe(2010000);
    expect(after_stats.wall.stddev).toBeLessThan(25000); // Much lower, normalized

    // Verify outlier records are marked with exclusion flag
    expect(result.detected_outliers.every((o: { is_outlier: boolean }) => o.is_outlier === true)).toBe(true);

    // Verify excluded data is separately preserved and traceable
    expect(result.excluded_data_archive).toBeDefined();
    expect(result.excluded_data_archive.length).toBe(4);
    expect(result.excluded_data_archive.every((d: { exclusion_reason: string; exclusion_method: string; outlier_flag: boolean }) =>
      d.exclusion_reason && d.exclusion_method && d.outlier_flag === true
    )).toBe(true);

    // Verify exclusion reason is documented
    const foundation_outlier = result.excluded_data_archive.find(
      (d: { id: string }) => d.id === 'PRJ010'
    );
    expect(foundation_outlier.exclusion_reason).toMatch(/IQR|quartile|outlier/i);
    expect(foundation_outlier.exclusion_method).toBe('iqr');

    // Verify data integrity: cleaned_data + excluded_data_archive = original data count
    expect(result.cleaned_data.length + result.excluded_data_archive.length).toBe(historical_data.length);

    // Verify metadata is recorded
    expect(result.metadata).toBeDefined();
    expect(result.metadata.total_records_input).toBe(30);
    expect(result.metadata.total_records_cleaned).toBe(26);
    expect(result.metadata.total_outliers_detected).toBe(4);
    expect(result.metadata.cleaning_method).toBe('iqr');
    expect(result.metadata.iqr_multiplier).toBe(1.5);
    expect(result.metadata.processed_at).toBeDefined();
  });
});