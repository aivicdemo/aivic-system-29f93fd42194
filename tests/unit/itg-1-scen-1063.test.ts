import { describe, test, expect, beforeEach } from "@jest/globals";
import { determineReportDistributionEligibility } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("Report Distribution Rule Judgment - Undefined Rule Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1063
  test("should return ineligible status when distribution rule is not defined for customer", () => {
    const undefinedRuleCustomerId = "CUST-NO-RULE-001";
    const definedRuleCustomerId = "CUST-WITH-RULE-002";

    const input_undefined = {
      customerId: undefinedRuleCustomerId,
      ruleDefinitions: [
        {
          customerId: definedRuleCustomerId,
          distributionChannel: "email",
          frequency: "monthly",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          isActive: true,
        },
      ],
      targetMonth: "2024-01",
    };

    const result_undefined = determineReportDistributionEligibility(
      input_undefined
    );

    expect(result_undefined.isEligible).toBe(false);
    expect(result_undefined.eligibilityStatus).toBe("ineligible");
    expect(result_undefined.reason).toMatch(/配信ルール未定義/);
    expect(result_undefined.shouldSkipDistribution).toBe(true);

    const input_defined = {
      customerId: definedRuleCustomerId,
      ruleDefinitions: [
        {
          customerId: definedRuleCustomerId,
          distributionChannel: "email",
          frequency: "monthly",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          isActive: true,
        },
      ],
      targetMonth: "2024-01",
    };

    const result_defined = determineReportDistributionEligibility(
      input_defined
    );

    expect(result_defined.isEligible).toBe(true);
    expect(result_defined.eligibilityStatus).toBe("eligible");
    expect(result_defined.shouldSkipDistribution).toBe(false);

    expect(result_undefined.isEligible).not.toBe(result_defined.isEligible);
  });
});