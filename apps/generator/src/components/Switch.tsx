import styles from './Switch.module.css';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

/** A labelled on/off switch. The whole row is the control; state is conveyed by aria-checked and thumb position. */
export function Switch({ label, checked, onChange, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.switch}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.text}>{label}</span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </button>
  );
}
