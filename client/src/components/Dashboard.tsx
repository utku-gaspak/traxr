import axios from "axios";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import {
  BadgePlus,
  Diamond,
  ExternalLink,
  FileText,
  LogOut,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  createJobApplication,
  deleteJobApplication,
  listJobApplications,
  updateJobApplication,
} from "../api/jobApplicationsApi";
import JobApplicationForm from "./JobApplicationForm";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import {
  JobApplicationStatus,
  jobApplicationStatusLabels,
  jobApplicationStatusOrder,
  type JobApplication,
  type JobApplicationCreateInput,
  type JobApplicationUpdateInput,
} from "../types";

const formatAppliedDate = (isoDate: string) =>
  new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(isoDate));

const getLoadApplicationsErrorMessage = (error: unknown) => {
  // Keep server-side failures and connectivity failures distinct so the UI can suggest the right next step.
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Could not reach the server. Check your connection and try again.";
    }

    if (error.response.status >= 500) {
      return "Something went wrong. Please try again.";
    }
  }

  return "Could not load job applications.";
};

const boardColumns = [
  {
    status: JobApplicationStatus.Applied,
    title: "Applied",
    subtitle: "Fresh outreach",
    borderClass: "border-l-column-applied",
    accentClass: "text-column-applied",
  },
  {
    status: JobApplicationStatus.Interviewing,
    title: "Interviewing",
    subtitle: "Active conversations",
    borderClass: "border-l-column-interviewing",
    accentClass: "text-column-interviewing",
  },
  {
    status: JobApplicationStatus.Rejected,
    title: "Rejected",
    subtitle: "Closed loops",
    borderClass: "border-l-column-rejected",
    accentClass: "text-column-rejected",
  },
  {
    status: JobApplicationStatus.Offer,
    title: "Offer",
    subtitle: "Decision stage",
    borderClass: "border-l-column-offer",
    accentClass: "text-column-offer",
  },
] as const;

const buildColumns = (applications: JobApplication[]) =>
  jobApplicationStatusOrder.reduce<
    Record<JobApplicationStatus, JobApplication[]>
  >(
    (columns, status) => {
      columns[status] = applications.filter(
        (application) => application.status === status,
      );
      return columns;
    },
    {
      [JobApplicationStatus.Applied]: [],
      [JobApplicationStatus.Interviewing]: [],
      [JobApplicationStatus.Rejected]: [],
      [JobApplicationStatus.Offer]: [],
    },
  );

const flattenColumns = (
  columns: Record<JobApplicationStatus, JobApplication[]>,
) => jobApplicationStatusOrder.flatMap((status) => columns[status]);

const reorderApplications = (
  applications: JobApplication[],
  sourceStatus: JobApplicationStatus,
  destinationStatus: JobApplicationStatus,
  sourceIndex: number,
  destinationIndex: number,
) => {
  const columns = buildColumns(applications);
  const sourceItems = [...columns[sourceStatus]];
  const [movedApplication] = sourceItems.splice(sourceIndex, 1);

  if (!movedApplication) {
    return null;
  }

  const destinationItems =
    sourceStatus === destinationStatus
      ? sourceItems
      : [...columns[destinationStatus]];
  const nextApplication =
    sourceStatus === destinationStatus
      ? movedApplication
      : { ...movedApplication, status: destinationStatus };

  destinationItems.splice(destinationIndex, 0, nextApplication);

  const nextColumns = {
    ...columns,
    [sourceStatus]: sourceItems,
    [destinationStatus]: destinationItems,
  };

  return {
    movedApplication: nextApplication,
    nextApplications: flattenColumns(nextColumns),
  };
};

const detailRows = (application: JobApplication) =>
  [
    { label: "Company", value: application.companyName },
    { label: "Position", value: application.position },
    { label: "Status", value: jobApplicationStatusLabels[application.status] },
    { label: "Date", value: formatAppliedDate(application.dateApplied) },
    { label: "Location", value: application.location ?? "Not provided" },
    { label: "Salary", value: application.salaryRange ?? "Not provided" },
    // These remain view-only placeholders until the backend model persists them.
    { label: "Technical Stack", value: "Not tracked yet" },
  ] as const;

const Dashboard = () => {
  const { logout, username } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplication | null>(null);
  const [isDetailEditing, setIsDetailEditing] = useState(false);

  const columns = useMemo(() => buildColumns(applications), [applications]);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setErrorMessage(null);
        const items = await listJobApplications();
        setApplications(items);
      } catch (error) {
        console.error("Load job applications failed:", error);
        setErrorMessage(getLoadApplicationsErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    void loadApplications();
  }, []);

  const openCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const openDetails = (application: JobApplication) => {
    setSelectedApplication(application);
    setIsDetailEditing(false);
  };

  const closeDetails = () => {
    setSelectedApplication(null);
    setIsDetailEditing(false);
  };

  const handleCreate = async (input: JobApplicationCreateInput) => {
    const createdApplication = await createJobApplication(input);
    setApplications((current) => [createdApplication, ...current]);
    toast.success("Application added.");
    return createdApplication;
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJobApplication(id);
      setApplications((current) =>
        current.filter((application) => application.id !== id),
      );
      setSelectedApplication((current) =>
        current?.id === id ? null : current,
      );
      setIsDetailEditing(false);
      toast.success("Application removed.");
    } catch (error) {
      console.error("Delete job application failed:", error);
      setErrorMessage("Could not delete the application.");
    }
  };

  const handleUpdate = async (id: string, input: JobApplicationUpdateInput) => {
    await updateJobApplication(id, input);

    let updatedApplication: JobApplication | null = null;

    setApplications((current) =>
      current.map((application) => {
        if (application.id !== id) {
          return application;
        }

        updatedApplication = {
          ...application,
          companyName: input.companyName,
          position: input.position,
          jobUrl: input.jobUrl ?? null,
          location: input.location ?? null,
          salaryRange: input.salaryRange ?? null,
          jobDescription: input.jobDescription ?? null,
          status: input.status,
          dateApplied: input.dateApplied,
        };

        return updatedApplication;
      }),
    );

    if (updatedApplication) {
      setSelectedApplication(updatedApplication);
    }

    setIsDetailEditing(false);
    toast.success("Application updated.");
  };

  const handleDragEnd = async (result: DropResult) => {
    const destination = result.destination;

    if (!destination) {
      return;
    }

    const sourceStatus = Number(
      result.source.droppableId,
    ) as JobApplicationStatus;
    const destinationStatus = Number(
      destination.droppableId,
    ) as JobApplicationStatus;

    if (
      sourceStatus === destinationStatus &&
      result.source.index === destination.index
    ) {
      return;
    }

    const reordered = reorderApplications(
      applications,
      sourceStatus,
      destinationStatus,
      result.source.index,
      destination.index,
    );

    if (!reordered) {
      return;
    }

    const previousApplications = applications;
    setApplications(reordered.nextApplications);

    if (selectedApplication?.id === reordered.movedApplication.id) {
      setSelectedApplication(reordered.movedApplication);
    }

    if (sourceStatus === destinationStatus) {
      return;
    }

    try {
      // The board responds immediately on drop, then rolls back if the persisted status update fails.
      await updateJobApplication(reordered.movedApplication.id, {
        companyName: reordered.movedApplication.companyName,
        position: reordered.movedApplication.position,
        jobUrl: reordered.movedApplication.jobUrl ?? undefined,
        location: reordered.movedApplication.location ?? undefined,
        salaryRange: reordered.movedApplication.salaryRange ?? undefined,
        jobDescription: reordered.movedApplication.jobDescription ?? undefined,
        status: reordered.movedApplication.status,
        dateApplied: reordered.movedApplication.dateApplied,
      });

      toast.success(
        `${reordered.movedApplication.companyName} moved to ${jobApplicationStatusLabels[destinationStatus]}.`,
      );
    } catch (error) {
      console.error("Move job application failed:", error);
      setApplications(previousApplications);
      if (selectedApplication?.id === reordered.movedApplication.id) {
        const previousSelected = previousApplications.find(
          (application) => application.id === reordered.movedApplication.id,
        );
        setSelectedApplication(previousSelected ?? null);
      }
      setErrorMessage("Could not update the application status.");
      toast.error("Could not update the application status.");
    }
  };

  return (
    <main className="mx-auto flex h-screen max-w-[1600px] flex-col overflow-hidden px-3 py-3 lg:px-5">
      <header className="mb-4 flex flex-col gap-2 border-b border-border-gold bg-deco-surface px-6 py-4 shadow-deco-panel backdrop-blur md:flex-row md:items-baseline md:justify-between">
        <div className="flex flex-col">
          <h1 className="font-heading text-[1.75rem] tracking-tight text-deco-foreground md:text-[2.2rem]">
            Job Application Tracker
          </h1>

          <div className="mt-2 flex items-center">
            <div className="h-[2px] w-24 bg-primary-gold"></div>
            <div className="h-px w-full max-w-[200px] bg-primary-gold opacity-20"></div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-primary-gold"></div>
          <p className="text-[0.65rem] font-medium uppercase tracking-[0.25em] text-deco-muted">
            Drag to update status
          </p>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-stretch">
        <aside className="deco-sidebar flex min-h-0 flex-col items-stretch overflow-hidden border border-border-gold bg-deco-surface-soft p-5 shadow-deco-panel backdrop-blur md:p-6">
          <section className="border border-border-gold bg-deco-surface p-4 shadow-sm">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary-gold">
              Profile
            </p>
            <div className="mt-2 flex items-center gap-2 text-sm text-deco-foreground">
              <User className="h-4 w-4 text-primary-gold" />
              <span className="truncate font-medium">{username ?? "User"}</span>
            </div>
          </section>

          <section className="mt-4 border border-border-gold bg-deco-surface p-4 shadow-sm">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-primary-gold">
              Summary
            </p>
            <div className="mt-2">
              <span className="font-heading text-3xl leading-none">
                {applications.length}
              </span>
              <p className="mt-1 text-[0.6rem] uppercase tracking-[0.15em] text-deco-muted">
                Total Applications
              </p>
            </div>
          </section>

          <div className="mt-4 flex w-full flex-col gap-3">
            <Button
              aria-label="New Application"
              className="h-11 w-full rounded-none transition-all hover:opacity-90"
              onClick={openCreateDialog}
            >
              <div className="flex w-full items-center px-4">
                <BadgePlus className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-center text-[0.65rem] uppercase tracking-[0.25em]">
                  Add New
                </span>
                <div className="w-4" />
              </div>
            </Button>

            <Button
              aria-label="Log out"
              className="h-11 w-full rounded-none transition-all"
              variant="outline"
              onClick={logout}
            >
              <div className="flex w-full items-center px-4">
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-center text-[0.65rem] uppercase tracking-[0.25em]">
                  Log Out
                </span>
                <div className="w-4" />
              </div>
            </Button>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col gap-3">
          {errorMessage ? (
            <p className="border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
              {errorMessage}
            </p>
          ) : null}

          {isLoading ? (
            <p className="border border-border-gold-muted bg-deco-surface-soft px-4 py-3 text-sm text-deco-muted">
              Loading applications...
            </p>
          ) : null}

          {!isLoading && applications.length === 0 ? (
            <div className="border border-border-gold-muted bg-deco-surface-soft px-5 py-10 text-center shadow-deco-panel">
              <p className="font-heading text-2xl text-deco-foreground">
                No applications yet.
              </p>
              <p className="mt-3 text-sm text-deco-muted">
                No applications yet. Add your first one and it will appear here
                immediately.
              </p>
              <Button className="mt-6" onClick={openCreateDialog}>
                <BadgePlus className="h-4 w-4" />
                Add Application
              </Button>
            </div>
          ) : null}

          {!isLoading && applications.length > 0 ? (
            <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
              <div className="grid min-h-0 flex-1 gap-5 xl:grid-cols-4">
                {boardColumns.map((column) => (
                  <section
                    className="kanban-column flex min-h-0 flex-col border border-border-gold-muted bg-deco-surface-soft p-4"
                    id={`column-${column.title.toLowerCase()}`}
                    key={column.status}
                  >
                    <div className="border-b border-primary-gold pb-3">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <h3 className="text-2xl text-deco-foreground">
                            {column.title}
                          </h3>
                          <p className="mt-1 text-sm text-deco-muted">
                            {column.subtitle}
                          </p>
                        </div>
                        <span className={column.accentClass}>
                          {columns[column.status].length}
                        </span>
                      </div>
                    </div>

                    <Droppable droppableId={String(column.status)}>
                      {(droppableProvided, droppableSnapshot) => (
                        <div
                          className={`mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto transition-colors ${
                            droppableSnapshot.isDraggingOver
                              ? "bg-primary-gold-muted"
                              : ""
                          }`}
                          ref={droppableProvided.innerRef}
                          {...droppableProvided.droppableProps}
                        >
                          {columns[column.status].map((application, index) => (
                            <Draggable
                              draggableId={application.id}
                              index={index}
                              key={application.id}
                            >
                              {(draggableProvided, draggableSnapshot) => (
                                <article
                                  className={`application-card ${column.borderClass} cursor-pointer border-y border-r border-l-2 border-border-gold-muted bg-deco-card px-3 py-2 font-sans text-[0.78rem] tracking-[0.02em] text-deco-foreground shadow-sm transition-shadow hover:shadow-deco-glow ${
                                    draggableSnapshot.isDragging
                                      ? "shadow-deco-glow"
                                      : ""
                                  }`}
                                  key={application.id}
                                  ref={draggableProvided.innerRef}
                                  {...draggableProvided.draggableProps}
                                  {...draggableProvided.dragHandleProps}
                                  onClick={() => openDetails(application)}
                                >
                                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                                    <div className="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap">
                                      <span className="truncate font-semibold uppercase tracking-[0.08em] text-deco-foreground">
                                        {application.companyName}
                                      </span>
                                      <span className="shrink-0 text-primary-gold">
                                        -
                                      </span>
                                      <span className="truncate text-deco-muted">
                                        {application.position}
                                      </span>
                                    </div>
                                    <span className="shrink-0 text-right text-deco-muted">
                                      {formatAppliedDate(
                                        application.dateApplied,
                                      )}
                                    </span>
                                  </div>
                                </article>
                              )}
                            </Draggable>
                          ))}
                          {droppableProvided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </section>
                ))}
              </div>
            </DragDropContext>
          ) : null}

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
            }}
          >
            <DialogContent className="p-0">
              <DialogHeader>
                <DialogTitle>Add Application</DialogTitle>
                <DialogDescription>
                  Capture the company, role, and current status in the board.
                </DialogDescription>
              </DialogHeader>
              <JobApplicationForm
                editingApplication={null}
                onCancelEdit={closeCreateDialog}
                onCreate={handleCreate}
                onSuccess={closeCreateDialog}
                onUpdate={handleUpdate}
              />
            </DialogContent>
          </Dialog>

          <Sheet
            open={selectedApplication !== null}
            onOpenChange={(open) => {
              if (!open) {
                closeDetails();
              }
            }}
          >
            <SheetContent className="border-l border-border-gold bg-deco-bg">
              <SheetHeader>
                <SheetTitle>
                  {selectedApplication
                    ? `${selectedApplication.companyName} Details`
                    : "Job Details"}
                </SheetTitle>
                <SheetDescription>
                  {selectedApplication?.position ?? "Application details"}
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {selectedApplication ? (
                  <div className="space-y-6">
                    {isDetailEditing ? (
                      <JobApplicationForm
                        editingApplication={selectedApplication}
                        onCancelEdit={() => setIsDetailEditing(false)}
                        onCreate={handleCreate}
                        onSuccess={() => setIsDetailEditing(false)}
                        onUpdate={handleUpdate}
                        submitLabel="Save Changes"
                        submittingLabel="Saving Changes..."
                        cancelLabel="Discard"
                      />
                    ) : (
                      <>
                        <section className="space-y-4 border-b border-primary-gold-muted pb-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-gold">
                                Application Record
                              </p>
                              <h3 className="mt-2 text-3xl text-deco-foreground">
                                {selectedApplication.companyName}
                              </h3>
                              <p className="mt-2 text-sm uppercase tracking-[0.14em] text-deco-muted">
                                {selectedApplication.position}
                              </p>
                            </div>
                            <Badge>
                              {
                                jobApplicationStatusLabels[
                                  selectedApplication.status
                                ]
                              }
                            </Badge>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            {detailRows(selectedApplication).map((row) => (
                              <div key={row.label} className="space-y-1">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-gold">
                                  {row.label}
                                </p>
                                <p className="text-sm leading-6 text-deco-foreground">
                                  {row.value}
                                </p>
                              </div>
                            ))}
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-gold">
                                Interest Level
                              </p>
                              <div className="flex items-center gap-1 text-primary-gold">
                                <Diamond className="h-4 w-4 fill-current" />
                                <Diamond className="h-4 w-4 fill-current opacity-70" />
                                <Diamond className="h-4 w-4 opacity-30" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-gold">
                                Job URL
                              </p>
                              {selectedApplication.jobUrl ? (
                                <a
                                  className="inline-flex items-center gap-2 text-sm text-deco-foreground underline decoration-primary-gold underline-offset-4 transition-colors hover:text-primary-gold"
                                  href={selectedApplication.jobUrl}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Open posting
                                </a>
                              ) : (
                                <p className="text-sm leading-6 text-deco-foreground">
                                  Not provided
                                </p>
                              )}
                            </div>
                          </div>
                        </section>

                        <section className="space-y-3 border-b border-primary-gold-muted pb-5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary-gold" />
                            <h4 className="text-xl text-deco-foreground">
                              Job Description
                            </h4>
                          </div>
                          <div className="max-h-[22rem] overflow-y-auto border border-border-gold-muted bg-deco-surface-soft p-4 shadow-sm">
                            <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-deco-foreground">
                              {selectedApplication.jobDescription?.trim()
                                ? selectedApplication.jobDescription
                                : "No job description saved."}
                            </pre>
                          </div>
                        </section>

                        <div className="space-y-3">
                          <Button
                            className="w-full justify-center"
                            onClick={() => setIsDetailEditing(true)}
                          >
                            Edit Application
                          </Button>
                          <Button
                            className="w-full justify-center text-danger hover:text-danger"
                            variant="ghost"
                            onClick={() =>
                              void handleDelete(selectedApplication.id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Application
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>
            </SheetContent>
          </Sheet>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
