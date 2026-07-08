import { validateEstimateFileUpload } from "../../src/logic/it-1-br-2-2-2-1";

describe("見積書ファイル形式・サイズ検証 - サイズ上限ちょうど", () => {
  // SCEN-716
  test("サイズがちょうど50MBのPDFファイルが正常に受け入れられ、エラーが発生しないこと", () => {
    const FILE_SIZE_50MB = 50 * 1024 * 1024; // 52,428,800 bytes
    const FILE_NAME = "estimate_exactly_50mb.pdf";
    const FILE_TYPE = "application/pdf";

    const uploadRequest = {
      fileName: FILE_NAME,
      fileSize: FILE_SIZE_50MB,
      fileType: FILE_TYPE,
      uploadedAt: new Date("2024-12-15T10:30:00Z"),
    };

    const result = validateEstimateFileUpload(uploadRequest);

    expect(result.isValid).toBe(true);
    expect(result.fileName).toBe(FILE_NAME);
    expect(result.fileSize).toBe(FILE_SIZE_50MB);
    expect(result.fileType).toBe(FILE_TYPE);
    expect(result.validationMessage).toBe("");
    expect(result.errorCode).toBeNull();
    expect(result.processedAt).toBeDefined();
  });

  test("サイズが50MBを1バイト超過したファイルが拒否されること", () => {
    const FILE_SIZE_OVER_50MB = 50 * 1024 * 1024 + 1; // 52,428,801 bytes
    const FILE_NAME = "estimate_over_50mb.pdf";
    const FILE_TYPE = "application/pdf";

    const uploadRequest = {
      fileName: FILE_NAME,
      fileSize: FILE_SIZE_OVER_50MB,
      fileType: FILE_TYPE,
      uploadedAt: new Date("2024-12-15T10:31:00Z"),
    };

    expect(() => validateEstimateFileUpload(uploadRequest)).toThrow(
      /ファイルサイズ/
    );
  });

  test("PDF形式以外のファイルが拒否されること", () => {
    const FILE_SIZE_50MB = 50 * 1024 * 1024;
    const FILE_NAME = "estimate_50mb.xlsx";
    const FILE_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    const uploadRequest = {
      fileName: FILE_NAME,
      fileSize: FILE_SIZE_50MB,
      fileType: FILE_TYPE,
      uploadedAt: new Date("2024-12-15T10:32:00Z"),
    };

    expect(() => validateEstimateFileUpload(uploadRequest)).toThrow(
      /ファイル形式/
    );
  });

  test("サイズがちょうど1MBのPDFファイルが正常に受け入れられること", () => {
    const FILE_SIZE_1MB = 1 * 1024 * 1024; // 1,048,576 bytes
    const FILE_NAME = "estimate_1mb.pdf";
    const FILE_TYPE = "application/pdf";

    const uploadRequest = {
      fileName: FILE_NAME,
      fileSize: FILE_SIZE_1MB,
      fileType: FILE_TYPE,
      uploadedAt: new Date("2024-12-15T10:33:00Z"),
    };

    const result = validateEstimateFileUpload(uploadRequest);

    expect(result.isValid).toBe(true);
    expect(result.fileName).toBe(FILE_NAME);
    expect(result.fileSize).toBe(FILE_SIZE_1MB);
    expect(result.errorCode).toBeNull();
  });

  test("空のファイルが拒否されること", () => {
    const FILE_SIZE_ZERO = 0;
    const FILE_NAME = "estimate_empty.pdf";
    const FILE_TYPE = "application/pdf";

    const uploadRequest = {
      fileName: FILE_NAME,
      fileSize: FILE_SIZE_ZERO,
      fileType: FILE_TYPE,
      uploadedAt: new Date("2024-12-15T10:34:00Z"),
    };

    expect(() => validateEstimateFileUpload(uploadRequest)).toThrow(
      /ファイルサイズ/
    );
  });

  test("ファイル名が空またはnullの場合が拒否されること", () => {
    const FILE_SIZE_50MB = 50 * 1024 * 1024;
    const FILE_TYPE = "application/pdf";

    const uploadRequest = {
      fileName: "",
      fileSize: FILE_SIZE_50MB,
      fileType: FILE_TYPE,
      uploadedAt: new Date("2024-12-15T10:35:00Z"),
    };

    expect(() => validateEstimateFileUpload(uploadRequest)).toThrow(
      /ファイル名/
    );
  });

  test("サイズがちょうど50MBのPDFファイル複数件が順序よく検証されること", () => {
    const FILE_SIZE_50MB = 50 * 1024 * 1024;
    const FILE_TYPE = "application/pdf";

    const uploadRequest1 = {
      fileName: "estimate_1.pdf",
      fileSize: FILE_SIZE_50MB,
      fileType: FILE_TYPE,
      uploadedAt: new Date("2024-12-15T10:36:00Z"),
    };

    const uploadRequest2 = {
      fileName: "estimate_2.pdf",
      fileSize: FILE_SIZE_50MB,
      fileType: FILE_TYPE,
      uploadedAt: new Date("2024-12-15T10:37:00Z"),
    };

    const result1 = validateEstimateFileUpload(uploadRequest1);
    const result2 = validateEstimateFileUpload(uploadRequest2);

    expect(result1.isValid).toBe(true);
    expect(result1.fileName).toBe("estimate_1.pdf");
    expect(result2.isValid).toBe(true);
    expect(result2.fileName).toBe("estimate_2.pdf");
  });
});