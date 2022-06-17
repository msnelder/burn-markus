import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import clsx from "clsx";
import { formatUSD } from "../utils/format";
import Chart from "../components/chart";
import PlaidLink from "../components/simple-plaid-link";
import { Account, Transaction, Bucket, Adjustment } from "../types/types";
import { getTransactions } from "../lib/plaid/transactions";
import { getHistoricalBuckets, getProjectedBuckets } from "../lib/burn/buckets";
import styles from "./index.module.css";
import { useSessionStorage } from "../lib/hooks/useSessionStorage";

export default function Home() {
  const [accessToken, setAccessToken] = useSessionStorage("access_token", null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(0);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [historicalBuckets, setHistoricalBuckets] = useState<Bucket[] | null>(
    null
  );
  // const [adjustments, setAdjustments] = useState<Adjustments | {}>({});
  const [adjustments, setAdjustments] = useSessionStorage("adjustments", null);

  /* TODO:
    - [ ] Fix the account balance to exclude all expenses month-to-date
    - [ ] Enable / Disable adjustment
    ===== Future State
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

  const createHistoricalBuckets = async (
    transactions: Transaction[],
    accountBalance: number
  ) => {
    const historicalBuckets = await getHistoricalBuckets(
      transactions,
      accountBalance
    );

    setHistoricalBuckets(historicalBuckets);
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
      [modifiedBucket.month]: adjustments?.hasOwnProperty(modifiedBucket.month)
        ? [...adjustments[modifiedBucket.month], newAdjustment]
        : [newAdjustment],
    });
  };

  const updateAdjustments = (
    modifiedBucket: Bucket,
    updatedAdjustment: Adjustment,
    newAmount?: string,
    newName?: string
  ) => {
    // Udpate the adjustments state
    const newAdjustments = { ...adjustments };

    if (newAmount) {
      newAdjustments[modifiedBucket.month].find(
        (adjustment) => adjustment.id === updatedAdjustment.id
      ).amount = ~~newAmount;
    }

    if (newName) {
      newAdjustments[modifiedBucket.month].find(
        (adjustment) => adjustment.id === updatedAdjustment.id
      ).name = newName;
    }

    setAdjustments(newAdjustments);
  };

  const deleteAdjustment = (
    modifiedBucket: Bucket,
    updatedAdjustment: Adjustment
  ) => {
    // Udpate the adjustments state
    let newAdjustments = { ...adjustments };

    newAdjustments[modifiedBucket.month] = newAdjustments[
      modifiedBucket.month
    ].filter(
      (adjustment: Adjustment) => adjustment.id !== updatedAdjustment.id
    );

    setAdjustments(newAdjustments);
  };

  const sumAmounts = (amounts: number[]) => {
    const expenses = amounts.filter((amount) => amount < 0);
    const expensesTotal = expenses.reduce((a, b) => a + b, 0);

    const revenue = amounts.filter((amount) => amount > 0);
    const revenueTotal = revenue.reduce((a, b) => a + b, 0);

    // console.log(expenses);
    // console.log(revenue);

    const profitLoss = {
      expenses: expensesTotal,
      revenue: revenueTotal,
    };

    return profitLoss;
  };

  const projectedBuckets = useMemo(() => {
    if (historicalBuckets) {
      let buckets: Bucket[] = getProjectedBuckets(
        6,
        historicalBuckets,
        adjustments,
        accountBalance
      );
      return buckets;
    }
  }, [historicalBuckets, adjustments]);

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
      createHistoricalBuckets(transactions, accountBalance);
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
          data={historicalBuckets?.concat(projectedBuckets)}
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
          {historicalBuckets
            ? historicalBuckets.map((bucket: Bucket) => (
                <div key={bucket.month} className={styles["month"]}>
                  <div>{moment(bucket.month).format("MMMM - YYYY")}</div>
                  <div className={styles["month-balance"]}>
                    {formatUSD(bucket.balance, { maximumFractionDigits: 2 })}
                  </div>
                  {/* start: balance-group */}
                  <div className={styles["month-balance-group"]}>
                    <div className={clsx(styles["profit-loss-total"])}>
                      {formatUSD(bucket.total, { maximumFractionDigits: 2 })}
                    </div>
                    <div className={styles["profit-loss"]}>
                      <div className={clsx(styles["profit-loss-revenue"])}>
                        {formatUSD(sumAmounts(bucket.amounts).revenue, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className={clsx(styles["profit-loss-expense"])}>
                        {formatUSD(sumAmounts(bucket.amounts).expenses, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                  {/* end: balance-group */}
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
                  <div className={styles["month-balance"]}>
                    {formatUSD(bucket.balance, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  {/* start: balance-group */}
                  <div className={styles["month-balance-group"]}>
                    <div className={clsx(styles["profit-loss-total"])}>
                      {formatUSD(bucket.total, { maximumFractionDigits: 2 })}
                    </div>
                    <div className={styles["profit-loss"]}>
                      <div className={clsx(styles["profit-loss-revenue"])}>
                        {formatUSD(sumAmounts(bucket.amounts).revenue, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className={clsx(styles["profit-loss-expense"])}>
                        {formatUSD(sumAmounts(bucket.amounts).expenses, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  </div>
                  {/* end: balance-group */}

                  {/* start: adjustment-list */}
                  <div className={styles["transaction-list"]}>
                    {adjustments && adjustments[bucket.month]
                      ? adjustments[bucket.month].map(
                          (adjustment: Adjustment, i) => (
                            <div
                              key={adjustment.id}
                              className={clsx(
                                "input-group-inline",
                                styles["adjustment-row"]
                              )}
                            >
                              <input
                                className={styles["adjustment-input-name"]}
                                type="text"
                                defaultValue={adjustment.name || null}
                                placeholder={`Adjustment ${i + 1}`}
                                onChange={(e) => {
                                  updateAdjustments(
                                    bucket,
                                    adjustment,
                                    undefined,
                                    e.target.value
                                  );
                                }}
                              />
                              <input
                                className={styles["adjustment-input-value"]}
                                type="number"
                                defaultValue={adjustment.amount || "0"}
                                onChange={(e) => {
                                  updateAdjustments(
                                    bucket,
                                    adjustment,
                                    e.target.value,
                                    undefined
                                  );
                                }}
                                onWheel={() => {
                                  return false;
                                }}
                              />
                              <div className={styles["adjustment-actions"]}>
                                <div
                                  className="button button-xsmall button-round"
                                  onClick={(e) => {
                                    deleteAdjustment(bucket, adjustment);
                                  }}
                                >
                                  X
                                </div>
                              </div>
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
