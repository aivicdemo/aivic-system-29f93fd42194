import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  recordPortalResponse,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質管理・請求自動化システム - 対応結果のポータル記録・監査ログ機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-821: 対応内容が空文字列で送信された場合にバリデーションエラーが発生する
  test("対応内容が空文字列または未入力の場合、バリデーションエラーと監査ログが記録される", () => {
    const user_id = "usr_20240115_001";
    const contract_id = "ct_cust_abc_001";
    const response_content = "";
    const timestamp = new Date("2024-01-15T10:30:00Z");
    const source_ip = "192.168.1.100";

    const input = {
      user_id,
      contract_id,
      response_content,
      timestamp,
      source_ip,
    };

    const result = recordPortalResponse(input);

    expect(result.success).toBe(false);
    expect(result.error_code).toBe("VALIDATION_ERROR");
    expect(result.error_message).toMatch(/対応内容/);

    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.event_type).toBe("VALIDATION_FAILURE");
    expect(result.audit_log.user_id).toBe(user_id);
    expect(result.audit_log.contract_id).toBe(contract_id);
    expect(result.audit_log.timestamp).toEqual(timestamp);
    expect(result.audit_log.source_ip).toBe(source_ip);
    expect(result.audit_log.error_detail).toMatch(/対応内容/);
  });

  // 対応内容が正常な値で送信された場合、記録成功と監査ログが記録される
  test("対応内容が正常な値で送信された場合、ポータルに記録され監査ログが成功イベントとして記録される", () => {
    const user_id = "usr_20240115_002";
    const contract_id = "ct_cust_abc_002";
    const response_content = "契約内容の確認を完了しました。修正が必要な部分について別途連絡させていただきます。";
    const timestamp = new Date("2024-01-15T11:45:00Z");
    const source_ip = "192.168.1.101";

    const input = {
      user_id,
      contract_id,
      response_content,
      timestamp,
      source_ip,
    };

    const result = recordPortalResponse(input);

    expect(result.success).toBe(true);
    expect(result.error_code).toBeUndefined();
    expect(result.error_message).toBeUndefined();

    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.event_type).toBe("RESPONSE_RECORDED");
    expect(result.audit_log.user_id).toBe(user_id);
    expect(result.audit_log.contract_id).toBe(contract_id);
    expect(result.audit_log.timestamp).toEqual(timestamp);
    expect(result.audit_log.source_ip).toBe(source_ip);
    expect(result.recorded_response_id).toBeDefined();
    expect(result.recorded_response_id).toMatch(/^resp_/);
  });

  // 対応内容が空白のみ（スペース・タブのみ）で送信された場合、バリデーションエラーが発生する
  test("対応内容が空白のみで送信された場合、バリデーションエラーが発生する", () => {
    const user_id = "usr_20240115_003";
    const contract_id = "ct_cust_abc_003";
    const response_content = "   \t  ";
    const timestamp = new Date("2024-01-15T12:00:00Z");
    const source_ip = "192.168.1.102";

    const input = {
      user_id,
      contract_id,
      response_content,
      timestamp,
      source_ip,
    };

    const result = recordPortalResponse(input);

    expect(result.success).toBe(false);
    expect(result.error_code).toBe("VALIDATION_ERROR");
    expect(result.error_message).toMatch(/対応内容/);
    expect(result.audit_log.event_type).toBe("VALIDATION_FAILURE");
  });

  // user_id が空文字列で送信された場合、バリデーションエラーが発生する
  test("user_id が空文字列で送信された場合、バリデーションエラーが発生する", () => {
    const user_id = "";
    const contract_id = "ct_cust_abc_004";
    const response_content = "対応内容テスト";
    const timestamp = new Date("2024-01-15T13:00:00Z");
    const source_ip = "192.168.1.103";

    const input = {
      user_id,
      contract_id,
      response_content,
      timestamp,
      source_ip,
    };

    const result = recordPortalResponse(input);

    expect(result.success).toBe(false);
    expect(result.error_code).toBe("VALIDATION_ERROR");
    expect(result.error_message).toMatch(/ユーザーID|user_id/);
  });

  // contract_id が空文字列で送信された場合、バリデーションエラーが発生する
  test("contract_id が空文字列で送信された場合、バリデーションエラーが発生する", () => {
    const user_id = "usr_20240115_005";
    const contract_id = "";
    const response_content = "対応内容テスト";
    const timestamp = new Date("2024-01-15T14:00:00Z");
    const source_ip = "192.168.1.104";

    const input = {
      user_id,
      contract_id,
      response_content,
      timestamp,
      source_ip,
    };

    const result = recordPortalResponse(input);

    expect(result.success).toBe(false);
    expect(result.error_code).toBe("VALIDATION_ERROR");
    expect(result.error_message).toMatch(/契約ID|contract_id/);
  });

  // 監査ログに正確なタイムスタンプが記録される
  test("監査ログには正確なタイムスタンプ、ユーザーID、ソースIPが記録される", () => {
    const user_id = "usr_20240115_006";
    const contract_id = "ct_cust_abc_006";
    const response_content = "";
    const timestamp = new Date("2024-01-15T15:30:45Z");
    const source_ip = "203.0.113.42";

    const input = {
      user_id,
      contract_id,
      response_content,
      timestamp,
      source_ip,
    };

    const result = recordPortalResponse(input);

    expect(result.audit_log.timestamp).toEqual(timestamp);
    expect(result.audit_log.timestamp.toISOString()).toBe(
      "2024-01-15T15:30:45.000Z"
    );
    expect(result.audit_log.user_id).toBe(user_id);
    expect(result.audit_log.source_ip).toBe(source_ip);
  });
});