import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "./ui";

export function PasswordField({
  label,
  name,
  value,
  onChange,
  current = false,
  readOnly = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange?: (value: string) => void;
  current?: boolean;
  readOnly?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      label={label}
      hint={!current && !readOnly ? "Entre 12 et 128 caractères." : undefined}
    >
      <span className="password-field">
        <input
          aria-label={label}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          autoComplete={
            readOnly ? "off" : current ? "current-password" : "new-password"
          }
          minLength={current ? 1 : 12}
          maxLength={current ? undefined : 128}
          required={!readOnly}
          readOnly={readOnly}
          spellCheck={false}
        />
        <button
          className="icon-button"
          type="button"
          aria-label={`${visible ? "Masquer" : "Afficher"} : ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </Field>
  );
}
