import { recordContractDocumentVersionHistory } from "../../src/logic/it-1781935279444-1-1-1";

describe("契約書・提案資料のバージョン履歴自動記録", () => {
  test("SCEN-761: 同一資料の複数バージョンが時系列順序を保持して記録される", () => {
    // テストデータ準備
    const documentId = "doc-contract-001";
    const documentName = "基本契約書";
    const documentType = "contract";

    // タイムスタンプ（T1 < T2 < T3）
    const timestamp_t1 = new Date("2024-01-15T09:00:00Z");
    const timestamp_t2 = new Date("2024-01-15T10:30:00Z");
    const timestamp_t3 = new Date("2024-01-15T14:00:00Z");

    // v1.0を時刻T1に登録
    const versionHistory_v1_0 = recordContractDocumentVersionHistory({
      documentId: documentId,
      documentName: documentName,
      documentType: documentType,
      versionNumber: "v1.0",
      uploadedAt: timestamp_t1,
      uploadedBy: "user-rep-001",
      changeDescription: "初版作成",
    });

    expect(versionHistory_v1_0).toEqual(
      expect.objectContaining({
        documentId: documentId,
        documentName: documentName,
        documentType: documentType,
        versions: expect.arrayContaining([
          expect.objectContaining({
            versionNumber: "v1.0",
            uploadedAt: timestamp_t1.toISOString(),
            uploadedBy: "user-rep-001",
            changeDescription: "初版作成",
          }),
        ]),
      })
    );

    // v1.1を時刻T2に登録
    const versionHistory_v1_1 = recordContractDocumentVersionHistory({
      documentId: documentId,
      documentName: documentName,
      documentType: documentType,
      versionNumber: "v1.1",
      uploadedAt: timestamp_t2,
      uploadedBy: "user-rep-002",
      changeDescription: "表示順序の微調整",
      previousVersionHistory: versionHistory_v1_0,
    });

    expect(versionHistory_v1_1.versions).toHaveLength(2);
    expect(versionHistory_v1_1.versions[0].versionNumber).toBe("v1.0");
    expect(versionHistory_v1_1.versions[1].versionNumber).toBe("v1.1");

    // v2.0を時刻T3に登録
    const versionHistory_v2_0 = recordContractDocumentVersionHistory({
      documentId: documentId,
      documentName: documentName,
      documentType: documentType,
      versionNumber: "v2.0",
      uploadedAt: timestamp_t3,
      uploadedBy: "user-rep-001",
      changeDescription: "大幅改訂、契約条件を更新",
      previousVersionHistory: versionHistory_v1_1,
    });

    // バージョン履歴の一覧を取得
    const finalVersionHistory = versionHistory_v2_0;

    // すべてのバージョンが存在することを確認
    expect(finalVersionHistory.versions).toHaveLength(3);
    expect(finalVersionHistory.versions.map((v) => v.versionNumber)).toEqual([
      "v1.0",
      "v1.1",
      "v2.0",
    ]);

    // 時系列順序が正しく保持されていることを確認
    const version_timestamps = finalVersionHistory.versions.map((v) =>
      new Date(v.uploadedAt).getTime()
    );
    const t1_ms = timestamp_t1.getTime();
    const t2_ms = timestamp_t2.getTime();
    const t3_ms = timestamp_t3.getTime();

    expect(version_timestamps[0]).toBe(t1_ms);
    expect(version_timestamps[1]).toBe(t2_ms);
    expect(version_timestamps[2]).toBe(t3_ms);

    // T1 < T2 < T3 の順序を保持していることを確認
    expect(t1_ms < t2_ms).toBe(true);
    expect(t2_ms < t3_ms).toBe(true);

    // 最新バージョンがv2.0であることを確認
    expect(finalVersionHistory.latestVersion).toBe("v2.0");
    expect(finalVersionHistory.latestVersionUploadedAt).toBe(
      timestamp_t3.toISOString()
    );

    // 各バージョンのメタデータが正確に保持されていることを確認
    expect(finalVersionHistory.versions[0]).toEqual(
      expect.objectContaining({
        versionNumber: "v1.0",
        uploadedAt: timestamp_t1.toISOString(),
        uploadedBy: "user-rep-001",
        changeDescription: "初版作成",
      })
    );
    expect(finalVersionHistory.versions[1]).toEqual(
      expect.objectContaining({
        versionNumber: "v1.1",
        uploadedAt: timestamp_t2.toISOString(),
        uploadedBy: "user-rep-002",
        changeDescription: "表示順序の微調整",
      })
    );
    expect(finalVersionHistory.versions[2]).toEqual(
      expect.objectContaining({
        versionNumber: "v2.0",
        uploadedAt: timestamp_t3.toISOString(),
        uploadedBy: "user-rep-001",
        changeDescription: "大幅改訂、契約条件を更新",
      })
    );
  });
});