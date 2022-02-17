import { useState, useEffect } from "react";
import Head from "next/head";
import moment from "moment";
import clsx from "clsx";
import { formatUSD } from "../utils/format";
import styles from "./index.module.css";
import PlaidLink from "../components/simple-plaid-link";

export default function Home() {
  const [transactions, setTransactions] = useState<any | null>([]);
  const [transactionBuckets, setTransactionBuckets] = useState<any | null>([]);
  const [projectedBuckets, setProjectedBuckets] = useState<any | null>([]);

  useEffect(() => {
    console.log("Transactions:", transactions);
    console.log("History:", transactionBuckets);
    console.log("Projection:", projectedBuckets);
  });

  const getTransactions = async () => {
    const accessToken = sessionStorage.getItem("access_token");
    const response = await fetch("/api/plaid/transactions", {
      method: "POST",
      body: JSON.stringify({ access_token: accessToken }),
    });
    let data = await response.json();
    data = data.transactions;

    return data;
  };

  const createTransactionBuckets = () => {
    let bucketMonth;
    let buckets = [];
    transactions.map((t) => {
      let transactionMonth = moment(t.date).format("YYYY-MM");
      // If it's a new month, create a new array for that month as a "bucket"
      if (transactionMonth != bucketMonth) {
        bucketMonth = transactionMonth;
        let dateBucket = {
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
      thisBucket.transactions.push(t);
      thisBucket.amounts.push(t.amount);
      thisBucket.total = thisBucket.amounts.reduce((a, b) => a + b, 0);
    });
    setTransactionBuckets(buckets);
  };

  const createProjectedBuckets = (months: 3) => {
    let totals = [];
    let baseTotal = 0;
    let adjustment = 0;
    let buckets = [];

    transactionBuckets.map((b) => {
      totals.push(b.total);
    });

    baseTotal = Math.max(...totals);

    for (let i = 0; i < months; i++) {
      let newMonth = moment().add(i, "M").format("YYYY-MM");
      buckets.push({
        month: newMonth,
        base_total: baseTotal,
        adjustment: adjustment,
        total: baseTotal + adjustment,
      });
    }
    console.log(buckets);
    setProjectedBuckets(buckets);
  };

  const updateBucketTotal = (month: string, adjustment: string) => {
    let buckets = projectedBuckets;
    let bucketIndex = buckets.findIndex((bucket) => bucket.month === month);
    buckets[bucketIndex]["adjustment"] = ~~adjustment;
    buckets[bucketIndex]["total"] =
      buckets[bucketIndex]["base_total"] + ~~adjustment;
    setProjectedBuckets(buckets);
    console.log("New Projection:", projectedBuckets);
  };

  return (
    <div className="container">
      <Head>
        <title>Burn: We all die someday</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <h1 className="title">Burn</h1>

        <p className="description">Connect your bank account to get started</p>
        <div className={styles["actions"]}>
          <PlaidLink />
          <button
            onClick={() => {
              getTransactions().then((data) => {
                setTransactions(data);
              });
            }}
            className="button"
          >
            Get transactions
          </button>

          <button
            onClick={() => {
              createTransactionBuckets();
            }}
            disabled={transactions.length === 0}
            className="button"
          >
            Generate History
          </button>

          <button
            onClick={() => {
              createProjectedBuckets(3);
            }}
            disabled={transactions.length === 0}
            className="button"
          >
            Generate Projections
          </button>
        </div>
      </header>

      <main className={styles["month-layout"]}>
        {transactionBuckets.map((b) => (
          <div key={b.month} className={styles["month"]}>
            <div>{moment(b.month).format("MMMM - YYYY")}</div>
            <div className={styles["amount-total"]}>
              {formatUSD(b.total, { maximumFractionDigits: 2 })}
            </div>
            <ul className={styles["transaction-list"]}>
              {b.transactions.map((t) => (
                <li
                  key={t.transaction_id}
                  className={clsx(styles["transaction-item"])}
                >
                  <div className={clsx(styles["transaction-date"])}>
                    {t.date}
                  </div>
                  <div className={styles["transaction-amount"]}>
                    {formatUSD(t.amount, { maximumFractionDigits: 2 })}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {projectedBuckets.map((b) => (
          <div key={b.month} className={styles["month"]}>
            <div>{moment(b.month).format("MMMM - YYYY")}</div>
            <div className={styles["amount-total"]}>
              {formatUSD(b.total, {
                maximumFractionDigits: 2,
              })}
            </div>
            <ul className={styles["transaction-list"]}>
              <input
                type="number"
                value={b.adjustments}
                onChange={(e) => {
                  updateBucketTotal(b.month, e.target.value);
                }}
              />
            </ul>
          </div>
        ))}
      </main>
    </div>
  );
}
