import { submitFeedbackWithDefaultClassification } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("Monthly Summary Template Definition and Management - Feedback Classification", () => {
  test("SCEN-1313: Undefined feedback category automatically assigned to default classification", () => {
    // Setup: Define predefined categories and default category
    const predefinedCategories = ["accuracy", "clarity", "completeness"];
    const defaultCategory = "other";

    // Input: Feedback with undefined category
    const feedbackInput = {
      content: "Report data seems unclear in some sections",
      category: "undefined_category_xyz",
      templateId: "template_001",
      submittedBy: "user_123",
      submittedAt: "2024-01-15T10:30:00Z",
    };

    // Execute: Submit feedback with undefined category
    const result = submitFeedbackWithDefaultClassification(
      feedbackInput,
      predefinedCategories,
      defaultCategory
    );

    // Assertions: Verify that undefined category is mapped to default
    expect(result).toEqual({
      feedbackId: expect.any(String),
      content: "Report data seems unclear in some sections",
      category: "other",
      originalCategory: "undefined_category_xyz",
      templateId: "template_001",
      submittedBy: "user_123",
      submittedAt: "2024-01-15T10:30:00Z",
      assignedAt: "2024-01-15T10:30:00Z",
      status: "classified",
    });

    expect(result.category).toBe("other");
    expect(result.originalCategory).toBe("undefined_category_xyz");
    expect(result.status).toBe("classified");

    // Verify: Test that predefined categories are NOT reassigned
    const validFeedbackInput = {
      content: "Report is very accurate",
      category: "accuracy",
      templateId: "template_001",
      submittedBy: "user_124",
      submittedAt: "2024-01-15T11:00:00Z",
    };

    const validResult = submitFeedbackWithDefaultClassification(
      validFeedbackInput,
      predefinedCategories,
      defaultCategory
    );

    expect(validResult.category).toBe("accuracy");
    expect(validResult.originalCategory).toBeUndefined();

    // Edge case: Empty category string should map to default
    const emptyFeedbackInput = {
      content: "Some feedback",
      category: "",
      templateId: "template_001",
      submittedBy: "user_125",
      submittedAt: "2024-01-15T11:30:00Z",
    };

    const emptyResult = submitFeedbackWithDefaultClassification(
      emptyFeedbackInput,
      predefinedCategories,
      defaultCategory
    );

    expect(emptyResult.category).toBe("other");

    // Edge case: Null/undefined category should map to default
    const nullFeedbackInput = {
      content: "Some feedback",
      category: null,
      templateId: "template_001",
      submittedBy: "user_126",
      submittedAt: "2024-01-15T12:00:00Z",
    };

    const nullResult = submitFeedbackWithDefaultClassification(
      nullFeedbackInput,
      predefinedCategories,
      defaultCategory
    );

    expect(nullResult.category).toBe("other");

    // Error case: Missing required fields should throw
    expect(() =>
      submitFeedbackWithDefaultClassification(
        { content: "Test" },
        predefinedCategories,
        defaultCategory
      )
    ).toThrow(/テンプレート/);

    // Error case: Invalid template ID should throw
    expect(() =>
      submitFeedbackWithDefaultClassification(
        {
          content: "Test feedback",
          category: "custom",
          templateId: "",
          submittedBy: "user_127",
          submittedAt: "2024-01-15T12:30:00Z",
        },
        predefinedCategories,
        defaultCategory
      )
    ).toThrow(/テンプレートID/);
  });
});