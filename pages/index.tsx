import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { v4 as uuidv4 } from "uuid";
import clsx from "clsx";
import { formatUSD } from "../utils/format";
import Chart from "../components/chart";
import PlaidLink from "../components/simple-plaid-link";
import { Account, Transaction, Bucket, Adjustment } from "../types/types";
import { getTransactions } from "../lib/plaid/transactions";
import { getHistoricalBuckets, getProjectedBuckets } from "../lib/burn/buckets";
import { useSessionStorage } from "../lib/hooks/useSessionStorage";
import { getTransactionAmounts } from "../lib/burn/transactions";
import { sumArray, percentChange } from "../utils/math";

import styles from "./index.module.css";
import AppTabs from "../components/app-tabs";
import { format, parseISO, startOfMonth, sub } from "date-fns";

export default function Home() {
  const [accessToken, setAccessToken] = useSessionStorage("access_token", null);
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(0);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [historicalBuckets, setHistoricalBuckets] = useState<Bucket[] | null>(null);
  const [adjustments, setAdjustments] = useSessionStorage("adjustments", null);
  const [reports, setReports] = useSessionStorage("reports", null);

  const today = new Date();

  /* TODO:
    - [ ] Create multiple reports
    - [ ] Disconnect bank account
    ===== Future State
    - [ ] Move to reducers
    - [ ] Storing the adjustments - move to stupabase
    */

  const sumAccountBalances = (accounts: Account[], transactions: Transaction[]) => {
    let balances: number[] = [];
    let accountBalance: number = 0;
    accounts?.map((account: Account) => {
      balances.push(account.balances.available);
    });
    const thisMonthsTransactions = getTransactionAmounts(transactions, today);

    accountBalance = sumArray(balances) - sumArray(thisMonthsTransactions);
    return accountBalance;
  };

  const createHistoricalBuckets = async (transactions: Transaction[], accountBalance: number) => {
    const historicalBuckets = await getHistoricalBuckets(transactions, accountBalance);

    setHistoricalBuckets(historicalBuckets);
  };

  const createAdjustment = (modifiedBucket: Bucket) => {
    let newAdjustment: Adjustment = {
      id: uuidv4(),
      name: null,
      amount: 0,
      bucket_id: modifiedBucket.id,
      enabled: true,
    };

    setAdjustments({
      ...adjustments,
      [modifiedBucket.month]: adjustments?.hasOwnProperty(modifiedBucket.month)
        ? [{ ...newAdjustment }, ...adjustments[modifiedBucket.month]]
        : [newAdjustment],
    });
  };

  const updateAdjustments = (
    modifiedBucket: Bucket,
    updatedAdjustment: Adjustment,
    newAmount?: string,
    newName?: string,
    enabled?: boolean
  ) => {
    // Udpate the adjustments state
    const newAdjustments = { ...adjustments };

    if (newAmount) {
      newAdjustments[modifiedBucket.month].find((adjustment) => adjustment.id === updatedAdjustment.id).amount =
        ~~newAmount;
    }

    if (newName) {
      newAdjustments[modifiedBucket.month].find((adjustment) => adjustment.id === updatedAdjustment.id).name = newName;
    }

    if (enabled !== null) {
      newAdjustments[modifiedBucket.month].find((adjustment) => adjustment.id === updatedAdjustment.id).enabled =
        enabled;
    }

    setAdjustments(newAdjustments);
  };

  const deleteAdjustment = (modifiedBucket: Bucket, updatedAdjustment: Adjustment) => {
    // Udpate the adjustments state
    let newAdjustments = { ...adjustments };

    newAdjustments[modifiedBucket.month] = newAdjustments[modifiedBucket.month].filter(
      (adjustment: Adjustment) => adjustment.id !== updatedAdjustment.id
    );

    setAdjustments(newAdjustments);
  };

  const sumAmounts = (amounts: number[]) => {
    const expenses = amounts.filter((amount) => amount < 0);
    const expensesTotal = expenses.reduce((a, b) => a + b, 0);

    const revenue = amounts.filter((amount) => amount > 0);
    const revenueTotal = revenue.reduce((a, b) => a + b, 0);

    const profitLoss: { expenses: number; revenue: number } = {
      expenses: expensesTotal,
      revenue: revenueTotal,
    };

    return profitLoss;
  };

  const projectedBuckets = useMemo(() => {
    if (historicalBuckets) {
      let buckets: Bucket[] = getProjectedBuckets(6, historicalBuckets, adjustments, accountBalance, transactions);
      return buckets;
    }
  }, [historicalBuckets, adjustments]);

  const finalMonthBalance: {
    amount: number;
    change: number;
    changePercentage: number;
  } = {
    amount: projectedBuckets?.slice(-1).pop().balance,
    change: projectedBuckets?.slice(-1).pop().balance - accountBalance,
    changePercentage: percentChange(accountBalance, projectedBuckets?.slice(-1).pop().balance),
  };

  useEffect(() => {
    if (!accessToken) return;
    getTransactions(accessToken).then((data) => {
      if (data.accounts) {
        let accountBalance: number = sumAccountBalances(data.accounts, data.transactions);
        setAccountBalance(accountBalance);
        setTransactions(data.transactions);
        setAccounts(data.accounts);
      } else {
        setAccessToken(null);
      }
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
        <div className={styles["header-left"]}>
          <div className={styles["header-logo"]}>
            <img className={styles["header-mark"]} src="/images/logo.svg" alt="" />
            Burn
          </div>
          <AppTabs />
        </div>

        <div className={styles["header-right"]}>
          <div className={styles["actions"]}>
            <PlaidLink setAccessToken={setAccessToken} accessToken={accessToken} />
          </div>
        </div>
      </header>

      <main>
        {/* start: balance-header */}
        <div className={styles["balance-header"]}>
          <div className={clsx(styles["transaction-date"])}>
            Available Balance as of {format(startOfMonth(new Date()), "MMM dd ’yy")} (All Accounts)
          </div>
          <h2 className="font-mono">
            {accounts
              ? formatUSD(accountBalance, {
                  maximumFractionDigits: 2,
                })
              : formatUSD(0, {
                  maximumFractionDigits: 2,
                })}
          </h2>
          {projectedBuckets ? (
            <div className={styles["balance-summary"]}>
              {formatUSD(finalMonthBalance.amount, {
                maximumFractionDigits: 2,
              })}

              <span
                className={clsx(
                  {
                    "text-green-400": finalMonthBalance.change - accountBalance > 0,
                    "text-red-400": finalMonthBalance.change - accountBalance < 0,
                  },
                  "font-mono"
                )}
              >
                {" "}
                ({finalMonthBalance.change >= 0 ? "+" : null}
                {`${finalMonthBalance.changePercentage}%`})
              </span>

              <span className={styles["balance-summary-date"]}>
                {format(parseISO(projectedBuckets?.slice(-1).pop().month), "MMM ’yy")}
              </span>
            </div>
          ) : null}
        </div>
        {/* end: balance-header */}

        <Chart
          data={historicalBuckets?.concat(projectedBuckets)}
          xAxisKey="month"
          areaKey="balance"
          balance={accountBalance}
        />

        {/* start: monthly-layout */}
        <div className={styles["bucket-layout"]}>
          {historicalBuckets
            ? historicalBuckets.map((bucket: Bucket) => (
                <div key={bucket.month} className={styles["bucket"]}>
                  <div className={styles["bucket-month"]}>{format(parseISO(bucket.month), "MMM ’yy")}</div>
                  <div className={styles["bucket-balance"]}>
                    {formatUSD(bucket.balance, { maximumFractionDigits: 2 })}
                  </div>
                  {/* start: balance-group */}
                  <div className={styles["bucket-balance-group"]}>
                    <div className={clsx(styles["profit-loss-total"])}>
                      Net {formatUSD(bucket.total, { maximumFractionDigits: 2 })}
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
                      <li key={transaction.transaction_id} className={clsx(styles["transaction-item"])}>
                        <div className={clsx(styles["transaction-date"])}>
                          {format(parseISO(transaction.date), "MM-dd")}
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
                <div key={bucket.month} className={styles["bucket"]}>
                  <div className={styles["bucket-month"]}>{format(parseISO(bucket.month), "MMM ’yy")}</div>
                  <div className={styles["bucket-balance"]}>
                    {formatUSD(bucket.balance, {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  {/* start: balance-group */}
                  <div className={styles["bucket-balance-group"]}>
                    <div className={clsx(styles["profit-loss-total"])}>
                      Net {formatUSD(bucket.total, { maximumFractionDigits: 2 })}
                    </div>
                    <div className={styles["profit-loss"]}>
                      {bucket.transactions.length > 0 ? (
                        <>
                          <div className={clsx(styles["profit-loss-revenue"])}>
                            {formatUSD(
                              sumArray(getTransactionAmounts(bucket.transactions).filter((amount) => amount > 0)),
                              { maximumFractionDigits: 2 }
                            )}
                          </div>
                        </>
                      ) : null}
                      <div className={clsx(styles["profit-loss-revenue"])}>
                        {formatUSD(sumAmounts(bucket.amounts).revenue, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className={clsx(styles["profit-loss-expense"])}>
                        {formatUSD(bucket.projected_total, {
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
                  <div className={styles["button-adjustment-actions"]}>
                    <div
                      className={clsx(
                        "button button-small button-primary button-text right",
                        styles["button-adjustment-add"]
                      )}
                      onClick={(e) => {
                        createAdjustment(bucket);
                      }}
                    >
                      &#43; Add Adjustment
                    </div>
                  </div>
                  <div className={styles["transaction-list"]}>
                    {adjustments && adjustments[bucket.month]
                      ? adjustments[bucket.month].map((adjustment: Adjustment, i) => (
                          <div key={adjustment.id} className={clsx("input-group-inline", styles["adjustment-row"])}>
                            <input
                              className={clsx(styles["adjustment-input-name"], {
                                [styles["disabled"]]: !adjustment.enabled,
                              })}
                              type="text"
                              defaultValue={adjustment.name || null}
                              placeholder={`Adjustment ${i + 1}`}
                              onChange={(e) => {
                                updateAdjustments(bucket, adjustment, undefined, e.target.value, true);
                              }}
                            />
                            <input
                              className={clsx(styles["adjustment-input-value"], {
                                [styles["disabled"]]: !adjustment.enabled,
                              })}
                              type="number"
                              defaultValue={adjustment.amount || "0"}
                              onChange={(e) => {
                                updateAdjustments(bucket, adjustment, e.target.value, undefined, true);
                              }}
                              onWheel={() => {
                                return false;
                              }}
                            />
                            <div className={styles["adjustment-actions"]}>
                              <div
                                className={clsx("button button-xsmall button-primary", styles["adjustment-toggle"])}
                                onClick={(e) => {
                                  updateAdjustments(bucket, adjustment, undefined, undefined, !adjustment.enabled);
                                }}
                              >
                                {adjustment.enabled ? (
                                  <span className={styles["adjustment-toggle-icon"]}>&#9863;</span>
                                ) : (
                                  <span className={styles["adjustment-toggle-icon"]}>&#9862;</span>
                                )}
                              </div>
                              <div
                                className={clsx("button button-xsmall button-primary", styles["adjustment-delete"])}
                                onClick={(e) => {
                                  deleteAdjustment(bucket, adjustment);
                                }}
                              >
                                &#10005;
                              </div>
                            </div>
                          </div>
                        ))
                      : null}
                  </div>
                  {/* end: adjustment-list */}
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
