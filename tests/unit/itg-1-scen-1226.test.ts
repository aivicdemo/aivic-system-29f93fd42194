import { describe, test, expect } from "@jest/globals";
import {
  recordContractChangeAuditLog,
  calculateContractDifference,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理 - 契約変更監査ログ自動記録", () => {
  // SCEN-1226: [normal] 契約変更監査ログ自動記録機能 - 変更前後の状態が完全に記録され、差分が正確に計算される
  test("should record contract change audit log with complete before/after state and accurate differences", () => {
    // Arrange: 変更前の契約状態（旧値）
    const before_contract_state = {
      contract_id: "CONTRACT-2024-001",
      monthly_amount: 10000,
      contract_period_months: 12,
      service_name: "営業代行サービス",
      customer_id: "CUST-001",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      discount_rate: 0,
      renewal_status: "active",
    };

    // 変更後の契約状態（新値）
    const after_contract_state = {
      contract_id: "CONTRACT-2024-001",
      monthly_amount: 15000,
      contract_period_months: 24,
      service_name: "営業代行サービス",
      customer_id: "CUST-001",
      start_date: "2024-01-01",
      end_date: "2026-01-01",
      discount_rate: 5,
      renewal_status: "active",
    };

    // 変更者メタデータ
    const change_metadata = {
      changed_by_user_id: "USER-001",
      changed_by_user_name: "山田太郎",
      changed_at: "2024-05-15T14:30:00Z",
      change_reason: "顧客要望による契約拡張",
    };

    // Act: 監査ログレコード作成
    const audit_log = recordContractChangeAuditLog({
      contract_id: before_contract_state.contract_id,
      before_state: before_contract_state,
      after_state: after_contract_state,
      changed_by_user_id: change_metadata.changed_by_user_id,
      changed_by_user_name: change_metadata.changed_by_user_name,
      changed_at: change_metadata.changed_at,
      change_reason: change_metadata.change_reason,
    });

    // Assert: 監査ログが作成されたことを検証
    expect(audit_log).toBeDefined();
    expect(audit_log.contract_id).toBe("CONTRACT-2024-001");
    expect(audit_log.audit_log_id).toBeDefined();
    expect(typeof audit_log.audit_log_id).toBe("string");

    // Assert: 変更前の完全な状態が記録されていることを検証
    expect(audit_log.before_state).toEqual({
      contract_id: "CONTRACT-2024-001",
      monthly_amount: 10000,
      contract_period_months: 12,
      service_name: "営業代行サービス",
      customer_id: "CUST-001",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      discount_rate: 0,
      renewal_status: "active",
    });

    // Assert: 変更後の完全な状態が記録されていることを検証
    expect(audit_log.after_state).toEqual({
      contract_id: "CONTRACT-2024-001",
      monthly_amount: 15000,
      contract_period_months: 24,
      service_name: "営業代行サービス",
      customer_id: "CUST-001",
      start_date: "2024-01-01",
      end_date: "2026-01-01",
      discount_rate: 5,
      renewal_status: "active",
    });

    // Act: 差分情報を計算
    const differences = calculateContractDifference({
      before_state: before_contract_state,
      after_state: after_contract_state,
    });

    // Assert: 月額金額の差分が正確に計算されていることを検証
    const amount_diff = differences.find(
      (d: { field_name: string }) => d.field_name === "monthly_amount"
    );
    expect(amount_diff).toBeDefined();
    expect(amount_diff.before_value).toBe(10000);
    expect(amount_diff.after_value).toBe(15000);
    expect(amount_diff.difference_value).toBe(5000);
    expect(amount_diff.change_type).toBe("numeric_increase");

    // Assert: 契約期間の差分が正確に計算されていることを検証
    const period_diff = differences.find(
      (d: { field_name: string }) => d.field_name === "contract_period_months"
    );
    expect(period_diff).toBeDefined();
    expect(period_diff.before_value).toBe(12);
    expect(period_diff.after_value).toBe(24);
    expect(period_diff.difference_value).toBe(12);
    expect(period_diff.change_type).toBe("numeric_increase");

    // Assert: 終了日の差分が正確に計算されていることを検証
    const end_date_diff = differences.find(
      (d: { field_name: string }) => d.field_name === "end_date"
    );
    expect(end_date_diff).toBeDefined();
    expect(end_date_diff.before_value).toBe("2024-12-31");
    expect(end_date_diff.after_value).toBe("2026-01-01");
    expect(end_date_diff.change_type).toBe("date_changed");

    // Assert: 割引率の差分が正確に計算されていることを検証
    const discount_diff = differences.find(
      (d: { field_name: string }) => d.field_name === "discount_rate"
    );
    expect(discount_diff).toBeDefined();
    expect(discount_diff.before_value).toBe(0);
    expect(discount_diff.after_value).toBe(5);
    expect(discount_diff.difference_value).toBe(5);
    expect(discount_diff.change_type).toBe("numeric_increase");

    // Assert: 変更されていないフィールド（service_name, renewal_status）は差分に含まれないことを検証
    const unchanged_fields = differences.filter(
      (d: { field_name: string }) =>
        d.field_name === "service_name" || d.field_name === "renewal_status"
    );
    expect(unchanged_fields.length).toBe(0);

    // Assert: 差分の総数が正確であることを検証（4項目が変更）
    expect(differences.length).toBe(4);

    // Assert: メタデータが正確に記録されていることを検証
    expect(audit_log.changed_by_user_id).toBe("USER-001");
    expect(audit_log.changed_by_user_name).toBe("山田太郎");
    expect(audit_log.changed_at).toBe("2024-05-15T14:30:00Z");
    expect(audit_log.change_reason).toBe("顧客要望による契約拡張");

    // Assert: 監査ログレコードに差分情報が含まれていることを検証
    expect(audit_log.differences).toEqual(differences);

    // Assert: 監査ログレコードの構造が完全であることを検証
    expect(audit_log.audit_log_id).toBeDefined();
    expect(audit_log.contract_id).toBe("CONTRACT-2024-001");
    expect(audit_log.before_state).toBeDefined();
    expect(audit_log.after_state).toBeDefined();
    expect(audit_log.differences).toBeDefined();
    expect(audit_log.differences.length).toBeGreaterThan(0);
    expect(audit_log.changed_by_user_id).toBe("USER-001");
    expect(audit_log.changed_at).toBe("2024-05-15T14:30:00Z");
    expect(audit_log.created_at).toBeDefined();

    // Assert: created_at が記録時点で設定されていることを検証
    const audit_created_at = new Date(audit_log.created_at as string);
    expect(audit_created_at.getTime()).toBeGreaterThan(0);
  });
});