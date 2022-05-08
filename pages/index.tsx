import { useState, useEffect } from "react";
import Head from "next/head";
import moment from "moment";
import clsx from "clsx";
import { formatUSD } from "../utils/format";
import Chart from "../components/chart";
import PlaidLink from "../components/simple-plaid-link";
import { Account, Transaction, Bucket } from "./types";
import { getTransactions } from "../lib/plaid/transactions";
import {
  createHistoricalBuckets,
  createProjectedBuckets,
} from "../lib/burn/buckets";
import styles from "./index.module.css";

export default function Home() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(0);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [historicalBuckets, setHistoricalBuckets] = useState<Bucket[]>([]);
  const [projectedBuckets, setProjectedBuckets] = useState<Bucket[]>([]);
  const [monthlyBuckets, setMonthyBuckets] = useState<{
    historical: Bucket[];
    projected: Bucket[];
  }>({
    historical: [],
    projected: [],
  });
  const [concatonatedBuckets, setConcatonatedBuckets] = useState<Bucket[]>([]);

  const sumAccountBalances = (accounts: Account[]) => {
    let balances: number[] = [];
    let accountBalance: number = 0;
    accounts.map((account: Account) => {
      balances.push(account.balances.available);
    });

    accountBalance = balances.reduce((a, b) => a + b, 0);
    return accountBalance;
  };

  const createMonthlyBuckets = async (
    transactions: Transaction[],
    accountBalance: number
  ) => {
    const historicalBuckets = await createHistoricalBuckets(
      transactions,
      accountBalance
    );
    const projectedBuckets = await createProjectedBuckets(
      6,
      historicalBuckets,
      accountBalance
    );
    setHistoricalBuckets(historicalBuckets);
    setProjectedBuckets(projectedBuckets);
    setConcatonatedBuckets(historicalBuckets.concat(projectedBuckets));
    setMonthyBuckets({
      historical: historicalBuckets,
      projected: projectedBuckets,
    });
  };

  const updateBucketTotal = (month: string, adjustment: string) => {
    // Find the bucket this adjustment happened in
    let buckets = monthlyBuckets.projected;
    let adjustedBucketIndex = buckets.findIndex(
      (bucket) => bucket.month === month
    );
    let bucket = buckets[adjustedBucketIndex];
    // Create an array with the buckets you have to update subsequently
    let remainginBuckets = buckets.slice(adjustedBucketIndex + 1);

    // Update the current bucket according to the latest adjustment
    // Convert the adjustment from a string to a number
    bucket["adjustment"] = ~~adjustment;
    bucket["total"] = bucket["base_total"] + ~~adjustment;

    // Set the new balance for the bucket and subsequent buckets
    if (adjustedBucketIndex > 0) {
      bucket["balance"] =
        buckets[adjustedBucketIndex - 1]["balance"] + bucket["total"];
    } else {
      bucket["balance"] = accountBalance + bucket["total"];
    }

    // Start with the next bucket in the list
    // Loop through each bucket, and update the balance based on the previous bucket

    for (let i = adjustedBucketIndex + 1; i <= remainginBuckets.length; i++) {
      buckets[i]["balance"] = buckets[i - 1]["balance"] + buckets[i]["total"];
    }

    setMonthyBuckets({
      historical: historicalBuckets,
      projected: buckets,
    });
    setProjectedBuckets(buckets);
    setConcatonatedBuckets(historicalBuckets.concat(buckets));
  };

  useEffect(() => {
    if (sessionStorage.getItem("access_token")) {
      if (transactions) {
        createMonthlyBuckets(transactions, accountBalance);
      } else {
        getTransactions().then((data) => {
          let accountBalance: number = sumAccountBalances(data.accounts);
          setAccountBalance(accountBalance);
          setTransactions(data.transactions);
          setAccounts(data.accounts);
          createMonthlyBuckets(data.transactions, accountBalance);
        });
      }
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

        <p className="description">Connect your bank account to get started</p>
        <div className={styles["actions"]}>
          <PlaidLink />
        </div>
      </header>

      <main>
        <Chart data={concatonatedBuckets} xAxisKey="month" areaKey="balance" />

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
                  <ul className={styles["transaction-list"]}>
                    {bucket.transactions.map((transaction: Transaction) => (
                      <li
                        key={transaction.transaction_id}
                        className={clsx(styles["transaction-item"])}
                      >
                        <div className={clsx(styles["transaction-date"])}>
                          {moment(transaction.date).format("MM-DD")}
                        </div>
                        <div className={styles["transaction-amount"]}>
                          {formatUSD(transaction.amount, {
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            : null}
          {monthlyBuckets.projected
            ? monthlyBuckets.projected.map((bucket: Bucket) => (
                <div key={bucket.id} className={styles["month"]}>
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
                    <input
                      className={styles["adjustment-input"]}
                      type="number"
                      defaultValue={bucket.adjustment || "0"}
                      onChange={(e) => {
                        updateBucketTotal(bucket.month, e.target.value);
                      }}
                    />
                  </div>
                </div>
              ))
            : null}
        </div>
        {/* end: monthly-layout */}
      </main>
    </div>
  );
}
