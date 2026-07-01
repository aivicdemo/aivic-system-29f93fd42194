import { recordCorrespondenceHistory } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-832
  test("対応履歴の自動記録機能 - 代表が対応方針を記録する際、タイムスタンプと対応者情報が自動付与される", () => {
    // 入力データ: 代表ユーザーによる対応方針の記録
    const representativeUserId = "user-rep-001";
    const representativeName = "営業代表太郎";
    const correspondencePlan = "顧客へ追加フォローアップを実施予定";
    const recordedAtTimestamp = new Date("2024-01-15T10:30:00Z");

    // 対応履歴記録を実行
    const result = recordCorrespondenceHistory({
      recordedBy: representativeUserId,
      recordedByName: representativeName,
      correspondencePlan: correspondencePlan,
      recordedAt: recordedAtTimestamp,
    });

    // 期待値: 対応履歴が正常に記録されること
    expect(result).toEqual({
      historyId: expect.any(String),
      recordedBy: representativeUserId,
      recordedByName: representativeName,
      correspondencePlan: correspondencePlan,
      recordedAt: recordedAtTimestamp,
      status: "saved",
    });

    // 検証: 保存された履歴ID が存在すること
    expect(result.historyId).toBeTruthy();

    // 検証: 対応者情報が正確に記録されていること
    expect(result.recordedByName).toBe("営業代表太郎");
    expect(result.recordedBy).toBe("user-rep-001");

    // 検証: 対応方針テキストが正確に記録されていること
    expect(result.correspondencePlan).toBe("顧客へ追加フォローアップを実施予定");

    // 検証: タイムスタンプが自動付与されていること
    expect(result.recordedAt).toEqual(new Date("2024-01-15T10:30:00Z"));

    // 検証: ステータスが「保存済み」であること
    expect(result.status).toBe("saved");
  });

  test("複数の対応方針を連続して記録し、すべての履歴がタイムスタンプと対応者情報付きで保持される", () => {
    const representativeUserId = "user-rep-001";
    const representativeName = "営業代表太郎";

    // 第1回目の対応記録
    const firstPlan = "顧客へメール送信完了";
    const firstTimestamp = new Date("2024-01-15T09:00:00Z");
    const firstResult = recordCorrespondenceHistory({
      recordedBy: representativeUserId,
      recordedByName: representativeName,
      correspondencePlan: firstPlan,
      recordedAt: firstTimestamp,
    });

    // 第2回目の対応記録
    const secondPlan = "顧客からの返信確認";
    const secondTimestamp = new Date("2024-01-15T10:15:00Z");
    const secondResult = recordCorrespondenceHistory({
      recordedBy: representativeUserId,
      recordedByName: representativeName,
      correspondencePlan: secondPlan,
      recordedAt: secondTimestamp,
    });

    // 第3回目の対応記録
    const thirdPlan = "追加フォローアップを実施予定";
    const thirdTimestamp = new Date("2024-01-15T11:30:00Z");
    const thirdResult = recordCorrespondenceHistory({
      recordedBy: representativeUserId,
      recordedByName: representativeName,
      correspondencePlan: thirdPlan,
      recordedAt: thirdTimestamp,
    });

    // 検証: 第1回目の履歴
    expect(firstResult.correspondencePlan).toBe("顧客へメール送信完了");
    expect(firstResult.recordedAt).toEqual(new Date("2024-01-15T09:00:00Z"));
    expect(firstResult.recordedByName).toBe("営業代表太郎");
    expect(firstResult.status).toBe("saved");

    // 検証: 第2回目の履歴
    expect(secondResult.correspondencePlan).toBe("顧客からの返信確認");
    expect(secondResult.recordedAt).toEqual(new Date("2024-01-15T10:15:00Z"));
    expect(secondResult.recordedByName).toBe("営業代表太郎");
    expect(secondResult.status).toBe("saved");

    // 検証: 第3回目の履歴
    expect(thirdResult.correspondencePlan).toBe("追加フォローアップを実施予定");
    expect(thirdResult.recordedAt).toEqual(new Date("2024-01-15T11:30:00Z"));
    expect(thirdResult.recordedByName).toBe("営業代表太郎");
    expect(thirdResult.status).toBe("saved");

    // 検証: 各履歴のID が異なること
    expect(firstResult.historyId).not.toBe(secondResult.historyId);
    expect(secondResult.historyId).not.toBe(thirdResult.historyId);
    expect(firstResult.historyId).not.toBe(thirdResult.historyId);

    // 検証: タイムスタンプが時系列順であること
    const firstTime = firstResult.recordedAt.getTime();
    const secondTime = secondResult.recordedAt.getTime();
    const thirdTime = thirdResult.recordedAt.getTime();
    expect(firstTime).toBeLessThan(secondTime);
    expect(secondTime).toBeLessThan(thirdTime);
  });

  test("対応方針を記録する際、必須フィールド欠落時はエラーを発生させる", () => {
    // 対応者情報が欠落している場合
    expect(() =>
      recordCorrespondenceHistory({
        recordedBy: "",
        recordedByName: "営業代表太郎",
        correspondencePlan: "顧客へフォローアップ",
        recordedAt: new Date("2024-01-15T10:30:00Z"),
      })
    ).toThrow(/対応者/);

    // 対応方針テキストが欠落している場合
    expect(() =>
      recordCorrespondenceHistory({
        recordedBy: "user-rep-001",
        recordedByName: "営業代表太郎",
        correspondencePlan: "",
        recordedAt: new Date("2024-01-15T10:30:00Z"),
      })
    ).toThrow(/対応方針/);

    // タイムスタンプが無効である場合
    expect(() =>
      recordCorrespondenceHistory({
        recordedBy: "user-rep-001",
        recordedByName: "営業代表太郎",
        correspondencePlan: "顧客へフォローアップ",
        recordedAt: new Date("invalid"),
      })
    ).toThrow(/タイムスタンプ/);
  });
});