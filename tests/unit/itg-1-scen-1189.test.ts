import { classifyAndPrioritizeInquiry } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1189: [normal] 問い合わせ分類・優先度決定機能 - 分類結果に基づいて優先度（高/中/低）が正しく決定される
  test("should correctly classify inquiries and assign priority levels based on urgency and severity", () => {
    // テストケース1: 緊急/重大な問い合わせ → 高優先度
    const urgentInquiry = {
      inquiryId: "INQ-001",
      customerId: "CUST-A",
      inquiryType: "billing_critical_error",
      description:
        "請求額が契約額の2倍になっており、即座の修正が必要です。支払い期限が迫っています。",
      reportedAt: "2024-12-15T09:00:00Z",
      severity: "critical",
      impact: "payment_blocked",
    };

    const urgentResult = classifyAndPrioritizeInquiry(urgentInquiry);
    expect(urgentResult.priorityLevel).toBe("high");
    expect(urgentResult.classification).toBe("billing_error");
    expect(urgentResult.responseDeadlineHours).toBe(4);
    expect(urgentResult.assignmentRoute).toBe("immediate_escalation");

    // テストケース2: 通常の問い合わせ → 中優先度
    const normalInquiry = {
      inquiryId: "INQ-002",
      customerId: "CUST-B",
      inquiryType: "data_verification_request",
      description:
        "先月のレポートに記載されている成約数の確認をしたいのですが、根拠データを教えてください。",
      reportedAt: "2024-12-15T10:30:00Z",
      severity: "normal",
      impact: "clarification_needed",
    };

    const normalResult = classifyAndPrioritizeInquiry(normalInquiry);
    expect(normalResult.priorityLevel).toBe("medium");
    expect(normalResult.classification).toBe("data_verification");
    expect(normalResult.responseDeadlineHours).toBe(24);
    expect(normalResult.assignmentRoute).toBe("standard_support");

    // テストケース3: 軽微/参考情報的な問い合わせ → 低優先度
    const minorInquiry = {
      inquiryId: "INQ-003",
      customerId: "CUST-C",
      inquiryType: "report_format_preference",
      description:
        "今後のレポートをCSV形式で受け取りたいのですが、設定変更は可能でしょうか？",
      reportedAt: "2024-12-15T14:00:00Z",
      severity: "minor",
      impact: "preference_request",
    };

    const minorResult = classifyAndPrioritizeInquiry(minorInquiry);
    expect(minorResult.priorityLevel).toBe("low");
    expect(minorResult.classification).toBe("format_preference");
    expect(minorResult.responseDeadlineHours).toBe(72);
    expect(minorResult.assignmentRoute).toBe("general_inquiry");

    // 各優先度レベルのステータスとフラグが正しく設定されていることを確認
    expect(urgentResult.requiresManualReview).toBe(true);
    expect(urgentResult.escalationFlag).toBe(true);
    expect(normalResult.requiresManualReview).toBe(true);
    expect(normalResult.escalationFlag).toBe(false);
    expect(minorResult.requiresManualReview).toBe(false);
    expect(minorResult.escalationFlag).toBe(false);

    // 優先度決定ロジックのトレースログを確認し、分類判定の根拠が正しいことを検証
    expect(urgentResult.classificationReason).toMatch(/critical/);
    expect(urgentResult.classificationReason).toMatch(/billing_error/);
    expect(normalResult.classificationReason).toMatch(/data_verification/);
    expect(minorResult.classificationReason).toMatch(/preference/);

    // 類似の分類内容に対しては同じ優先度が付与されることを確認
    const similarCriticalInquiry = {
      inquiryId: "INQ-004",
      customerId: "CUST-D",
      inquiryType: "billing_amount_mismatch",
      description:
        "請求額の計算が誤っており、直ちに対応が必要です。契約条件との乖離があります。",
      reportedAt: "2024-12-15T11:00:00Z",
      severity: "critical",
      impact: "payment_blocked",
    };

    const similarCriticalResult = classifyAndPrioritizeInquiry(
      similarCriticalInquiry
    );
    expect(similarCriticalResult.priorityLevel).toBe("high");
    expect(similarCriticalResult.responseDeadlineHours).toBe(4);
    expect(similarCriticalResult.assignmentRoute).toBe("immediate_escalation");

    // 優先度決定ロジックの一貫性を検証
    expect(urgentResult.priorityLevel).toBe(
      similarCriticalResult.priorityLevel
    );
    expect(urgentResult.responseDeadlineHours).toBe(
      similarCriticalResult.responseDeadlineHours
    );

    // 優先度と緊急度の対応関係が正しいことを確認
    expect(urgentResult.priorityScore).toBeGreaterThan(
      normalResult.priorityScore
    );
    expect(normalResult.priorityScore).toBeGreaterThan(
      minorResult.priorityScore
    );
  });
});