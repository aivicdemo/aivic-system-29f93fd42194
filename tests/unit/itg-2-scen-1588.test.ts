import { calculateManualRevisionAccuracyImprovement } from "../../src/logic/it-6-2-2-1";

describe("Manual Revision Accuracy Tracking - Precision Degradation Warning", () => {
  test("SCEN-1588: Should warn when manual revision causes negative accuracy improvement (precision degradation)", () => {
    // Pre-revision baseline accuracy: 85%
    const pre_revision_ocr_accuracy = 85;
    const pre_revision_ai_judgment_accuracy = 85;

    // Post-revision measured accuracy: 75% (degradation)
    const post_revision_ocr_accuracy = 75;
    const post_revision_ai_judgment_accuracy = 75;

    // Revision metadata
    const revision_content = "Updated OCR parsing logic for complex invoice formats";
    const revision_timestamp = new Date("2024-06-15T10:30:00Z");
    const revision_implemented_by = "admin_user_001";

    // Calculate accuracy improvement degree
    const result = calculateManualRevisionAccuracyImprovement({
      pre_revision_ocr_accuracy,
      pre_revision_ai_judgment_accuracy,
      post_revision_ocr_accuracy,
      post_revision_ai_judgment_accuracy,
      revision_content,
      revision_timestamp,
      revision_implemented_by,
    });

    // Expected improvement degree: (75 - 85) / 85 * 100 = -11.76%
    expect(result.ocr_accuracy_improvement_rate).toBe(-11.76);
    expect(result.ai_judgment_accuracy_improvement_rate).toBe(-11.76);

    // Negative improvement triggers warning
    expect(result.has_accuracy_degradation).toBe(true);

    // Warning message should be present and indicate precision degradation
    expect(result.warning_message).toMatch(/改版内容の妥当性/);
    expect(result.warning_message).toMatch(/精度が低下/);
    expect(result.warning_message).toMatch(/再検討/);

    // Warning should include specific metrics
    expect(result.warning_message).toContain("75%");
    expect(result.warning_message).toContain("85%");

    // Recommended action should be provided
    expect(result.recommended_action).toMatch(/改版内容/);
    expect(result.recommended_action).toMatch(/確認/);

    // Revision record should include degradation flag for tracking
    expect(result.revision_record).toEqual({
      revision_id: expect.any(String),
      revision_content,
      revision_timestamp: revision_timestamp.toISOString(),
      revision_implemented_by,
      pre_revision_ocr_accuracy,
      pre_revision_ai_judgment_accuracy,
      post_revision_ocr_accuracy,
      post_revision_ai_judgment_accuracy,
      ocr_accuracy_improvement_rate: -11.76,
      ai_judgment_accuracy_improvement_rate: -11.76,
      has_accuracy_degradation: true,
      warning_level: "high",
      warning_display_timing: "immediate_upon_completion",
    });

    // Ensure warning is not suppressed
    expect(result.should_block_revision_approval).toBe(false);
    expect(result.warning_severity).toBe("critical");
  });
});