export type Account = {
  account_id: string;
  name: string;
  balances: {
    available: number | null;
    current: number | null;
    mask: string;
    iso_currency_code: string;
    limit: number | null;
    unofficial_currency_code: number | null;
  };
  official_name: string | null;
  subtype: string | null;
  type: string | null;
};

export type Transaction = {
  transaction_id: string;
  date: string;
  amount: number;
};

export type Adjustment = {
  id: string;
  name: string;
  amount: number;
  bucket_id: string;
  enabled: boolean;
};

export type Adjustments = {
  [bucket_month: string]: Adjustment[];
};

export type Bucket = {
  id: string;
  month: string;
  transactions: Transaction[];
  amounts: number[];
  total: number;
  projected_total: number;
  balance: number;
};

export type Report = {};
