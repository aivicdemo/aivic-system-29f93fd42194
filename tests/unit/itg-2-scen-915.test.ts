import { describe, test, expect } from "@jest/globals";
import {
  autoAssignClassificationTags,
} from "../../src/logic/it-6-2-1-1";

describe("Past project data classification tag auto-assignment", () => {
  // SCEN-915
  test("should auto-assign region code, construction type code, and supplementary tags to mixed-format past project data", () => {
    // Arrange: Mixed-format past project data
    const mixed_format_project_data = [
      {
        project_id: "PROJ-001",
        project_name: "東京都渋谷区 オフィスビル外壁工事",
        location_raw: "東京都渋谷区",
        construction_type_raw: "建築工事",
        amount: 1500000,
        quantity: 100,
        unit: "m2",
        remarks: "外壁塗装",
      },
      {
        project_id: "PROJ-002",
        project_name: "大阪府大阪市北区 道路舗装",
        location_raw: "大阪市北区",
        construction_type_raw: "土木工事",
        amount: 2500000,
        quantity: 500,
        unit: "m2",
        remarks: "アスファルト舗装",
      },
      {
        project_id: "PROJ-003",
        project_name: "愛知県名古屋市中区 内装工事",
        location_raw: "名古屋中区",
        construction_type_raw: "内装",
        amount: 800000,
        quantity: 50,
        unit: "m2",
        remarks: "床張替え",
      },
      {
        project_id: "PROJ-004",
        project_name: "東京都新宿区 設備工事",
        location_raw: "新宿区東京",
        construction_type_raw: "機械設備工事",
        amount: 3000000,
        quantity: 1,
        unit: "式",
        remarks: "HVAC設置",
      },
    ];

    // Act: Call auto-assignment function
    const assignment_result = autoAssignClassificationTags(
      mixed_format_project_data
    );

    // Assert: Verify all records have region code assigned
    expect(assignment_result).toHaveLength(4);
    expect(assignment_result[0]).toHaveProperty("region_code");
    expect(assignment_result[1]).toHaveProperty("region_code");
    expect(assignment_result[2]).toHaveProperty("region_code");
    expect(assignment_result[3]).toHaveProperty("region_code");

    // Assert: Verify region codes are correctly extracted from mixed formats
    expect(assignment_result[0].region_code).toBe("13101"); // Tokyo Shibuya
    expect(assignment_result[1].region_code).toBe("27130"); // Osaka Osaka-shi Kita-ku
    expect(assignment_result[2].region_code).toBe("23100"); // Aichi Nagoya-shi Naka-ku
    expect(assignment_result[3].region_code).toBe("13104"); // Tokyo Shinjuku-ku

    // Assert: Verify all records have construction type code assigned
    expect(assignment_result[0]).toHaveProperty("construction_type_code");
    expect(assignment_result[1]).toHaveProperty("construction_type_code");
    expect(assignment_result[2]).toHaveProperty("construction_type_code");
    expect(assignment_result[3]).toHaveProperty("construction_type_code");

    // Assert: Verify construction type codes are correctly extracted
    expect(assignment_result[0].construction_type_code).toBe("01"); // Architecture
    expect(assignment_result[1].construction_type_code).toBe("02"); // Civil Engineering
    expect(assignment_result[2].construction_type_code).toBe("03"); // Interior
    expect(assignment_result[3].construction_type_code).toBe("04"); // Machinery/Equipment

    // Assert: Verify all records have supplementary classification tags assigned
    expect(assignment_result[0]).toHaveProperty("supplementary_tags");
    expect(assignment_result[1]).toHaveProperty("supplementary_tags");
    expect(assignment_result[2]).toHaveProperty("supplementary_tags");
    expect(assignment_result[3]).toHaveProperty("supplementary_tags");

    // Assert: Verify supplementary tags are correctly assigned
    expect(assignment_result[0].supplementary_tags).toEqual([
      "外装",
      "塗装工",
    ]);
    expect(assignment_result[1].supplementary_tags).toEqual([
      "舗装",
      "路面",
    ]);
    expect(assignment_result[2].supplementary_tags).toEqual([
      "内装",
      "床工",
    ]);
    expect(assignment_result[3].supplementary_tags).toEqual([
      "設備",
      "空調",
    ]);

    // Assert: Verify all 3 required fields are assigned to every record (no gaps)
    assignment_result.forEach((record: any, index: number) => {
      expect(record.region_code).toBeDefined();
      expect(record.region_code).not.toBeNull();
      expect(record.region_code).not.toBe("");

      expect(record.construction_type_code).toBeDefined();
      expect(record.construction_type_code).not.toBeNull();
      expect(record.construction_type_code).not.toBe("");

      expect(record.supplementary_tags).toBeDefined();
      expect(record.supplementary_tags).not.toBeNull();
      expect(Array.isArray(record.supplementary_tags)).toBe(true);
      expect(record.supplementary_tags.length).toBeGreaterThan(0);
    });

    // Assert: Verify assigned tags match standard master data
    const expected_master_regions = [
      "13101",
      "27130",
      "23100",
      "13104",
    ];
    const expected_master_construction_types = ["01", "02", "03", "04"];

    assignment_result.forEach((record: any, index: number) => {
      expect(expected_master_regions).toContain(record.region_code);
      expect(expected_master_construction_types).toContain(
        record.construction_type_code
      );
    });

    // Assert: Verify no missing or duplicate assignments
    const region_code_count = assignment_result.filter(
      (r: any) => r.region_code
    ).length;
    const construction_type_code_count = assignment_result.filter(
      (r: any) => r.construction_type_code
    ).length;
    const supplementary_tags_count = assignment_result.filter(
      (r: any) => r.supplementary_tags && r.supplementary_tags.length > 0
    ).length;

    expect(region_code_count).toBe(4);
    expect(construction_type_code_count).toBe(4);
    expect(supplementary_tags_count).toBe(4);

    // Assert: Verify result structure includes original fields plus new classification fields
    expect(assignment_result[0]).toHaveProperty("project_id");
    expect(assignment_result[0]).toHaveProperty("project_name");
    expect(assignment_result[0]).toHaveProperty("location_raw");
    expect(assignment_result[0]).toHaveProperty("construction_type_raw");
    expect(assignment_result[0]).toHaveProperty("region_code");
    expect(assignment_result[0]).toHaveProperty("construction_type_code");
    expect(assignment_result[0]).toHaveProperty("supplementary_tags");
  });
});