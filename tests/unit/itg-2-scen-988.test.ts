import { describe, test, expect } from "@jest/globals";
import { validateMarketDeviationBasis } from "../../src/logic/it-1-br-2-2-2-1";

describe("Market Deviation Basis Data Display - Dashboard", () => {
  test("SCEN-988: should display warning message when reference data is empty", () => {
    // Arrange
    const input = {
      referenceDataCount: 0,
      deviationRate: 15.5,
      deviationAmount: 250000,
      quotationAmount: 1500000,
      pastProjectDataSet: [],
      priceBookReferences: [],
      correctionCoefficients: [],
    };

    // Act & Assert
    const result = validateMarketDeviationBasis(input);

    // Validate warning message is returned
    expect(result).toEqual({
      isValid: false,
      warningMessage: "根拠データが不足しています",
      referenceDataCount: 0,
      deviationRate: 15.5,
      deviationAmount: 250000,
      displayable: false,
    });

    // Validate that console error is not produced
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    validateMarketDeviationBasis(input);
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();

    // Validate warning message contains expected text
    expect(result.warningMessage).toMatch(/根拠データが不足/);

    // Validate display flag is false when reference data is empty
    expect(result.displayable).toBe(false);
  });
});