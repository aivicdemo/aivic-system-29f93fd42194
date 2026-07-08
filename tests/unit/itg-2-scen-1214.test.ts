import { validateLearningDataQuality } from '../../src/logic/it-6-2-2-1';

describe('Learning Data Quality Validation - Duplicate Removal, Format Unification, Anomaly Detection', () => {
  test('SCEN-1214: Learning data quality validation - data passes through duplicate removal, format unification, and anomaly detection', () => {
    // Input: Raw learning dataset with duplicates, inconsistent formats, and anomalous values
    const inputDataset = [
      {
        project_id: 'PROJ001',
        construction_type: '鉄骨工事',
        quantity: 100,
        unit_price: 5000,
        amount: 500000,
        region: '東京都',
        fiscal_period: '2024-01',
        source_data_type: 'past_project'
      },
      // Duplicate entry
      {
        project_id: 'PROJ001',
        construction_type: '鉄骨工事',
        quantity: 100,
        unit_price: 5000,
        amount: 500000,
        region: '東京都',
        fiscal_period: '2024-01',
        source_data_type: 'past_project'
      },
      // Inconsistent format (unit_price as string instead of number)
      {
        project_id: 'PROJ002',
        construction_type: '鉄筋コンクリート工事',
        quantity: 150,
        unit_price: '4500',
        amount: 675000,
        region: '大阪府',
        fiscal_period: '2024-02',
        source_data_type: 'past_project'
      },
      // Anomalous value (unit_price = 0)
      {
        project_id: 'PROJ003',
        construction_type: '木造工事',
        quantity: 80,
        unit_price: 0,
        amount: 0,
        region: '愛知県',
        fiscal_period: '2024-03',
        source_data_type: 'past_project'
      },
      // Valid entry
      {
        project_id: 'PROJ004',
        construction_type: '外装工事',
        quantity: 120,
        unit_price: 3500,
        amount: 420000,
        region: '福岡県',
        fiscal_period: '2024-01',
        source_data_type: 'past_project'
      }
    ];

    // Execute validation
    const result = validateLearningDataQuality(inputDataset);

    // Assertion 1: Quality validation passes
    expect(result.validation_status).toBe('passed');

    // Assertion 2: Duplicate removal - input had 5 records with 1 duplicate, expected 4 after deduplication
    expect(result.duplicate_removal_count).toBe(1);
    expect(result.records_after_deduplication).toBe(4);

    // Assertion 3: Format unification - 1 record had inconsistent format (unit_price as string)
    expect(result.format_unification_count).toBe(1);
    expect(result.records_after_format_unification).toBe(4);

    // Assertion 4: Anomaly detection - 1 record with unit_price = 0 detected as anomalous
    expect(result.anomaly_detection_count).toBe(1);
    expect(result.anomalous_records_flagged).toBe(1);

    // Assertion 5: Final dataset quality metrics
    expect(result.final_record_count).toBe(4);
    expect(result.duplicate_rate).toBe(0);
    expect(result.format_compliance_rate).toBe(1.0);
    expect(result.anomaly_flag_rate).toBeCloseTo(0.25, 2); // 1 anomalous out of 4 records

    // Assertion 6: Validation report generated with detailed metrics
    expect(result.validation_report).toBeDefined();
    expect(result.validation_report.duplicate_removal_summary).toBe('1 duplicate records removed');
    expect(result.validation_report.format_unification_summary).toBe('1 record(s) reformatted to standard format');
    expect(result.validation_report.anomaly_detection_summary).toBe('1 anomalous value(s) detected and flagged');
    expect(result.validation_report.quality_check_timestamp).toMatch(/2024-01-15T11:00:00Z|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // Assertion 7: All data meets quality baseline standards
    expect(result.quality_baseline_met).toBe(true);
    expect(result.ready_for_model_training).toBe(true);

    // Assertion 8: Deduplicated and validated dataset structure preserved
    expect(Array.isArray(result.cleaned_dataset)).toBe(true);
    expect(result.cleaned_dataset.length).toBe(4);

    // Assertion 9: All records in cleaned dataset have correct numeric types
    result.cleaned_dataset.forEach((record) => {
      expect(typeof record.quantity).toBe('number');
      expect(typeof record.unit_price).toBe('number');
      expect(typeof record.amount).toBe('number');
      expect(record.unit_price).toBeGreaterThan(0);
    });

    // Assertion 10: Validation timestamp is recorded
    expect(result.validation_timestamp).toBeDefined();
    expect(typeof result.validation_timestamp).toBe('string');
  });
});