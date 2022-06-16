import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import clsx from "clsx";
import { formatUSD } from "../utils/format";
import Chart from "../components/chart";
import PlaidLink from "../components/simple-plaid-link";
import {
  Account,
  Transaction,
  Bucket,
  Adjustment,
  Adjustments,
} from "../types/types";
import { getTransactions } from "../lib/plaid/transactions";
import { getHistoricalBuckets, getProjectedBuckets } from "../lib/burn/buckets";
import styles from "./index.module.css";
import { useSessionStorage } from "../lib/hooks/useSessionStorage";

export default function Home() {
  const [accessToken, setAccessToken] = useSessionStorage("access_token", null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(0);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [monthlyBuckets, setMonthyBuckets] = useState<{
    historical: Bucket[];
  }>({
    historical: [],
  });
  const [adjustments, setAdjustments] = useState<Adjustments | {}>({});

  /* TODO:
    - [ ] Generate all projected months on fly
    - [ ] Fix the account balance to exclude all expenses month-to-date
    - [ ] Fix how totals are calculated after adjustment
    - [ ] Move calculated fields to helper methods
    - [ ] Enable / Disable adjustment
    - [ ] Move away from indexes wherever possible
    - [ ] Restructure adjustments
    - [ ] Store adjustments in local storage
    - [ ] Move to reducers
    - [ ] Storing the adjustments - move to stupabase
    */

  const sumAccountBalances = (accounts: Account[]) => {
    let balances: number[] = [];
    let accountBalance: number = 0;
    accounts?.map((account: Account) => {
      balances.push(account.balances.available);
    });

    accountBalance = balances.reduce((a, b) => a + b, 0);
    return accountBalance;
  };

  const createMonthlyBuckets = async (
    transactions: Transaction[],
    accountBalance: number
  ) => {
    const historicalBuckets = await getHistoricalBuckets(
      transactions,
      accountBalance
    );

    setMonthyBuckets({
      historical: historicalBuckets,
    });
  };

  const createAdjustment = (modifiedBucket: Bucket) => {
    let newAdjustment: Adjustment = {
      id: uuidv4(),
      name: null,
      amount: 0,
      bucket_id: modifiedBucket.id,
    };

    setAdjustments({
      ...adjustments,
      [modifiedBucket.month]: adjustments.hasOwnProperty(modifiedBucket.month)
        ? [...adjustments[modifiedBucket.month], newAdjustment]
        : [newAdjustment],
    });
  };

  const updateAdjustments = (
    modifiedBucket: Bucket,
    newAmount: string,
    updatedAdjustment: Adjustment
  ) => {
    // Udpate the adjustments state
    setAdjustments((adjustments) => {
      adjustments[modifiedBucket.month].find(
        (adjustment) => adjustment.id === updatedAdjustment.id
      ).amount = ~~newAmount;

      return adjustments;
    });

    const newAdjustments = { ...adjustments };
    newAdjustments[modifiedBucket.month].find(
      (adjustment) => adjustment.id === updatedAdjustment.id
    ).amount = ~~newAmount;
    setAdjustments(newAdjustments);
  };

  const projectedBuckets = useMemo(
    () =>
      getProjectedBuckets(
        6,
        monthlyBuckets.historical,
        adjustments,
        accountBalance
      ),
    [monthlyBuckets, adjustments]
  );

  useEffect(() => {
    if (!accessToken) return;
    getTransactions(accessToken).then((data) => {
      let accountBalance: number = sumAccountBalances(data.accounts);
      setAccountBalance(accountBalance);
      setTransactions(data.transactions);
      setAccounts(data.accounts);
    });
  }, [accessToken]); // <-- dependency array

  useEffect(() => {
    if (transactions) {
      createMonthlyBuckets(transactions, accountBalance);
    }
  }, [transactions]); // <-- dependency array

  return (
    <div className="container">
      <Head>
        <title>Burn: We all die someday</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles["header"]}>
        <h1 className="title">Burn</h1>

        <div className={styles["actions"]}>
          <PlaidLink
            setAccessToken={setAccessToken}
            accessToken={accessToken}
          />
        </div>
      </header>

      <main>
        <Chart
          data={monthlyBuckets.historical.concat(projectedBuckets)}
          xAxisKey="month"
          areaKey="balance"
        />

        {/* start: balance-header */}
        <div className={styles["balance-header"]}>
          <div className={clsx(styles["transaction-date"])}>
            Available Balance (All Accounts)
          </div>
          <h2>
            {accounts
              ? formatUSD(accountBalance, {
                  maximumFractionDigits: 2,
                })
              : formatUSD(0, {
                  maximumFractionDigits: 2,
                })}
          </h2>
        </div>
        {/* end: balance-header */}

        {/* start: monthly-layout */}
        <div className={styles["month-layout"]}>
          {monthlyBuckets.historical
            ? monthlyBuckets.historical.map((bucket: Bucket) => (
                <div key={bucket.month} className={styles["month"]}>
                  <div>{moment(bucket.month).format("MMMM - YYYY")}</div>
                  <div className={styles["amount-total"]}>
                    {formatUSD(bucket.total, { maximumFractionDigits: 2 })}
                  </div>
                  <div
                    className={clsx(
                      styles["transaction-date"],
                      "text-green-500"
                    )}
                  >
                    {formatUSD(bucket.balance, { maximumFractionDigits: 2 })}
                  </div>
                  {/* start: transaction-list */}
                  <ul className={styles["transaction-list"]}>
                    {bucket.transactions.map((transaction: Transaction) => (
                      <li
                        key={transaction.transaction_id}
                        className={clsx(styles["transaction-item"])}
                      >
                        <div className={clsx(styles["transaction-date"])}>
                          {moment(transaction.date).format("MM-DD")}
                        </div>
                        <div
                          className={clsx(
                            styles["transaction-amount"],
                            transaction.amount < 1 && styles["income"],
                            transaction.amount > 1 && styles["expense"]
                          )}
                        >
                          {formatUSD(transaction.amount * -1, {
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {/* end: transaction-list */}
                </div>
              ))
            : null}

          {/* start: projected-months */}
          {projectedBuckets
            ? projectedBuckets.map((bucket: Bucket) => (
                <div key={bucket.month} className={styles["month"]}>
                  <div>{moment(bucket.month).format("MMMM - YYYY")}</div>
                  <div className={styles["amount-total"]}>
                    {formatUSD(bucket.total, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div
                    className={clsx(
                      styles["transaction-date"],
                      "text-green-500"
                    )}
                  >
                    {formatUSD(bucket.balance, { maximumFractionDigits: 2 })}
                  </div>

                  <div className={styles["transaction-list"]}>
                    {adjustments[bucket.month]
                      ? adjustments[bucket.month].map(
                          (adjustment: Adjustment, i) => (
                            <div
                              key={adjustment.id}
                              className="input-group-inline"
                            >
                              <input
                                className={styles["adjustment-input-name"]}
                                type="text"
                                defaultValue={adjustment.name || null}
                                placeholder={`Adjustment ${i + 1}`}
                              />
                              <input
                                className={styles["adjustment-input-value"]}
                                type="number"
                                defaultValue={adjustment.amount || "0"}
                                onChange={(e) => {
                                  updateAdjustments(
                                    bucket,
                                    e.target.value,
                                    adjustment
                                  );
                                }}
                              />
                            </div>
                          )
                        )
                      : null}
                  </div>
                  {/* end: adjustment-list */}
                  <div
                    className={clsx(
                      "button button-text button-small",
                      styles["button-adjustment-add"]
                    )}
                    onClick={(e) => {
                      createAdjustment(bucket);
                    }}
                  >
                    Add Adjustment
                  </div>
                </div>
              ))
            : null}
          {/* end: projected-months */}
        </div>
        {/* end: monthly-layout */}
      </main>
    </div>
  );
}
