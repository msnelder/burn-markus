import {
  Transaction,
  Bucket,
  Adjustments,
  Adjustment,
} from "../../types/types";
import { v4 as uuidv4 } from "uuid";
import { add, format, parseISO } from "date-fns";
import { getTransactionAmounts, getTransactionsByMonth } from "./transactions";
import { sumArray } from "../../utils/math";

const getBucketIndex = (desiredBucket: Bucket, buckets: Bucket[]) => {
  let index = buckets.findIndex((bucket) => bucket.id === desiredBucket.id);
  return index;
};

const getHistoricalBuckets = (
  transactions: Transaction[],
  accountBalance: number
) => {
  let bucketMonth: string = "";
  let buckets: Bucket[] = [];
  const thisMonth = format(new Date(), "yyyy-MM");

  // Loop through all of the transactions from every account
  transactions?.map((transaction: Transaction) => {
    let transactionMonth = format(parseISO(transaction.date), "yyyy-MM");
    // If it's a new month, create a new array for that month as a "bucket"
    if (transactionMonth !== thisMonth) {
      if (transactionMonth !== bucketMonth) {
        bucketMonth = transactionMonth;
        let dateBucket: Bucket = {
          id: uuidv4(),
          month: "",
          transactions: [],
          amounts: [],
          total: 0,
          projected_total: 0,
          balance: 0,
        };
        dateBucket["month"] = bucketMonth;
        buckets.unshift(dateBucket);
      }

      // Find the bucket this transaction belongs in
      let newBucket = buckets.find(
        (bucket) => bucket.month === transactionMonth
      );
      // Put the transaction in the bucket
      newBucket.transactions = [...newBucket.transactions, transaction];
      // Put it's amount in the amounts array for easy calculation
      newBucket.amounts = [...newBucket.amounts, transaction.amount * -1];
      // Recaculate the total for the bucket
      newBucket.total = newBucket.amounts.reduce((a, b) => a + b, 0);
    }
  });

  // Compute the balance for each bucket based on current balance
  for (let i = buckets.length - 1; i >= 0; i--) {
    const bucket = buckets[i];
    if (i === buckets.length - 1) {
      bucket.balance = accountBalance;
    } else {
      bucket.balance = buckets[i + 1]["balance"] - bucket.total;
    }
  }

  return buckets;
};

const getProjectedBuckets = (
  projectedMonths: number,
  historicalBuckets: Bucket[],
  adjustments: Adjustments,
  accountBalance: number,
  transactions: Transaction[]
) => {
  let totals = [];
  let projectedTotal = 0;
  let total = 0;
  let balance = 0;
  let projectedBuckets: Bucket[] = [];

  // Create the bucket
  for (let i = 0; i < projectedMonths; i++) {
    let adjustmentAmounts = [];
    let bucketId = uuidv4();
    let newMonth = format(add(new Date(), { months: i }), "yyyy-MM");
    let adjustmentTotal = 0;
    let thisMonthsTransactions: Transaction[] = [];

    let today = new Date();
    let thisMonth = format(new Date(), "yyyy-MM");
    if (thisMonth === newMonth) {
      thisMonthsTransactions = getTransactionsByMonth(transactions, today);
    }

    if (adjustments && adjustments[newMonth]) {
      adjustmentTotal = adjustments[newMonth].reduce(
        (accumulator, adjustment: Adjustment) => {
          adjustmentAmounts.push(adjustment.amount);
          return accumulator + adjustment.amount;
        },
        0
      );
    }

    adjustmentTotal =
      adjustmentTotal +
      sumArray(
        getTransactionAmounts(thisMonthsTransactions).filter(
          (amount) => amount > 0
        )
      );

    // Get the transaction totals from each historical bucket
    historicalBuckets.map((bucket: Bucket) => {
      totals.push(bucket.total);
    });

    // Get the min value to set as the worst-case projected bucket toal
    projectedTotal = Math.min(...totals);

    // Calculate the balance adjustments (there aren't any adjustment, I should probably remove that logic)
    total = projectedTotal + adjustmentTotal;
    balance = accountBalance + total;

    // Set the balance to the current total minus the previous bucket's balance
    if (i > 0) {
      balance = projectedBuckets[i - 1]["balance"] + total;
    }

    projectedBuckets.push({
      id: bucketId,
      month: newMonth,
      transactions: thisMonthsTransactions,
      amounts: adjustmentAmounts,
      total: total,
      projected_total: projectedTotal,
      balance: balance,
    });
  }

  return projectedBuckets;
};

export { getBucketIndex, getHistoricalBuckets, getProjectedBuckets };
