import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateMonthlySummaryTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

const fetchMock = require("jest-fetch-mock");

describe("Monthly Summary Template Definition and Management", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1088: [error] Document Update Lifecycle Management - Error when improvement proposal process is not defined
  test("should return error when improvement proposal process is not defined", async () => {
    const input = {
      templateId: "tmpl-2024-01",
      templateName: "Monthly Summary 2024-01",
      items: [
        {
          itemId: "item-001",
          itemName: "Sales Performance",
          displayOrder: 1,
          calculationLogic: "SUM(sales_data)",
          formatType: "numeric",
        },
      ],
      improvementProposalProcess: undefined,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        success: false,
        errorCode: 422,
        errorMessage: "改善提案プロセスが定義されていません",
        errorKey: "IMPROVEMENT_PROPOSAL_PROCESS_NOT_DEFINED",
      }),
      { status: 422 }
    );

    const error = await validateMonthlySummaryTemplate(input).catch(
      (err) => err
    );

    expect(error).toBeDefined();
    expect(error.message).toMatch(/改善提案プロセス/);
    expect(error.status).toBe(422);
  });
});