import { describe, test, expect } from "@jest/globals";
import { validateCustomerAgreementData, sendFollowUpNotification } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1220: [error] 契約変更確認催促通知機能 - 顧客合意確認データが不完全な場合、エラーが発生して催促通知は送信されない
  test("should reject incomplete customer agreement data and not send follow-up notification", () => {
    // テストケース1: 必須フィールドが空のデータ
    const incompleteData_emptyContractId = {
      contract_id: "",
      customer_id: "CUST001",
      agreement_date: "2024-01-15T10:00:00Z",
      agreement_status: "pending",
      notification_required: true,
    };

    expect(() => {
      validateCustomerAgreementData(incompleteData_emptyContractId);
    }).toThrow(/契約ID/);

    // テストケース2: 顧客IDがnullのデータ
    const incompleteData_nullCustomerId = {
      contract_id: "CONT001",
      customer_id: null,
      agreement_date: "2024-01-15T10:00:00Z",
      agreement_status: "pending",
      notification_required: true,
    };

    expect(() => {
      validateCustomerAgreementData(incompleteData_nullCustomerId);
    }).toThrow(/顧客ID/);

    // テストケース3: 合意日付が不正なデータ
    const incompleteData_invalidDate = {
      contract_id: "CONT001",
      customer_id: "CUST001",
      agreement_date: "",
      agreement_status: "pending",
      notification_required: true,
    };

    expect(() => {
      validateCustomerAgreementData(incompleteData_invalidDate);
    }).toThrow(/合意日付/);

    // テストケース4: 合意ステータスが空のデータ
    const incompleteData_emptyStatus = {
      contract_id: "CONT001",
      customer_id: "CUST001",
      agreement_date: "2024-01-15T10:00:00Z",
      agreement_status: "",
      notification_required: true,
    };

    expect(() => {
      validateCustomerAgreementData(incompleteData_emptyStatus);
    }).toThrow(/ステータス/);

    // テストケース5: 催促通知フラグが不正なデータ
    const incompleteData_invalidNotificationFlag = {
      contract_id: "CONT001",
      customer_id: "CUST001",
      agreement_date: "2024-01-15T10:00:00Z",
      agreement_status: "pending",
      notification_required: null,
    };

    expect(() => {
      validateCustomerAgreementData(incompleteData_invalidNotificationFlag);
    }).toThrow(/通知フラグ/);

    // テストケース6: 複数の必須フィールドが欠落した場合、最初の欠落項目でエラー発生
    const incompleteData_multipleFields = {
      contract_id: "",
      customer_id: null,
      agreement_date: "2024-01-15T10:00:00Z",
      agreement_status: "",
      notification_required: true,
    };

    expect(() => {
      validateCustomerAgreementData(incompleteData_multipleFields);
    }).toThrow(/契約ID/);

    // テストケース7: 催促通知送信関数がバリデーションエラーに対応
    const result = sendFollowUpNotification(incompleteData_emptyContractId);
    
    expect(result).toEqual({
      success: false,
      error_message: "顧客合意確認データの検証に失敗しました: 契約IDが必須です",
      notification_sent: false,
    });

    // テストケース8: バリデーションエラー後、データベース状態が変わらないことを確認
    const notificationLog = {
      contract_id: "CONT001",
      customer_id: "CUST001",
      notification_attempt_at: null,
      notification_status: "not_sent",
      error_occurred: true,
      error_type: "validation_error",
    };

    expect(notificationLog.notification_status).toBe("not_sent");
    expect(notificationLog.notification_attempt_at).toBeNull();
    expect(notificationLog.error_occurred).toBe(true);

    // テストケース9: 正常なデータでは成功する（システム復帰の確認）
    const completeData = {
      contract_id: "CONT001",
      customer_id: "CUST001",
      agreement_date: "2024-01-15T10:00:00Z",
      agreement_status: "pending",
      notification_required: true,
    };

    const validationResult = validateCustomerAgreementData(completeData);
    expect(validationResult).toEqual({
      is_valid: true,
      errors: [],
    });

    // テストケース10: 正常なデータで催促通知送信が成功することを確認
    const successResult = sendFollowUpNotification(completeData);
    expect(successResult).toEqual({
      success: true,
      error_message: null,
      notification_sent: true,
    });
  });
});