import { validateIntegratedThreeBusinesses } from "../../src/logic/it-1781935279444-2-2-1";

describe("3業務統合検証・進行判定", () => {
  test("SCEN-1108: 3業務すべてが合格時に次フェーズへ進行可能と判定される", () => {
    // 入力: 請求書作成、営業報告書集計、契約書管理の3業務がすべて合格ステータス
    const invoiceCreationResult = {
      businessName: "請求書作成",
      passFail: "合格",
      validationItems: [
        {
          itemName: "必須項目完全性",
          status: "合格",
        },
        {
          itemName: "データ型整合性",
          status: "合格",
        },
        {
          itemName: "金額異常値検出",
          status: "合格",
        },
      ],
    };

    const salesReportAggregationResult = {
      businessName: "営業報告書集計",
      passFail: "合格",
      validationItems: [
        {
          itemName: "集計ロジック正確性",
          status: "合格",
        },
        {
          itemName: "計算式適用正確性",
          status: "合格",
        },
        {
          itemName: "異常値欠落検出",
          status: "合格",
        },
      ],
    };

    const contractManagementResult = {
      businessName: "契約書管理",
      passFail: "合格",
      validationItems: [
        {
          itemName: "契約書バージョン管理",
          status: "合格",
        },
        {
          itemName: "顧客情報正確性",
          status: "合格",
        },
        {
          itemName: "最新版確認",
          status: "合格",
        },
      ],
    };

    // 関数実行
    const result = validateIntegratedThreeBusinesses({
      invoiceCreation: invoiceCreationResult,
      salesReportAggregation: salesReportAggregationResult,
      contractManagement: contractManagementResult,
    });

    // 期待結果: 進行判定が「次フェーズへ進行可能」
    expect(result.progressJudgement).toBe("次フェーズへ進行可能");
    expect(result.canProceedToNextPhase).toBe(true);
    expect(result.allBusinessesPassed).toBe(true);

    // 3業務すべてが合格ステータスであることを確認
    expect(result.businessResults.invoiceCreation.passFail).toBe("合格");
    expect(result.businessResults.salesReportAggregation.passFail).toBe("合格");
    expect(result.businessResults.contractManagement.passFail).toBe("合格");

    // 各業務内の検証項目がすべて合格であることを確認
    expect(
      result.businessResults.invoiceCreation.validationItems.every(
        (item) => item.status === "合格"
      )
    ).toBe(true);
    expect(
      result.businessResults.salesReportAggregation.validationItems.every(
        (item) => item.status === "合格"
      )
    ).toBe(true);
    expect(
      result.businessResults.contractManagement.validationItems.every(
        (item) => item.status === "合格"
      )
    ).toBe(true);

    // フェーズ遷移が承認されたことを確認
    expect(result.phaseTransitionApproved).toBe(true);
    expect(result.passedBusinessCount).toBe(3);
    expect(result.failedBusinessCount).toBe(0);
  });
});