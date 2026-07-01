import { validateSlaTimeMetadata } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - SLA時間検証", () => {
  // SCEN-793
  test("SLA時間が無効値または定義されていない場合、適切なエラーが返される", () => {
    // null の場合
    expect(() =>
      validateSlaTimeMetadata({
        slaTimeMinutes: null,
        notificationId: "notif_001",
        targetDocumentType: "contract",
      })
    ).toThrow(/SLA時間が定義されていません/);

    // undefined の場合
    expect(() =>
      validateSlaTimeMetadata({
        slaTimeMinutes: undefined,
        notificationId: "notif_002",
        targetDocumentType: "proposal",
      })
    ).toThrow(/SLA時間が定義されていません/);

    // 負の数の場合
    expect(() =>
      validateSlaTimeMetadata({
        slaTimeMinutes: -30,
        notificationId: "notif_003",
        targetDocumentType: "contract",
      })
    ).toThrow(/SLA時間が無効です/);

    // 0 の場合（無効値）
    expect(() =>
      validateSlaTimeMetadata({
        slaTimeMinutes: 0,
        notificationId: "notif_004",
        targetDocumentType: "proposal",
      })
    ).toThrow(/SLA時間が無効です/);

    // NaN の場合
    expect(() =>
      validateSlaTimeMetadata({
        slaTimeMinutes: NaN,
        notificationId: "notif_005",
        targetDocumentType: "contract",
      })
    ).toThrow(/SLA時間が無効です/);

    // 文字列の場合
    expect(() =>
      validateSlaTimeMetadata({
        slaTimeMinutes: "invalid" as any,
        notificationId: "notif_006",
        targetDocumentType: "proposal",
      })
    ).toThrow(/SLA時間が無効です/);

    // 有効な値の場合はエラーが発生しない
    const result = validateSlaTimeMetadata({
      slaTimeMinutes: 60,
      notificationId: "notif_007",
      targetDocumentType: "contract",
    });

    expect(result).toEqual({
      isValid: true,
      notificationId: "notif_007",
      targetDocumentType: "contract",
      slaTimeMinutes: 60,
      validatedAt: expect.any(String),
    });

    // 浮動小数点の有効な値の場合
    const resultDecimal = validateSlaTimeMetadata({
      slaTimeMinutes: 90.5,
      notificationId: "notif_008",
      targetDocumentType: "proposal",
    });

    expect(resultDecimal).toEqual({
      isValid: true,
      notificationId: "notif_008",
      targetDocumentType: "proposal",
      slaTimeMinutes: 90.5,
      validatedAt: expect.any(String),
    });
  });
});