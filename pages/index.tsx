import { useState, useEffect } from "react";
import Head from "next/head";
import moment from "moment";
import clsx from "clsx";
import { formatUSD } from "../utils/format";
import styles from "./index.module.css";
import PlaidLink from "../components/simple-plaid-link";

export default function Home() {
  const [accounts, setAccounts] = useState<[] | null>(null);
  const [accountBalance, setAccountBalance] = useState<number | null>(0);
  const [transactions, setTransactions] = useState<[] | null>([]);
  const [history, setHistory] = useState<any>([]);
  const [projection, setProjection] = useState<any>([]);

  type Transaction = {
    transaction_id: string;
    date: string;
    amount: number;
  };

  type Bucket = {
    id: string;
    month: string;
    transactions: [];
    amounts: [];
    base_total: number;
    adjustment: number;
    total: number;
    balance: number;
  };

  type Account = {
    account_id: string;
    name: string;
    balances: {
      available: number;
      current: number;
    };
  };

  useEffect(() => {
    createTransactionBuckets();
  }, [transactions]); // <-- dependency array

  const getTransactions = async () => {
    const accessToken = sessionStorage.getItem("access_token");
    const response = await fetch("/api/plaid/transactions", {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken }),
    });
    let data = await response.json();

    return data;
  };

  const sumAccountBalances = (accounts: []) => {
    let balances = [];
    let totalBalance = 0;
    accounts.map((account: Account) => {
      balances.push(account.balances.available);
    });

    totalBalance = balances.reduce((a, b) => a + b, 0);
    setAccountBalance(totalBalance);
  };

  const createTransactionBuckets = () => {
    let bucketMonth = "";
    let buckets = [];
    transactions.map((transaction: Transaction) => {
      let transactionMonth = moment(transaction.date).format("YYYY-MM");
      // If it's a new month, create a new array for that month as a "bucket"
      if (transactionMonth != bucketMonth) {
        bucketMonth = transactionMonth;
        let dateBucket = {
          id: Math.floor(Math.random() * 9000).toString(),
          month: "",
          transactions: [],
          amounts: [],
          total: 0,
        };
        dateBucket["month"] = bucketMonth;
        buckets.unshift(dateBucket);
      }

      // Put the transaction into its bucket
      let thisBucket = buckets.find(
        (bucket) => bucket.month === transactionMonth
      );
      thisBucket.transactions.push(transaction);
      thisBucket.amounts.push(transaction.amount);
      thisBucket.total = thisBucket.amounts.reduce((a, b) => a + b, 0);
    });
    setHistory({ buckets });
  };

  const createProjectedBuckets = (months: number) => {
    let totals = [];
    let baseTotal = 0;
    let adjustment = 0;
    let total = 0;
    let balance = 0;
    let buckets = [];

    // Get teh transaction totals from each historical bucket
    history.buckets.map((bucket: Bucket) => {
      totals.push(bucket.total);
    });

    // Get the max value to set as the worst-case projected bucket toal
    baseTotal = Math.max(...totals);
    total = baseTotal + adjustment;
    balance = accountBalance - total;

    for (let i = 0; i < months; i++) {
      let newMonth = moment().add(i, "M").format("YYYY-MM");

      // Set the balance to the current total minus the previous bucket's balance
      if (i > 0) {
        balance = buckets[i - 1]["balance"] - total;
      }

      buckets.push({
        id: Math.floor(Math.random() * 90000).toString(),
        month: newMonth,
        base_total: baseTotal,
        adjustment: adjustment,
        total: total,
        balance: balance,
      });
    }
    setProjection({ buckets });
  };

  const updateBucketTotal = (month: string, adjustment: string) => {
    let buckets = projection.buckets;
    let bucketIndex = buckets.findIndex((bucket) => bucket.month === month);
    let bucket = buckets[bucketIndex];
    let nextBucket = buckets[bucketIndex + 1];

    // Update the current bucket according to the latest adjustment
    // Conver the adjustment from a string to a number
    bucket["adjustment"] = ~~adjustment;
    bucket["total"] = bucket["base_total"] + ~~adjustment;
    bucket["balance"] = accountBalance - bucket["total"];

    // TO-DO - Change the balance on the subsequent buckets
    setProjection({ buckets });
  };

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
          <button
            onClick={() => {
              getTransactions().then((data) => {
                setTransactions(data.transactions);
                setAccounts(data.accounts);
                sumAccountBalances(data.accounts);
              });
            }}
            className="button"
          >
            Get transactions
          </button>

          <button
            onClick={() => {
              createProjectedBuckets(5);
            }}
            disabled={transactions.length <= 0}
            className="button"
          >
            Generate Projections
          </button>
        </div>
      </header>

      <main>
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
        <div className={styles["month-layout"]}>
          {history.buckets
            ? history.buckets.map((bucket: Bucket) => (
                <div key={bucket.month} className={styles["month"]}>
                  <div>{moment(bucket.month).format("MMMM - YYYY")}</div>
                  <div className={styles["amount-total"]}>
                    {formatUSD(bucket.total, { maximumFractionDigits: 2 })}
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
          {projection.buckets
            ? projection.buckets.map((bucket: Bucket) => (
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
      </main>
    </div>
  );
}
