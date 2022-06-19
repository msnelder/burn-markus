import clsx from "clsx";
import { format } from "date-fns";

import styles from "./app-tabs.module.css";

const AppTabs = () => {
  return (
    <div className={styles["tabs"]}>
      <div
        className={clsx(styles["tab-square"], styles["tab-icon"], {
          [styles["active"]]: false,
        })}
      >
        &#10061;
      </div>
      <div
        className={clsx(styles["tab"], {
          [styles["active"]]: true,
        })}
      >
        <span className={styles["tab-icon"]}>&#10065;</span>
        Studio Model {format(new Date(), "yyyy-mm-dd")}
      </div>
      <div
        className={clsx(styles["tab-add"], {
          [styles["active"]]: false,
        })}
      >
        <div className={styles["tab-add-button"]}>&#10158;</div>
        New Model
      </div>
    </div>
  );
};

export default AppTabs;
