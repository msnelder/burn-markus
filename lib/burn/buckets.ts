import { Transaction, Bucket } from "../../types/types";
import moment from "moment";

const getBucketIndex = (bucketMonth: string, buckets: Bucket[]) => {
  let index = buckets.findIndex((bucket) => bucket.month === bucketMonth);
  return index;
};

const createHistoricalBuckets = (
  transactions: Transaction[],
  accountBalance: number
) => {
  let bucketMonth: string = "";
  let buckets: Bucket[] = [];

  // Loop through all of the transactions from every account
  transactions?.map((transaction: Transaction) => {
    let transactionMonth = moment(transaction.date).format("YYYY-MM");
    // If it's a new month, create a new array for that month as a "bucket"
    if (transactionMonth != bucketMonth) {
      bucketMonth = transactionMonth;
      let dateBucket: Bucket = {
        id: Math.floor(Math.random() * 9000).toString(),
        month: "",
        transactions: [],
        amounts: [],
        base_total: 0,
        adjustment: 0,
        adjustments: [],
        total: 0,
        balance: 0,
      };
      dateBucket["month"] = bucketMonth;
      buckets.unshift(dateBucket);
    }

    // Find the bucket this transaction belongs in
    let thisBucket = buckets.find(
      (bucket) => bucket.month === transactionMonth
    );
    // Put the transaction in the bucket
    thisBucket.transactions.push(transaction);
    // Put it's amount in the amounts array for easy calculation
    thisBucket.amounts.push(transaction.amount);
    // Recaculate the total for the bucket
    thisBucket.total = thisBucket.amounts.reduce((a, b) => a + b, 0);
  });

  // Compute the balance for each bucket based on current balance
  for (let i = buckets.length - 1; i >= 0; i--) {
    const bucket = buckets[i];
    if (i === buckets.length - 1) {
      bucket.balance = accountBalance;
    } else {
      bucket.balance = buckets[i + 1]["balance"] + bucket.total;
    }
  }

  return buckets;
};

const createProjectedBuckets = (
  months: number,
  historicalBuckets: Bucket[],
  accountBalance: number
) => {
  let totals = [];
  let baseTotal = 0;
  let adjustment = 0;
  let adjustments = [
    {
      name: null,
      amount: 0,
    },
  ];
  let total = 0;
  let balance = 0;
  let projectedBuckets = [];

  // Get the transaction totals from each historical bucket
  historicalBuckets.map((bucket: Bucket) => {
    totals.push(bucket.total);
  });

  // Get the max value to set as the worst-case projected bucket toal
  baseTotal = Math.min(...totals);
  total = baseTotal + adjustment;
  balance = accountBalance + total;

  for (let i = 0; i < months; i++) {
    let newMonth = moment().add(i, "M").format("YYYY-MM");

    // Set the balance to the current total minus the previous bucket's balance
    if (i > 0) {
      balance = projectedBuckets[i - 1]["balance"] + total;
    }

    projectedBuckets.push({
      id: Math.floor(Math.random() * 90000).toString(),
      month: newMonth,
      base_total: baseTotal,
      adjustment: adjustment,
      adjustments: adjustments,
      total: total,
      balance: balance,
    });
  }

  return projectedBuckets;
};

export { getBucketIndex, createHistoricalBuckets, createProjectedBuckets };
