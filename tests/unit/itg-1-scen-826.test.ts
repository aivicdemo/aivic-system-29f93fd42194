import { registerContractFileMetadata } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-826: [normal] 契約書・提案資料バージョン管理機能 - 契約書が新規アップロードされたとき、変更日時・更新者・バージョン番号が自動記録される
  test("契約書が新規アップロードされたとき、変更日時・更新者・バージョン番号が自動記録される", () => {
    const upload_timestamp = new Date("2024-01-15T11:00:00Z");
    const uploader_user_id = "user_12345";
    const uploader_name = "田中太郎";
    const file_name = "contract_template_2024.pdf";
    const file_size_bytes = 2457600;
    const file_mime_type = "application/pdf";

    const result = registerContractFileMetadata({
      file_name: file_name,
      file_size_bytes: file_size_bytes,
      file_mime_type: file_mime_type,
      upload_timestamp: upload_timestamp,
      uploader_user_id: uploader_user_id,
      uploader_name: uploader_name,
    });

    // ①変更日時がアップロード時刻と一致
    expect(result.recorded_timestamp).toEqual(upload_timestamp);

    // ②更新者がログインユーザーと一致
    expect(result.recorded_uploader_user_id).toBe(uploader_user_id);
    expect(result.recorded_uploader_name).toBe(uploader_name);

    // ③バージョン番号が初版「1.0」
    expect(result.version_number).toBe("1.0");

    // 追加検証：記録されたファイルメタデータの完全性
    expect(result.file_name).toBe(file_name);
    expect(result.file_size_bytes).toBe(file_size_bytes);
    expect(result.file_mime_type).toBe(file_mime_type);

    // ④レコード生成状態の確認
    expect(result.record_id).toBeTruthy();
    expect(typeof result.record_id).toBe("string");
    expect(result.record_id.length).toBeGreaterThan(0);
  });
});