const getTransactions = async () => {
  // const accessToken = sessionStorage.getItem("access_token");
  const response = await fetch("/api/plaid/transactions", {
    method: "POST",
    body: JSON.stringify({
      access_token: sessionStorage.getItem("access_token"),
    }),
  });
  let data = await response.json();

  return data;
};

export { getTransactions };
