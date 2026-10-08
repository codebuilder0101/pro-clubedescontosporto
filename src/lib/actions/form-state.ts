/** Result of a form Server Action, read by useActionState. Codes map to Auth.errors.*. */
export type FormState = {
  errors?: Record<string, string>;
  /** Echo of non-secret inputs, so the form keeps them after a failed submit. */
  values?: Record<string, string>;
  /** Success flag for actions that don't redirect. */
  ok?: boolean;
};

export const initialFormState: FormState = {};
