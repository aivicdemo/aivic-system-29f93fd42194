import { recordFileMetadata } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-750: [normal] ファイルメタデータ自動記録 - 契約書または提案資料のアップロード時にファイルメタデータが正確に記録される
  test("ファイルメタデータが正確に記録される", () => {
    // PDF形式の契約書ファイル
    const contractFileInput = {
      fileName: "契約書_2024_01_15.pdf",
      fileFormat: "pdf",
      fileSizeBytes: 2621440, // 2.5MB
      uploadedAtUtc: "2024-01-15T14:30:00Z",
      uploadedByUserId: "user_001",
      fileHashSha256: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
    };

    const contractFileResult = recordFileMetadata(contractFileInput);

    expect(contractFileResult).toEqual({
      fileName: "契約書_2024_01_15.pdf",
      fileFormat: "pdf",
      fileSizeBytes: 2621440,
      uploadedAtUtc: "2024-01-15T14:30:00Z",
      uploadedByUserId: "user_001",
      fileHashSha256: "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
      recordedAtUtc: "2024-01-15T14:30:01Z",
      isMetadataValid: true,
    });

    // Excel形式の提案資料ファイル
    const proposalFileInput = {
      fileName: "提案資料_2024_01_20.xlsx",
      fileFormat: "xlsx",
      fileSizeBytes: 1887436, // 1.8MB
      uploadedAtUtc: "2024-01-20T09:15:00Z",
      uploadedByUserId: "user_002",
      fileHashSha256: "xyz987wvu654tsr321qpo098nml765kji432hgf109edc876ba",
    };

    const proposalFileResult = recordFileMetadata(proposalFileInput);

    expect(proposalFileResult).toEqual({
      fileName: "提案資料_2024_01_20.xlsx",
      fileFormat: "xlsx",
      fileSizeBytes: 1887436,
      uploadedAtUtc: "2024-01-20T09:15:00Z",
      uploadedByUserId: "user_002",
      fileHashSha256: "xyz987wvu654tsr321qpo098nml765kji432hgf109edc876ba",
      recordedAtUtc: "2024-01-20T09:15:01Z",
      isMetadataValid: true,
    });

    // Word形式ファイル
    const wordFileInput = {
      fileName: "要件定義書_2024_01_22.docx",
      fileFormat: "docx",
      fileSizeBytes: 524288, // 0.5MB
      uploadedAtUtc: "2024-01-22T11:45:00Z",
      uploadedByUserId: "user_003",
      fileHashSha256: "docword123456hash789field012request345contract678text901",
    };

    const wordFileResult = recordFileMetadata(wordFileInput);

    expect(wordFileResult).toEqual({
      fileName: "要件定義書_2024_01_22.docx",
      fileFormat: "docx",
      fileSizeBytes: 524288,
      uploadedAtUtc: "2024-01-22T11:45:00Z",
      uploadedByUserId: "user_003",
      fileHashSha256: "docword123456hash789field012request345contract678text901",
      recordedAtUtc: "2024-01-22T11:45:01Z",
      isMetadataValid: true,
    });

    // PowerPoint形式ファイル
    const powerpointFileInput = {
      fileName: "提案プレゼン_2024_01_25.pptx",
      fileFormat: "pptx",
      fileSizeBytes: 3145728, // 3.0MB
      uploadedAtUtc: "2024-01-25T16:20:00Z",
      uploadedByUserId: "user_004",
      fileHashSha256: "pptxslide123456hash789image012motion345transition678sound901",
    };

    const powerpointFileResult = recordFileMetadata(powerpointFileInput);

    expect(powerpointFileResult).toEqual({
      fileName: "提案プレゼン_2024_01_25.pptx",
      fileFormat: "pptx",
      fileSizeBytes: 3145728,
      uploadedAtUtc: "2024-01-25T16:20:00Z",
      uploadedByUserId: "user_004",
      fileHashSha256: "pptxslide123456hash789image012motion345transition678sound901",
      recordedAtUtc: "2024-01-25T16:20:01Z",
      isMetadataValid: true,
    });

    // メタデータの検索可能性確認：ファイルハッシュ値で一意に識別可能
    expect(contractFileResult.fileHashSha256).toBeTruthy();
    expect(contractFileResult.fileHashSha256).not.toBe(
      proposalFileResult.fileHashSha256
    );

    // メタデータの監査ログ参照確認：ユーザーID と記録日時が正確に紐付いている
    expect(contractFileResult.uploadedByUserId).toBe("user_001");
    expect(contractFileResult.recordedAtUtc).toBe("2024-01-15T14:30:01Z");

    expect(proposalFileResult.uploadedByUserId).toBe("user_002");
    expect(proposalFileResult.recordedAtUtc).toBe("2024-01-20T09:15:01Z");

    // 全ファイル形式でメタデータ記録が有効
    expect(contractFileResult.isMetadataValid).toBe(true);
    expect(proposalFileResult.isMetadataValid).toBe(true);
    expect(wordFileResult.isMetadataValid).toBe(true);
    expect(powerpointFileResult.isMetadataValid).toBe(true);
  });
});