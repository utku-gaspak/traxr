import { useEffect, useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  JobApplicationStatus,
  jobApplicationStatusLabels,
  type JobApplication,
  type JobApplicationCreateInput,
  type JobApplicationUpdateInput,
} from "../types";

interface JobApplicationFormProps {
  onCreate: (input: JobApplicationCreateInput) => Promise<JobApplication>;
  onUpdate: (id: string, input: JobApplicationUpdateInput) => Promise<void>;
  editingApplication: JobApplication | null;
  onCancelEdit: () => void;
  onSuccess: () => void;
}

interface ValidationErrors {
  companyName?: string;
  position?: string;
}

const initialFormState: JobApplicationCreateInput = {
  companyName: "",
  position: "",
  status: JobApplicationStatus.Applied,
};

const JobApplicationForm = ({
  onCreate,
  onUpdate,
  editingApplication,
  onCancelEdit,
  onSuccess,
}: JobApplicationFormProps) => {
  const [form, setForm] = useState<JobApplicationCreateInput>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (editingApplication) {
      setForm({
        companyName: editingApplication.companyName,
        position: editingApplication.position,
        status: editingApplication.status,
      });
    } else {
      setForm(initialFormState);
    }

    setErrorMessage(null);
    setValidationErrors({});
  }, [editingApplication]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const nextValidationErrors: ValidationErrors = {};

    if (!form.companyName.trim()) {
      nextValidationErrors.companyName = "Company name is required.";
    }

    if (!form.position.trim()) {
      nextValidationErrors.position = "Position is required.";
    }

    if (Object.keys(nextValidationErrors).length > 0) {
      setValidationErrors(nextValidationErrors);
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      if (editingApplication) {
        await onUpdate(editingApplication.id, {
          companyName: form.companyName,
          position: form.position,
          status: form.status,
          dateApplied: editingApplication.dateApplied,
        });
      } else {
        await onCreate(form);
        setForm(initialFormState);
      }

      onSuccess();
    } catch (error) {
      console.error("Save job application failed:", error);
      setErrorMessage("Could not save the application. Check the form and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-5 p-6" noValidate onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted-foreground)]">
          Company Name
        </span>
        <Input
          aria-label="Company Name"
          value={form.companyName}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({ ...current, companyName: value }));
            setValidationErrors((current) => ({ ...current, companyName: undefined }));
          }}
          placeholder="Example: Stripe"
          required
        />
        {validationErrors.companyName ? (
          <span className="text-sm text-[color:var(--color-danger)]">{validationErrors.companyName}</span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted-foreground)]">
          Position
        </span>
        <Input
          aria-label="Position"
          value={form.position}
          onChange={(event) => {
            const value = event.target.value;
            setForm((current) => ({ ...current, position: value }));
            setValidationErrors((current) => ({ ...current, position: undefined }));
          }}
          placeholder="Example: Backend Engineer"
          required
        />
        {validationErrors.position ? (
          <span className="text-sm text-[color:var(--color-danger)]">{validationErrors.position}</span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted-foreground)]">
          Status
        </span>
        <select
          aria-label="Status"
          className="h-11 rounded-none border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-ring)]"
          value={form.status}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              status: Number(event.target.value) as JobApplicationStatus,
            }))
          }
        >
          {Object.values(JobApplicationStatus)
            .filter((value): value is JobApplicationStatus => typeof value === "number")
            .map((value) => (
              <option key={value} value={value}>
                {jobApplicationStatusLabels[value]}
              </option>
            ))}
        </select>
      </label>

      {errorMessage ? (
        <p className="border border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)] px-3 py-2 text-sm text-[color:var(--color-danger)]">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : editingApplication ? "Save Changes" : "Add Application"}
        </Button>
        <Button variant="ghost" type="button" onClick={onCancelEdit}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default JobApplicationForm;
