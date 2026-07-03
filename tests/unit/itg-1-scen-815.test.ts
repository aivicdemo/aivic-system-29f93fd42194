import { routeConsultationByPriority } from "../../src/logic/it-1781935279444-2-2-1";

describe("相談内容の優先度ベース自動ルーティング機能", () => {
  // SCEN-815
  test("優先度が無効な値で指定された場合にルーティングが失敗する", () => {
    const validConsultation = {
      consultation_id: "CONS-001",
      customer_id: "CUST-001",
      content: "契約内容の変更について相談したいです",
      priority: null,
      created_at: new Date("2024-01-15T10:30:00Z"),
      routing_status: "pending" as const,
    };

    // null優先度でエラー発生
    expect(() =>
      routeConsultationByPriority({
        ...validConsultation,
        priority: null,
      })
    ).toThrow(/優先度/);

    // undefined優先度でエラー発生
    expect(() =>
      routeConsultationByPriority({
        ...validConsultation,
        priority: undefined,
      })
    ).toThrow(/優先度/);

    // 空文字列優先度でエラー発生
    expect(() =>
      routeConsultationByPriority({
        ...validConsultation,
        priority: "",
      })
    ).toThrow(/優先度/);

    // 数値以外の文字列優先度でエラー発生
    expect(() =>
      routeConsultationByPriority({
        ...validConsultation,
        priority: "high-priority",
      })
    ).toThrow(/優先度/);

    // 範囲外の数値優先度でエラー発生
    expect(() =>
      routeConsultationByPriority({
        ...validConsultation,
        priority: 10,
      })
    ).toThrow(/優先度/);

    // 有効な優先度(1-5)でルーティング成功
    const result = routeConsultationByPriority({
      ...validConsultation,
      priority: 1,
    });

    expect(result).toEqual({
      consultation_id: "CONS-001",
      customer_id: "CUST-001",
      content: "契約内容の変更について相談したいです",
      priority: 1,
      created_at: new Date("2024-01-15T10:30:00Z"),
      routing_status: "routed",
      routed_to: "senior_manager",
      routed_at: expect.any(Date),
      routing_reason: "High priority consultation automatically routed",
    });

    // 優先度2でもルーティング成功
    const result2 = routeConsultationByPriority({
      ...validConsultation,
      priority: 2,
    });

    expect(result2.routing_status).toBe("routed");
    expect(result2.routed_to).toBe("manager");

    // 優先度5(最低)でもルーティング成功
    const result5 = routeConsultationByPriority({
      ...validConsultation,
      priority: 5,
    });

    expect(result5.routing_status).toBe("routed");
    expect(result5.routed_to).toBe("support_staff");
  });
});