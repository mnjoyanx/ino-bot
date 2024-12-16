import { useState } from "react";
import useKeydown from "../../hooks/useKeydown";
import Button from "./Button";

import styles from "./styles/appExit.module.scss";

export default function AppExit({ onCancel, onConfirm }) {
  const [active, setActive] = useState(0);

  useKeydown({
    isActive: true,
    left: () => setActive(0),
    right: () => setActive(1),
    ok: () => (active === 0 ? onCancel() : onConfirm()),
    back: () => onCancel(),
  });

  return (
    <div className={styles["app-exit"]}>
      <p className={styles["title"]}>Are you sure you want to exit?</p>
      <div className={styles["actions"]}>
        <Button
          title="Cancel"
          onClick={onCancel}
          isActive={active === 0}
          onMouseEnter={() => setActive(0)}
        />
        <Button
          title="Confirm"
          onClick={onConfirm}
          isActive={active === 1}
          onMouseEnter={() => setActive(1)}
        />
      </div>
    </div>
  );
}
