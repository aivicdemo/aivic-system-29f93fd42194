import { describe, test, expect, beforeEach } from "@jest/globals";
import { analyzeOCRReadingErrors } from "../../src/logic/it-6-2-2-2";

describe("OCR reading error analysis dashboard", () => {
  // SCEN-1394
  test("should structure OCR reading error details correctly when estimate original and reading result mismatch", () => {
    // Setup: Original estimate data from source document
    const estimateOriginal = {
      estimateId: "EST-001",
      items: [
        {
          itemName: "基礎工事",
          quantity: 100,
          unitPrice: 5000,
          unit: "㎡",
        },
        {
          itemName: "躯体工事",
          quantity: 150,
          unitPrice: 8000,
          unit: "㎡",
        },
        {
          itemName: "内装工事",
          quantity: 200,
          unitPrice: 3000,
          unit: "㎡",
        },
      ],
    };

    // OCR reading result with errors
    const ocrReadingResult = {
      estimateId: "EST-001",
      items: [
        {
          itemName: "基礎工事",
          quantity: 100,
          unitPrice: 5000,
          unit: "㎡",
        },
        {
          itemName: "躯体工事",
          quantity: 160, // Misread: should be 150
          unitPrice: 8000,
          unit: "㎡",
        },
        {
          itemName: "内装工事",
          quantity: 200,
          unitPrice: 2800, // Misread: should be 3000
          unit: "㎡",
        },
      ],
    };

    // Execute function
    const errorDetails = analyzeOCRReadingErrors(
      estimateOriginal,
      ocrReadingResult
    );

    // Assertions: Verify structured error details format and content
    expect(errorDetails).toBeDefined();
    expect(Array.isArray(errorDetails.errors)).toBe(true);
    expect(errorDetails.errors.length).toBe(2);

    // First error: Quantity mismatch in 躯体工事
    expect(errorDetails.errors[0]).toEqual({
      itemName: "躯体工事",
      fieldName: "quantity",
      ocrReadValue: 160,
      correctValue: 150,
      discrepancyType: "quantity",
    });

    // Second error: Unit price mismatch in 内装工事
    expect(errorDetails.errors[1]).toEqual({
      itemName: "内装工事",
      fieldName: "unitPrice",
      ocrReadValue: 2800,
      correctValue: 3000,
      discrepancyType: "unitPrice",
    });

    // Verify structured output format
    expect(errorDetails.format).toBe("json");
    expect(errorDetails.estimateId).toBe("EST-001");
    expect(errorDetails.totalDiscrepancies).toBe(2);
    expect(typeof errorDetails.timestamp).toBe("string");

    // Verify each error has all required fields
    errorDetails.errors.forEach((error: {
      itemName: string;
      fieldName: string;
      ocrReadValue: number;
      correctValue: number;
      discrepancyType: string;
    }) => {
      expect(error).toHaveProperty("itemName");
      expect(error).toHaveProperty("fieldName");
      expect(error).toHaveProperty("ocrReadValue");
      expect(error).toHaveProperty("correctValue");
      expect(error).toHaveProperty("discrepancyType");
      expect(typeof error.itemName).toBe("string");
      expect(typeof error.fieldName).toBe("string");
      expect(typeof error.discrepancyType).toBe("string");
    });

    // Verify distinct error records for multiple discrepancies
    const itemNames = errorDetails.errors.map(
      (e: { itemName: string }) => e.itemName
    );
    expect(new Set(itemNames).size).toBe(2); // Two different items with errors
  });
});