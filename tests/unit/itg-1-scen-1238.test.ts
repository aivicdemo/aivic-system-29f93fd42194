import { optimizeCustomerNotificationOrder } from "../../src/logic/it-1781935279444-2-2-1";

describe("Contract Change Customer Notification Order Optimization", () => {
  // SCEN-1238
  test("should optimize customer notification order by impact level and creation date", () => {
    // Test data: 3 contract changes with different impact levels
    const contractChanges = [
      {
        id: "change_001",
        customerId: "cust_A",
        impactLevel: "medium",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        changeDescription: "Service tier downgrade",
      },
      {
        id: "change_002",
        customerId: "cust_B",
        impactLevel: "high",
        createdAt: new Date("2024-01-15T09:30:00Z"),
        changeDescription: "Billing cycle change",
      },
      {
        id: "change_003",
        customerId: "cust_C",
        impactLevel: "low",
        createdAt: new Date("2024-01-15T11:00:00Z"),
        changeDescription: "Contact information update",
      },
      {
        id: "change_004",
        customerId: "cust_D",
        impactLevel: "high",
        createdAt: new Date("2024-01-15T10:30:00Z"),
        changeDescription: "Contract term extension",
      },
      {
        id: "change_005",
        customerId: "cust_E",
        impactLevel: "medium",
        createdAt: new Date("2024-01-15T09:00:00Z"),
        changeDescription: "Discount rate modification",
      },
    ];

    const result = optimizeCustomerNotificationOrder(contractChanges);

    // Verify result structure
    expect(result).toBeDefined();
    expect(result.optimizedOrder).toBeDefined();
    expect(result.customerNotifications).toBeDefined();

    // Verify total count matches
    expect(result.optimizedOrder.length).toBe(5);
    expect(result.customerNotifications.length).toBe(5);
    expect(result.totalContractChanges).toBe(5);
    expect(result.totalCustomers).toBe(5);

    // Verify notification order: high → medium → low
    const optimizedIds = result.optimizedOrder.map(
      (item: { id: string }) => item.id
    );

    // High priority changes should come first (sorted by creation date within same level)
    // change_002 (high, 09:30) then change_004 (high, 10:30)
    expect(optimizedIds[0]).toBe("change_002");
    expect(optimizedIds[1]).toBe("change_004");

    // Medium priority changes should come next (sorted by creation date)
    // change_005 (medium, 09:00) then change_001 (medium, 10:00)
    expect(optimizedIds[2]).toBe("change_005");
    expect(optimizedIds[3]).toBe("change_001");

    // Low priority change should be last
    expect(optimizedIds[4]).toBe("change_003");

    // Verify impact level grouping
    const highPriorityGroup = result.optimizedOrder.slice(0, 2);
    highPriorityGroup.forEach((item: { impactLevel: string }) => {
      expect(item.impactLevel).toBe("high");
    });

    const mediumPriorityGroup = result.optimizedOrder.slice(2, 4);
    mediumPriorityGroup.forEach((item: { impactLevel: string }) => {
      expect(item.impactLevel).toBe("medium");
    });

    const lowPriorityGroup = result.optimizedOrder.slice(4);
    lowPriorityGroup.forEach((item: { impactLevel: string }) => {
      expect(item.impactLevel).toBe("low");
    });

    // Verify within-group creation date ordering for high priority
    const highPriorityCreatedDates = highPriorityGroup.map(
      (item: { createdAt: Date }) => item.createdAt
    );
    expect(highPriorityCreatedDates[0].getTime()).toBeLessThan(
      highPriorityCreatedDates[1].getTime()
    );

    // Verify within-group creation date ordering for medium priority
    const mediumPriorityCreatedDates = mediumPriorityGroup.map(
      (item: { createdAt: Date }) => item.createdAt
    );
    expect(mediumPriorityCreatedDates[0].getTime()).toBeLessThan(
      mediumPriorityCreatedDates[1].getTime()
    );

    // Verify customer notifications are generated correctly
    result.customerNotifications.forEach(
      (notification: {
        contractChangeId: string;
        customerId: string;
        notificationOrder: number;
      }) => {
        expect(notification.contractChangeId).toBeDefined();
        expect(notification.customerId).toBeDefined();
        expect(notification.notificationOrder).toBeGreaterThan(0);
        expect(notification.notificationOrder).toBeLessThanOrEqual(5);
      }
    );

    // Verify no duplicate notifications
    const notificationIds = result.customerNotifications.map(
      (n: { contractChangeId: string }) => n.contractChangeId
    );
    const uniqueIds = new Set(notificationIds);
    expect(uniqueIds.size).toBe(5);

    // Verify notification order matches optimized order
    result.customerNotifications.forEach(
      (notification: { contractChangeId: string; notificationOrder: number }) => {
        const changeIndex = optimizedIds.indexOf(notification.contractChangeId);
        expect(notification.notificationOrder).toBe(changeIndex + 1);
      }
    );

    // Verify all changes are represented in notifications
    const notificationChangeIds = new Set(
      result.customerNotifications.map(
        (n: { contractChangeId: string }) => n.contractChangeId
      )
    );
    contractChanges.forEach((change) => {
      expect(notificationChangeIds.has(change.id)).toBe(true);
    });

    // Verify metadata
    expect(result.optimizationTimestamp).toBeDefined();
    expect(result.impactLevelHierarchy).toEqual([
      "high",
      "medium",
      "low",
    ]);
  });
});