import { updateContractWithValidation } from "../../src/logic/it-1-2-1";

describe("契約・請求データリアルタイム更新機能", () => {
  // SCEN-1223
  test("変更内容に矛盾がある場合、データ更新がロールバックされる", async () => {
    const customerId = "CUST-001";
    const originalContractAmount = 100000;
    const originalStartDate = "2024-01-01";
    const originalEndDate = "2024-12-31";

    const existingContractData = {
      customerId,
      contractAmount: originalContractAmount,
      contractStartDate: originalStartDate,
      contractEndDate: originalEndDate,
      status: "active",
    };

    const conflictingUpdateRequest = {
      customerId,
      contractAmount: 150000,
      contractStartDate: "2023-01-01",
      contractEndDate: "2023-12-31",
      status: "active",
    };

    const mockDatabase = {
      contracts: [existingContractData],
      billings: [
        {
          customerId,
          invoiceAmount: 100000,
          invoiceMonth: "2024-01",
          status: "active",
        },
      ],
    };

    const result = updateContractWithValidation(
      conflictingUpdateRequest,
      mockDatabase
    );

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("DATA_CONFLICT");
    expect(result.errorMessage).toMatch(/矛盾/);

    const contractAfterUpdate = mockDatabase.contracts.find(
      (c) => c.customerId === customerId
    );
    expect(contractAfterUpdate).toEqual({
      customerId,
      contractAmount: originalContractAmount,
      contractStartDate: originalStartDate,
      contractEndDate: originalEndDate,
      status: "active",
    });

    const billingAfterUpdate = mockDatabase.billings.find(
      (b) => b.customerId === customerId
    );
    expect(billingAfterUpdate).toEqual({
      customerId,
      invoiceAmount: 100000,
      invoiceMonth: "2024-01",
      status: "active",
    });

    expect(result.rollbackApplied).toBe(true);
    expect(result.conflictDetails).toMatchObject({
      reason: "契約期間の遡及変更は契約金額の変更と同時実行不可",
    });
  });
});