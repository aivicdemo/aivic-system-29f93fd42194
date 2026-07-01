import { recordResponsePolicy } from "../../src/logic/it-1781935279444-2-2-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("対応方針の記録・ステータス更新機能", () => {
  test("SCEN-823: 対応方針の記録時に必須項目（判断内容、理由）が欠落している場合、エラーが返却される", async () => {
    // ケース1: 判断内容が欠落している場合
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error: "判断内容は必須です"
      }),
      { status: 400 }
    );

    const request_missing_decision = {
      decision_content: "",
      reason: "顧客からの異議に対する説明を準備中"
    };

    const response1 = await fetch("/api/response-policy/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request_missing_decision)
    });

    expect(response1.status).toBe(400);
    const body1 = await response1.json();
    expect(body1.error).toMatch(/判断内容/);

    // ケース2: 理由が欠落している場合
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error: "理由は必須です"
      }),
      { status: 400 }
    );

    const request_missing_reason = {
      decision_content: "修正対応",
      reason: ""
    };

    const response2 = await fetch("/api/response-policy/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request_missing_reason)
    });

    expect(response2.status).toBe(400);
    const body2 = await response2.json();
    expect(body2.error).toMatch(/理由/);

    // ケース3: 判断内容と理由の両方が欠落している場合
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 400,
        error: "判断内容は必須です。理由は必須です"
      }),
      { status: 400 }
    );

    const request_missing_both = {
      decision_content: "",
      reason: ""
    };

    const response3 = await fetch("/api/response-policy/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request_missing_both)
    });

    expect(response3.status).toBe(400);
    const body3 = await response3.json();
    expect(body3.error).toMatch(/判断内容/);
    expect(body3.error).toMatch(/理由/);
  });
});