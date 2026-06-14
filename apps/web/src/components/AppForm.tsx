import type { ReactNode, ComponentProps } from "react";
import { useForm, FormProvider, useFormContext, type UseFormProps, type FieldValues, type SubmitHandler } from "react-hook-form";

interface AppFormProps<T extends FieldValues> {
  /** Props de React Hook Form useForm */
  formProps?: UseFormProps<T>;
  /** Callback al enviar el formulario */
  onSubmit: SubmitHandler<T>;
  /** Contenido del formulario */
  children: ReactNode;
  /** Clase CSS adicional */
  className?: string;
}

/**
 * AppForm — Wrapper de React Hook Form que provee contexto de formulario.
 *
 * @example
 * <AppForm onSubmit={(data) => console.log(data)}>
 *   <FormSection title="Datos básicos">
 *     <AppInput name="email" label="Correo" />
 *   </FormSection>
 * </AppForm>
 */
export function AppForm<T extends FieldValues>({
  formProps,
  onSubmit,
  children,
  className,
}: AppFormProps<T>) {
  const methods = useForm<T>(formProps);

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={`form-group${className ? ` ${className}` : ""}`}
      >
        {children}
      </form>
    </FormProvider>
  );
}

// --- FormSection ---
interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
}

/**
 * FormSection — Agrupa campos de un formulario en una sección con título.
 */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="form-section">
      {title && <h3 className="form-section-title">{title}</h3>}
      {description && <p className="form-section-description">{description}</p>}
      <div className="form-section-fields">
        {children}
      </div>
    </div>
  );
}

// --- AppInput ---
interface AppInputProps extends ComponentProps<"input"> {
  name: string;
  label: string;
}

/**
 * AppInput — Input de formulario integrado con React Hook Form.
 */
export function AppInput({ name, label, type = "text", ...rest }: AppInputProps) {
  const { register, formState: { errors } } = useFormContextSafe();
  const error = (errors as any)[name]?.message as string | undefined;

  // Si no hay contexto de form, renderizar input simple
  if (!register) {
    return (
      <div className="app-input-group">
        <label className="app-input-label">{label}</label>
        <input type={type} name={name} className="app-input" {...rest} />
      </div>
    );
  }

  return (
    <div className="app-input-group">
      <label className="app-input-label" htmlFor={name}>{label}</label>
      <input id={name} type={type} className={`app-input${error ? " app-input-error" : ""}`} {...register(name)} {...rest} />
      {error && <span className="app-input-error-msg">{error}</span>}
    </div>
  );
}

// --- AppSelect ---
interface AppSelectProps extends ComponentProps<"select"> {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

/**
 * AppSelect — Select de formulario integrado con React Hook Form.
 */
export function AppSelect({ name, label, options, placeholder = "Seleccionar...", ...rest }: AppSelectProps) {
  const { register, formState: { errors } } = useFormContextSafe();
  const error = (errors as any)[name]?.message as string | undefined;

  if (!register) {
    return (
      <div className="app-input-group">
        <label className="app-input-label">{label}</label>
        <select name={name} className="app-input" {...rest}>
          <option value="">{placeholder}</option>
          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
    );
  }

  return (
    <div className="app-input-group">
      <label className="app-input-label" htmlFor={name}>{label}</label>
      <select id={name} className={`app-input${error ? " app-input-error" : ""}`} {...register(name)} {...rest}>
        <option value="">{placeholder}</option>
        {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      {error && <span className="app-input-error-msg">{error}</span>}
    </div>
  );
}

// --- Helper: useFormContext seguro ---
function useFormContextSafe() {
  try {
    const ctx = useFormContext();
    return { register: ctx.register, formState: ctx.formState };
  } catch {
    return { register: null, formState: { errors: {} } };
  }
}
