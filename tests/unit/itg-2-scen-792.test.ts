import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  checkSlaViolation,
  getSlaWarningDetails,
  recordEstimateReceipt,
  startEstimationProcess,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("SLA Monitoring and Alert Functionality", () => {
  let mockCurrentTime: Date;
  let receiptTime: Date;
  let estimateId: string;
  let departmentHeadId: string;

  beforeEach(() => {
    mockCurrentTime = new Date("2024-03-15T10:00:00Z");
    receiptTime = new Date("2024-03-15T10:00:00Z");
    estimateId = "EST-20240315-001";
    departmentHeadId = "DEPT-HEAD-001";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-792: [normal] SLA監視・警告機能 - 見積書受付から査定完了までの経過時間が30分を超過した場合、査定部署長に警告が発火される
  test("SCEN-792: should trigger SLA warning when elapsed time exceeds 30 minutes from receipt to completion", () => {
    // Step 1: Record estimate receipt
    const receiptData = {
      estimateId: estimateId,
      receivedAt: receiptTime,
      constructionType: "建築工事",
      totalAmount: 5000000,
      quantity: 100,
    };

    const receiptResult = recordEstimateReceipt(receiptData);
    expect(receiptResult.success).toBe(true);
    expect(receiptResult.receiptTime).toEqual(receiptTime);
    expect(receiptResult.estimateId).toBe(estimateId);

    // Step 2: Start estimation process
    const processData = {
      estimateId: estimateId,
      startedAt: receiptTime,
      assessorId: "ASSESSOR-001",
    };

    const processResult = startEstimationProcess(processData);
    expect(processResult.success).toBe(true);
    expect(processResult.processStartTime).toEqual(receiptTime);

    // Step 3: Check at 29 minutes 59 seconds - should NOT trigger warning
    const timeAt29m59s = new Date(receiptTime.getTime() + 29 * 60 * 1000 + 59 * 1000);
    const checkAt29m59s = checkSlaViolation({
      estimateId: estimateId,
      receiptTime: receiptTime,
      currentTime: timeAt29m59s,
      slaBudgetMinutes: 30,
      departmentHeadId: departmentHeadId,
    });

    expect(checkAt29m59s.isViolated).toBe(false);
    expect(checkAt29m59s.warningTriggered).toBe(false);
    expect(checkAt29m59s.elapsedMinutes).toBe(29.98333333);

    // Step 4: Check at 30 minutes 1 second - SHOULD trigger warning
    const timeAt30m1s = new Date(receiptTime.getTime() + 30 * 60 * 1000 + 1 * 1000);
    const checkAt30m1s = checkSlaViolation({
      estimateId: estimateId,
      receiptTime: receiptTime,
      currentTime: timeAt30m1s,
      slaBudgetMinutes: 30,
      departmentHeadId: departmentHeadId,
    });

    expect(checkAt30m1s.isViolated).toBe(true);
    expect(checkAt30m1s.warningTriggered).toBe(true);
    expect(checkAt30m1s.elapsedMinutes).toBe(30.01666667);
    expect(checkAt30m1s.excessMinutes).toBe(0.01666667);

    // Step 5: Retrieve warning details
    const warningDetails = getSlaWarningDetails({
      estimateId: estimateId,
      departmentHeadId: departmentHeadId,
      violationTime: timeAt30m1s,
      receiptTime: receiptTime,
    });

    expect(warningDetails.warningMessage).toBeDefined();
    expect(warningDetails.estimateId).toBe(estimateId);
    expect(warningDetails.exceededMinutes).toBe(0.01666667);
    expect(warningDetails.recommendedAction).toBeDefined();
    expect(warningDetails.priorityLevel).toBe("high");
    expect(warningDetails.sentToDepartmentHead).toBe(true);
    expect(warningDetails.departmentHeadId).toBe(departmentHeadId);

    // Step 6: Verify warning message content includes required fields
    expect(warningDetails.warningMessage).toMatch(/EST-20240315-001/);
    expect(warningDetails.warningMessage).toMatch(/30/);
    expect(warningDetails.recommendedAction).toMatch(/人員配置|対応/);
  });
});