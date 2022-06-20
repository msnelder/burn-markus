import { useState, useEffect } from "react";
import Avatar from "boring-avatars";
import { supabase } from "../utils/supabase-client";
import s from "./account.module.css";

const UserAccount = ({
  session,
  userAccountOpen,
  setUserAccountOpen,
}: {
  session: any;
  userAccountOpen: boolean;
  setUserAccountOpen: (value: boolean) => void;
}) => {
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState(null);
  const [lastName, setLastName] = useState(null);
  const [website, setWebsite] = useState(null);

  useEffect(() => {
    getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const user = supabase.auth.user();

      let { data, error, status } = await supabase
        .from("profiles")
        .select(`first_name, last_name, website`)
        .eq("id", user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setWebsite(data.website);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({ firstName, lastName, website }) {
    try {
      setLoading(true);
      const user = supabase.auth.user();

      const updates = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        website: website,
        updated_at: new Date(),
      };

      let { error } = await supabase.from("profiles").upsert(updates, {
        returning: "minimal", // Don't return the value after inserting
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overlay" onClick={(e) => setUserAccountOpen(!userAccountOpen)}>
      <div className={s["modal"]} onClick={(e) => e.stopPropagation()}>
        <div className={s["header"]}>
          <Avatar
            size={40}
            name={session.user.email}
            variant="marble"
            colors={["#E7EDEA", "#FFC52C", "#FB0D06", "#030D4F", "#CEECEF"]}
          />
          <div className={s["actions"]}>
            <button className="button button-block button-danger" onClick={() => supabase.auth.signOut()}>
              Sign Out
            </button>
          </div>
        </div>
        <div className="input-group">
          <input id="email" type="text" value={session.user.email} disabled />

          <input
            id="first-name"
            type="text"
            value={firstName || ""}
            placeholder="Your First Name"
            onChange={(e) => setFirstName(e.target.value)}
          />

          <input
            id="last-name"
            type="text"
            value={lastName || ""}
            placeholder="Your Last Name"
            onChange={(e) => setLastName(e.target.value)}
          />

          <input
            id="website"
            type="website"
            value={website || ""}
            placeholder="https://website.site"
            onChange={(e) => setWebsite(e.target.value)}
          />

          <button
            className="button button-block button-primary"
            onClick={() => updateProfile({ firstName, lastName, website })}
            disabled={loading}
          >
            {loading ? "Loading ..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAccount;
