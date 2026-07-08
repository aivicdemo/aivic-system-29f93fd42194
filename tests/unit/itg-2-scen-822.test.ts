import { recordAssessorFeedback, calculateLearningDataPriority } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-822: [normal] 査定員フィードバック記録・学習データ優先度自動算出機能
  test("査定員が修正指示・異議・承認を記録した際に、その内容がシステムに記録され、学習データ改善の優先度が自動算出される", () => {
    // Setup: 複数の査定員フィードバック記録
    const assessorId1 = "ASS001";
    const assessmentItemId = "ITEM20240115001";
    const assessorId2 = "ASS002";

    // 修正指示の記録
    const correctionFeedback = {
      assessor_id: assessorId1,
      assessment_item_id: assessmentItemId,
      feedback_type: "correction",
      feedback_content: "地域補正係数を1.15から1.20に修正すべき",
      recorded_at: "2024-01-15T10:30:00Z",
    };

    const correctionResult = recordAssessorFeedback(correctionFeedback);
    expect(correctionResult.status).toBe("success");
    expect(correctionResult.feedback_id).toBeDefined();
    expect(correctionResult.recorded_content).toEqual({
      feedback_type: "correction",
      feedback_content: "地域補正係数を1.15から1.20に修正すべき",
      assessment_item_id: assessmentItemId,
    });

    // 異議の記録
    const objectionFeedback = {
      assessor_id: assessorId2,
      assessment_item_id: assessmentItemId,
      feedback_type: "objection",
      feedback_content: "過去案件データのサンプル数が不足している。30件未満の地域は信頼度が低い",
      recorded_at: "2024-01-15T11:00:00Z",
    };

    const objectionResult = recordAssessorFeedback(objectionFeedback);
    expect(objectionResult.status).toBe("success");
    expect(objectionResult.feedback_id).toBeDefined();
    expect(objectionResult.recorded_content).toEqual({
      feedback_type: "objection",
      feedback_content: "過去案件データのサンプル数が不足している。30件未満の地域は信頼度が低い",
      assessment_item_id: assessmentItemId,
    });

    // 承認の記録
    const approveFeedback = {
      assessor_id: assessorId1,
      assessment_item_id: assessmentItemId,
      feedback_type: "approval",
      feedback_content: "AI判定結果が妥当。相場乖離率4.2%は許容範囲内",
      recorded_at: "2024-01-15T11:30:00Z",
    };

    const approveResult = recordAssessorFeedback(approveFeedback);
    expect(approveResult.status).toBe("success");
    expect(approveResult.feedback_id).toBeDefined();
    expect(approveResult.recorded_content).toEqual({
      feedback_type: "approval",
      feedback_content: "AI判定結果が妥当。相場乖離率4.2%は許容範囲内",
      assessment_item_id: assessmentItemId,
    });

    // 学習データ優先度自動算出
    const feedbackList = [correctionResult, objectionResult, approveResult];
    const priorityCalculationInput = {
      assessment_item_id: assessmentItemId,
      feedback_records: feedbackList.map((fb) => ({
        feedback_type: fb.recorded_content.feedback_type,
        feedback_content: fb.recorded_content.feedback_content,
        recorded_at: fb.recorded_at || "2024-01-15T11:30:00Z",
      })),
      current_ocr_accuracy: 0.88,
      current_judgment_accuracy: 0.82,
    };

    const priorityResult = calculateLearningDataPriority(
      priorityCalculationInput
    );

    // 優先度算出結果の検証
    expect(priorityResult.calculation_status).toBe("completed");
    expect(priorityResult.priority_score).toBe(72);
    expect(priorityResult.priority_level).toBe("high");
    expect(priorityResult.feedback_count_total).toBe(3);
    expect(priorityResult.feedback_breakdown).toEqual({
      correction_count: 1,
      objection_count: 1,
      approval_count: 1,
    });

    // 改善対象データ分類
    expect(priorityResult.recommended_actions).toEqual([
      {
        action_type: "regional_correction_data_update",
        impact_score: 25,
        reason: "地域補正係数の修正指示が記録された",
      },
      {
        action_type: "past_case_data_expansion",
        impact_score: 28,
        reason: "過去案件データのサンプル不足が指摘された（目標30件以上）",
      },
      {
        action_type: "model_validation",
        impact_score: 19,
        reason: "承認判定により現在モデルの信頼度が確認された",
      },
    ]);

    // 複数フィードバックでの優先度計算
    const assessmentItemId2 = "ITEM20240115002";
    const multipleFeedbackInput = {
      assessment_item_id: assessmentItemId2,
      feedback_records: [
        {
          feedback_type: "correction",
          feedback_content: "時期補正係数を1.08から1.12に修正",
          recorded_at: "2024-01-15T09:00:00Z",
        },
        {
          feedback_type: "correction",
          feedback_content: "金額帯別の基準値を更新すべき",
          recorded_at: "2024-01-15T09:30:00Z",
        },
        {
          feedback_type: "objection",
          feedback_content: "物価本の版数が古い（3ヶ月以上未更新）",
          recorded_at: "2024-01-15T10:00:00Z",
        },
        {
          feedback_type: "approval",
          feedback_content: "判定ロジックは適切に機能している",
          recorded_at: "2024-01-15T10:15:00Z",
        },
      ],
      current_ocr_accuracy: 0.85,
      current_judgment_accuracy: 0.78,
    };

    const multiplePriorityResult = calculateLearningDataPriority(
      multipleFeedbackInput
    );

    expect(multiplePriorityResult.calculation_status).toBe("completed");
    expect(multiplePriorityResult.priority_score).toBe(81);
    expect(multiplePriorityResult.priority_level).toBe("highest");
    expect(multiplePriorityResult.feedback_count_total).toBe(4);
    expect(multiplePriorityResult.feedback_breakdown).toEqual({
      correction_count: 2,
      objection_count: 1,
      approval_count: 1,
    });

    // 複数修正指示の合算効果
    expect(multiplePriorityResult.recommended_actions.length).toBeGreaterThan(2);
    expect(multiplePriorityResult.recommended_actions[0].impact_score).toBe(32);
    expect(multiplePriorityResult.recommended_actions[0].action_type).toBe(
      "seasonal_correction_data_update"
    );

    // 学習データ優先度リスト反映確認
    expect(multiplePriorityResult.learning_data_priority_list).toEqual({
      regional_correction: 25,
      seasonal_correction: 32,
      price_basis_update: 18,
      past_case_expansion: 0,
      price_book_update: 24,
    });

    // 優先度スコア計算の根拠データ
    expect(multiplePriorityResult.calculation_details).toEqual({
      feedback_impact_weight: 0.6,
      accuracy_degradation_weight: 0.25,
      urgency_weight: 0.15,
      feedback_impact_score: 54,
      accuracy_degradation_score: 19,
      urgency_score: 8,
    });
  });
});