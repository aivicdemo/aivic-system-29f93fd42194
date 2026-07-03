import { validateSalesDataIntegrity } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性自動検証", () => {
  test("SCEN-1050: 営業データに矛盾する値が含まれている場合、矛盾内容が検出・通知される", () => {
    // テストデータ: 契約金額と請求金額が不一致
    const sales_data_with_contradiction = {
      sales_data_id: "SD-2024-001",
      customer_id: "CUST-001",
      sales_date: "2024-01-15",
      contract_amount: 1000000,
      billing_amount: 1200000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_type: "advisory",
      created_at: "2024-01-15T11:00:00Z",
      created_by: "sales_user_001",
    };

    const result = validateSalesDataIntegrity(sales_data_with_contradiction);

    // (1) 矛盾内容が具体的に特定・ログされる
    expect(result.validation_status).toBe("failed");
    expect(result.contradictions).toHaveLength(1);
    expect(result.contradictions[0]).toEqual({
      field_1: "contract_amount",
      field_2: "billing_amount",
      value_1: 1000000,
      value_2: 1200000,
      contradiction_type: "amount_mismatch",
      detail: "契約金額1000000と請求金額1200000の不一致",
    });

    // (2) エラーメッセージが明確に表示される
    expect(result.error_message).toMatch(/契約金額/);
    expect(result.error_message).toMatch(/請求金額/);
    expect(result.error_message).toMatch(/不一致/);

    // (3) 関連する営業担当者・管理者に対して矛盾内容の通知が送信される
    expect(result.notifications).toHaveLength(2);
    expect(result.notifications[0].recipient_type).toBe("sales_user");
    expect(result.notifications[0].recipient_id).toBe("sales_user_001");
    expect(result.notifications[0].notification_channel).toBe("email");
    expect(result.notifications[0].notification_content).toMatch(/矛盾/);

    expect(result.notifications[1].recipient_type).toBe("admin");
    expect(result.notifications[1].notification_channel).toMatch(/(system_alert|dashboard)/);

    // (4) 不正なデータが請求処理に進まないようブロックされる
    expect(result.billing_process_blocked).toBe(true);
    expect(result.block_reason).toBe("data_contradiction_detected");
  });

  test("SCEN-1050: 契約期間が逆順の矛盾データの場合、矛盾が検出・ログされる", () => {
    const sales_data_with_date_contradiction = {
      sales_data_id: "SD-2024-002",
      customer_id: "CUST-002",
      sales_date: "2024-01-15",
      contract_amount: 1000000,
      billing_amount: 1000000,
      contract_start_date: "2024-12-31",
      contract_end_date: "2024-01-01",
      service_type: "advisory",
      created_at: "2024-01-15T11:00:00Z",
      created_by: "sales_user_002",
    };

    const result = validateSalesDataIntegrity(sales_data_with_date_contradiction);

    // 契約期間逆順の矛盾を検出
    expect(result.validation_status).toBe("failed");
    expect(result.contradictions).toHaveLength(1);
    expect(result.contradictions[0]).toEqual({
      field_1: "contract_start_date",
      field_2: "contract_end_date",
      value_1: "2024-12-31",
      value_2: "2024-01-01",
      contradiction_type: "date_order_invalid",
      detail: "契約開始日2024-12-31が契約終了日2024-01-01より後",
    });

    expect(result.error_message).toMatch(/契約開始日/);
    expect(result.error_message).toMatch(/契約終了日/);
    expect(result.error_message).toMatch(/逆順/);

    expect(result.billing_process_blocked).toBe(true);
    expect(result.block_reason).toBe("data_contradiction_detected");
  });

  test("SCEN-1050: 矛盾のない正常なデータの場合、検証成功になり通知は送信されない", () => {
    const sales_data_valid = {
      sales_data_id: "SD-2024-003",
      customer_id: "CUST-003",
      sales_date: "2024-01-15",
      contract_amount: 1000000,
      billing_amount: 1000000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-12-31",
      service_type: "advisory",
      created_at: "2024-01-15T11:00:00Z",
      created_by: "sales_user_003",
    };

    const result = validateSalesDataIntegrity(sales_data_valid);

    // (1) 検証ステータスが成功
    expect(result.validation_status).toBe("passed");

    // (2) 矛盾が検出されない
    expect(result.contradictions).toHaveLength(0);

    // (3) エラーメッセージは空
    expect(result.error_message).toBe("");

    // (4) 通知は送信されない
    expect(result.notifications).toHaveLength(0);

    // (5) 請求処理がブロックされない
    expect(result.billing_process_blocked).toBe(false);
  });

  test("SCEN-1050: 複数の矛盾がある場合、すべての矛盾が検出・ログされる", () => {
    const sales_data_multiple_contradictions = {
      sales_data_id: "SD-2024-004",
      customer_id: "CUST-004",
      sales_date: "2024-01-15",
      contract_amount: 1000000,
      billing_amount: 1200000,
      contract_start_date: "2024-12-31",
      contract_end_date: "2024-01-01",
      service_type: "advisory",
      created_at: "2024-01-15T11:00:00Z",
      created_by: "sales_user_004",
    };

    const result = validateSalesDataIntegrity(sales_data_multiple_contradictions);

    // すべての矛盾が検出される
    expect(result.validation_status).toBe("failed");
    expect(result.contradictions.length).toBeGreaterThanOrEqual(2);

    // 金額不一致が含まれる
    const amount_contradiction = result.contradictions.find(
      (c) => c.contradiction_type === "amount_mismatch"
    );
    expect(amount_contradiction).toBeDefined();
    expect(amount_contradiction?.detail).toMatch(/契約金額/);

    // 日付順序不正が含まれる
    const date_contradiction = result.contradictions.find(
      (c) => c.contradiction_type === "date_order_invalid"
    );
    expect(date_contradiction).toBeDefined();
    expect(date_contradiction?.detail).toMatch(/契約開始日/);

    // 請求処理がブロックされる
    expect(result.billing_process_blocked).toBe(true);
  });

  test("SCEN-1050: 矛盾が検出された場合、notify 関数が呼ばれてエラー通知が送信される", () => {
    const sales_data_contradiction = {
      sales_data_id: "SD-2024-005",
      customer_id: "CUST-005",
      sales_date: "2024-01-15",
      contract_amount: 500000,
      billing_amount: 750000,
      contract_start_date: "2024-01-01",
      contract_end_date: "2024-06-30",
      service_type: "consulting",
      created_at: "2024-01-15T11:00:00Z",
      created_by: "sales_user_005",
    };

    const result = validateSalesDataIntegrity(sales_data_contradiction);

    // 通知オブジェクトが構造化されている
    expect(result.notifications).toHaveLength(2);

    // 営業ユーザーへのメール通知
    const email_notification = result.notifications.find(
      (n) => n.notification_channel === "email"
    );
    expect(email_notification).toBeDefined();
    expect(email_notification?.recipient_type).toBe("sales_user");
    expect(email_notification?.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);

    // 管理者へのシステム通知
    const admin_notification = result.notifications.find(
      (n) => n.recipient_type === "admin"
    );
    expect(admin_notification).toBeDefined();
    expect(admin_notification?.priority).toMatch(/(high|urgent)/);
  });

  test("SCEN-1050: 矛盾検出時に呼ばれる blockBillingProcess が正しく実行されることを検証", () => {
    const sales_data_contradiction = {
      sales_data_id: "SD-2024-006",
      customer_id: "CUST-006",
      sales_date: "2024-01-20",
      contract_amount: 2000000,
      billing_amount: 2500000,
      contract_start_date: "2024-02-01",
      contract_end_date: "2024-08-31",
      service_type: "advisory",
      created_at: "2024-01-20T14:30:00Z",
      created_by: "sales_user_006",
    };

    const result = validateSalesDataIntegrity(sales_data_contradiction);

    // ブロック情報が記録される
    expect(result.billing_process_blocked).toBe(true);
    expect(result.block_reason).toBe("data_contradiction_detected");
    expect(result.blocked_at).toMatch(/\d{4}-\d{2}-\d{2}T/);

    // ブロック対象の請求処理 ID が記録される (該当フィールドがあれば)
    expect(result.sales_data_id).toBe("SD-2024-006");

    // 矛盾の詳細がログされている
    expect(result.contradictions.length).toBeGreaterThan(0);
    result.contradictions.forEach((contradiction) => {
      expect(contradiction.detail).toBeDefined();
      expect(contradiction.detail.length).toBeGreaterThan(0);
    });
  });
});