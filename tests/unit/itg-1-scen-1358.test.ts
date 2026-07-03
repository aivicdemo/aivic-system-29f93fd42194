import { describe, test, expect } from "@jest/globals";
import { validateLogicCompatibility } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 営業システムとの連携互Compatibility検証", () => {
  // SCEN-1358: [error] 営業システムとの連携互Compatibility検証機能
  test("営業システムの計算ロジックがCRMベンダー仕様と矛盾する場合、連携不可と判定される", () => {
    // 営業システムの計算ロジック定義（矛盾するケース）
    const salesSystemLogic = {
      itemId: "item-001",
      itemName: "成約数",
      unit: "件",
      dataType: "integer",
      calculationLogic: {
        formula: "tax_rate = 0.10; discount_order = ['tax_first', 'discount_after']; amount = (base_price * (1 - discount_rate)) * (1 + tax_rate);",
        taxRate: 0.10,
        discountApplicationOrder: ["tax_first", "discount_after"],
        minInvoiceAmount: 1000,
      },
    };

    // CRMベンダーの標準計算ロジック（互いに矛盾）
    const crmVendorLogic = {
      itemId: "item-001",
      itemName: "成約数",
      unit: "件",
      dataType: "integer",
      calculationLogic: {
        formula: "tax_rate = 0.08; discount_order = ['discount_first', 'tax_after']; amount = (base_price * (1 - discount_rate)) * (1 + tax_rate);",
        taxRate: 0.08,
        discountApplicationOrder: ["discount_first", "tax_after"],
        minInvoiceAmount: 500,
      },
    };

    // 検証実行
    const result = validateLogicCompatibility({
      salesSystemLogic: salesSystemLogic,
      crmVendorLogic: crmVendorLogic,
    });

    // 期待結果: 連携互Compatibility検証が矛盾を検出
    expect(result.isCompatible).toBe(false);
    expect(result.compatibilityStatus).toBe("連携不可");

    // エラーメッセージが矛盾内容を含む
    expect(result.errorMessage).toMatch(/計算ロジック/);
    expect(result.errorMessage).toMatch(/矛盾/);

    // 矛盾箇所の詳細が記録される
    expect(result.incompatibilities).toHaveLength(3);
    expect(result.incompatibilities).toContainEqual(
      expect.objectContaining({
        field: "taxRate",
        salesSystemValue: 0.10,
        crmVendorValue: 0.08,
        conflictType: "value_mismatch",
      })
    );
    expect(result.incompatibilities).toContainEqual(
      expect.objectContaining({
        field: "discountApplicationOrder",
        salesSystemValue: ["tax_first", "discount_after"],
        crmVendorValue: ["discount_first", "tax_after"],
        conflictType: "sequence_mismatch",
      })
    );
    expect(result.incompatibilities).toContainEqual(
      expect.objectContaining({
        field: "minInvoiceAmount",
        salesSystemValue: 1000,
        crmVendorValue: 500,
        conflictType: "value_mismatch",
      })
    );

    // 連携ブロック理由ログに詳細が記録される
    expect(result.blockReasonLog).toBeDefined();
    expect(result.blockReasonLog).toMatch(/税率/);
    expect(result.blockReasonLog).toMatch(/割引適用順序/);
    expect(result.blockReasonLog).toMatch(/最小請求額/);

    // 検証タイムスタンプが記録される
    expect(result.validatedAt).toBeDefined();
    expect(new Date(result.validatedAt).getTime()).toBeGreaterThan(0);

    // 連携可否フラグが正確に設定される
    expect(result.canProceedWithIntegration).toBe(false);
  });
});