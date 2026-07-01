import {
  recordExceptionCase,
  createProcedureDocument,
  uploadDocumentToManagement,
  startApprovalWorkflow,
  updateExceptionPatternMaster,
  verifyBillingLogicReflection,
  sendOperationalNotification,
  verifyNotificationAndDocumentAccess,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-1016: 新しい例外ケースが発生したときに手順書に反映される", () => {
    // ========== 初期状態: 既存の例外パターン一覧を確認 ==========
    const existing_exceptions = [
      {
        exception_id: "EXC-001",
        customer_name: "顧客A",
        exception_type: "追加割引",
        discount_rate: 0.1,
        created_at: "2024-01-10T09:00:00Z",
        status: "approved",
      },
      {
        exception_id: "EXC-002",
        customer_name: "顧客B",
        exception_type: "季節割引",
        discount_rate: 0.05,
        created_at: "2024-02-15T10:30:00Z",
        status: "approved",
      },
    ];

    // ========== Step 1: 新しい例外ケースを記録 ==========
    const new_exception_input = {
      customer_id: "CUST-003",
      customer_name: "顧客C",
      exception_type: "キャンペーン割引",
      discount_rate: 0.15,
      service_type: "営業代行",
      target_period_start: "2024-03-01",
      target_period_end: "2024-03-31",
      reason: "春季キャンペーン実施に伴う特別割引",
      created_by_user_id: "USR-001",
      created_at: "2024-02-25T14:00:00Z",
    };

    const recorded_exception = recordExceptionCase(new_exception_input);

    expect(recorded_exception).toEqual({
      exception_id: expect.stringMatching(/^EXC-\d+$/),
      customer_id: "CUST-003",
      customer_name: "顧客C",
      exception_type: "キャンペーン割引",
      discount_rate: 0.15,
      service_type: "営業代行",
      target_period_start: "2024-03-01",
      target_period_end: "2024-03-31",
      reason: "春季キャンペーン実施に伴う特別割引",
      status: "draft",
      created_by_user_id: "USR-001",
      created_at: "2024-02-25T14:00:00Z",
    });

    const exception_id = recorded_exception.exception_id;

    // ========== Step 2: 対応手順書を作成 ==========
    const procedure_input = {
      exception_id: exception_id,
      title: "キャンペーン割引適用手順書 - 顧客C春季キャンペーン",
      description: "顧客Cに対する春季キャンペーン期間中の15%割引適用手順",
      steps: [
        {
          step_number: 1,
          step_title: "対象期間確認",
          step_content:
            "請求対象月が2024年3月であることを確認。対象外の月は割引を適用しない。",
        },
        {
          step_number: 2,
          step_title: "割引率確認",
          step_content:
            "15%割引を適用。契約単価から0.15を乗じた金額を値引額として計上。",
        },
        {
          step_number: 3,
          step_title: "請求額の再計算",
          step_content:
            "基本料金から割引額を差し引き、最終請求額を決定。請求書に割引理由を記載。",
        },
      ],
      created_by_user_id: "USR-001",
      created_at: "2024-02-25T14:15:00Z",
    };

    const created_procedure = createProcedureDocument(procedure_input);

    expect(created_procedure).toEqual({
      procedure_id: expect.stringMatching(/^PROC-\d+$/),
      exception_id: exception_id,
      title: "キャンペーン割引適用手順書 - 顧客C春季キャンペーン",
      description: "顧客Cに対する春季キャンペーン期間中の15%割引適用手順",
      steps: expect.arrayContaining([
        expect.objectContaining({
          step_number: 1,
          step_title: "対象期間確認",
        }),
        expect.objectContaining({
          step_number: 2,
          step_title: "割引率確認",
        }),
        expect.objectContaining({
          step_number: 3,
          step_title: "請求額の再計算",
        }),
      ]),
      status: "draft",
      created_by_user_id: "USR-001",
      created_at: "2024-02-25T14:15:00Z",
    });

    const procedure_id = created_procedure.procedure_id;

    // ========== Step 3: 文書管理システムにアップロード ==========
    const upload_input = {
      procedure_id: procedure_id,
      exception_id: exception_id,
      file_name: "キャンペーン割引適用手順書_顧客C_2024春季.md",
      file_content:
        "# キャンペーン割引適用手順書 - 顧客C春季キャンペーン\n\n## 目的\n顧客Cに対する春季キャンペーン期間中の15%割引を適用するための標準手順\n\n## 対象期間\n2024年3月1日～3月31日\n\n## 処理手順\n1. 対象期間確認\n2. 割引率確認（15%）\n3. 請求額の再計算",
      document_type: "procedure_manual",
      upload_timestamp: "2024-02-25T14:30:00Z",
      uploader_user_id: "USR-001",
    };

    const uploaded_document = uploadDocumentToManagement(upload_input);

    expect(uploaded_document).toEqual({
      document_id: expect.stringMatching(/^DOC-\d+$/),
      procedure_id: procedure_id,
      exception_id: exception_id,
      file_name: "キャンペーン割引適用手順書_顧客C_2024春季.md",
      document_type: "procedure_manual",
      storage_path: expect.stringContaining("/documents/"),
      upload_timestamp: "2024-02-25T14:30:00Z",
      uploader_user_id: "USR-001",
      status: "uploaded",
    });

    const document_id = uploaded_document.document_id;

    // ========== Step 4: 承認ワークフローを開始 ==========
    const approval_workflow_input = {
      document_id: document_id,
      procedure_id: procedure_id,
      exception_id: exception_id,
      requester_user_id: "USR-001",
      approval_request_timestamp: "2024-02-25T14:45:00Z",
      required_approvers: [
        {
          approver_user_id: "MGR-001",
          approver_name: "営業オペレーション部長",
          approval_level: 1,
        },
        {
          approver_user_id: "DIR-001",
          approver_name: "代表兼営業責任者",
          approval_level: 2,
        },
      ],
    };

    const approval_workflow = startApprovalWorkflow(
      approval_workflow_input
    );

    expect(approval_workflow).toEqual({
      workflow_id: expect.stringMatching(/^WF-\d+$/),
      document_id: document_id,
      procedure_id: procedure_id,
      exception_id: exception_id,
      requester_user_id: "USR-001",
      approval_request_timestamp: "2024-02-25T14:45:00Z",
      workflow_status: "pending_approval",
      current_approval_level: 1,
      approval_chain: expect.arrayContaining([
        expect.objectContaining({
          approver_user_id: "MGR-001",
          approval_level: 1,
          approval_status: "pending",
        }),
        expect.objectContaining({
          approver_user_id: "DIR-001",
          approval_level: 2,
          approval_status: "pending",
        }),
      ]),
    });

    const workflow_id = approval_workflow.workflow_id;

    // ========== Step 5: 承認者による確認と承認 ==========
    // 第1段階承認: 営業オペレーション部長が承認
    const first_approval_result = {
      workflow_id: workflow_id,
      approver_user_id: "MGR-001",
      approval_level: 1,
      approval_decision: "approved",
      approval_timestamp: "2024-02-26T09:30:00Z",
      approval_comment: "手順書の内容は適切です。承認します。",
    };

    // 第2段階承認: 代表兼営業責任者が承認
    const final_approval_result = {
      workflow_id: workflow_id,
      approver_user_id: "DIR-001",
      approval_level: 2,
      approval_decision: "approved",
      approval_timestamp: "2024-02-26T10:15:00Z",
      approval_comment: "確認しました。本例外パターンを承認し、即座に適用します。",
    };

    expect(first_approval_result.approval_decision).toBe("approved");
    expect(final_approval_result.approval_decision).toBe("approved");

    // ========== Step 6: 例外パターンマスタを更新 ==========
    const update_master_input = {
      workflow_id: workflow_id,
      document_id: document_id,
      exception_id: exception_id,
      procedure_id: procedure_id,
      update_timestamp: "2024-02-26T10:30:00Z",
      updated_by_user_id: "USR-002",
      exception_data: {
        customer_id: "CUST-003",
        customer_name: "顧客C",
        exception_type: "キャンペーン割引",
        discount_rate: 0.15,
        service_type: "営業代行",
        target_period_start: "2024-03-01",
        target_period_end: "2024-03-31",
        reason: "春季キャンペーン実施に伴う特別割引",
        procedure_id: procedure_id,
      },
    };

    const updated_master = updateExceptionPatternMaster(update_master_input);

    expect(updated_master).toEqual({
      exception_id: exception_id,
      customer_id: "CUST-003",
      customer_name: "顧客C",
      exception_type: "キャンペーン割引",
      discount_rate: 0.15,
      service_type: "営業代行",
      target_period_start: "2024-03-01",
      target_period_end: "2024-03-31",
      reason: "春季キャンペーン実施に伴う特別割引",
      procedure_id: procedure_id,
      master_status: "active",
      update_timestamp: "2024-02-26T10:30:00Z",
      updated_by_user_id: "USR-002",
    });

    // ========== Step 7: 請求ロジックに正しく反映されていることを確認 ==========
    // テストシナリオ: 顧客Cの2024年3月の請求対象アポ数が10件、基本単価が50,000円
    const billing_verification_input = {
      exception_id: exception_id,
      customer_id: "CUST-003",
      service_type: "営業代行",
      billing_month: "2024-03",
      base_price: 50000,
      unit_count: 10,
      expected_discount_rate: 0.15,
    };

    const billing_verification = verifyBillingLogicReflection(
      billing_verification_input
    );

    // 期待値計算: 基本金額 = 50,000 × 10 = 500,000
    // 割引額 = 500,000 × 0.15 = 75,000
    // 最終請求額 = 500,000 - 75,000 = 425,000
    const expected_base_amount = 50000 * 10;
    const expected_discount_amount = expected_base_amount * 0.15;
    const expected_final_billing_amount =
      expected_base_amount - expected_discount_amount;

    expect(billing_verification).toEqual({
      exception_id: exception_id,
      customer_id: "CUST-003",
      billing_month: "2024-03",
      base_amount: expected_base_amount,
      discount_rate: 0.15,
      discount_amount: expected_discount_amount,
      final_billing_amount: expected_final_billing_amount,
      exception_applied: true,
      reflection_status: "verified",
      verification_timestamp: "2024-02-26T10:45:00Z",
    });

    expect(billing_verification.final_billing_amount).toBe(425000);
    expect(billing_verification.discount_amount).toBe(75000);
    expect(billing_verification.exception_applied).toBe(true);

    // ========== Step 8: 運用チームに通知を送信 ==========
    const notification_input = {
      exception_id: exception_id,
      procedure_id: procedure_id,
      document_id: document_id,
      notification_type: "exception_pattern_update",
      recipients: [
        {
          user_id: "OPS-001",
          user_name: "営業オペレーター A",
          email: "ops-a@company.com",
          role: "billing_operator",
        },
        {
          user_id: "OPS-002",
          user_name: "営業オペレーター B",
          email: "ops-b@company.com",
          role: "billing_operator",
        },
      ],
      notification_title: "新しい例外パターンが追加されました：キャンペーン割引（顧客C）",
      notification_content:
        "顧客Cに対する春季キャンペーン割引（15%）が本日より適用開始となります。詳細は添付の手順書をご確認ください。",
      notification_sent_timestamp: "2024-02-26T11:00:00Z",
    };

    const sent_notification = sendOperationalNotification(notification_input);

    expect(sent_notification).toEqual({
      notification_id: expect.stringMatching(/^NOTIF-\d+$/),
      exception_id: exception_id,
      procedure_id: procedure_id,
      document_id: document_id,
      notification_type: "exception_pattern_update",
      recipient_count: 2,
      notification_title: "新しい例外パターンが追加されました：キャンペーン割引（顧客C）",
      notification_sent_timestamp: "2024-02-26T11:00:00Z",
      delivery_status: "sent",
      delivery_confirmations: expect.arrayContaining([
        expect.objectContaining({
          user_id: "OPS-001",
          delivery_status: "delivered",
        }),
        expect.objectContaining({
          user_id: "OPS-002",
          delivery_status: "delivered",
        }),
      ]),
    });

    const notification_id = sent_notification.notification_id;

    // ========== Step 9: 通知受信と手順書の参照可能性を確認 ==========
    const access_verification_input = {
      notification_id: notification_id,
      document_id: document_id,
      procedure_id: procedure_id,
      exception_id: exception_id,
      user_id: "OPS-001",
      access_verification_timestamp: "2024-02-26T11:30:00Z",
    };

    const access_verification = verifyNotificationAndDocumentAccess(
      access_verification_input
    );

    expect(access_verification).toEqual({
      notification_id: notification_id,
      document_id: document_id,
      procedure_id: procedure_id,
      exception_id: exception_id,
      user_id: "OPS-001",
      notification_received: true,
      notification_read_status: true,
      document_accessible: true,
      procedure_accessible: true,
      exception_pattern_active: true,
      document_access_count: expect.any(Number),
      last_document_access_timestamp: "2024-02-26T11:30:00Z",
      verification_status: "success",
      verification_timestamp: "2024-02-26T11:30:00Z",
    });

    expect(access_verification.notification_received).toBe(true);
    expect(access_verification.document_accessible).toBe(true);
    expect(access_verification.procedure_accessible).toBe(true);
    expect(access_verification.exception_pattern_active).toBe(true);
    expect(access_verification.verification_status).toBe("success");

    // ========== 総合検証: フロー全体の整合性確認 ==========
    // 1. 例外ケースが正しく記録されたこと
    expect(recorded_exception.status).toBe("draft");

    // 2. 手順書が作成され、承認フローに入ったこと
    expect(created_procedure.status).toBe("draft");
    expect(approval_workflow.workflow_status).toBe("pending_approval");

    // 3. 承認が完了し、マスタが更新されたこと
    expect(updated_master.master_status).toBe("active");

    // 4. 請求ロジックに反映されたこと
    expect(billing_verification.reflection_status).toBe("verified");
    expect(billing_verification.exception_applied).toBe(true);

    // 5. 運用チームに通知が届き、ドキュメントにアクセスできることが確認されたこと
    expect(sent_notification.delivery_status).toBe("sent");
    expect(access_verification.verification_status).toBe("success");
  });
});