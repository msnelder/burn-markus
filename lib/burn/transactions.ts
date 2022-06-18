import { Transaction } from "../../types/types";
import moment from "moment";

const getTransactionAmounts = (transactions: Transaction[], month?: Date) => {
  let amounts: number[] = [];
  const filterMonth = moment(month).format("YYYY-MM");

  // Loop through all of the transactions from every account
  if (month) {
    transactions?.map((transaction: Transaction) => {
      let transactionMonth = moment(transaction.date).format("YYYY-MM");

      if (transactionMonth === filterMonth) {
        amounts.push(transaction.amount * -1);
      }
    });
  } else {
    transactions?.map((transaction: Transaction) => {
      amounts.push(transaction.amount * -1);
    });
  }

  return amounts;
};

const getTransactionsByMonth = (transactions: Transaction[], month: Date) => {
  let thisMonthsTransactions: Transaction[] = [];
  const filterMonth = moment(month).format("YYYY-MM");

  // Loop through all of the transactions from every account
  transactions?.map((transaction: Transaction) => {
    let transactionMonth = moment(transaction.date).format("YYYY-MM");

    if (transactionMonth === filterMonth) {
      thisMonthsTransactions.push(transaction);
    }
  });

  return thisMonthsTransactions;
};

export { getTransactionAmounts, getTransactionsByMonth };
