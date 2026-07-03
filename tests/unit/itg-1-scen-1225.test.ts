import { recordAuditLog } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-1225: [normal] 契約変更監査ログ自動記録機能 - 契約・請求データ更新時に変更内容・変更者・変更日時・差分が自動記録される
  test("契約・請求データ更新時に変更内容・変更者・変更日時・差分が監査ログテーブルに自動記録される", () => {
    const now = new Date("2024-01-15T11:00:00Z");
    const auditLogs: Array<{
      id: string;
      dataType: string;
      recordId: string;
      changedBy: string;
      changedAt: Date;
      changeContent: string;
      beforeValue: Record<string, unknown>;
      afterValue: Record<string, unknown>;
      diff: Record<string, { before: unknown; after: unknown }>;
    }> = [];

    // ステップ1: 契約データを更新し、監査ログに記録
    const contractChangeResult = recordAuditLog({
      dataType: "契約",
      recordId: "CONTRACT_001",
      changedBy: "TEST_USER_001",
      changedAt: now,
      beforeValue: { contractAmount: 100000, contractName: "営業代行契約A" },
      afterValue: { contractAmount: 150000, contractName: "営業代行契約A" },
    });

    auditLogs.push(contractChangeResult);

    // ステップ2: 契約更新処理が正常に完了したことを確認
    expect(contractChangeResult).toBeDefined();
    expect(contractChangeResult.id).toBeDefined();
    expect(typeof contractChangeResult.id).toBe("string");

    // ステップ3: 記録された監査ログレコードの変更内容フィールドを検証
    expect(contractChangeResult.changeContent).toBe(
      "契約金額: 100000円 → 150000円"
    );

    // ステップ4: 監査ログレコードの変更者フィールドを検証
    expect(contractChangeResult.changedBy).toBe("TEST_USER_001");

    // ステップ5: 監査ログレコードの変更日時を検証
    expect(contractChangeResult.changedAt).toEqual(now);

    // ステップ6: 監査ログレコードの差分フィールドに詳細な変更情報が記録されていることを検証
    expect(contractChangeResult.diff).toEqual({
      contractAmount: { before: 100000, after: 150000 },
    });
    expect(contractChangeResult.diff.contractAmount.before).toBe(100000);
    expect(contractChangeResult.diff.contractAmount.after).toBe(150000);

    // ステップ7: 異なるユーザーで請求データを更新
    const billingChangeTime = new Date("2024-01-15T12:30:00Z");
    const billingChangeResult = recordAuditLog({
      dataType: "請求",
      recordId: "BILLING_001",
      changedBy: "TEST_USER_002",
      changedAt: billingChangeTime,
      beforeValue: { billingAmount: 200000, billingStatus: "未確定" },
      afterValue: { billingAmount: 220000, billingStatus: "確定" },
    });

    auditLogs.push(billingChangeResult);

    // ステップ8: 新しい監査ログレコードが記録されたことを確認
    expect(billingChangeResult).toBeDefined();
    expect(billingChangeResult.id).toBeDefined();
    expect(billingChangeResult.id).not.toBe(contractChangeResult.id);

    // ステップ9: 新しい監査ログレコードの変更者がTEST_USER_002であることを検証
    expect(billingChangeResult.changedBy).toBe("TEST_USER_002");

    // ステップ10: 新しい監査ログレコードの変更内容を検証
    expect(billingChangeResult.changeContent).toContain("220000");

    // ステップ11: 複数の監査ログレコードが正しい時系列順序で記録されていることを検証
    expect(auditLogs.length).toBe(2);
    expect(auditLogs[0].changedAt).toEqual(now);
    expect(auditLogs[1].changedAt).toEqual(billingChangeTime);
    expect(auditLogs[0].changedAt.getTime()).toBeLessThan(
      auditLogs[1].changedAt.getTime()
    );

    // ステップ12: データ型が正確に記録されていることを検証
    expect(auditLogs[0].dataType).toBe("契約");
    expect(auditLogs[1].dataType).toBe("請求");

    // ステップ13: recordIdが正確に記録されていることを検証
    expect(auditLogs[0].recordId).toBe("CONTRACT_001");
    expect(auditLogs[1].recordId).toBe("BILLING_001");

    // ステップ14: 差分情報が複数フィールドをサポートしていることを検証
    expect(Object.keys(billingChangeResult.diff).length).toBeGreaterThan(0);
    expect(billingChangeResult.diff).toHaveProperty("billingAmount");
    expect(billingChangeResult.diff).toHaveProperty("billingStatus");

    // ステップ15: 各監査ログの前後の値が正確に記録されていることを検証
    expect(contractChangeResult.beforeValue.contractAmount).toBe(100000);
    expect(contractChangeResult.afterValue.contractAmount).toBe(150000);
    expect(billingChangeResult.beforeValue.billingAmount).toBe(200000);
    expect(billingChangeResult.afterValue.billingAmount).toBe(220000);
  });
});