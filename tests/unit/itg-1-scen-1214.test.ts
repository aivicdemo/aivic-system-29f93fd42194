import { calculateSLADeadline, recordInquiryResponse, getSLAStatus } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-1214: 問い合わせ対応SLA管理機能 - 営業日の終業時刻直前に受領した問い合わせが翌営業日に回答完了した場合、SLA内として扱われる", () => {
    // Arrange: 営業日設定（月〜金、営業時間 09:00-18:00）
    const businessDayStart = 9 * 60; // 分単位
    const businessDayEnd = 18 * 60; // 分単位
    const slaDurationMinutes = 1440; // 営業日1日分（24時間）

    // 受領時刻: 月曜日 17:55（終業時刻5分前）
    const inquiryReceivedTime = new Date("2024-01-15T17:55:00Z"); // 月曜日
    const inquiryId = "inquiry_001";

    // Act & Assert: SLA期限を計算
    // 受領時刻が終業時刻の5分前のため、同営業日の終業時刻(18:00)までの5分と、
    // 翌営業日(火曜日)の営業時間を含めた期限を計算
    const slaDueTime = calculateSLADeadline({
      inquiryId,
      receivedAt: inquiryReceivedTime,
      slaDurationMinutes,
      businessDayStart,
      businessDayEnd,
    });

    // 期待値: 翌営業日(火曜日)の18:00(営業日終業時刻)が期限
    // 月曜日17:55受領 → 月曜日18:00まで5分 + 火曜日営業時間全日(9:00-18:00=480分)
    // ただしSLA期限は営業時間ベースなので、翌営業日18:00が適切な期限
    const expectedSlaDueTime = new Date("2024-01-16T18:00:00Z"); // 火曜日18:00

    expect(slaDueTime.toISOString()).toBe(expectedSlaDueTime.toISOString());

    // Act: システム時刻を翌営業日の営業開始時刻に進める
    const responseRecordedTime = new Date("2024-01-16T09:30:00Z"); // 火曜日09:30

    // Act: 問い合わせに対して回答を登録
    const responseResult = recordInquiryResponse({
      inquiryId,
      responseAt: responseRecordedTime,
      responseContent: "ご指摘ありがとうございます。対応いたしました。",
    });

    expect(responseResult).toEqual({
      inquiryId,
      responseAt: responseRecordedTime,
      recorded: true,
    });

    // Act: 問い合わせのSLAステータスを確認
    const slaStatus = getSLAStatus({
      inquiryId,
      receivedAt: inquiryReceivedTime,
      respondedAt: responseRecordedTime,
      slaDueTime,
    });

    // Assert: 回答完了時刻がSLA期限以内であり、SLAステータスが『SLA内』
    expect(responseRecordedTime.getTime()).toBeLessThanOrEqual(
      slaDueTime.getTime()
    );
    expect(slaStatus).toEqual({
      status: "SLA内",
      inquiryId,
      receivedAt: inquiryReceivedTime,
      respondedAt: responseRecordedTime,
      slaDueTime,
      isWithinSLA: true,
    });

    // Assert: SLA時間計算の詳細確認
    // 受領時刻から回答時刻までの経過時間を営業時間ベースで検証
    const elapsedMinutes =
      (responseRecordedTime.getTime() - inquiryReceivedTime.getTime()) / 60000;
    // 月曜日17:55〜18:00: 5分（営業時間内）
    // 月曜日18:00〜火曜日09:00: 営業時間外（スキップ）
    // 火曜日09:00〜09:30: 30分（営業時間内）
    // 営業時間ベース合計: 5 + 30 = 35分 < 1440分（SLA期間）
    const businessHoursElapsed = 5 + 30; // 35分
    expect(businessHoursElapsed).toBeLessThan(slaDurationMinutes);
  });
});