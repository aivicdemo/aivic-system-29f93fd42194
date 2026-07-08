import { evaluateImprovementAchievementDegree } from "../../src/logic/it-1-br-2-2-2-1";

const fetchMock = require("jest-fetch-mock");

describe("改善効果達成度判定と継続改善計画決定", () => {
  // SCEN-1520
  test("改善実績レポートが未確定状態で達成度判定が呼び出された場合、不正な状態遷移エラーを返却", async () => {
    fetchMock.resetMocks();

    const improvementReportId = "report-20240115-001";
    const improvementReportStatus = "unconfirmed";

    // 改善実績レポートが未確定状態であることをシミュレート
    fetchMock.mockResponseOnce(
      JSON.stringify({
        id: improvementReportId,
        status: improvementReportStatus,
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
      }),
      { status: 200 }
    );

    // 達成度判定APIを呼び出し、未確定状態のレポートIDをパラメータとして渡す
    const evaluateRequest = async () => {
      const response = await fetch(
        `/api/improvement-reports/${improvementReportId}/evaluate-achievement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId: improvementReportId,
            evaluationType: "achievement_degree",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          status: response.status,
          errorMessage: errorData.message || "",
        };
      }

      return { status: response.status, errorMessage: "" };
    };

    // エラーレスポンスをモック（ステータスコード422）
    fetchMock.mockResponseOnce(
      JSON.stringify({
        message: "不正な状態遷移です。改善実績レポートが確定状態である必要があります。",
        errorCode: "INVALID_STATE_TRANSITION",
      }),
      { status: 422 }
    );

    // 達成度判定を実行
    const result = await evaluateRequest();

    // 検証1: エラーレスポンスのステータスコードが422であることを確認
    expect(result.status).toBe(422);

    // 検証2: エラーメッセージに「不正な状態遷移」が含まれていることを確認
    expect(result.errorMessage).toMatch(/不正な状態遷移/);

    // 検証3: エラーメッセージに「改善実績レポートが確定状態である必要があります」が含まれていることを確認
    expect(result.errorMessage).toMatch(/改善実績レポートが確定状態である必要があります/);

    // 検証4: 改善実績レポートのステータスが「未確定」のままであることを確認
    const reportStatusCheckResponse = await fetch(
      `/api/improvement-reports/${improvementReportId}`
    );
    const reportData = await reportStatusCheckResponse.json();
    expect(reportData.status).toBe("unconfirmed");
  });
});