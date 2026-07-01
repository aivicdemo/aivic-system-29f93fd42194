import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateUserAccessToQualityManagement } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("SCEN-800: 認証情報は有効だが必要な権限がないユーザーのアクセスが拒否される", () => {
    // 認証情報は有効だが権限がないユーザーのテストデータを準備
    const user_id = "USR-12345";
    const user_name = "test_operator";
    const is_authenticated = true;
    const required_permissions = ["quality_management_access"];
    const user_permissions = ["basic_view"];
    const access_requested_feature = "quality_management";
    const timestamp_access_attempt = new Date("2024-01-15T10:30:00Z");

    // validateUserAccessToQualityManagement を呼び出す
    const access_result = validateUserAccessToQualityManagement({
      user_id: user_id,
      user_name: user_name,
      is_authenticated: is_authenticated,
      required_permissions: required_permissions,
      user_permissions: user_permissions,
      access_requested_feature: access_requested_feature,
      timestamp_access_attempt: timestamp_access_attempt,
    });

    // アクセスが拒否されていることを確認
    expect(access_result.access_granted).toBe(false);

    // 権限不足を示すエラーメッセージが返却されていることを確認
    expect(access_result.error_code).toBe("403");
    expect(access_result.error_message).toMatch(/権限/);

    // アクセス拒否の理由が権限不足であることを確認
    expect(access_result.denial_reason).toBe("insufficient_permissions");

    // セキュリティログが記録されていることを確認
    expect(access_result.security_log_recorded).toBe(true);

    // ログのタイムスタンプが正確に記録されていることを確認
    expect(access_result.log_timestamp).toEqual(
      new Date("2024-01-15T10:30:00Z")
    );

    // ログに記録されるユーザー情報が正確であることを確認
    expect(access_result.logged_user_id).toBe(user_id);
    expect(access_result.logged_feature_name).toBe(access_requested_feature);

    // セキュリティイベント種別が「アクセス拒否」であることを確認
    expect(access_result.security_event_type).toBe("access_denied");

    // 対象機能へのアクセス可否が false であることを確認
    expect(access_result.feature_accessible).toBe(false);
  });

  test("SCEN-800: 認証情報が無効な場合はアクセスが拒否される", () => {
    const user_id = "USR-99999";
    const user_name = "invalid_user";
    const is_authenticated = false;
    const required_permissions = ["quality_management_access"];
    const user_permissions = [];
    const access_requested_feature = "quality_management";
    const timestamp_access_attempt = new Date("2024-01-15T10:35:00Z");

    const access_result = validateUserAccessToQualityManagement({
      user_id: user_id,
      user_name: user_name,
      is_authenticated: is_authenticated,
      required_permissions: required_permissions,
      user_permissions: user_permissions,
      access_requested_feature: access_requested_feature,
      timestamp_access_attempt: timestamp_access_attempt,
    });

    expect(access_result.access_granted).toBe(false);
    expect(access_result.error_code).toBe("401");
    expect(access_result.error_message).toMatch(/認証/);
    expect(access_result.denial_reason).toBe("authentication_failed");
    expect(access_result.security_log_recorded).toBe(true);
    expect(access_result.security_event_type).toBe("authentication_failure");
  });

  test("SCEN-800: 必要な権限を持つ認証済みユーザーのアクセスは許可される", () => {
    const user_id = "USR-54321";
    const user_name = "authorized_operator";
    const is_authenticated = true;
    const required_permissions = ["quality_management_access"];
    const user_permissions = ["quality_management_access", "report_view"];
    const access_requested_feature = "quality_management";
    const timestamp_access_attempt = new Date("2024-01-15T10:40:00Z");

    const access_result = validateUserAccessToQualityManagement({
      user_id: user_id,
      user_name: user_name,
      is_authenticated: is_authenticated,
      required_permissions: required_permissions,
      user_permissions: user_permissions,
      access_requested_feature: access_requested_feature,
      timestamp_access_attempt: timestamp_access_attempt,
    });

    expect(access_result.access_granted).toBe(true);
    expect(access_result.error_code).toBe(null);
    expect(access_result.feature_accessible).toBe(true);
    expect(access_result.security_log_recorded).toBe(true);
    expect(access_result.security_event_type).toBe("access_granted");
  });

  test("SCEN-800: 複数の権限要件のうち一部しか満たさないユーザーのアクセスが拒否される", () => {
    const user_id = "USR-67890";
    const user_name = "partial_permission_user";
    const is_authenticated = true;
    const required_permissions = [
      "quality_management_access",
      "billing_data_access",
    ];
    const user_permissions = ["quality_management_access"];
    const access_requested_feature = "quality_management";
    const timestamp_access_attempt = new Date("2024-01-15T10:45:00Z");

    const access_result = validateUserAccessToQualityManagement({
      user_id: user_id,
      user_name: user_name,
      is_authenticated: is_authenticated,
      required_permissions: required_permissions,
      user_permissions: user_permissions,
      access_requested_feature: access_requested_feature,
      timestamp_access_attempt: timestamp_access_attempt,
    });

    expect(access_result.access_granted).toBe(false);
    expect(access_result.error_code).toBe("403");
    expect(access_result.denial_reason).toBe("insufficient_permissions");
    expect(access_result.missing_permissions).toContain("billing_data_access");
    expect(access_result.security_log_recorded).toBe(true);
  });
});