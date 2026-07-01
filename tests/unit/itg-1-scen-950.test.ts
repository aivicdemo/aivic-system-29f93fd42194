import { identifyBillableServicesWithDiscounts } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-950: [normal] 請求対象契約確認・割引基準識別機能 - 請求対象サービスが複数ある場合、すべてが正しく識別される
  test("複数の請求対象サービスと割引基準を正しく識別する", () => {
    const contractData = {
      contract_id: "CTR-2024-001",
      customer_id: "CUST-A001",
      services: [
        {
          service_id: "SVC-A",
          service_name: "サービスA",
          is_billable: true,
          discount_rate: 10,
          discount_type: "percentage",
        },
        {
          service_id: "SVC-B",
          service_name: "サービスB",
          is_billable: true,
          discount_rate: 5,
          discount_type: "percentage",
        },
        {
          service_id: "SVC-C",
          service_name: "サービスC",
          is_billable: true,
          discount_rate: 0,
          discount_type: "none",
        },
      ],
    };

    const result = identifyBillableServicesWithDiscounts(contractData);

    expect(result).toEqual({
      contract_id: "CTR-2024-001",
      customer_id: "CUST-A001",
      billable_services_count: 3,
      services: [
        {
          service_id: "SVC-A",
          service_name: "サービスA",
          is_billable: true,
          discount_rate: 10,
          discount_type: "percentage",
        },
        {
          service_id: "SVC-B",
          service_name: "サービスB",
          is_billable: true,
          discount_rate: 5,
          discount_type: "percentage",
        },
        {
          service_id: "SVC-C",
          service_name: "サービスC",
          is_billable: true,
          discount_rate: 0,
          discount_type: "none",
        },
      ],
    });

    expect(result.billable_services_count).toBe(3);
    expect(result.services).toHaveLength(3);

    expect(result.services[0].is_billable).toBe(true);
    expect(result.services[1].is_billable).toBe(true);
    expect(result.services[2].is_billable).toBe(true);

    expect(result.services[0].discount_rate).toBe(10);
    expect(result.services[0].discount_type).toBe("percentage");

    expect(result.services[1].discount_rate).toBe(5);
    expect(result.services[1].discount_type).toBe("percentage");

    expect(result.services[2].discount_rate).toBe(0);
    expect(result.services[2].discount_type).toBe("none");

    const service_ids = result.services.map((s) => s.service_id);
    expect(new Set(service_ids).size).toBe(3);
  });
});