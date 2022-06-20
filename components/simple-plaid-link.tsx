import React, { useCallback, useState } from "react";
import { Home, Zap, ZapOff } from "react-feather";

import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";

const PlaidLink = ({ setAccessToken, accessToken }: { setAccessToken: any; accessToken: string }) => {
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

      // All I need to do here is send the access_token back to the server and store it
      setAccessToken(data.access_token);
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
      <button onClick={() => open()} className="button button-small button-primary text-gray-100">
        {!ready || accessToken !== null ? <Zap size={12} /> : <ZapOff size={12} color={"var(--gray-300)"} />}
        {!ready || accessToken !== null ? (
          <span style={{ color: "var(--gray-300)" }}>Connected</span>
        ) : (
          <span style={{ color: "var(--gray-300)" }}>Connect a Bank</span>
        )}
      </button>
    </>
  );
};

export default PlaidLink;
