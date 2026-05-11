import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createJobApplication, deleteJobApplication, listJobApplications } from "../api/jobApplicationsApi";
import JobApplicationForm from "./JobApplicationForm";
import { jobApplicationStatusLabels, type JobApplication, type JobApplicationCreateInput } from "../types";

const formatAppliedDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));

const Dashboard = () => {
  const { logout } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setErrorMessage(null);
        const items = await listJobApplications();
        setApplications(items);
      } catch (error) {
        console.error("Load job applications failed:", error);
        setErrorMessage("Could not load job applications.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadApplications();
  }, []);

  const handleCreate = async (input: JobApplicationCreateInput) => {
    const createdApplication = await createJobApplication(input);
    setApplications((current) => [createdApplication, ...current]);
    return createdApplication;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJobApplication(id);
      setApplications((current) => current.filter((application) => application.id !== id));
    } catch (error) {
      console.error("Delete job application failed:", error);
      setErrorMessage("Could not delete the application.");
    }
  };

  return (
    <main className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Job Application Tracker</p>
          <h1>Track every application without losing the thread.</h1>
          <p className="hero-copy">
            Keep company names, roles, and current hiring status in one place.
          </p>
        </div>

        <div className="hero-actions">
          <div className="stat-card">
            <span>Total applications</span>
            <strong>{applications.length}</strong>
          </div>
          <button className="secondary-button" onClick={logout}>
            Log out
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <JobApplicationForm onCreate={handleCreate} />

        <section className="panel panel-list">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Overview</p>
              <h2>Application dashboard</h2>
            </div>
          </div>

          {errorMessage ? <p className="callout error-callout">{errorMessage}</p> : null}

          {isLoading ? <p className="callout">Loading applications...</p> : null}

          {!isLoading && applications.length === 0 ? (
            <p className="callout">
              No applications yet. Add your first one and it will appear here immediately.
            </p>
          ) : null}

          <div className="application-list">
            {applications.map((application) => (
              <article className="application-card" key={application.id}>
                <div className="application-main">
                  <div className="application-heading">
                    <div>
                      <p className="company-name">{application.companyName}</p>
                      <h3>{application.position}</h3>
                    </div>
                    <span className={`status-pill status-${application.status}`}>
                      {jobApplicationStatusLabels[application.status]}
                    </span>
                  </div>

                  <p className="application-meta">
                    Applied on {formatAppliedDate(application.dateApplied)}
                  </p>
                </div>

                <button
                  className="text-button"
                  onClick={() => void handleDelete(application.id)}
                  type="button"
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default Dashboard;
