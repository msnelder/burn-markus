import React, { useCallback, useState } from "react";

import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";

const PlaidLink = (props) => {
  const [token, setToken] = useState<string | null>(null);

  // get link_token from your server when component mounts
  React.useEffect(() => {
    const createLinkToken = async () => {
      const response = await fetch("/api/plaid/link-token", {
        method: "POST",
      });
      const data = await response.json();
      setToken(data.link_token);
    };
    createLinkToken();
  }, []);

  const onSuccess = useCallback<PlaidLinkOnSuccess>((publicToken, metadata) => {
    const getAccounts = async () => {
      const response = await fetch("/api/plaid/accounts", {
        method: "POST",
        body: JSON.stringify({ public_token: publicToken }),
      });
      const data = await response.json();
      console.log("data:", data);
      // All I need to do here is send the access_token back to the server and store it
      sessionStorage.setItem("access_token", data.access_token);
      sessionStorage.setItem("accounts", data.accounts);
    };
    getAccounts();
  }, []);

  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
    // onEvent
    // onExit
  });

  return (
    <>
      <button
        onClick={() => open()}
        disabled={!ready}
        className="button button-primary"
      >
        Connect a bank account
      </button>
    </>
  );
};

export default PlaidLink;
