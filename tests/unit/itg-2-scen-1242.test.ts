import { generateStakeholderCustomizedReport } from "../../src/logic/it-1-br-2-2-2-1";

describe("Stakeholder-Customized Report Generation", () => {
  // SCEN-1242
  test("should generate assessor-oriented report with practical improvements and detailed explanation", () => {
    const reportRequest = {
      stakeholderType: "assessor",
      detailLevel: "detailed",
      generatedAt: new Date("2024-01-15T09:30:00Z"),
    };

    const report = generateStakeholderCustomizedReport(reportRequest);

    // Validate report structure
    expect(report).toHaveProperty("stakeholderType");
    expect(report).toHaveProperty("detailLevel");
    expect(report).toHaveProperty("generatedAt");
    expect(report).toHaveProperty("title");
    expect(report).toHaveProperty("content");
    expect(report).toHaveProperty("layout");
    expect(report).toHaveProperty("sections");

    // Validate stakeholder type and detail level
    expect(report.stakeholderType).toBe("assessor");
    expect(report.detailLevel).toBe("detailed");
    expect(report.generatedAt).toBe("2024-01-15T09:30:00Z");

    // Validate title includes stakeholder type
    expect(report.title).toMatch(/査定員向け/);

    // Validate report includes practical improvements
    expect(report.content).toMatch(/査定プロセス改善/);
    expect(report.content).toMatch(/品質向上/);

    // Validate report includes detailed analysis and metrics
    expect(report.content).toMatch(/現状課題/);
    expect(report.content).toMatch(/改善効果/);
    expect(report.content).toMatch(/数値/);
    expect(report.content).toMatch(/実装手順/);

    // Validate layout is assessor-friendly
    expect(report.layout).toBe("detailed_structured");

    // Validate sections exist with appropriate structure
    expect(Array.isArray(report.sections)).toBe(true);
    expect(report.sections.length).toBeGreaterThan(0);

    // Validate sections contain expected components
    const sectionTypes = report.sections.map((s: any) => s.type);
    expect(sectionTypes).toContain("heading");
    expect(sectionTypes).toContain("table");
    expect(sectionTypes).toContain("graph");
    expect(sectionTypes).toContain("narrative");

    // Validate report timestamp and stakeholder type are recorded
    expect(report).toHaveProperty("reportMetadata");
    expect(report.reportMetadata).toHaveProperty("generatedTimestamp");
    expect(report.reportMetadata).toHaveProperty("stakeholderType");
    expect(report.reportMetadata.stakeholderType).toBe("assessor");
    expect(report.reportMetadata.generatedTimestamp).toBe(
      "2024-01-15T09:30:00Z"
    );

    // Validate detailed content depth for assessor
    expect(report.content.length).toBeGreaterThan(2000);

    // Validate practical implementation guidance
    expect(report.content).toMatch(/実務的/);
    expect(report.content).toMatch(/即座/);
    expect(report.content).toMatch(/活用/);
  });
});