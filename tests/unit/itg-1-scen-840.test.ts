import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { recordContractDocumentMetadata } from "../../src/logic/it-1781935279444-1-1-1";

const fetchMock = require("jest-fetch-mock");
fetchMock.enableMocks();

describe("営業データ項目のメタデータ管理機能", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-840
  test("新規アップロードされた契約書ファイルの変更日時・更新者・変更内容が正しく記録される", async () => {
    const uploadedAtIso = "2024-02-15T09:30:00Z";
    const uploadedAtDate = new Date(uploadedAtIso);
    const testUserId = "user_test_001";
    const testUserName = "テスト太郎";
    const fileName = "contract_2024_v1.pdf";
    const fileSize = 2048576;
    const documentType = "contract";
    const changeDescription = "新規ファイルアップロード";
    const initialVersion = "1.0";
    const documentId = "doc_20240215_001";

    const mockMetadata = {
      documentId: documentId,
      fileName: fileName,
      fileSize: fileSize,
      documentType: documentType,
      uploadedAt: uploadedAtIso,
      uploadedByUserId: testUserId,
      uploadedByUserName: testUserName,
      versionNumber: initialVersion,
      changeHistory: [
        {
          timestamp: uploadedAtIso,
          userId: testUserId,
          userName: testUserName,
          description: changeDescription,
          changeType: "upload"
        }
      ],
      isActive: true,
      createdAt: uploadedAtIso,
      updatedAt: uploadedAtIso
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockMetadata), { status: 200 });

    const inputPayload = {
      fileName: fileName,
      fileSize: fileSize,
      documentType: documentType,
      uploadedByUserId: testUserId,
      uploadedByUserName: testUserName,
      uploadedAt: uploadedAtDate,
      changeDescription: changeDescription
    };

    const result = await recordContractDocumentMetadata(inputPayload);

    expect(result).toEqual({
      documentId: documentId,
      fileName: fileName,
      fileSize: fileSize,
      documentType: documentType,
      uploadedAt: uploadedAtIso,
      uploadedByUserId: testUserId,
      uploadedByUserName: testUserName,
      versionNumber: initialVersion,
      changeHistory: [
        {
          timestamp: uploadedAtIso,
          userId: testUserId,
          userName: testUserName,
          description: changeDescription,
          changeType: "upload"
        }
      ],
      isActive: true,
      createdAt: uploadedAtIso,
      updatedAt: uploadedAtIso
    });

    expect(result.uploadedAt).toBe(uploadedAtIso);
    expect(result.uploadedByUserId).toBe(testUserId);
    expect(result.uploadedByUserName).toBe(testUserName);
    expect(result.versionNumber).toBe(initialVersion);
    expect(result.changeHistory[0].description).toBe(changeDescription);
    expect(result.changeHistory[0].changeType).toBe("upload");
    expect(result.documentType).toBe(documentType);
    expect(result.fileName).toBe(fileName);
    expect(result.isActive).toBe(true);

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toMatch(/metadata|document|contract/i);
    expect(callArgs[1].method).toMatch(/POST|PUT/);
  });
});