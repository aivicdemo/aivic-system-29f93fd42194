import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  updateContractAndBillingDataOnCustomerAgreement,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 契約・請求データ更新", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1250: [normal] 契約・請求データ更新機能 - 顧客合意確認受領・確認時に契約・請求データが最新状態に更新される
  test("顧客合意確認受領・確認後、契約・請求データが最新状態に更新される", () => {
    // ===== 前提条件: 顧客合意確認前のデータベース状態をスナップショット =====
    const customer_id = "CUST-001";
    const contract_id = "CONTRACT-001";
    const billing_id = "BILLING-001";

    // スナップショット時点の契約・請求データ
    const snapshot_contract_start_date = "2024-01-01";
    const snapshot_contract_end_date = "2024-12-31";
    const snapshot_contract_amount = 500000;
    const snapshot_billing_date = "2024-02-01";
    const snapshot_billing_amount = 50000;
    const snapshot_payment_deadline = "2024-02-15";
    const snapshot_updated_at = "2024-01-15T09:00:00Z";

    // 顧客合意確認後に反映される新しい契約・請求条件
    const new_contract_start_date = "2024-01-01";
    const new_contract_end_date = "2025-12-31"; // 契約期間を2025年まで延長
    const new_contract_amount = 600000; // 契約金額を増加
    const new_billing_date = "2024-02-05"; // 請求日変更
    const new_billing_amount = 60000; // 請求額増加
    const new_payment_deadline = "2024-02-20"; // 支払期限変更
    const expected_updated_at = "2024-01-15T14:30:00Z"; // 確認処理完了時刻

    // ===== トリガー: 顧客合意確認フォームに必要情報を入力して確認受領・確認を実行 =====
    const confirmation_input = {
      customer_id: customer_id,
      contract_id: contract_id,
      billing_id: billing_id,
      agreement_status: "confirmed", // 確認受領・確認完了状態
      new_contract_end_date: new_contract_end_date,
      new_contract_amount: new_contract_amount,
      new_billing_date: new_billing_date,
      new_billing_amount: new_billing_amount,
      new_payment_deadline: new_payment_deadline,
      confirmation_timestamp: expected_updated_at,
      confirmed_by: "rep-001", // 代表兼営業オペレーター
    };

    // ===== 実行: 契約・請求データ更新関数を呼び出し =====
    const result = updateContractAndBillingDataOnCustomerAgreement(
      confirmation_input
    );

    // ===== 検証: 期待結果に対する assertion =====
    // 更新後の契約データが正確に反映されていることを確認
    expect(result.contract_updated).toBe(true);
    expect(result.contract.contract_id).toBe(contract_id);
    expect(result.contract.contract_end_date).toBe(new_contract_end_date); // 契約期間が2025年に更新
    expect(result.contract.contract_amount).toBe(new_contract_amount); // 契約金額が600000に更新
    expect(result.contract.updated_at).toBe(expected_updated_at); // 更新日時が正確に記録

    // 更新後の請求データが正確に反映されていることを確認
    expect(result.billing_updated).toBe(true);
    expect(result.billing.billing_id).toBe(billing_id);
    expect(result.billing.billing_date).toBe(new_billing_date); // 請求日が2024-02-05に変更
    expect(result.billing.billing_amount).toBe(new_billing_amount); // 請求額が60000に更新
    expect(result.billing.payment_deadline).toBe(new_payment_deadline); // 支払期限が2024-02-20に変更
    expect(result.billing.updated_at).toBe(expected_updated_at); // 更新日時が正確に記録

    // スナップショットからの差分が正確に記録されていることを確認
    expect(result.changes_recorded).toBe(true);
    expect(result.changes.contract_end_date_changed).toBe(true);
    expect(result.changes.contract_amount_changed).toBe(true);
    expect(result.changes.billing_date_changed).toBe(true);
    expect(result.changes.billing_amount_changed).toBe(true);
    expect(result.changes.payment_deadline_changed).toBe(true);

    // 管理画面に反映される更新内容が正確であることを確認
    expect(result.admin_display).toEqual({
      contract_id: contract_id,
      customer_id: customer_id,
      update_status: "completed", // 更新完了
      updated_at: expected_updated_at,
      updated_by: "rep-001",
      previous_contract_end_date: snapshot_contract_end_date,
      new_contract_end_date: new_contract_end_date,
      previous_contract_amount: snapshot_contract_amount,
      new_contract_amount: new_contract_amount,
      previous_billing_date: snapshot_billing_date,
      new_billing_date: new_billing_date,
      previous_billing_amount: snapshot_billing_amount,
      new_billing_amount: new_billing_amount,
      previous_payment_deadline: snapshot_payment_deadline,
      new_payment_deadline: new_payment_deadline,
    });

    // システムの整合性が保たれていることを確認（更新前後の全データが記録）
    expect(result.system_consistency_verified).toBe(true);
    expect(result.audit_log_created).toBe(true);
    expect(result.audit_log.action).toBe("contract_billing_update_on_agreement");
    expect(result.audit_log.contract_id).toBe(contract_id);
    expect(result.audit_log.customer_id).toBe(customer_id);
    expect(result.audit_log.timestamp).toBe(expected_updated_at);
    expect(result.audit_log.status).toBe("success");
  });
});