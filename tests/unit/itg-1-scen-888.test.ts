import { determineDiscount } from "../../src/logic/it-1-2-1";

describe("割引・キャンペーン適用判定機能", () => {
  // SCEN-888
  test("キャンペーン終了日を超過した場合は特典が除外される", () => {
    const campaign_end_date = new Date("2024-01-31T23:59:59Z");
    const system_date = new Date("2024-02-01T00:00:00Z");

    const input = {
      customer_id: "CUST_001",
      service_id: "SVC_001",
      base_amount: 100000,
      campaigns: [
        {
          campaign_id: "CAMP_001",
          campaign_name: "New Year Campaign",
          end_date: campaign_end_date,
          discount_rate: 0.1,
          discount_amount: 0,
          benefit_type: "discount_rate",
        },
        {
          campaign_id: "CAMP_002",
          campaign_name: "Valid Campaign",
          end_date: new Date("2024-12-31T23:59:59Z"),
          discount_rate: 0.05,
          discount_amount: 0,
          benefit_type: "discount_rate",
        },
      ],
      current_date: system_date,
    };

    const result = determineDiscount(input);

    expect(result.applied_campaigns).toHaveLength(1);
    expect(result.applied_campaigns[0].campaign_id).toBe("CAMP_002");
    expect(result.excluded_campaigns).toContainEqual(
      expect.objectContaining({
        campaign_id: "CAMP_001",
        exclusion_reason: "キャンペーン終了日超過",
      })
    );
    expect(result.discount_rate).toBe(0.05);
    expect(result.final_amount).toBe(95000);
  });
});