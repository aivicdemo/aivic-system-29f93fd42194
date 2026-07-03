import { describe, test, expect } from "@jest/globals";
import {
  validateContractDocumentMetadata,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("契約書・提案資料バージョン管理機能 - メタデータ検証", () => {
  // SCEN-828
  test("メタデータが不正なファイルはアップロードが拒否され、バージョン記録が作成されない", () => {
    // 正常なメタデータの基準値を定義
    const validMetadata = {
      fileName: "contract_2024_01.pdf",
      fileSize: 2048000, // 2MB
      uploadedAt: "2024-01-15T09:00:00Z",
      uploadedBy: "user_001",
      documentType: "contract", // contract または proposal
      version: "v1.0.0",
      applicableCustomerIds: ["cust_A", "cust_B"],
      effectiveDate: "2024-01-15T00:00:00Z",
      expiryDate: "2024-12-31T23:59:59Z",
    };

    // ケース1: 必須フィールド欠落（fileName 欠落）
    const metadataWithMissingField = {
      fileSize: 2048000,
      uploadedAt: "2024-01-15T09:00:00Z",
      uploadedBy: "user_001",
      documentType: "contract",
      version: "v1.0.0",
      applicableCustomerIds: ["cust_A"],
      effectiveDate: "2024-01-15T00:00:00Z",
      expiryDate: "2024-12-31T23:59:59Z",
    };
    expect(() =>
      validateContractDocumentMetadata(metadataWithMissingField)
    ).toThrow(/ファイル名/);

    // ケース2: データ型不正（fileSize が文字列）
    const metadataWithWrongType = {
      fileName: "contract_2024_01.pdf",
      fileSize: "2048000", // 数値ではなく文字列
      uploadedAt: "2024-01-15T09:00:00Z",
      uploadedBy: "user_001",
      documentType: "contract",
      version: "v1.0.0",
      applicableCustomerIds: ["cust_A"],
      effectiveDate: "2024-01-15T00:00:00Z",
      expiryDate: "2024-12-31T23:59:59Z",
    };
    expect(() =>
      validateContractDocumentMetadata(metadataWithWrongType)
    ).toThrow(/ファイルサイズ/);

    // ケース3: ファイルサイズが上限を超過（上限は 100MB = 104857600 バイト）
    const metadataWithExcessiveSize = {
      fileName: "contract_2024_01.pdf",
      fileSize: 104857601, // 100MBを超過
      uploadedAt: "2024-01-15T09:00:00Z",
      uploadedBy: "user_001",
      documentType: "contract",
      version: "v1.0.0",
      applicableCustomerIds: ["cust_A"],
      effectiveDate: "2024-01-15T00:00:00Z",
      expiryDate: "2024-12-31T23:59:59Z",
    };
    expect(() =>
      validateContractDocumentMetadata(metadataWithExcessiveSize)
    ).toThrow(/ファイルサイズ/);

    // ケース4: ドキュメント種別が無効（contract / proposal 以外）
    const metadataWithInvalidDocType = {
      fileName: "contract_2024_01.pdf",
      fileSize: 2048000,
      uploadedAt: "2024-01-15T09:00:00Z",
      uploadedBy: "user_001",
      documentType: "invalid_type", // contract または proposal 以外
      version: "v1.0.0",
      applicableCustomerIds: ["cust_A"],
      effectiveDate: "2024-01-15T00:00:00Z",
      expiryDate: "2024-12-31T23:59:59Z",
    };
    expect(() =>
      validateContractDocumentMetadata(metadataWithInvalidDocType)
    ).toThrow(/ドキュメント種別/);

    // ケース5: 有効期限が不正（expiryDate < effectiveDate）
    const metadataWithInvalidDateRange = {
      fileName: "contract_2024_01.pdf",
      fileSize: 2048000,
      uploadedAt: "2024-01-15T09:00:00Z",
      uploadedBy: "user_001",
      documentType: "contract",
      version: "v1.0.0",
      applicableCustomerIds: ["cust_A"],
      effectiveDate: "2024-12-31T23:59:59Z", // 開始日
      expiryDate: "2024-01-15T00:00:00Z", // 終了日が前
    };
    expect(() =>
      validateContractDocumentMetadata(metadataWithInvalidDateRange)
    ).toThrow(/有効期限/);

    // ケース6: 適用対象顧客IDが空配列
    const metadataWithEmptyCustomerList = {
      fileName: "contract_2024_01.pdf",
      fileSize: 2048000,
      uploadedAt: "2024-01-15T09:00:00Z",
      uploadedBy: "user_001",
      documentType: "contract",
      version: "v1.0.0",
      applicableCustomerIds: [], // 空配列
      effectiveDate: "2024-01-15T00:00:00Z",
      expiryDate: "2024-12-31T23:59:59Z",
    };
    expect(() =>
      validateContractDocumentMetadata(metadataWithEmptyCustomerList)
    ).toThrow(/顧客/);

    // ケース7: ISO 形式の日付が不正
    const metadataWithMalformedDate = {
      fileName: "contract_2024_01.pdf",
      fileSize: 2048000,
      uploadedAt: "2024/01/15 09:00:00", // ISO形式ではない
      uploadedBy: "user_001",
      documentType: "contract",
      version: "v1.0.0",
      applicableCustomerIds: ["cust_A"],
      effectiveDate: "2024-01-15T00:00:00Z",
      expiryDate: "2024-12-31T23:59:59Z",
    };
    expect(() =>
      validateContractDocumentMetadata(metadataWithMalformedDate)
    ).toThrow(/アップロード日時/);

    // ケース8: 正常なメタデータは検証に成功し、エラーを投げない
    const validationResult = validateContractDocumentMetadata(validMetadata);
    expect(validationResult).toEqual({
      isValid: true,
      errors: [],
      versionId: expect.any(String),
      recordedAt: expect.any(String),
    });

    // ケース9: バージョン形式が不正（v1.0.0 形式ではない）
    const metadataWithInvalidVersion = {
      fileName: "contract_2024_01.pdf",
      fileSize: 2048000,
      uploadedAt: "2024-01-15T09:00:00Z",
      uploadedBy: "user_001",
      documentType: "contract",
      version: "invalid_version", // v1.0.0 形式ではない
      applicableCustomerIds: ["cust_A"],
      effectiveDate: "2024-01-15T00:00:00Z",
      expiryDate: "2024-12-31T23:59:59Z",
    };
    expect(() =>
      validateContractDocumentMetadata(metadataWithInvalidVersion)
    ).toThrow(/バージョン/);
  });
});