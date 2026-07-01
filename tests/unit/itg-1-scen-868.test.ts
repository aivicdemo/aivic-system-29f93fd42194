import { describe, test, expect } from "@jest/globals";
import {
  validateContractChangeDiff,
  calculatePostChangeInvoiceAmount,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-868: 契約変更前後の整合性検証機能 - 契約変更前後の条件差分と請求額の妥当性が正確に判定される", () => {
    // === 事前準備: テストデータとして既存の契約情報をシステムに登録 ===
    const pre_change_contract = {
      contract_id: "CTR-2024-001",
      customer_id: "CST-001",
      service_id: "SRV-BASIC",
      monthly_fee: 100000,
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      discount_rate: 0.1,
      base_condition: "appointment_based",
    };

    // === ステップ1: 契約変更前の状態をスナップショットとして記録 ===
    const pre_invoice_amount = 90000; // 100000 * (1 - 0.1)
    const pre_snapshot = {
      contract_id: pre_change_contract.contract_id,
      monthly_fee: pre_change_contract.monthly_fee,
      discount_rate: pre_change_contract.discount_rate,
      calculated_amount: pre_invoice_amount,
      snapshot_date: "2024-06-01T00:00:00Z",
    };

    // === ステップ2: 契約変更内容を入力 ===
    // 金額を100000から120000に変更、割引率を10%から5%に変更
    const contract_change_input = {
      contract_id: "CTR-2024-001",
      change_date: "2024-06-15T10:00:00Z",
      change_type: "fee_and_discount_update",
      new_monthly_fee: 120000,
      new_discount_rate: 0.05,
      change_reason: "service_expansion",
      effective_date: "2024-06-15",
    };

    // === ステップ3: 差分レポート生成 ===
    const diff_report = validateContractChangeDiff({
      pre_change: {
        contract_id: pre_change_contract.contract_id,
        monthly_fee: pre_change_contract.monthly_fee,
        discount_rate: pre_change_contract.discount_rate,
        start_date: pre_change_contract.start_date,
        end_date: pre_change_contract.end_date,
      },
      post_change: {
        contract_id: contract_change_input.contract_id,
        monthly_fee: contract_change_input.new_monthly_fee,
        discount_rate: contract_change_input.new_discount_rate,
        start_date: pre_change_contract.start_date,
        end_date: pre_change_contract.end_date,
      },
      change_date: contract_change_input.change_date,
    });

    // === ステップ4: 差分レポートの検証 ===
    expect(diff_report).toHaveProperty("contract_id", "CTR-2024-001");
    expect(diff_report).toHaveProperty("change_date", "2024-06-15T10:00:00Z");
    expect(diff_report.diff_items).toBeDefined();
    expect(diff_report.diff_items.length).toBe(2);

    // 差分項目1: 月額料金
    const fee_diff = diff_report.diff_items.find(
      (item: any) => item.field_name === "monthly_fee"
    );
    expect(fee_diff).toBeDefined();
    expect(fee_diff.pre_value).toBe(100000);
    expect(fee_diff.post_value).toBe(120000);
    expect(fee_diff.change_amount).toBe(20000);

    // 差分項目2: 割引率
    const discount_diff = diff_report.diff_items.find(
      (item: any) => item.field_name === "discount_rate"
    );
    expect(discount_diff).toBeDefined();
    expect(discount_diff.pre_value).toBe(0.1);
    expect(discount_diff.post_value).toBe(0.05);

    // === ステップ5: 変更後の請求額を自動計算 ===
    // 6月15日から月末までの日割り計算が必要
    // 6月は30日なので、6月15日から6月30日 = 16日間（6月15日を含む）
    // 日数比: 16 / 30 = 0.5333...
    // 変更前の日割部分（6月1日～6月14日 = 14日）: 90000 * (14 / 30) = 42000
    // 変更後の日割部分（6月15日～6月30日 = 16日）: 114000 * (16 / 30) = 60800
    // 6月請求額 = 42000 + 60800 = 102800
    const post_change_invoice_result = calculatePostChangeInvoiceAmount({
      contract_id: "CTR-2024-001",
      pre_monthly_fee: 100000,
      pre_discount_rate: 0.1,
      post_monthly_fee: 120000,
      post_discount_rate: 0.05,
      effective_date: "2024-06-15",
      current_month: "2024-06",
    });

    expect(post_change_invoice_result).toHaveProperty("contract_id");
    expect(post_change_invoice_result.contract_id).toBe("CTR-2024-001");

    // === ステップ6: 請求額計算ロジックの検証 ===
    // 変更前: 100000 * (1 - 0.1) = 90000
    // 変更後: 120000 * (1 - 0.05) = 114000
    // 6月（変更月）の日割計算:
    //   - 前14日: 90000 * (14/30) = 42000
    //   - 後16日: 114000 * (16/30) = 60800
    //   - 合計: 102800
    expect(post_change_invoice_result.pre_change_monthly_net).toBe(90000);
    expect(post_change_invoice_result.post_change_monthly_net).toBe(114000);
    expect(post_change_invoice_result.pro_rata_invoice_amount).toBe(102800);

    // === ステップ7: 日割り計算の精度検証 ===
    expect(post_change_invoice_result.pre_change_daily_net).toBe(3000); // 90000 / 30
    expect(post_change_invoice_result.post_change_daily_net).toBe(3800); // 114000 / 30
    expect(post_change_invoice_result.pre_change_days).toBe(14);
    expect(post_change_invoice_result.post_change_days).toBe(16);

    // === ステップ8: 整合性検証 ===
    // 計算の検証: 42000 + 60800 = 102800
    const manual_calculation =
      post_change_invoice_result.pre_change_daily_net *
        post_change_invoice_result.pre_change_days +
      post_change_invoice_result.post_change_daily_net *
        post_change_invoice_result.post_change_days;
    expect(manual_calculation).toBe(102800);
    expect(post_change_invoice_result.pro_rata_invoice_amount).toBe(
      manual_calculation
    );

    // === ステップ9: 監査ログの記録検証 ===
    expect(post_change_invoice_result).toHaveProperty("audit_log");
    expect(post_change_invoice_result.audit_log).toBeDefined();
    expect(post_change_invoice_result.audit_log).toHaveProperty(
      "change_timestamp"
    );
    expect(post_change_invoice_result.audit_log.change_timestamp).toBe(
      "2024-06-15"
    );
    expect(post_change_invoice_result.audit_log).toHaveProperty(
      "change_details"
    );
    expect(
      post_change_invoice_result.audit_log.change_details
    ).toHaveProperty("monthly_fee_from");
    expect(
      post_change_invoice_result.audit_log.change_details.monthly_fee_from
    ).toBe(100000);
    expect(
      post_change_invoice_result.audit_log.change_details.monthly_fee_to
    ).toBe(120000);
    expect(
      post_change_invoice_result.audit_log.change_details.discount_rate_from
    ).toBe(0.1);
    expect(
      post_change_invoice_result.audit_log.change_details.discount_rate_to
    ).toBe(0.05);

    // === ステップ10: エラーケース検証 ===
    // 無効な契約ID
    expect(() =>
      validateContractChangeDiff({
        pre_change: {
          contract_id: "",
          monthly_fee: 100000,
          discount_rate: 0.1,
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        post_change: {
          contract_id: "",
          monthly_fee: 120000,
          discount_rate: 0.05,
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        change_date: "2024-06-15T10:00:00Z",
      })
    ).toThrow(/契約ID/);

    // 無効な日付
    expect(() =>
      calculatePostChangeInvoiceAmount({
        contract_id: "CTR-2024-001",
        pre_monthly_fee: 100000,
        pre_discount_rate: 0.1,
        post_monthly_fee: 120000,
        post_discount_rate: 0.05,
        effective_date: "invalid-date",
        current_month: "2024-06",
      })
    ).toThrow(/日付/);

    // 無効な金額（負数）
    expect(() =>
      validateContractChangeDiff({
        pre_change: {
          contract_id: "CTR-2024-001",
          monthly_fee: -100000,
          discount_rate: 0.1,
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        post_change: {
          contract_id: "CTR-2024-001",
          monthly_fee: 120000,
          discount_rate: 0.05,
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        change_date: "2024-06-15T10:00:00Z",
      })
    ).toThrow(/金額/);

    // 無効な割引率（1.0以上）
    expect(() =>
      validateContractChangeDiff({
        pre_change: {
          contract_id: "CTR-2024-001",
          monthly_fee: 100000,
          discount_rate: 1.5,
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        post_change: {
          contract_id: "CTR-2024-001",
          monthly_fee: 120000,
          discount_rate: 0.05,
          start_date: "2024-01-01",
          end_date: "2024-12-31",
        },
        change_date: "2024-06-15T10:00:00Z",
      })
    ).toThrow(/割引率/);

    // === 最終検証: 差分報告と請求額調整の整合性 ===
    const total_difference =
      post_change_invoice_result.pro_rata_invoice_amount - pre_invoice_amount;
    expect(total_difference).toBe(12800); // 102800 - 90000
    expect(diff_report.total_amount_adjustment).toBe(12800);
  });
});