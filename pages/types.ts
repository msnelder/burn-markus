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

export type Bucket = {
  id: string;
  month: string;
  transactions: Transaction[];
  amounts: number[];
  base_total: number;
  adjustment: number;
  total: number;
  balance: number;
};

export type Foo = {
  // ...
};
export default Foo;
