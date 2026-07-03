import { recordFileMetadata } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-753: [edge] ファイルメタデータ自動記録 - 同一ファイルの連続更新時に各バージョンのメタデータが正確に分離・記録される
  test("同一ファイルの連続更新時に各バージョンのメタデータが完全に分離・記録される", () => {
    const baseFileName = "sales_data.csv";
    const userId = "user_12345";
    const uploadTimestampV1 = new Date("2024-01-15T10:00:00Z");
    const uploadTimestampV2 = new Date("2024-01-15T10:00:01Z");
    const uploadTimestampV3 = new Date("2024-01-15T10:00:02Z");
    const uploadTimestampV4 = new Date("2024-01-15T10:00:03Z");

    const fileContentV1 = "customer_id,apo_count,contract_count\n101,5,2\n102,3,1";
    const fileContentV2 = "customer_id,apo_count,contract_count\n101,6,2\n102,4,1";
    const fileContentV3 = "customer_id,apo_count,contract_count\n101,7,3\n102,4,2";
    const fileContentV4 = "customer_id,apo_count,contract_count\n101,8,3\n102,5,2";

    const hashV1 = "hash_abc123_v1";
    const hashV2 = "hash_def456_v2";
    const hashV3 = "hash_ghi789_v3";
    const hashV4 = "hash_jkl012_v4";

    const fileSizeV1 = 52;
    const fileSizeV2 = 52;
    const fileSizeV3 = 52;
    const fileSizeV4 = 52;

    // バージョン1のメタデータ記録
    const metadataV1 = recordFileMetadata({
      fileName: baseFileName,
      fileContent: fileContentV1,
      fileHash: hashV1,
      fileSize: fileSizeV1,
      uploadTimestamp: uploadTimestampV1,
      uploadUserId: userId,
      mimeType: "text/csv"
    });

    expect(metadataV1.version).toBe(1);
    expect(metadataV1.fileName).toBe(baseFileName);
    expect(metadataV1.fileHash).toBe(hashV1);
    expect(metadataV1.fileSize).toBe(fileSizeV1);
    expect(metadataV1.uploadTimestamp).toEqual(uploadTimestampV1);
    expect(metadataV1.uploadUserId).toBe(userId);
    expect(metadataV1.mimeType).toBe("text/csv");

    // バージョン2のメタデータ記録
    const metadataV2 = recordFileMetadata({
      fileName: baseFileName,
      fileContent: fileContentV2,
      fileHash: hashV2,
      fileSize: fileSizeV2,
      uploadTimestamp: uploadTimestampV2,
      uploadUserId: userId,
      mimeType: "text/csv"
    });

    expect(metadataV2.version).toBe(2);
    expect(metadataV2.fileName).toBe(baseFileName);
    expect(metadataV2.fileHash).toBe(hashV2);
    expect(metadataV2.fileSize).toBe(fileSizeV2);
    expect(metadataV2.uploadTimestamp).toEqual(uploadTimestampV2);
    expect(metadataV2.uploadUserId).toBe(userId);
    // v1と完全に分離されていることを確認
    expect(metadataV2.fileHash).not.toBe(metadataV1.fileHash);
    expect(metadataV2.uploadTimestamp).not.toEqual(metadataV1.uploadTimestamp);

    // バージョン3のメタデータ記録
    const metadataV3 = recordFileMetadata({
      fileName: baseFileName,
      fileContent: fileContentV3,
      fileHash: hashV3,
      fileSize: fileSizeV3,
      uploadTimestamp: uploadTimestampV3,
      uploadUserId: userId,
      mimeType: "text/csv"
    });

    expect(metadataV3.version).toBe(3);
    expect(metadataV3.fileName).toBe(baseFileName);
    expect(metadataV3.fileHash).toBe(hashV3);
    expect(metadataV3.fileSize).toBe(fileSizeV3);
    expect(metadataV3.uploadTimestamp).toEqual(uploadTimestampV3);
    expect(metadataV3.uploadUserId).toBe(userId);
    // v1, v2と完全に分離されていることを確認
    expect(metadataV3.fileHash).not.toBe(metadataV1.fileHash);
    expect(metadataV3.fileHash).not.toBe(metadataV2.fileHash);
    expect(metadataV3.uploadTimestamp).not.toEqual(metadataV1.uploadTimestamp);
    expect(metadataV3.uploadTimestamp).not.toEqual(metadataV2.uploadTimestamp);

    // バージョン4のメタデータ記録
    const metadataV4 = recordFileMetadata({
      fileName: baseFileName,
      fileContent: fileContentV4,
      fileHash: hashV4,
      fileSize: fileSizeV4,
      uploadTimestamp: uploadTimestampV4,
      uploadUserId: userId,
      mimeType: "text/csv"
    });

    expect(metadataV4.version).toBe(4);
    expect(metadataV4.fileName).toBe(baseFileName);
    expect(metadataV4.fileHash).toBe(hashV4);
    expect(metadataV4.fileSize).toBe(fileSizeV4);
    expect(metadataV4.uploadTimestamp).toEqual(uploadTimestampV4);
    expect(metadataV4.uploadUserId).toBe(userId);
    // v1, v2, v3と完全に分離されていることを確認
    expect(metadataV4.fileHash).not.toBe(metadataV1.fileHash);
    expect(metadataV4.fileHash).not.toBe(metadataV2.fileHash);
    expect(metadataV4.fileHash).not.toBe(metadataV3.fileHash);
    expect(metadataV4.uploadTimestamp).not.toEqual(metadataV1.uploadTimestamp);
    expect(metadataV4.uploadTimestamp).not.toEqual(metadataV2.uploadTimestamp);
    expect(metadataV4.uploadTimestamp).not.toEqual(metadataV3.uploadTimestamp);

    // タイムスタンプが昇順であることを確認
    expect(metadataV1.uploadTimestamp.getTime()).toBeLessThan(metadataV2.uploadTimestamp.getTime());
    expect(metadataV2.uploadTimestamp.getTime()).toBeLessThan(metadataV3.uploadTimestamp.getTime());
    expect(metadataV3.uploadTimestamp.getTime()).toBeLessThan(metadataV4.uploadTimestamp.getTime());

    // バージョン番号が正確に昇順であることを確認
    expect(metadataV1.version).toBe(1);
    expect(metadataV2.version).toBe(2);
    expect(metadataV3.version).toBe(3);
    expect(metadataV4.version).toBe(4);

    // ファイルハッシュがすべて一意であることを確認
    const hashSet = new Set([
      metadataV1.fileHash,
      metadataV2.fileHash,
      metadataV3.fileHash,
      metadataV4.fileHash
    ]);
    expect(hashSet.size).toBe(4);

    // すべてのメタデータが同じファイル名を保持していることを確認
    expect(metadataV1.fileName).toBe(baseFileName);
    expect(metadataV2.fileName).toBe(baseFileName);
    expect(metadataV3.fileName).toBe(baseFileName);
    expect(metadataV4.fileName).toBe(baseFileName);

    // すべてのメタデータが同じユーザー情報を保持していることを確認
    expect(metadataV1.uploadUserId).toBe(userId);
    expect(metadataV2.uploadUserId).toBe(userId);
    expect(metadataV3.uploadUserId).toBe(userId);
    expect(metadataV4.uploadUserId).toBe(userId);

    // ファイルサイズが保持されていることを確認
    expect(metadataV1.fileSize).toBe(fileSizeV1);
    expect(metadataV2.fileSize).toBe(fileSizeV2);
    expect(metadataV3.fileSize).toBe(fileSizeV3);
    expect(metadataV4.fileSize).toBe(fileSizeV4);

    // MIMEタイプが保持されていることを確認
    expect(metadataV1.mimeType).toBe("text/csv");
    expect(metadataV2.mimeType).toBe("text/csv");
    expect(metadataV3.mimeType).toBe("text/csv");
    expect(metadataV4.mimeType).toBe("text/csv");
  });
});