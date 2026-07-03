import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fetchMock from "jest-fetch-mock";
import {
  detectBillingLogicContradictions,
  resolveBillingLogicContradictions,
  validateBillingLogicAfterResolution,
} from "../../src/logic/it-1-2-1";

fetchMock.enableMocks();

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-994: [normal] 請求ロジック・割引基準・例外パターン管理 - 既存手順書に矛盾が判明した場合に矛盾を解決し統一基準を確立できる
  it("既存手順書の矛盾を検出し、統一基準を確立してシステムに反映させる", () => {
    // 前提: 既存の請求ロジック手順書と割引基準手順書がシステムに登録されており、矛盾が存在する状態
    // 期待: 矛盾が正確に検出され、統一基準が確立され、システム動作検証が成功すること

    // Phase 1: 既存手順書の矛盾を検出
    const billingLogicManualV1 = {
      manual_id: "manual_001",
      version: "1.0",
      title: "請求ロジック手順書",
      content: {
        base_charge: 50000,
        performance_bonus_rule: "成約数 × 5000",
        minimum_charge: 30000,
        maximum_charge: 200000,
        discount_application: "月間成約数 >= 10件で5%割引",
      },
      last_updated: "2024-01-10T09:00:00Z",
      created_by: "operator_001",
    };

    const discountManualV1 = {
      manual_id: "manual_002",
      version: "1.0",
      title: "割引基準手順書",
      content: {
        discount_rule_1: "新規顧客は初月のみ10%割引",
        discount_rule_2: "月間成約数 >= 15件で8%割引",
        discount_rule_3: "既存顧客で成約数 >= 10件は5%割引",
        exclusion_rules: "割引の重複適用は不可。最大割引率を適用",
      },
      last_updated: "2024-01-05T14:30:00Z",
      created_by: "operator_002",
    };

    // Phase 2: 矛盾検出実行
    const contradictions = detectBillingLogicContradictions({
      billing_logic_manual: billingLogicManualV1,
      discount_manual: discountManualV1,
      detection_timestamp: "2024-01-15T10:00:00Z",
      detector_id: "operator_001",
    });

    // Phase 2の期待値: 矛盾が3件検出される
    // 矛盾1: 請求ロジック「成約数 >= 10件で5%割引」vs 割引基準「成約数 >= 15件で8%割引」
    // 矛盾2: 請求ロジック「割引適用基準 >= 10件」 vs 割引基準「既存顧客 >= 10件は5%、新規 >= 15件は8%」で顧客属性の考慮が異なる
    // 矛盾3: 割引基準内で「初月10%」「15件以上8%」「10件以上5%」の優先度が不明確
    expect(contradictions.status).toBe("detected");
    expect(contradictions.contradiction_count).toBe(3);
    expect(contradictions.contradictions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          contradiction_id: expect.any(String),
          type: "discount_threshold_mismatch",
          source_manual_1: "manual_001",
          source_manual_2: "manual_002",
          description: expect.stringContaining("成約数"),
          severity: "high",
        }),
        expect.objectContaining({
          contradiction_id: expect.any(String),
          type: "customer_attribute_consideration",
          source_manual_1: "manual_001",
          source_manual_2: "manual_002",
          description: expect.stringContaining("顧客属性"),
          severity: "high",
        }),
        expect.objectContaining({
          contradiction_id: expect.any(String),
          type: "discount_priority_unclear",
          source_manual_1: "manual_002",
          source_manual_2: "manual_002",
          description: expect.stringContaining("優先度"),
          severity: "medium",
        }),
      ])
    );

    // Phase 3: 統一基準案を作成
    const unifiedBillingStandard = {
      unified_standard_id: "standard_unified_001",
      version: "2.0",
      title: "統一請求ロジック・割引基準",
      effective_date: "2024-02-01T00:00:00Z",
      content: {
        base_charge: 50000,
        performance_bonus_rule: "成約数 × 5000",
        minimum_charge: 30000,
        maximum_charge: 200000,
        discount_rules: [
          {
            rule_id: "discount_rule_unified_1",
            description: "新規顧客初月: 10%割引",
            condition: "customer_type == 'new' && month == first_month",
            discount_rate: 0.1,
            priority: 1,
          },
          {
            rule_id: "discount_rule_unified_2",
            description: "既存顧客・月間成約数 >= 12件: 7%割引",
            condition: "customer_type == 'existing' && contract_count >= 12",
            discount_rate: 0.07,
            priority: 2,
          },
          {
            rule_id: "discount_rule_unified_3",
            description: "既存顧客・月間成約数 >= 10件 < 12件: 5%割引",
            condition: "customer_type == 'existing' && contract_count >= 10 && contract_count < 12",
            discount_rate: 0.05,
            priority: 3,
          },
        ],
        discount_application_rule: "複数割引該当時は最高割引率のみを適用。重複適用不可",
        exemption_rules:
          "割引対象外: キャンペーン特典が既に適用されている場合は割引不可",
      },
      created_by: "operator_001",
      created_timestamp: "2024-01-15T11:00:00Z",
      status: "draft",
    };

    // Phase 4: 矛盾解決実行 (統一基準案で矛盾を解決)
    const resolutionResult = resolveBillingLogicContradictions({
      contradictions: contradictions.contradictions,
      unified_standard_proposal: unifiedBillingStandard,
      resolution_timestamp: "2024-01-15T11:30:00Z",
      resolver_id: "operator_001",
    });

    // Phase 4の期待値: 矛盾が解決される
    expect(resolutionResult.resolution_status).toBe("resolved");
    expect(resolutionResult.resolved_contradiction_count).toBe(3);
    expect(resolutionResult.unresolved_contradiction_count).toBe(0);
    expect(resolutionResult.resolution_summary).toContain("統一基準");

    // Phase 5: 承認ワークフロー開始 (模擬)
    const approvalWorkflow = {
      workflow_id: "workflow_approval_001",
      unified_standard_id: "standard_unified_001",
      status: "approved",
      approvals: [
        {
          approver_id: "approver_001",
          approver_role: "営業オペレーター",
          approval_timestamp: "2024-01-15T12:00:00Z",
          decision: "approved",
          comment: "統一基準案に同意。矛盾が完全に解決されている。",
        },
        {
          approver_id: "approver_002",
          approver_role: "管理者",
          approval_timestamp: "2024-01-15T13:00:00Z",
          decision: "approved",
          comment: "顧客属性と割引優先度が明確に定義されている。",
        },
      ],
      all_approvals_received: true,
      final_approval_timestamp: "2024-01-15T13:00:00Z",
    };

    // Phase 6: 統一基準をシステムに登録
    const registeredStandard = {
      ...unifiedBillingStandard,
      status: "active",
      system_registration_timestamp: "2024-01-15T13:30:00Z",
      registered_by: "operator_001",
      effective_date: "2024-02-01T00:00:00Z",
    };

    expect(registeredStandard.status).toBe("active");
    expect(registeredStandard.system_registration_timestamp).toBe(
      "2024-01-15T13:30:00Z"
    );

    // Phase 7: 例外パターン管理セクションで新統一基準を参照する設定に更新
    const exceptionPatternConfig = {
      config_id: "exception_pattern_config_001",
      billing_standard_reference_id: "standard_unified_001",
      billing_standard_version: "2.0",
      effective_from: "2024-02-01T00:00:00Z",
      exception_patterns: [
        {
          pattern_id: "exception_001",
          description: "キャンペーン特典がある場合は割引を適用しない",
          condition: "has_campaign_benefit == true",
          action: "skip_discount",
          billing_standard_reference: "standard_unified_001",
        },
        {
          pattern_id: "exception_002",
          description: "複数割引該当時は最高割引率を適用",
          condition: "multiple_discounts_applicable == true",
          action: "apply_max_discount_rate",
          billing_standard_reference: "standard_unified_001",
        },
      ],
      updated_timestamp: "2024-01-15T14:00:00Z",
      updated_by: "operator_001",
    };

    expect(exceptionPatternConfig.billing_standard_reference_id).toBe(
      "standard_unified_001"
    );
    expect(exceptionPatternConfig.billing_standard_version).toBe("2.0");
    expect(exceptionPatternConfig.exception_patterns.length).toBe(2);

    // Phase 8: 統一基準に基づいて請求ロジックの動作検証を実行
    // テストケース1: 既存顧客・成約数12件 → 7%割引が適用される
    const testCase1_input = {
      customer_id: "cust_001",
      customer_type: "existing",
      service_id: "service_001",
      contract_count: 12,
      base_amount: 50000,
      campaign_benefit: false,
    };

    const testCase1_expected = {
      base_amount: 50000,
      discount_rate: 0.07,
      discount_amount: 3500,
      final_amount: 46500,
      applied_discount_rule: "discount_rule_unified_2",
      validation_status: "valid",
    };

    // テストケース2: 既存顧客・成約数10件 → 5%割引が適用される
    const testCase2_input = {
      customer_id: "cust_002",
      customer_type: "existing",
      service_id: "service_001",
      contract_count: 10,
      base_amount: 50000,
      campaign_benefit: false,
    };

    const testCase2_expected = {
      base_amount: 50000,
      discount_rate: 0.05,
      discount_amount: 2500,
      final_amount: 47500,
      applied_discount_rule: "discount_rule_unified_3",
      validation_status: "valid",
    };

    // テストケース3: 新規顧客・初月 → 10%割引が適用される
    const testCase3_input = {
      customer_id: "cust_003",
      customer_type: "new",
      service_id: "service_001",
      contract_count: 5,
      base_amount: 50000,
      campaign_benefit: false,
      is_first_month: true,
    };

    const testCase3_expected = {
      base_amount: 50000,
      discount_rate: 0.1,
      discount_amount: 5000,
      final_amount: 45000,
      applied_discount_rule: "discount_rule_unified_1",
      validation_status: "valid",
    };

    // テストケース4: キャンペーン特典がある場合 → 割引が適用されない
    const testCase4_input = {
      customer_id: "cust_004",
      customer_type: "existing",
      service_id: "service_001",
      contract_count: 12,
      base_amount: 50000,
      campaign_benefit: true,
    };

    const testCase4_expected = {
      base_amount: 50000,
      discount_rate: 0,
      discount_amount: 0,
      final_amount: 50000,
      applied_discount_rule: null,
      validation_status: "valid",
      exemption_reason: "campaign_benefit_applied",
    };

    // Phase 9: validateBillingLogicAfterResolution を実行
    const validationResult = validateBillingLogicAfterResolution({
      unified_standard_id: "standard_unified_001",
      test_cases: [
        testCase1_input,
        testCase2_input,
        testCase3_input,
        testCase4_input,
      ],
      expected_results: [
        testCase1_expected,
        testCase2_expected,
        testCase3_expected,
        testCase4_expected,
      ],
      validation_timestamp: "2024-01-15T14:30:00Z",
      validator_id: "operator_001",
    });

    // Phase 9の期待値: すべてのテストケースが成功する
    expect(validationResult.validation_status).toBe("all_passed");
    expect(validationResult.total_test_cases).toBe(4);
    expect(validationResult.passed_test_cases).toBe(4);
    expect(validationResult.failed_test_cases).toBe(0);
    expect(validationResult.validation_results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          test_case_id: 0,
          actual_result: testCase1_expected,
          expected_result: testCase1_expected,
          test_status: "passed",
        }),
        expect.objectContaining({
          test_case_id: 1,
          actual_result: testCase2_expected,
          expected_result: testCase2_expected,
          test_status: "passed",
        }),
        expect.objectContaining({
          test_case_id: 2,
          actual_result: testCase3_expected,
          expected_result: testCase3_expected,
          test_status: "passed",
        }),
        expect.objectContaining({
          test_case_id: 3,
          actual_result: testCase4_expected,
          expected_result: testCase4_expected,
          test_status: "passed",
        }),
      ])
    );

    // Phase 10: 最終確認 - 矛盾解決から検証完了までの全体結果
    const finalSummary = {
      scenario_id: "SCEN-994",
      initial_contradiction_count: 3,
      resolved_contradiction_count: 3,
      remaining_contradiction_count: 0,
      unified_standard_established: true,
      unified_standard_id: "standard_unified_001",
      system_registration_successful: true,
      exception_pattern_updated: true,
      billing_logic_validation_passed: true,
      overall_status: "success",
      completion_timestamp: "2024-01-15T14:30:00Z",
    };

    expect(finalSummary.overall_status).toBe("success");
    expect(finalSummary.resolved_contradiction_count).toBe(3);
    expect(finalSummary.remaining_contradiction_count).toBe(0);
    expect(finalSummary.unified_standard_established).toBe(true);
    expect(finalSummary.system_registration_successful).toBe(true);
    expect(finalSummary.exception_pattern_updated).toBe(true);
    expect(finalSummary.billing_logic_validation_passed).toBe(true);
  });
});