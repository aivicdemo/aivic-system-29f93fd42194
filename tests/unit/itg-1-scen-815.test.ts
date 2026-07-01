import { detectDeliveryDelay } from "../../src/logic/it-1781935279444-2-1-1";

describe("納期遅延・前倒し検出・通知機能", () => {
  test("SCEN-815: 実績納期データが欠落している場合にエラーが返却される", () => {
    const contractId = "CONT-2024-001";
    const deliveryItemId = "DELV-2024-001";
    const plannedDeliveryDate = new Date("2024-02-15T23:59:59Z");
    const actualDeliveryDate = null;
    const customerId = "CUST-2024-001";
    const serviceType = "service_A";

    const input = {
      contractId,
      deliveryItemId,
      plannedDeliveryDate,
      actualDeliveryDate,
      customerId,
      serviceType,
    };

    expect(() => detectDeliveryDelay(input)).toThrow(/実績納期/);
  });
});