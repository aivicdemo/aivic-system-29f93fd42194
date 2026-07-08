import { validateProductionApplicability } from "../../src/logic/it-6-2-2-1";

describe("本番環境適用可否判定機能", () => {
  // SCEN-1428
  test("検証データセットが不完全な場合に適用不可と判定される", () => {
    const incompleteValidationDataset = {
      assessment_criteria_data: null,
      sample_data_count: 0,
      reference_data_items: [],
      supplementary_classifications: undefined,
    };

    expect(() => {
      validateProductionApplicability(incompleteValidationDataset);
    }).toThrow(/査定基準/);

    const missingAssessmentStandards = {
      assessment_criteria_data: {
        items: [],
      },
      sample_data_count: 10,
      reference_data_items: ["item_1", "item_2"],
      supplementary_classifications: ["region", "construction_type"],
    };

    expect(() => {
      validateProductionApplicability(missingAssessmentStandards);
    }).toThrow(/査定基準/);

    const insufficientSampleData = {
      assessment_criteria_data: {
        items: [
          { item_id: "criteria_1", lower_bound: 1000, upper_bound: 5000 },
          { item_id: "criteria_2", lower_bound: 5000, upper_bound: 10000 },
        ],
      },
      sample_data_count: 4,
      reference_data_items: ["item_1", "item_2"],
      supplementary_classifications: ["region", "construction_type"],
    };

    expect(() => {
      validateProductionApplicability(insufficientSampleData);
    }).toThrow(/サンプル/);

    const missingReferenceData = {
      assessment_criteria_data: {
        items: [
          { item_id: "criteria_1", lower_bound: 1000, upper_bound: 5000 },
          { item_id: "criteria_2", lower_bound: 5000, upper_bound: 10000 },
        ],
      },
      sample_data_count: 50,
      reference_data_items: [],
      supplementary_classifications: ["region", "construction_type"],
    };

    expect(() => {
      validateProductionApplicability(missingReferenceData);
    }).toThrow(/参照/);

    const missingSupplementaryClassifications = {
      assessment_criteria_data: {
        items: [
          { item_id: "criteria_1", lower_bound: 1000, upper_bound: 5000 },
          { item_id: "criteria_2", lower_bound: 5000, upper_bound: 10000 },
        ],
      },
      sample_data_count: 50,
      reference_data_items: ["item_1", "item_2", "item_3"],
      supplementary_classifications: [],
    };

    expect(() => {
      validateProductionApplicability(missingSupplementaryClassifications);
    }).toThrow(/分類/);

    const completeValidationDataset = {
      assessment_criteria_data: {
        items: [
          { item_id: "criteria_1", lower_bound: 1000, upper_bound: 5000 },
          { item_id: "criteria_2", lower_bound: 5000, upper_bound: 10000 },
          { item_id: "criteria_3", lower_bound: 10000, upper_bound: 50000 },
        ],
      },
      sample_data_count: 120,
      reference_data_items: [
        "item_1",
        "item_2",
        "item_3",
        "item_4",
        "item_5",
      ],
      supplementary_classifications: [
        "region",
        "construction_type",
        "time_period",
      ],
    };

    const result = validateProductionApplicability(completeValidationDataset);

    expect(result).toEqual({
      is_applicable: true,
      applicability_status: "適用可",
      validation_passed_count: 4,
      validation_total_count: 4,
      message: "本番環境への適用が承認されました",
    });
  });
});