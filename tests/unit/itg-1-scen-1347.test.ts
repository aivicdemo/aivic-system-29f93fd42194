import { surveySalesDataItems } from "../../src/logic/it-1781935279444-1-1-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-1347: 営業システムへのアクセス失敗時にエラーが返される", async () => {
    // Reset mocks before test
    fetchMock.resetMocks();

    // Mock 401 Unauthorized response
    fetchMock.mockResponseOnce(
      JSON.stringify({
        code: "AUTH_FAILED",
        message: "認証に失敗しました",
      }),
      { status: 401 }
    );

    // Test 401 Unauthorized
    const testInput401 = {
      systemAccessUrl: "https://crm-system.example.com/api/v1/data-items",
      accessToken: "invalid_token_401",
      operationName: "surveyCurrentState",
    };

    let error401: any;
    try {
      await surveySalesDataItems(testInput401);
    } catch (e) {
      error401 = e;
    }

    expect(error401).toBeDefined();
    expect(error401.message).toMatch(/認証|401|Unauthorized/);
    expect(error401.statusCode).toBe(401);

    // Reset and test 403 Forbidden
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        code: "PERMISSION_DENIED",
        message: "アクセス権限がありません",
      }),
      { status: 403 }
    );

    const testInput403 = {
      systemAccessUrl: "https://crm-system.example.com/api/v1/data-items",
      accessToken: "valid_token_no_permission",
      operationName: "surveyCurrentState",
    };

    let error403: any;
    try {
      await surveySalesDataItems(testInput403);
    } catch (e) {
      error403 = e;
    }

    expect(error403).toBeDefined();
    expect(error403.message).toMatch(/権限|403|Forbidden/);
    expect(error403.statusCode).toBe(403);

    // Reset and test 503 Service Unavailable
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(
      JSON.stringify({
        code: "SERVICE_UNAVAILABLE",
        message: "サービスが利用できません",
      }),
      { status: 503 }
    );

    const testInput503 = {
      systemAccessUrl: "https://crm-system.example.com/api/v1/data-items",
      accessToken: "valid_token",
      operationName: "surveyCurrentState",
    };

    let error503: any;
    try {
      await surveySalesDataItems(testInput503);
    } catch (e) {
      error503 = e;
    }

    expect(error503).toBeDefined();
    expect(error503.message).toMatch(/利用|503|Service/);
    expect(error503.statusCode).toBe(503);

    // Verify that system does not enter unexpected state
    expect(error503.isSystemHealthy).toBe(false);
    expect(error503.recoveryAction).toBeDefined();
  });
});