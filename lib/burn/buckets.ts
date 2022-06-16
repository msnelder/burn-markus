import { Transaction, Bucket } from "../../types/types";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";

const getBucketIndex = (desiredBucket: Bucket, buckets: Bucket[]) => {
  let index = buckets.findIndex((bucket) => bucket.id === desiredBucket.id);
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
        id: uuidv4(),
        month: "",
        transactions: [],
        amounts: [],
        adjustments: [],
        total: 0,
        projected_total: 0,
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
    thisBucket.transactions = [...thisBucket.transactions, transaction];
    // Put it's amount in the amounts array for easy calculation
    thisBucket.amounts = [...thisBucket.amounts, transaction.amount * -1];
    // Recaculate the total for the bucket
    thisBucket.total = thisBucket.amounts.reduce((a, b) => a + b, 0);
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

const createProjectedBuckets = (
  projectedMonths: number,
  historicalBuckets: Bucket[],
  accountBalance: number
) => {
  let totals = [];
  let projectedTotal = 0;
  let total = 0;
  let balance = 0;
  let projectedBuckets = [];

  // Get the transaction totals from each historical bucket
  historicalBuckets.map((bucket: Bucket) => {
    totals.push(bucket.total);
  });

  // Get the min value to set as the worst-case projected bucket toal
  projectedTotal = Math.min(...totals);

  // Calculate the balance adjustments (there aren't any adjustment, I should probably remove that logic)
  total = projectedTotal;
  balance = accountBalance + total;

  // Create the bucket
  for (let i = 0; i < projectedMonths; i++) {
    let bucketId = uuidv4();
    let newMonth = moment().add(i, "M").format("YYYY-MM");
    let adjustments = [];

    // Set the balance to the current total minus the previous bucket's balance
    if (i > 0) {
      balance = projectedBuckets[i - 1]["balance"] + total;
    }

    projectedBuckets.push({
      id: bucketId,
      month: newMonth,
      adjustments: adjustments,
      total: total,
      projected_total: projectedTotal,
      balance: balance,
    });
  }

  return projectedBuckets;
};

export { getBucketIndex, createHistoricalBuckets, createProjectedBuckets };
