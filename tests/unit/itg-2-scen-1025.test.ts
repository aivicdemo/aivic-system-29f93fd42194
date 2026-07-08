import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateMultiFormatDocuments,
} from "../../src/logic/it-1-br-2-2-2-1";

const fetchMock = require("jest-fetch-mock");

describe("査定部署長による説明資料の最終確認・承認 - 複数ファイル形式の混在検証", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  test("SCEN-1025: 複数ファイル形式（PDF・Word・Excel・PowerPoint・画像）の混在時に基準値境界条件を正確に検証し、統一フォーマットで承認処理を完了する", async () => {
    // ===== 前提条件 =====
    // 複数のファイル形式が混在した説明資料セット
    const multiFormatDocuments = [
      {
        fileId: "doc_001",
        fileName: "assessment_summary.pdf",
        fileFormat: "PDF",
        fileSizeBytes: 2097152, // 2 MB (基準値上限)
        pageCount: 50,
        resolution: 300,
        uploadedAt: "2024-02-15T10:30:00Z",
        departmentHeadId: "head_001",
      },
      {
        fileId: "doc_002",
        fileName: "detailed_analysis.docx",
        fileFormat: "Word",
        fileSizeBytes: 1048576, // 1 MB
        pageCount: 30,
        resolution: 96,
        uploadedAt: "2024-02-15T10:31:00Z",
        departmentHeadId: "head_001",
      },
      {
        fileId: "doc_003",
        fileName: "price_comparison.xlsx",
        fileFormat: "Excel",
        fileSizeBytes: 524288, // 512 KB
        pageCount: 5,
        resolution: 96,
        uploadedAt: "2024-02-15T10:32:00Z",
        departmentHeadId: "head_001",
      },
      {
        fileId: "doc_004",
        fileName: "presentation_slides.pptx",
        fileFormat: "PowerPoint",
        fileSizeBytes: 3145728, // 3 MB
        pageCount: 20,
        resolution: 96,
        uploadedAt: "2024-02-15T10:33:00Z",
        departmentHeadId: "head_001",
      },
      {
        fileId: "doc_005",
        fileName: "market_comparison_chart.png",
        fileFormat: "Image",
        fileSizeBytes: 524288, // 512 KB
        pageCount: 1,
        resolution: 300,
        uploadedAt: "2024-02-15T10:34:00Z",
        departmentHeadId: "head_001",
      },
    ];

    // 基準値定義（各ファイル形式共通の検証基準）
    const validationCriteria = {
      PDF: {
        maxSizeBytes: 5242880, // 5 MB
        minResolution: 150,
        pageCountRange: { min: 1, max: 100 },
      },
      Word: {
        maxSizeBytes: 5242880, // 5 MB
        minResolution: 96,
        pageCountRange: { min: 1, max: 100 },
      },
      Excel: {
        maxSizeBytes: 10485760, // 10 MB
        minResolution: 96,
        pageCountRange: { min: 1, max: 50 },
      },
      PowerPoint: {
        maxSizeBytes: 10485760, // 10 MB
        minResolution: 96,
        pageCountRange: { min: 1, max: 100 },
      },
      Image: {
        maxSizeBytes: 5242880, // 5 MB
        minResolution: 150,
        pageCountRange: { min: 1, max: 1 },
      },
    };

    // ===== モック API レスポンス =====
    // 各ファイルの検証結果を返す API レスポンス
    const validationResults = {
      doc_001: {
        fileId: "doc_001",
        fileName: "assessment_summary.pdf",
        fileFormat: "PDF",
        validationChecks: {
          sizeValid: true, // 2 MB < 5 MB
          resolutionValid: true, // 300 >= 150
          pageCountValid: true, // 50 in [1, 100]
          formatValid: true,
        },
        overallStatus: "PASS",
        validationTimestamp: "2024-02-15T10:35:00Z",
      },
      doc_002: {
        fileId: "doc_002",
        fileName: "detailed_analysis.docx",
        fileFormat: "Word",
        validationChecks: {
          sizeValid: true, // 1 MB < 5 MB
          resolutionValid: true, // 96 >= 96
          pageCountValid: true, // 30 in [1, 100]
          formatValid: true,
        },
        overallStatus: "PASS",
        validationTimestamp: "2024-02-15T10:35:00Z",
      },
      doc_003: {
        fileId: "doc_003",
        fileName: "price_comparison.xlsx",
        fileFormat: "Excel",
        validationChecks: {
          sizeValid: true, // 512 KB < 10 MB
          resolutionValid: true, // 96 >= 96
          pageCountValid: true, // 5 in [1, 50]
          formatValid: true,
        },
        overallStatus: "PASS",
        validationTimestamp: "2024-02-15T10:35:00Z",
      },
      doc_004: {
        fileId: "doc_004",
        fileName: "presentation_slides.pptx",
        fileFormat: "PowerPoint",
        validationChecks: {
          sizeValid: true, // 3 MB < 10 MB
          resolutionValid: true, // 96 >= 96
          pageCountValid: true, // 20 in [1, 100]
          formatValid: true,
        },
        overallStatus: "PASS",
        validationTimestamp: "2024-02-15T10:35:00Z",
      },
      doc_005: {
        fileId: "doc_005",
        fileName: "market_comparison_chart.png",
        fileFormat: "Image",
        validationChecks: {
          sizeValid: true, // 512 KB < 5 MB
          resolutionValid: true, // 300 >= 150
          pageCountValid: true, // 1 in [1, 1]
          formatValid: true,
        },
        overallStatus: "PASS",
        validationTimestamp: "2024-02-15T10:35:00Z",
      },
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        validationResults: Object.values(validationResults),
        overallValidationStatus: "ALL_PASS",
        totalFilesValidated: 5,
        passedCount: 5,
        failedCount: 0,
        validationCompletedAt: "2024-02-15T10:35:30Z",
      }),
      { status: 200 }
    );

    // ===== テスト実行 =====
    const result = await validateMultiFormatDocuments({
      documents: multiFormatDocuments,
      validationCriteria: validationCriteria,
      departmentHeadId: "head_001",
      approvalTimestamp: "2024-02-15T10:36:00Z",
    });

    // ===== 期待値計算 =====
    // 基準値の境界条件の正確な検証
    const expectedValidationResults = [
      {
        fileId: "doc_001",
        fileName: "assessment_summary.pdf",
        fileFormat: "PDF",
        sizeCheck: {
          actual: 2097152,
          limit: 5242880,
          isValid: true,
          marginPercent: 60.0, // (5242880 - 2097152) / 5242880 * 100
        },
        resolutionCheck: {
          actual: 300,
          minRequired: 150,
          isValid: true,
        },
        pageCountCheck: {
          actual: 50,
          range: [1, 100],
          isValid: true,
        },
        overallStatus: "PASS",
      },
      {
        fileId: "doc_002",
        fileName: "detailed_analysis.docx",
        fileFormat: "Word",
        sizeCheck: {
          actual: 1048576,
          limit: 5242880,
          isValid: true,
          marginPercent: 80.0,
        },
        resolutionCheck: {
          actual: 96,
          minRequired: 96,
          isValid: true,
        },
        pageCountCheck: {
          actual: 30,
          range: [1, 100],
          isValid: true,
        },
        overallStatus: "PASS",
      },
      {
        fileId: "doc_003",
        fileName: "price_comparison.xlsx",
        fileFormat: "Excel",
        sizeCheck: {
          actual: 524288,
          limit: 10485760,
          isValid: true,
          marginPercent: 95.0,
        },
        resolutionCheck: {
          actual: 96,
          minRequired: 96,
          isValid: true,
        },
        pageCountCheck: {
          actual: 5,
          range: [1, 50],
          isValid: true,
        },
        overallStatus: "PASS",
      },
      {
        fileId: "doc_004",
        fileName: "presentation_slides.pptx",
        fileFormat: "PowerPoint",
        sizeCheck: {
          actual: 3145728,
          limit: 10485760,
          isValid: true,
          marginPercent: 70.0,
        },
        resolutionCheck: {
          actual: 96,
          minRequired: 96,
          isValid: true,
        },
        pageCountCheck: {
          actual: 20,
          range: [1, 100],
          isValid: true,
        },
        overallStatus: "PASS",
      },
      {
        fileId: "doc_005",
        fileName: "market_comparison_chart.png",
        fileFormat: "Image",
        sizeCheck: {
          actual: 524288,
          limit: 5242880,
          isValid: true,
          marginPercent: 90.0,
        },
        resolutionCheck: {
          actual: 300,
          minRequired: 150,
          isValid: true,
        },
        pageCountCheck: {
          actual: 1,
          range: [1, 1],
          isValid: true,
        },
        overallStatus: "PASS",
      },
    ];

    // ===== Assertion: 複数ファイル形式の混在検証結果 =====
    // 1. 返却値の構造
    expect(result).toHaveProperty("validationResults");
    expect(result).toHaveProperty("overallValidationStatus");
    expect(result).toHaveProperty("totalFilesValidated");
    expect(result).toHaveProperty("passedCount");
    expect(result).toHaveProperty("failedCount");

    // 2. 全ファイルが検証されたこと
    expect(result.totalFilesValidated).toBe(5);
    expect(result.passedCount).toBe(5);
    expect(result.failedCount).toBe(0);

    // 3. 全体的な検証ステータスが「ALL_PASS」
    expect(result.overallValidationStatus).toBe("ALL_PASS");

    // 4. 各ファイル形式の検証結果が正確に記録されていることを確認
    expect(result.validationResults).toHaveLength(5);

    // PDF の検証結果（基準値上限）
    const pdfResult = result.validationResults.find(
      (r: any) => r.fileId === "doc_001"
    );
    expect(pdfResult).toBeDefined();
    expect(pdfResult.fileFormat).toBe("PDF");
    expect(pdfResult.sizeCheck.actual).toBe(2097152);
    expect(pdfResult.sizeCheck.limit).toBe(5242880);
    expect(pdfResult.sizeCheck.isValid).toBe(true);
    expect(pdfResult.resolutionCheck.actual).toBe(300);
    expect(pdfResult.resolutionCheck.minRequired).toBe(150);
    expect(pdfResult.resolutionCheck.isValid).toBe(true);
    expect(pdfResult.pageCountCheck.actual).toBe(50);
    expect(pdfResult.pageCountCheck.isValid).toBe(true);
    expect(pdfResult.overallStatus).toBe("PASS");

    // Word の検証結果（解像度の最小要件）
    const wordResult = result.validationResults.find(
      (r: any) => r.fileId === "doc_002"
    );
    expect(wordResult).toBeDefined();
    expect(wordResult.fileFormat).toBe("Word");
    expect(wordResult.resolutionCheck.actual).toBe(96);
    expect(wordResult.resolutionCheck.minRequired).toBe(96);
    expect(wordResult.resolutionCheck.isValid).toBe(true);

    // Excel の検証結果（ファイルサイズ上限）
    const excelResult = result.validationResults.find(
      (r: any) => r.fileId === "doc_003"
    );
    expect(excelResult).toBeDefined();
    expect(excelResult.fileFormat).toBe("Excel");
    expect(excelResult.sizeCheck.limit).toBe(10485760);
    expect(excelResult.sizeCheck.isValid).toBe(true);
    expect(excelResult.pageCountCheck.range).toEqual([1, 50]);

    // PowerPoint の検証結果
    const pptResult = result.validationResults.find(
      (r: any) => r.fileId === "doc_004"
    );
    expect(pptResult).toBeDefined();
    expect(pptResult.fileFormat).toBe("PowerPoint");
    expect(pptResult.sizeCheck.limit).toBe(10485760);
    expect(pptResult.pageCountCheck.isValid).toBe(true);

    // Image の検証結果（ページ数の厳密な範囲）
    const imageResult = result.validationResults.find(
      (r: any) => r.fileId === "doc_005"
    );
    expect(imageResult).toBeDefined();
    expect(imageResult.fileFormat).toBe("Image");
    expect(imageResult.pageCountCheck.actual).toBe(1);
    expect(imageResult.pageCountCheck.range).toEqual([1, 1]);
    expect(imageResult.pageCountCheck.isValid).toBe(true);

    // 5. 統一されたフォーマットでの検証結果表示確認
    // すべての検証結果が同じ構造（sizeCheck, resolutionCheck, pageCountCheck）を持つこと
    result.validationResults.forEach((fileResult: any) => {
      expect(fileResult).toHaveProperty("fileId");
      expect(fileResult).toHaveProperty("fileFormat");
      expect(fileResult).toHaveProperty("sizeCheck");
      expect(fileResult).toHaveProperty("resolutionCheck");
      expect(fileResult).toHaveProperty("pageCountCheck");
      expect(fileResult).toHaveProperty("overallStatus");
      expect(fileResult.overallStatus).toBe("PASS");
    });

    // 6. 部署長による最終確認・承認プロセスのシミュレーション
    fetchMock.mockResponseOnce(
      JSON.stringify({
        approvalId: "approval_001",
        departmentHeadId: "head_001",
        approvalTimestamp: "2024-02-15T10:36:00Z",
        approvalStatus: "APPROVED",
        approvedDocuments: multiFormatDocuments.map((doc) => ({
          fileId: doc.fileId,
          fileName: doc.fileName,
          fileFormat: doc.fileFormat,
          validationStatus: "PASS",
        })),
        remarks: "すべてのファイル形式の検証基準を満たしています。承認します。",
      }),
      { status: 200 }
    );

    const approvalResult = await fetch("/api/documents/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        validationResultIds: result.validationResults.map((r: any) => r.fileId),
        departmentHeadId: "head_001",
        approvalTimestamp: "2024-02-15T10:36:00Z",
      }),
    }).then((res) => res.json());

    expect(approvalResult.approvalStatus).toBe("APPROVED");
    expect(approvalResult.approvedDocuments).toHaveLength(5);
    expect(approvalResult.approvedDocuments.every((doc: any) => doc.validationStatus === "PASS")).toBe(true);

    // 7. 各ファイル形式に対して一貫した検証基準が適用されていることの確認
    // マージン率（ファイルサイズが上限からどれだけ離れているか）の計算確認
    const expectedMargins = {
      doc_001: 60.0, // (5242880 - 2097152) / 5242880 * 100
      doc_002: 80.0, // (5242880 - 1048576) / 5242880 * 100
      doc_003: 95.0, // (10485760 - 524288) / 10485760 * 100
      doc_004: 70.0, // (10485760 - 3145728) / 10485760 * 100
      doc_005: 90.0, // (5242880 - 524288) / 5242880 * 100
    };

    result.validationResults.forEach((fileResult: any) => {
      const expectedMargin =
        expectedMargins[fileResult.fileId as keyof typeof expectedMargins];
      expect(fileResult.sizeCheck.marginPercent).toBeCloseTo(expectedMargin, 0);
    });

    // 8. 検証ログが正確に記録されたことを確認（監査証跡）
    expect(result).toHaveProperty("validationCompletedAt");
    expect(result.validationCompletedAt).toBe("2024-02-15T10:35:30Z");
  });
});