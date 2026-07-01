import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  defineDocumentLifecycleManagement,
  verifyUpdateFrequencyDefinition,
  verifyReviewCycleDefinition,
  verifyImprovementProposalProcessDefinition,
  retrieveDefinitionDetails,
  accessDocumentManagementFeature,
  verifyMultiUserConsistency,
  executeDocumentUpdateByUser,
  executeReviewProcessByUser,
  submitImprovementProposalByUser,
  validateQualityStandardsAcrossUsers,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("ドキュメント更新ライフサイクル管理機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1087
  test("[normal] ドキュメント更新ライフサイクル管理機能 - 更新頻度・レビュー周期・改善提案プロセスが定義され、誰でも同じ品質で実行可能な状態になる", async () => {
    // ステップ1: 営業データ品質管理・請求自動化システムにログイン
    const user1LoginResult = await accessDocumentManagementFeature({
      userId: "user_001",
      userRole: "representative",
      timestamp: new Date("2024-01-15T09:00:00Z"),
    });
    expect(user1LoginResult.accessGranted).toBe(true);
    expect(user1LoginResult.userId).toBe("user_001");

    // ステップ2: ドキュメント更新ライフサイクル管理機能にアクセス
    const featureAccessResult = await accessDocumentManagementFeature({
      userId: "user_001",
      userRole: "representative",
      timestamp: new Date("2024-01-15T09:05:00Z"),
    });
    expect(featureAccessResult.featureAvailable).toBe(true);

    // ステップ3: 更新頻度の定義が設定されていることを確認
    const updateFrequencyDefinition = await verifyUpdateFrequencyDefinition({
      documentId: "doc_template_001",
      expectedFrequency: "monthly",
    });
    expect(updateFrequencyDefinition.isDefined).toBe(true);
    expect(updateFrequencyDefinition.frequency).toBe("monthly");
    expect(updateFrequencyDefinition.lastUpdateDate).toEqual(
      new Date("2024-01-01T00:00:00Z")
    );
    expect(updateFrequencyDefinition.nextUpdateDueDate).toEqual(
      new Date("2024-02-01T00:00:00Z")
    );

    // ステップ4: レビュー周期の定義が設定されていることを確認
    const reviewCycleDefinition = await verifyReviewCycleDefinition({
      documentId: "doc_template_001",
      expectedCycle: "bi_weekly",
    });
    expect(reviewCycleDefinition.isDefined).toBe(true);
    expect(reviewCycleDefinition.cycle).toBe("bi_weekly");
    expect(reviewCycleDefinition.nextReviewDate).toEqual(
      new Date("2024-01-29T00:00:00Z")
    );
    expect(reviewCycleDefinition.reviewerCount).toBe(3);

    // ステップ5: 改善提案プロセスの定義が設定されていることを確認
    const improvementProposalProcess = await verifyImprovementProposalProcessDefinition({
      documentId: "doc_template_001",
    });
    expect(improvementProposalProcess.isDefined).toBe(true);
    expect(improvementProposalProcess.proposalSubmissionWindow).toBe(7);
    expect(improvementProposalProcess.approvalRequired).toBe(true);
    expect(improvementProposalProcess.maxReviewersNeeded).toBe(2);

    // ステップ6: 各定義内容の詳細をドキュメント化されている状態で確認
    const definitionDetails = await retrieveDefinitionDetails({
      documentId: "doc_template_001",
      userId: "user_001",
    });
    expect(definitionDetails.updateFrequencyDetails).toBeDefined();
    expect(definitionDetails.updateFrequencyDetails.frequency).toBe("monthly");
    expect(definitionDetails.updateFrequencyDetails.lastDocumented).toEqual(
      new Date("2024-01-10T14:30:00Z")
    );
    expect(definitionDetails.reviewCycleDetails).toBeDefined();
    expect(definitionDetails.reviewCycleDetails.cycle).toBe("bi_weekly");
    expect(definitionDetails.improvementProposalDetails).toBeDefined();
    expect(definitionDetails.improvementProposalDetails.windowDays).toBe(7);
    expect(definitionDetails.documentationStatus).toBe("documented");

    // ステップ7-8: 複数ユーザーアカウントでシステムにログイン
    const user2LoginResult = await accessDocumentManagementFeature({
      userId: "user_002",
      userRole: "operations_staff",
      timestamp: new Date("2024-01-15T09:10:00Z"),
    });
    expect(user2LoginResult.accessGranted).toBe(true);
    expect(user2LoginResult.userId).toBe("user_002");

    const user3LoginResult = await accessDocumentManagementFeature({
      userId: "user_003",
      userRole: "operations_staff",
      timestamp: new Date("2024-01-15T09:12:00Z"),
    });
    expect(user3LoginResult.accessGranted).toBe(true);
    expect(user3LoginResult.userId).toBe("user_003");

    // ステップ9: 複数ユーザーが同じドキュメント更新ライフサイクル管理機能にアクセス
    const user2FeatureAccess = await accessDocumentManagementFeature({
      userId: "user_002",
      userRole: "operations_staff",
      timestamp: new Date("2024-01-15T09:15:00Z"),
    });
    expect(user2FeatureAccess.featureAvailable).toBe(true);

    const user3FeatureAccess = await accessDocumentManagementFeature({
      userId: "user_003",
      userRole: "operations_staff",
      timestamp: new Date("2024-01-15T09:17:00Z"),
    });
    expect(user3FeatureAccess.featureAvailable).toBe(true);

    // ステップ10: 複数ユーザーが同じ定義を確認できることを検証
    const user2UpdateFrequency = await verifyUpdateFrequencyDefinition({
      documentId: "doc_template_001",
      expectedFrequency: "monthly",
    });
    expect(user2UpdateFrequency.frequency).toBe("monthly");
    expect(user2UpdateFrequency.nextUpdateDueDate).toEqual(
      new Date("2024-02-01T00:00:00Z")
    );

    const user2ReviewCycle = await verifyReviewCycleDefinition({
      documentId: "doc_template_001",
      expectedCycle: "bi_weekly",
    });
    expect(user2ReviewCycle.cycle).toBe("bi_weekly");

    const user2ImprovementProposal = await verifyImprovementProposalProcessDefinition({
      documentId: "doc_template_001",
    });
    expect(user2ImprovementProposal.proposalSubmissionWindow).toBe(7);

    const user3UpdateFrequency = await verifyUpdateFrequencyDefinition({
      documentId: "doc_template_001",
      expectedFrequency: "monthly",
    });
    expect(user3UpdateFrequency.frequency).toBe("monthly");

    const user3ReviewCycle = await verifyReviewCycleDefinition({
      documentId: "doc_template_001",
      expectedCycle: "bi_weekly",
    });
    expect(user3ReviewCycle.cycle).toBe("bi_weekly");

    // ステップ11: 複数ユーザーが定義に基づいてドキュメント更新を実行
    const user1UpdateExecution = await executeDocumentUpdateByUser({
      userId: "user_001",
      documentId: "doc_template_001",
      updateType: "content_revision",
      timestamp: new Date("2024-01-15T10:00:00Z"),
      changeDescription: "Updated billing logic based on new contract terms",
    });
    expect(user1UpdateExecution.executionStatus).toBe("completed");
    expect(user1UpdateExecution.qualityScore).toBe(95);
    expect(user1UpdateExecution.followsDefinition).toBe(true);

    const user2UpdateExecution = await executeDocumentUpdateByUser({
      userId: "user_002",
      documentId: "doc_template_001",
      updateType: "content_revision",
      timestamp: new Date("2024-01-15T10:05:00Z"),
      changeDescription: "Updated billing logic based on new contract terms",
    });
    expect(user2UpdateExecution.executionStatus).toBe("completed");
    expect(user2UpdateExecution.qualityScore).toBe(95);
    expect(user2UpdateExecution.followsDefinition).toBe(true);

    const user3UpdateExecution = await executeDocumentUpdateByUser({
      userId: "user_003",
      documentId: "doc_template_001",
      updateType: "content_revision",
      timestamp: new Date("2024-01-15T10:08:00Z"),
      changeDescription: "Updated billing logic based on new contract terms",
    });
    expect(user3UpdateExecution.executionStatus).toBe("completed");
    expect(user3UpdateExecution.qualityScore).toBe(95);
    expect(user3UpdateExecution.followsDefinition).toBe(true);

    // ステップ12: 複数ユーザーが定義に基づいてレビュープロセスを実行
    const user1ReviewExecution = await executeReviewProcessByUser({
      userId: "user_001",
      documentId: "doc_template_001",
      reviewType: "content_accuracy",
      timestamp: new Date("2024-01-15T10:30:00Z"),
      reviewApproved: true,
    });
    expect(user1ReviewExecution.reviewStatus).toBe("completed");
    expect(user1ReviewExecution.reviewApproved).toBe(true);
    expect(user1ReviewExecution.reviewQualityScore).toBe(98);

    const user2ReviewExecution = await executeReviewProcessByUser({
      userId: "user_002",
      documentId: "doc_template_001",
      reviewType: "content_accuracy",
      timestamp: new Date("2024-01-15T10:35:00Z"),
      reviewApproved: true,
    });
    expect(user2ReviewExecution.reviewStatus).toBe("completed");
    expect(user2ReviewExecution.reviewApproved).toBe(true);
    expect(user2ReviewExecution.reviewQualityScore).toBe(98);

    // ステップ13: 複数ユーザーが定義に基づいて改善提案を提出
    const user1ProposalSubmission = await submitImprovementProposalByUser({
      userId: "user_001",
      documentId: "doc_template_001",
      proposalTitle: "Add automated validation for payment terms",
      proposalDescription:
        "Implement system-level validation to prevent invalid payment term entries",
      priority: "high",
      timestamp: new Date("2024-01-15T11:00:00Z"),
    });
    expect(user1ProposalSubmission.submissionStatus).toBe("accepted");
    expect(user1ProposalSubmission.proposalId).toBeDefined();
    expect(user1ProposalSubmission.requiresApproval).toBe(true);

    const user2ProposalSubmission = await submitImprovementProposalByUser({
      userId: "user_002",
      documentId: "doc_template_001",
      proposalTitle: "Clarify monthly data extraction timing",
      proposalDescription:
        "Document exact cutoff time for monthly billing data extraction to prevent timing conflicts",
      priority: "medium",
      timestamp: new Date("2024-01-15T11:05:00Z"),
    });
    expect(user2ProposalSubmission.submissionStatus).toBe("accepted");
    expect(user2ProposalSubmission.proposalId).toBeDefined();
    expect(user2ProposalSubmission.requiresApproval).toBe(true);

    const user3ProposalSubmission = await submitImprovementProposalByUser({
      userId: "user_003",
      documentId: "doc_template_001",
      proposalTitle: "Add exception handling examples",
      proposalDescription: "Include real-world exception scenarios in the SOP",
      priority: "medium",
      timestamp: new Date("2024-01-15T11:10:00Z"),
    });
    expect(user3ProposalSubmission.submissionStatus).toBe("accepted");
    expect(user3ProposalSubmission.proposalId).toBeDefined();
    expect(user3ProposalSubmission.requiresApproval).toBe(true);

    // ステップ14: 複数ユーザーによる実行結果が同一の品質基準を満たしていることを確認
    const qualityValidation = await validateQualityStandardsAcrossUsers({
      documentId: "doc_template_001",
      userIds: ["user_001", "user_002", "user_003"],
      evaluationDate: new Date("2024-01-15T12:00:00Z"),
    });

    expect(qualityValidation.allUsersCompliant).toBe(true);
    expect(qualityValidation.consistencyScore).toBe(100);
    expect(qualityValidation.updateQualityAverageScore).toBe(95);
    expect(qualityValidation.reviewQualityAverageScore).toBe(98);
    expect(qualityValidation.proposalComplianceRate).toBe(100);

    // 詳細検証: 各ユーザーの個別品質スコア
    expect(qualityValidation.userQualityScores).toEqual([
      {
        userId: "user_001",
        updateExecutionQuality: 95,
        reviewExecutionQuality: 98,
        proposalSubmissionQuality: 96,
        overallCompliance: true,
      },
      {
        userId: "user_002",
        updateExecutionQuality: 95,
        reviewExecutionQuality: 98,
        proposalSubmissionQuality: 94,
        overallCompliance: true,
      },
      {
        userId: "user_003",
        updateExecutionQuality: 95,
        reviewExecutionQuality: 98,
        proposalSubmissionQuality: 95,
        overallCompliance: true,
      },
    ]);

    // 定義の遵守確認
    expect(qualityValidation.definitionAdherenceCheck).toEqual({
      updateFrequencyAdhered: true,
      reviewCycleAdhered: true,
      improvementProposalProcessAdhered: true,
      deviationCount: 0,
    });

    // 全ユーザーが同じ品質基準に適合していることを確認
    expect(qualityValidation.allUsersCompliant).toBe(true);
    expect(qualityValidation.consistencyScore).toBe(100);

    // 最終検証: ドキュメント更新ライフサイクル管理が確立されている
    expect(qualityValidation.lifecycleManagementEstablished).toBe(true);
    expect(qualityValidation.qualityStandardsUnified).toBe(true);
    expect(qualityValidation.multiUserExecutionSuccessful).toBe(true);
  });
});