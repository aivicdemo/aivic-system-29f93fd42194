import { validateSalesActivityData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-690: 必須項目がすべて入力された営業活動データが検証に合格する
  test("必須項目がすべて正しい形式で入力された営業活動データが検証に合格する", () => {
    const inputData = {
      salesPersonName: "山田太郎",
      customerName: "株式会社ABC",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: 150000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.message).toBe("データ登録完了");
  });

  test("営業担当者名が20文字以内であることが検証される", () => {
    const inputData = {
      salesPersonName: "山田太郎",
      customerName: "株式会社ABC",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: 150000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(true);
  });

  test("営業担当者名が21文字以上の場合エラーが検出される", () => {
    const inputData = {
      salesPersonName: "山田太郎山田太郎山田太郎",
      customerName: "株式会社ABC",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: 150000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/営業担当者名/);
  });

  test("顧客名が空文字の場合エラーが検出される", () => {
    const inputData = {
      salesPersonName: "山田太郎",
      customerName: "",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: 150000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/顧客名/);
  });

  test("金額が数値でない場合エラーが検出される", () => {
    const inputData = {
      salesPersonName: "山田太郎",
      customerName: "株式会社ABC",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: "150000" as any,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/金額/);
  });

  test("金額が負の数の場合エラーが検出される", () => {
    const inputData = {
      salesPersonName: "山田太郎",
      customerName: "株式会社ABC",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: -50000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/金額/);
  });

  test("活動日時が無効な場合エラーが検出される", () => {
    const inputData = {
      salesPersonName: "山田太郎",
      customerName: "株式会社ABC",
      activityType: "初回訪問",
      activityDateTime: null as any,
      amount: 150000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/活動日時/);
  });

  test("活動種別が空文字の場合エラーが検出される", () => {
    const inputData = {
      salesPersonName: "山田太郎",
      customerName: "株式会社ABC",
      activityType: "",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: 150000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/活動種別/);
  });

  test("複数の必須項目が欠落している場合すべてのエラーが検出される", () => {
    const inputData = {
      salesPersonName: "",
      customerName: "",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: 150000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(2);
    expect(result.errors.some((err: string) => err.match(/営業担当者名/))).toBe(true);
    expect(result.errors.some((err: string) => err.match(/顧客名/))).toBe(true);
  });

  test("金額が0の場合は有効と判定される", () => {
    const inputData = {
      salesPersonName: "山田太郎",
      customerName: "株式会社ABC",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: 0,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("金額が1000000の場合は有効と判定される", () => {
    const inputData = {
      salesPersonName: "山田太郎",
      customerName: "株式会社ABC",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: 1000000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test("営業担当者名が20文字ちょうどの場合は有効と判定される", () => {
    const inputData = {
      salesPersonName: "山田太郎山田太郎山田",
      customerName: "株式会社ABC",
      activityType: "初回訪問",
      activityDateTime: new Date("2024-01-15T10:30:00Z"),
      amount: 150000,
    };

    const result = validateSalesActivityData(inputData);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});