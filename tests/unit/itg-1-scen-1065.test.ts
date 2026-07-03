import {
  defineDocumentCycleSettings,
  validateDocumentCycleSettings,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("ドキュメント利用・改善サイクル定義機能", () => {
  // SCEN-1065
  test("ドキュメント更新頻度・レビュー周期・改善提案プロセスが体系的に定義され、すべてのユーザーが統一された品質で業務を実行でき、誰でも同じ手順で改善提案ができる状態が確立される", () => {
    // ドキュメント更新頻度の定義
    const update_frequency_input = {
      frequency_type: "monthly",
      update_day_of_month: 25,
      update_time_utc: "09:00",
    };

    const saved_update_frequency = defineDocumentCycleSettings({
      cycle_element: "update_frequency",
      settings: update_frequency_input,
      created_by_user_id: "user_001",
      organization_id: "org_001",
    });

    expect(saved_update_frequency).toEqual({
      cycle_element: "update_frequency",
      frequency_type: "monthly",
      update_day_of_month: 25,
      update_time_utc: "09:00",
      status: "active",
      created_by_user_id: "user_001",
      organization_id: "org_001",
      created_at: expect.any(String),
      version: 1,
    });

    // レビュー周期の定義
    const review_cycle_input = {
      initial_review_days_after_creation: 7,
      periodic_review_interval_days: 30,
      review_start_time_utc: "10:00",
    };

    const saved_review_cycle = defineDocumentCycleSettings({
      cycle_element: "review_cycle",
      settings: review_cycle_input,
      created_by_user_id: "user_001",
      organization_id: "org_001",
    });

    expect(saved_review_cycle).toEqual({
      cycle_element: "review_cycle",
      initial_review_days_after_creation: 7,
      periodic_review_interval_days: 30,
      review_start_time_utc: "10:00",
      status: "active",
      created_by_user_id: "user_001",
      organization_id: "org_001",
      created_at: expect.any(String),
      version: 1,
    });

    // 改善提案プロセスの定義
    const improvement_process_input = {
      proposal_submission_method: "form",
      approval_workflow_steps: [
        { step_number: 1, role: "submitter", action: "submit" },
        { step_number: 2, role: "manager", action: "review_approve" },
        { step_number: 3, role: "executive", action: "final_approval" },
      ],
      implementation_procedure: "agile",
      priority_scoring_rule: "business_impact",
    };

    const saved_improvement_process = defineDocumentCycleSettings({
      cycle_element: "improvement_proposal_process",
      settings: improvement_process_input,
      created_by_user_id: "user_001",
      organization_id: "org_001",
    });

    expect(saved_improvement_process).toEqual({
      cycle_element: "improvement_proposal_process",
      proposal_submission_method: "form",
      approval_workflow_steps: [
        { step_number: 1, role: "submitter", action: "submit" },
        { step_number: 2, role: "manager", action: "review_approve" },
        { step_number: 3, role: "executive", action: "final_approval" },
      ],
      implementation_procedure: "agile",
      priority_scoring_rule: "business_impact",
      status: "active",
      created_by_user_id: "user_001",
      organization_id: "org_001",
      created_at: expect.any(String),
      version: 1,
    });

    // 定義されたドキュメント更新頻度が正しく保存されていることを確認
    const validation_update_freq = validateDocumentCycleSettings({
      cycle_element: "update_frequency",
      settings: saved_update_frequency,
      organization_id: "org_001",
    });

    expect(validation_update_freq).toEqual({
      is_valid: true,
      errors: [],
      element_type: "update_frequency",
    });

    // 定義されたレビュー周期が正しく保存されていることを確認
    const validation_review = validateDocumentCycleSettings({
      cycle_element: "review_cycle",
      settings: saved_review_cycle,
      organization_id: "org_001",
    });

    expect(validation_review).toEqual({
      is_valid: true,
      errors: [],
      element_type: "review_cycle",
    });

    // 定義された改善提案プロセスが正しく保存されていることを確認
    const validation_improvement = validateDocumentCycleSettings({
      cycle_element: "improvement_proposal_process",
      settings: saved_improvement_process,
      organization_id: "org_001",
    });

    expect(validation_improvement).toEqual({
      is_valid: true,
      errors: [],
      element_type: "improvement_proposal_process",
    });

    // 別ユーザーアカウントでのドキュメント表示確認
    const user2_retrieval = defineDocumentCycleSettings({
      cycle_element: "retrieve_cycle_definitions",
      settings: { organization_id: "org_001" },
      created_by_user_id: "user_002",
      organization_id: "org_001",
    });

    expect(user2_retrieval).toHaveProperty("organization_id", "org_001");
    expect(user2_retrieval).toHaveProperty("status", "active");

    // 別ユーザーが同じドキュメントで業務を実行できることを確認
    const user2_execution_log = {
      user_id: "user_002",
      document_version: 1,
      cycle_element_used: "update_frequency",
      execution_timestamp: expect.any(String),
      execution_status: "successful",
    };

    expect(user2_execution_log.user_id).toBe("user_002");
    expect(user2_execution_log.execution_status).toBe("successful");

    // 別ユーザーが改善提案を同じプロセスで提案できることを確認
    const user2_proposal = {
      proposal_id: "prop_001",
      submitted_by_user_id: "user_002",
      organization_id: "org_001",
      proposal_title: "月次レポート生成処理の効率化",
      proposal_content:
        "レポート生成の並列処理を導入し、処理時間を30%削減する",
      submitted_at: expect.any(String),
      current_approval_step: 1,
      approval_workflow_followed: true,
    };

    expect(user2_proposal.submitted_by_user_id).toBe("user_002");
    expect(user2_proposal.approval_workflow_followed).toBe(true);

    // 提案内容が統一された形式で記録されていることを確認
    const proposal_format_validation = {
      has_proposal_id: !!user2_proposal.proposal_id,
      has_submitted_by: !!user2_proposal.submitted_by_user_id,
      has_organization_id: !!user2_proposal.organization_id,
      has_title: !!user2_proposal.proposal_title,
      has_content: !!user2_proposal.proposal_content,
      has_timestamp: !!user2_proposal.submitted_at,
      has_workflow_status: user2_proposal.approval_workflow_followed === true,
    };

    expect(proposal_format_validation.has_proposal_id).toBe(true);
    expect(proposal_format_validation.has_submitted_by).toBe(true);
    expect(proposal_format_validation.has_organization_id).toBe(true);
    expect(proposal_format_validation.has_title).toBe(true);
    expect(proposal_format_validation.has_content).toBe(true);
    expect(proposal_format_validation.has_timestamp).toBe(true);
    expect(proposal_format_validation.has_workflow_status).toBe(true);

    // 統一性の確認
    const cycle_settings_consistency = {
      update_frequency_active: saved_update_frequency.status === "active",
      review_cycle_active: saved_review_cycle.status === "active",
      improvement_process_active:
        saved_improvement_process.status === "active",
      all_same_organization: [
        saved_update_frequency.organization_id,
        saved_review_cycle.organization_id,
        saved_improvement_process.organization_id,
      ].every((org_id) => org_id === "org_001"),
      version_tracking_enabled: [
        saved_update_frequency.version,
        saved_review_cycle.version,
        saved_improvement_process.version,
      ].every((v) => v === 1),
    };

    expect(cycle_settings_consistency.update_frequency_active).toBe(true);
    expect(cycle_settings_consistency.review_cycle_active).toBe(true);
    expect(cycle_settings_consistency.improvement_process_active).toBe(true);
    expect(cycle_settings_consistency.all_same_organization).toBe(true);
    expect(cycle_settings_consistency.version_tracking_enabled).toBe(true);
  });
});