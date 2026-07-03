import { extractBillingContractsForMonth } from "../../src/logic/it-1-2-1";

describe("月次請求対象契約・割引基準の確認機能", () => {
  test("SCEN-938: 有効期間外の契約が誤って請求対象に含まれない", () => {
    const currentMonth = new Date("2024-11-01T00:00:00Z");
    const monthStart = new Date("2024-11-01T00:00:00Z");
    const monthEnd = new Date("2024-11-30T23:59:59Z");

    const contracts = [
      {
        contractId: "C001",
        customerId: "CUST001",
        startDate: new Date("2024-10-01T00:00:00Z"),
        endDate: new Date("2024-10-31T23:59:59Z"),
        serviceType: "SERVICE_A",
        status: "ACTIVE",
      },
      {
        contractId: "C002",
        customerId: "CUST002",
        startDate: new Date("2024-12-01T00:00:00Z"),
        endDate: new Date("2024-12-31T23:59:59Z"),
        serviceType: "SERVICE_B",
        status: "ACTIVE",
      },
      {
        contractId: "C003",
        customerId: "CUST003",
        startDate: new Date("2024-11-15T00:00:00Z"),
        endDate: new Date("2024-11-20T23:59:59Z"),
        serviceType: "SERVICE_C",
        status: "ACTIVE",
      },
      {
        contractId: "C004",
        customerId: "CUST004",
        startDate: new Date("2024-11-01T00:00:00Z"),
        endDate: new Date("2024-11-30T23:59:59Z"),
        serviceType: "SERVICE_D",
        status: "ACTIVE",
      },
      {
        contractId: "C005",
        customerId: "CUST005",
        startDate: new Date("2024-09-01T00:00:00Z"),
        endDate: new Date("2024-11-30T23:59:59Z"),
        serviceType: "SERVICE_E",
        status: "ACTIVE",
      },
    ];

    const result = extractBillingContractsForMonth({
      contracts,
      targetMonth: currentMonth,
    });

    expect(result).toEqual({
      validContracts: [
        {
          contractId: "C003",
          customerId: "CUST003",
          startDate: new Date("2024-11-15T00:00:00Z"),
          endDate: new Date("2024-11-20T23:59:59Z"),
          serviceType: "SERVICE_C",
          status: "ACTIVE",
        },
        {
          contractId: "C004",
          customerId: "CUST004",
          startDate: new Date("2024-11-01T00:00:00Z"),
          endDate: new Date("2024-11-30T23:59:59Z"),
          serviceType: "SERVICE_D",
          status: "ACTIVE",
        },
        {
          contractId: "C005",
          customerId: "CUST005",
          startDate: new Date("2024-09-01T00:00:00Z"),
          endDate: new Date("2024-11-30T23:59:59Z"),
          serviceType: "SERVICE_E",
          status: "ACTIVE",
        },
      ],
      invalidContracts: [
        {
          contractId: "C001",
          customerId: "CUST001",
          startDate: new Date("2024-10-01T00:00:00Z"),
          endDate: new Date("2024-10-31T23:59:59Z"),
          serviceType: "SERVICE_A",
          status: "ACTIVE",
          reason: "終了日が対象月より前",
        },
        {
          contractId: "C002",
          customerId: "CUST002",
          startDate: new Date("2024-12-01T00:00:00Z"),
          endDate: new Date("2024-12-31T23:59:59Z"),
          serviceType: "SERVICE_B",
          status: "ACTIVE",
          reason: "開始日が対象月より後",
        },
      ],
    });

    expect(result.validContracts.length).toBe(3);
    expect(result.invalidContracts.length).toBe(2);

    result.validContracts.forEach((contract) => {
      expect(contract.startDate.getTime()).toBeLessThanOrEqual(
        monthEnd.getTime()
      );
      expect(contract.endDate.getTime()).toBeGreaterThanOrEqual(
        monthStart.getTime()
      );
    });

    expect(result.validContracts.map((c) => c.contractId)).toContain("C003");
    expect(result.validContracts.map((c) => c.contractId)).toContain("C004");
    expect(result.validContracts.map((c) => c.contractId)).toContain("C005");

    expect(result.invalidContracts.map((c) => c.contractId)).not.toContain(
      "C003"
    );
    expect(result.invalidContracts.map((c) => c.contractId)).not.toContain(
      "C004"
    );
    expect(result.invalidContracts.map((c) => c.contractId)).not.toContain(
      "C005"
    );
  });
});