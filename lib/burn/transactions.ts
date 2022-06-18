import { Transaction } from "../../types/types";
import { format, parseISO } from "date-fns";

const getTransactionAmounts = (transactions: Transaction[], month?: Date) => {
  let amounts: number[] = [];

  // Loop through all of the transactions from every account
  if (month) {
    const filterMonth = format(month, "yyyy-MM");

    transactions?.map((transaction: Transaction) => {
      let transactionMonth = format(parseISO(transaction.date), "yyyy-MM");

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
  const filterMonth = format(month, "yyyy-MM");

  // Loop through all of the transactions from every account
  transactions?.map((transaction: Transaction) => {
    let transactionMonth = format(parseISO(transaction.date), "yyyy-MM");

    if (transactionMonth === filterMonth) {
      thisMonthsTransactions.push(transaction);
    }
  });

  return thisMonthsTransactions;
};

export { getTransactionAmounts, getTransactionsByMonth };
