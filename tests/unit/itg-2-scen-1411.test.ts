import { decideLearningDataCorrectionRange } from '../../src/logic/it-6-2-2-1';

describe('Learning Data Correction Range Decision - Price List Format Exception', () => {
  // SCEN-1411
  test('should identify price list format exception and determine appropriate correction method', () => {
    // Arrange: Set up test data with price list format exception
    const learningDataWithFormatException = {
      data_id: 'LD-20240515-001',
      source_type: 'price_list',
      original_value: '¥150,000 (tax included)',
      normalized_value: null,
      error_type: 'format_exception',
      price_list_version: 'PL-2024-Q1',
      item_code: 'ITEM-001',
      category: 'concrete_work',
      region: 'tokyo',
      format_issue: 'mixed_tax_notation',
      detection_date: '2024-05-15T10:30:00Z',
      severity_score: 85,
    };

    // Act: Call the learning data correction range decision function
    const correctionDecision = decideLearningDataCorrectionRange(
      learningDataWithFormatException
    );

    // Assert: Verify error cause is correctly identified as price list format exception
    expect(correctionDecision.root_cause_category).toBe('price_list_format_exception');

    // Assert: Verify correction method is determined
    expect(correctionDecision.correction_method).toBeDefined();

    // Assert: Verify the correction method matches expected value for this exception type
    expect(correctionDecision.correction_method).toBe('extract_numeric_value_exclude_tax_notation');

    // Assert: Verify correction scope includes the affected item
    expect(correctionDecision.correction_scope).toEqual({
      affected_items: ['ITEM-001'],
      affected_price_list_version: 'PL-2024-Q1',
      scope_level: 'item_category',
    });

    // Assert: Verify priority level is set appropriately for format exceptions
    expect(correctionDecision.priority_score).toBe(75);

    // Assert: Verify recommended action is to apply format normalization
    expect(correctionDecision.recommended_action).toBe('normalize_price_list_format');

    // Assert: Verify the correction method is included in the defined correction logic options
    expect(['extract_numeric_value_exclude_tax_notation', 'standardize_notation', 'remove_special_chars']).toContain(
      correctionDecision.correction_method
    );

    // Assert: Verify correction is executable (not in pending state)
    expect(correctionDecision.executable).toBe(true);

    // Assert: Verify correction record metadata is complete
    expect(correctionDecision.decision_timestamp).toBe('2024-05-15T10:45:00Z');
    expect(correctionDecision.decided_by_system).toBe(true);
  });
});