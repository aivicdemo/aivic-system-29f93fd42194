import { recordLearningDataUpdateMetadata } from "../../src/logic/it-6-2-2-1";

describe("学習データ更新メタデータ構造化記録", () => {
  // SCEN-1130: 必須メタデータ項目のいずれかが欠落している場合にバリデーションエラーを返す
  test("必須メタデータ項目が欠落している場合、バリデーションエラーが返却される", () => {
    // datasetId が欠落
    expect(() =>
      recordLearningDataUpdateMetadata({
        datasetId: "",
        updateDatetime: "2024-01-15T10:30:00Z",
        updaterId: "USR-001",
        version: "v2.1.0",
        changeDescription: "季節変動データを追加"
      })
    ).toThrow(/必須項目/);

    // updateDatetime が欠落
    expect(() =>
      recordLearningDataUpdateMetadata({
        datasetId: "DS-202401-001",
        updateDatetime: "",
        updaterId: "USR-001",
        version: "v2.1.0",
        changeDescription: "季節変動データを追加"
      })
    ).toThrow(/必須項目/);

    // updaterId が欠落
    expect(() =>
      recordLearningDataUpdateMetadata({
        datasetId: "DS-202401-001",
        updateDatetime: "2024-01-15T10:30:00Z",
        updaterId: "",
        version: "v2.1.0",
        changeDescription: "季節変動データを追加"
      })
    ).toThrow(/必須項目/);

    // version が欠落
    expect(() =>
      recordLearningDataUpdateMetadata({
        datasetId: "DS-202401-001",
        updateDatetime: "2024-01-15T10:30:00Z",
        updaterId: "USR-001",
        version: "",
        changeDescription: "季節変動データを追加"
      })
    ).toThrow(/必須項目/);

    // changeDescription が欠落
    expect(() =>
      recordLearningDataUpdateMetadata({
        datasetId: "DS-202401-001",
        updateDatetime: "2024-01-15T10:30:00Z",
        updaterId: "USR-001",
        version: "v2.1.0",
        changeDescription: ""
      })
    ).toThrow(/必須項目/);

    // すべての必須項目が正常に指定された場合、正常に記録される
    const result = recordLearningDataUpdateMetadata({
      datasetId: "DS-202401-001",
      updateDatetime: "2024-01-15T10:30:00Z",
      updaterId: "USR-001",
      version: "v2.1.0",
      changeDescription: "季節変動データを追加"
    });

    expect(result).toEqual({
      datasetId: "DS-202401-001",
      updateDatetime: "2024-01-15T10:30:00Z",
      updaterId: "USR-001",
      version: "v2.1.0",
      changeDescription: "季節変動データを追加",
      recordedAt: expect.any(String),
      status: "recorded"
    });

    expect(result.status).toBe("recorded");
    expect(result.recordedAt).toBeDefined();
  });
});