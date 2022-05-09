const getTransactions = async (accessToken: string) => {
  // const accessToken = sessionStorage.getItem("access_token");
  const response = await fetch("/api/plaid/transactions", {
    method: "POST",
    body: JSON.stringify({
      access_token: accessToken,
    }),
  });
  let data = await response.json();

  return data;
};

export { getTransactions };
