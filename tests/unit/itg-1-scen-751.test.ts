import { describe, test, expect } from "@jest/globals";
import {
  recordFileMetadata,
  getFileMetadata,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - ファイルメタデータ自動記録", () => {
  // SCEN-751
  test("既存ファイルの編集・上書き保存時に更新日時・更新者が正確に記録される", () => {
    // ============ 初期ファイル作成 ============
    const initial_created_at = new Date("2024-01-15T09:00:00Z");
    const initial_created_by = "user_001";
    const file_id = "file_abc123";
    const file_name = "sales_metadata_v1.json";

    // 初期ファイルのメタデータを記録
    recordFileMetadata({
      file_id,
      file_name,
      created_at: initial_created_at,
      created_by: initial_created_by,
      updated_at: initial_created_at,
      updated_by: initial_created_by,
    });

    // 初期状態のメタデータを確認
    const initial_metadata = getFileMetadata({ file_id });
    expect(initial_metadata.created_at).toBe(initial_created_at.toISOString());
    expect(initial_metadata.created_by).toBe(initial_created_by);
    expect(initial_metadata.updated_at).toBe(initial_created_at.toISOString());
    expect(initial_metadata.updated_by).toBe(initial_created_by);

    // ============ ファイルを編集・上書き保存 ============
    const update_timestamp = new Date("2024-01-15T11:30:45Z");
    const update_user = "user_002";

    recordFileMetadata({
      file_id,
      file_name,
      created_at: initial_created_at,
      created_by: initial_created_by,
      updated_at: update_timestamp,
      updated_by: update_user,
    });

    // ============ 更新後のメタデータを取得・検証 ============
    const updated_metadata = getFileMetadata({ file_id });

    // 更新日時が正確に記録されていることを検証
    expect(updated_metadata.updated_at).toBe(update_timestamp.toISOString());

    // 更新者がログインユーザーと一致することを検証
    expect(updated_metadata.updated_by).toBe(update_user);

    // 作成日時が変更されていないことを確認
    expect(updated_metadata.created_at).toBe(initial_created_at.toISOString());

    // 作成者が変更されていないことを確認
    expect(updated_metadata.created_by).toBe(initial_created_by);

    // ファイル名が保持されていることを確認
    expect(updated_metadata.file_name).toBe(file_name);

    // ============ メタデータの完全性を検証 ============
    expect(updated_metadata).toEqual({
      file_id,
      file_name,
      created_at: initial_created_at.toISOString(),
      created_by: initial_created_by,
      updated_at: update_timestamp.toISOString(),
      updated_by: update_user,
    });

    // 更新日時が作成日時より後であることを検証
    expect(new Date(updated_metadata.updated_at).getTime()).toBeGreaterThan(
      new Date(updated_metadata.created_at).getTime()
    );
  });
});