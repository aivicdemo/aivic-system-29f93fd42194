import { classifyGenconQuestion } from "../../src/logic/it-1-br-2-2-2-1";

describe("Gencon question auto-classification with confidence scoring", () => {
  // SCEN-1032
  test("should select classification category with highest confidence score for ambiguous questions", () => {
    // Setup: Ambiguous question that could fit multiple categories
    const ambiguous_question_1 = "見積金額の変更はできますか？それとも工期の短縮が可能ですか？";

    const result_1 = classifyGenconQuestion(ambiguous_question_1);

    expect(result_1).toEqual({
      selected_category: "pricing_adjustment",
      confidence_score: 0.82,
      all_scores: {
        pricing_adjustment: 0.82,
        schedule_modification: 0.76,
        scope_change: 0.45,
      },
      tie_applied: false,
    });

    // Verify that the selected category matches the highest confidence score
    const max_score_1 = Math.max(...Object.values(result_1.all_scores));
    expect(result_1.confidence_score).toBe(max_score_1);
    expect(result_1.all_scores[result_1.selected_category as keyof typeof result_1.all_scores]).toBe(max_score_1);

    // Test case 2: Different ambiguous question
    const ambiguous_question_2 = "この工事は地元企業を使う必要があります。それでも費用削減できますか？";

    const result_2 = classifyGenconQuestion(ambiguous_question_2);

    expect(result_2).toEqual({
      selected_category: "cost_reduction",
      confidence_score: 0.79,
      all_scores: {
        cost_reduction: 0.79,
        local_sourcing: 0.78,
        quality_compliance: 0.52,
      },
      tie_applied: false,
    });

    const max_score_2 = Math.max(...Object.values(result_2.all_scores));
    expect(result_2.confidence_score).toBe(max_score_2);
    expect(result_2.all_scores[result_2.selected_category as keyof typeof result_2.all_scores]).toBe(max_score_2);

    // Test case 3: Another ambiguous question
    const ambiguous_question_3 = "支払い条件の緩和を希望しますが、品質保証はどうなりますか？";

    const result_3 = classifyGenconQuestion(ambiguous_question_3);

    expect(result_3).toEqual({
      selected_category: "quality_guarantee",
      confidence_score: 0.81,
      all_scores: {
        quality_guarantee: 0.81,
        payment_terms: 0.80,
        warranty: 0.71,
      },
      tie_applied: false,
    });

    const max_score_3 = Math.max(...Object.values(result_3.all_scores));
    expect(result_3.confidence_score).toBe(max_score_3);
    expect(result_3.all_scores[result_3.selected_category as keyof typeof result_3.all_scores]).toBe(max_score_3);

    // Test case 4: Tie-breaking scenario - equal confidence scores
    const tie_question = "納期短縮と品質向上を同時に実現できますか？";

    const result_tie = classifyGenconQuestion(tie_question);

    // When scores are equal, priority rule should be applied consistently
    expect(result_tie.tie_applied).toBe(true);
    expect(result_tie.all_scores.schedule_optimization).toBe(0.75);
    expect(result_tie.all_scores.quality_improvement).toBe(0.75);
    // Priority rule: schedule_optimization > quality_improvement (alphabetical or defined rule)
    expect(result_tie.selected_category).toBe("quality_improvement");
    expect(result_tie.confidence_score).toBe(0.75);

    // Test case 5: Edge case - near-tie scenarios
    const near_tie_question = "部材の代替品使用で費用削減し、工期も短縮できますか？";

    const result_near_tie = classifyGenconQuestion(near_tie_question);

    expect(result_near_tie).toEqual({
      selected_category: "material_substitution",
      confidence_score: 0.77,
      all_scores: {
        material_substitution: 0.77,
        cost_reduction: 0.76,
        schedule_acceleration: 0.73,
      },
      tie_applied: false,
    });

    // Verify highest score is selected even in near-tie case
    const max_score_near_tie = Math.max(...Object.values(result_near_tie.all_scores));
    expect(result_near_tie.confidence_score).toBe(max_score_near_tie);
    expect(result_near_tie.all_scores[result_near_tie.selected_category as keyof typeof result_near_tie.all_scores]).toBe(max_score_near_tie);
  });
});