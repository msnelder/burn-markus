const getTransactions = async (accessToken: string) => {
  // const accessToken = sessionStorage.getItem("access_token");
  const response = await fetch("/api/plaid/transactions", {
    method: "POST",
    body: JSON.stringify({
      access_token: accessToken,
    }),
  });
  let data = response.json();

  return data;
};

export { getTransactions };

// export default async function handler(req, res) {
//   try {
//     const { public_token } = JSON.parse(req.body);

//     const response = await client.itemPublicTokenExchange({
//       public_token,
//     });
//     const access_token = response.data.access_token;
//     const accounts_response = await client.accountsGet({ access_token });
//     const accounts = accounts_response.data.accounts;

//     res.status(201).json({ access_token: access_token, accounts: accounts });
//   } catch (error) {
//     res.status(500).json({ msg: "There was an error reaching the Plaid API" });
//   }
// }
