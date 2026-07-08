import { aggregateDeviationPatterns } from '../../src/logic/it-1-br-6-2-1';

describe('乖離パターン分析・改善サイクル自動化機能', () => {
  // SCEN-1522: [error] 乖離パターン集計データが空または不完全な場合に適切なエラーハンドリング
  test('should handle empty and incomplete deviation pattern datasets with proper error messages and logging', () => {
    const timestamp_before = new Date('2024-12-01T08:00:00Z').toISOString();
    const timestamp_after = new Date('2024-12-01T08:30:00Z').toISOString();

    // Test 1: Empty dataset
    const empty_dataset = [];
    
    expect(() => {
      aggregateDeviationPatterns(empty_dataset);
    }).toThrow(/データが入力されていません/);

    // Test 2: Incomplete dataset - missing required fields
    const incomplete_dataset = [
      {
        assessment_id: 'ASS-001',
        region_code: 'KANTO',
        // Missing: construction_type, deviation_rate, deviation_amount, reference_data_count
        timestamp: timestamp_before
      },
      {
        assessment_id: 'ASS-002',
        region_code: 'KANSAI',
        construction_type: 'FOUNDATION',
        deviation_rate: 8.5,
        // Missing: deviation_amount, reference_data_count
        timestamp: timestamp_before
      }
    ];

    expect(() => {
      aggregateDeviationPatterns(incomplete_dataset);
    }).toThrow(/必須項目が不足しています/);

    // Test 3: Valid complete dataset
    const valid_dataset = [
      {
        assessment_id: 'ASS-001',
        region_code: 'KANTO',
        construction_type: 'FOUNDATION',
        deviation_rate: 5.2,
        deviation_amount: 125000,
        reference_data_count: 42,
        timestamp: timestamp_before
      },
      {
        assessment_id: 'ASS-002',
        region_code: 'KANTO',
        construction_type: 'FOUNDATION',
        deviation_rate: 6.8,
        deviation_amount: 172000,
        reference_data_count: 38,
        timestamp: timestamp_before
      },
      {
        assessment_id: 'ASS-003',
        region_code: 'KANSAI',
        construction_type: 'REINFORCEMENT',
        deviation_rate: 12.3,
        deviation_amount: 298000,
        reference_data_count: 25,
        timestamp: timestamp_before
      },
      {
        assessment_id: 'ASS-004',
        region_code: 'KANSAI',
        construction_type: 'REINFORCEMENT',
        deviation_rate: 9.7,
        deviation_amount: 215000,
        reference_data_count: 28,
        timestamp: timestamp_before
      },
      {
        assessment_id: 'ASS-005',
        region_code: 'TOHOKU',
        construction_type: 'FOUNDATION',
        deviation_rate: 3.1,
        deviation_amount: 78000,
        reference_data_count: 55,
        timestamp: timestamp_before
      }
    ];

    const result = aggregateDeviationPatterns(valid_dataset);

    // Verify aggregated result structure
    expect(result).toBeDefined();
    expect(result.status).toBe('success');
    expect(result.data).toBeDefined();
    expect(result.data.aggregated_by_region).toBeDefined();
    expect(result.data.aggregated_by_construction_type).toBeDefined();

    // Verify region-level aggregation
    const region_aggregation = result.data.aggregated_by_region;
    expect(region_aggregation['KANTO']).toBeDefined();
    expect(region_aggregation['KANTO'].count).toBe(2);
    expect(region_aggregation['KANTO'].avg_deviation_rate).toBe(6.0);
    expect(region_aggregation['KANTO'].total_deviation_amount).toBe(297000);
    expect(region_aggregation['KANTO'].avg_reference_data_count).toBe(40);

    expect(region_aggregation['KANSAI']).toBeDefined();
    expect(region_aggregation['KANSAI'].count).toBe(2);
    expect(region_aggregation['KANSAI'].avg_deviation_rate).toBe(11.0);
    expect(region_aggregation['KANSAI'].total_deviation_amount).toBe(513000);
    expect(region_aggregation['KANSAI'].avg_reference_data_count).toBe(26.5);

    expect(region_aggregation['TOHOKU']).toBeDefined();
    expect(region_aggregation['TOHOKU'].count).toBe(1);
    expect(region_aggregation['TOHOKU'].avg_deviation_rate).toBe(3.1);
    expect(region_aggregation['TOHOKU'].total_deviation_amount).toBe(78000);
    expect(region_aggregation['TOHOKU'].avg_reference_data_count).toBe(55);

    // Verify construction type aggregation
    const construction_aggregation = result.data.aggregated_by_construction_type;
    expect(construction_aggregation['FOUNDATION']).toBeDefined();
    expect(construction_aggregation['FOUNDATION'].count).toBe(3);
    expect(construction_aggregation['FOUNDATION'].avg_deviation_rate).toBeCloseTo(4.7, 1);
    expect(construction_aggregation['FOUNDATION'].total_deviation_amount).toBe(375000);
    expect(construction_aggregation['FOUNDATION'].avg_reference_data_count).toBeCloseTo(45, 0);

    expect(construction_aggregation['REINFORCEMENT']).toBeDefined();
    expect(construction_aggregation['REINFORCEMENT'].count).toBe(2);
    expect(construction_aggregation['REINFORCEMENT'].avg_deviation_rate).toBe(11.0);
    expect(construction_aggregation['REINFORCEMENT'].total_deviation_amount).toBe(513000);
    expect(construction_aggregation['REINFORCEMENT'].avg_reference_data_count).toBe(26.5);

    // Verify concentration detection
    expect(result.data.concentration_detected).toBeDefined();
    expect(Array.isArray(result.data.concentration_detected)).toBe(true);

    const concentrated_regions = result.data.concentration_detected.filter(
      (item: any) => item.concentration_level === 'HIGH'
    );
    expect(concentrated_regions.length).toBeGreaterThan(0);

    // Verify error logging metadata
    expect(result.metadata).toBeDefined();
    expect(result.metadata.processed_timestamp).toBeDefined();
    expect(result.metadata.total_records_processed).toBe(5);
    expect(result.metadata.records_valid).toBe(5);
    expect(result.metadata.records_invalid).toBe(0);

    // Test 4: Dataset with invalid deviation_rate value
    const invalid_rate_dataset = [
      {
        assessment_id: 'ASS-999',
        region_code: 'KANTO',
        construction_type: 'FOUNDATION',
        deviation_rate: -5.0, // Invalid: negative rate
        deviation_amount: 125000,
        reference_data_count: 42,
        timestamp: timestamp_after
      }
    ];

    expect(() => {
      aggregateDeviationPatterns(invalid_rate_dataset);
    }).toThrow(/乖離率の値が無効です/);

    // Test 5: Dataset with null/undefined critical values
    const null_values_dataset = [
      {
        assessment_id: 'ASS-1000',
        region_code: 'KANTO',
        construction_type: 'FOUNDATION',
        deviation_rate: null,
        deviation_amount: 125000,
        reference_data_count: 42,
        timestamp: timestamp_after
      }
    ];

    expect(() => {
      aggregateDeviationPatterns(null_values_dataset);
    }).toThrow(/必須項目が不足しています/);

    // Test 6: System stability after error - verify subsequent valid call works
    const recovery_dataset = [
      {
        assessment_id: 'ASS-RECOVERY-001',
        region_code: 'KANTO',
        construction_type: 'FOUNDATION',
        deviation_rate: 4.5,
        deviation_amount: 110000,
        reference_data_count: 50,
        timestamp: timestamp_after
      }
    ];

    const recovery_result = aggregateDeviationPatterns(recovery_dataset);
    expect(recovery_result.status).toBe('success');
    expect(recovery_result.data.aggregated_by_region['KANTO'].count).toBe(1);
    expect(recovery_result.data.aggregated_by_region['KANTO'].avg_deviation_rate).toBe(4.5);
  });
});