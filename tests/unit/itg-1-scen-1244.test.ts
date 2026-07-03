import { validateContractChangeAgreement } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1244
  test("複数の変更項目がある場合、すべて検証して部分的な合意状況を検出する", () => {
    // テストデータ: 複数の変更項目（4項目）を含む契約変更内容
    const contractChangeInput = {
      contractId: "CONTRACT-2024-001",
      customerId: "CUSTOMER-100",
      changedItems: [
        {
          itemId: "CHANGE-ITEM-A",
          itemName: "基本料金",
          previousValue: "100000",
          newValue: "120000",
          agreementStatus: "AGREED", // 合意
        },
        {
          itemId: "CHANGE-ITEM-B",
          itemName: "成果報酬率",
          previousValue: "10%",
          newValue: "12%",
          agreementStatus: "NOT_AGREED", // 未合意
        },
        {
          itemId: "CHANGE-ITEM-C",
          itemName: "納期条件",
          previousValue: "30日",
          newValue: "45日",
          agreementStatus: "AGREED", // 合意
        },
        {
          itemId: "CHANGE-ITEM-D",
          itemName: "割引基準",
          previousValue: "5%",
          newValue: "3%",
          agreementStatus: "PENDING", // 保留中
        },
      ],
      changeDate: "2024-01-15",
      customAgreementDeadline: "2024-01-22",
    };

    // 合意状況検証機能を実行
    const validationResult = validateContractChangeAgreement(
      contractChangeInput
    );

    // すべての変更項目が検証されたことを確認
    expect(validationResult.totalItemsValidated).toBe(4);

    // 各項目の合意状況が正確に判定されていることを確認
    expect(validationResult.agreedItemsCount).toBe(2); // A,C が合意
    expect(validationResult.notAgreedItemsCount).toBe(1); // B が未合意
    expect(validationResult.pendingItemsCount).toBe(1); // D が保留中

    // 合意率が正しく計算されていることを確認（合意項目数/全項目数）
    expect(validationResult.agreementRate).toBe(0.5); // 2/4 = 50%

    // 部分的な合意状況として判定していることを確認
    expect(validationResult.overallStatus).toBe("PARTIAL_AGREEMENT");

    // 検証結果レポートが構造化されていることを確認
    expect(validationResult.validationReport).toBeDefined();
    expect(validationResult.validationReport.agreedItems).toEqual([
      {
        itemId: "CHANGE-ITEM-A",
        itemName: "基本料金",
        status: "AGREED",
      },
      {
        itemId: "CHANGE-ITEM-C",
        itemName: "納期条件",
        status: "AGREED",
      },
    ]);

    // 未合意項目が明示されていることを確認
    expect(validationResult.validationReport.notAgreedItems).toEqual([
      {
        itemId: "CHANGE-ITEM-B",
        itemName: "成果報酬率",
        status: "NOT_AGREED",
      },
    ]);

    // 保留中項目が明示されていることを確認
    expect(validationResult.validationReport.pendingItems).toEqual([
      {
        itemId: "CHANGE-ITEM-D",
        itemName: "割引基準",
        status: "PENDING",
      },
    ]);

    // タイムスタンプが記録されていることを確認
    expect(validationResult.validatedAt).toBe("2024-01-15T00:00:00Z");

    // 次のアクション推奨がレポートに含まれていることを確認
    expect(validationResult.validationReport.nextActions).toContain(
      "NOT_AGREED_ITEM_RESOLUTION"
    );
    expect(validationResult.validationReport.nextActions).toContain(
      "PENDING_ITEM_FOLLOWUP"
    );

    // 検証が成功していることを確認
    expect(validationResult.isValidationSuccessful).toBe(true);
  });
});