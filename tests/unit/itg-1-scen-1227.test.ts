import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  generateCustomerChangeNotification,
  type GenerateCustomerChangeNotificationInput,
  type GenerateCustomerChangeNotificationOutput,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1227
  test("顧客企業への変更通知が準備される際、通知内容に変更内容・変更日時・変更者が正確に含まれる", () => {
    // テストデータ: 既存の顧客企業データ（変更前）
    const existing_customer_data = {
      company_id: "CUST-20240115-001",
      company_name_before: "旧会社名株式会社",
      address_before: "東京都渋谷区1-1-1",
      phone_before: "03-1234-5678",
    };

    // 変更後のデータ
    const updated_customer_data = {
      company_name_after: "新会社名株式会社",
      address_after: "東京都渋谷区2-2-2",
      phone_after: "03-8765-4321",
    };

    // テスト実行者のユーザー情報
    const executor_info = {
      user_id: "USR-20240115-001",
      user_name: "営業代理人太郎",
    };

    // 変更日時（固定値）
    const change_timestamp = new Date("2024-01-15T10:30:00Z");

    // 入力データの構築
    const input: GenerateCustomerChangeNotificationInput = {
      company_id: existing_customer_data.company_id,
      customer_name_before: existing_customer_data.company_name_before,
      customer_name_after: updated_customer_data.company_name_after,
      address_before: existing_customer_data.address_before,
      address_after: updated_customer_data.address_after,
      phone_before: existing_customer_data.phone_before,
      phone_after: updated_customer_data.phone_after,
      changed_by_user_id: executor_info.user_id,
      changed_by_user_name: executor_info.user_name,
      change_timestamp: change_timestamp,
    };

    // 関数呼び出し
    const result: GenerateCustomerChangeNotificationOutput =
      generateCustomerChangeNotification(input);

    // アサーション1: 通知オブジェクトが正しく生成されている
    expect(result).toBeDefined();
    expect(result.notification_id).toBeDefined();

    // アサーション2: 変更内容が正確に含まれている（会社名）
    expect(result.changes).toContainEqual({
      field_name: "customer_name",
      value_before: existing_customer_data.company_name_before,
      value_after: updated_customer_data.company_name_after,
    });

    // アサーション3: 変更内容が正確に含まれている（住所）
    expect(result.changes).toContainEqual({
      field_name: "address",
      value_before: existing_customer_data.address_before,
      value_after: updated_customer_data.address_after,
    });

    // アサーション4: 変更内容が正確に含まれている（電話番号）
    expect(result.changes).toContainEqual({
      field_name: "phone",
      value_before: existing_customer_data.phone_before,
      value_after: updated_customer_data.phone_after,
    });

    // アサーション5: 変更日時がタイムスタンプとして正確に含まれている
    expect(result.change_timestamp).toBe(change_timestamp.toISOString());

    // アサーション6: 変更者のユーザーIDが正確に含まれている
    expect(result.changed_by_user_id).toBe(executor_info.user_id);

    // アサーション7: 変更者のユーザー名が正確に含まれている
    expect(result.changed_by_user_name).toBe(executor_info.user_name);

    // アサーション8: 複数項目変更時にすべての変更内容が漏れなく反映されている
    expect(result.changes.length).toBe(3);

    // アサーション9: 対象顧客IDが通知に含まれている
    expect(result.company_id).toBe(existing_customer_data.company_id);

    // アサーション10: 通知タイプが設定されている
    expect(result.notification_type).toBe("customer_data_changed");

    // アサーション11: 通知ステータスが「準備完了」状態である
    expect(result.notification_status).toBe("prepared");
  });
});