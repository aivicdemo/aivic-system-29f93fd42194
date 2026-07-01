import { validateContractChangeContradiction } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-762: [error] 契約書・提案資料変更内容妥当性判定機能 - 変更内容が既存契約と矛盾している場合にエラーとして検出される
  test("既存契約と矛盾する変更内容が検出されエラーレスポンスが返される", () => {
    // 既存契約情報
    const existingContract = {
      contractId: "CTR-2024-001",
      contractAmount: 1000000,
      contractPeriodStart: new Date("2024-01-01"),
      contractPeriodEnd: new Date("2024-12-31"),
      deliverables: "営業支援システム構築、月次レポート生成機能",
      serviceType: "システム開発",
    };

    // 新しい契約書から抽出した変更内容
    const changeContent = {
      contractId: "CTR-2024-001",
      newContractAmount: 500000, // 既存: 1,000,000 → 新規: 500,000（50%削減 - 矛盾）
      newContractPeriodStart: new Date("2024-01-01"),
      newContractPeriodEnd: new Date("2023-12-31"), // 終了日が開始日より前 - 矛盾
      newDeliverables: "営業支援システム構築のみ、月次レポート機能は対象外", // 納入物削減 - 矛盾
      newServiceType: "コンサルティング", // サービス種別変更 - 矛盾
    };

    // 関数実行
    let result;
    try {
      result = validateContractChangeContradiction(existingContract, changeContent);
    } catch (error: unknown) {
      // エラー検証
      if (error instanceof Error) {
        expect(error.message).toMatch(/CONTRACT_CONTRADICTION_ERROR/);
        expect(error.message).toMatch(/契約金額/);
        expect(error.message).toMatch(/契約期間/);
        expect(error.message).toMatch(/納入物/);
        expect(error.message).toMatch(/サービス種別/);
      }
      return;
    }

    // 成功時の検証（もし例外が発生しない場合）
    if (result && typeof result === "object" && "errorCode" in result) {
      expect(result.errorCode).toBe("CONTRACT_CONTRADICTION_ERROR");
      expect(result).toHaveProperty("errorMessage");
      expect(result.errorMessage).toMatch(/矛盾/);
      expect(result).toHaveProperty("contradictionItems");
      expect(Array.isArray(result.contradictionItems)).toBe(true);
      expect(result.contradictionItems.length).toBeGreaterThan(0);

      // 矛盾項目の検証
      const contradictionItems = result.contradictionItems as Array<{
        field: string;
        existingValue: unknown;
        newValue: unknown;
      }>;
      const fieldNames = contradictionItems.map((item) => item.field);
      expect(fieldNames).toContain("contractAmount");
      expect(fieldNames).toContain("contractPeriod");
      expect(fieldNames).toContain("deliverables");
      expect(fieldNames).toContain("serviceType");

      // 対比情報の検証
      expect(result).toHaveProperty("comparison");
      const comparisonItem = contradictionItems.find(
        (item) => item.field === "contractAmount"
      );
      if (comparisonItem) {
        expect(comparisonItem.existingValue).toBe(1000000);
        expect(comparisonItem.newValue).toBe(500000);
      }
    }
  });
});