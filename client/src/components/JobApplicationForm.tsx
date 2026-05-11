import { useEffect, useState, type FormEvent } from "react";
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
        onCancelEdit();
      } else {
        await onCreate(form);
        setForm(initialFormState);
      }
    } catch (error) {
      console.error("Save job application failed:", error);
      setErrorMessage("Could not save the application. Check the form and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel panel-form">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{editingApplication ? "Edit application" : "New application"}</p>
          <h2>{editingApplication ? "Update job application" : "Add a job application"}</h2>
        </div>
      </div>

      <form className="job-form" noValidate onSubmit={handleSubmit}>
        <label className="field">
          <span>Company Name</span>
          <input
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
            <span className="form-error">{validationErrors.companyName}</span>
          ) : null}
        </label>

        <label className="field">
          <span>Position</span>
          <input
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
            <span className="form-error">{validationErrors.position}</span>
          ) : null}
        </label>

        <label className="field">
          <span>Status</span>
          <select
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

        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingApplication ? "Save Changes" : "Add Application"}
          </button>
          {editingApplication ? (
            <button className="ghost-button" type="button" onClick={onCancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
};

export default JobApplicationForm;
