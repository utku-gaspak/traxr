import axios from "axios";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import {
  BadgePlus,
  BriefcaseBusiness,
  Columns3,
  GripVertical,
  LogOut,
  Pencil,
  Trash2,
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  JobApplicationStatus,
  jobApplicationStatusLabels,
  jobApplicationStatusOrder,
  type JobApplication,
  type JobApplicationCreateInput,
  type JobApplicationUpdateInput,
} from "../types";

const formatAppliedDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
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
    borderClass: "border-l-[color:var(--color-column-applied)]",
    accentClass: "text-[color:var(--color-column-applied)]",
    dotClass: "bg-[color:var(--color-column-applied)]",
  },
  {
    status: JobApplicationStatus.Interviewing,
    title: "Interviewing",
    subtitle: "Active conversations",
    borderClass: "border-l-[color:var(--color-column-interviewing)]",
    accentClass: "text-[color:var(--color-column-interviewing)]",
    dotClass: "bg-[color:var(--color-column-interviewing)]",
  },
  {
    status: JobApplicationStatus.Rejected,
    title: "Rejected",
    subtitle: "Closed loops",
    borderClass: "border-l-[color:var(--color-column-rejected)]",
    accentClass: "text-[color:var(--color-column-rejected)]",
    dotClass: "bg-[color:var(--color-column-rejected)]",
  },
  {
    status: JobApplicationStatus.Offer,
    title: "Offer",
    subtitle: "Decision stage",
    borderClass: "border-l-[color:var(--color-column-offer)]",
    accentClass: "text-[color:var(--color-column-offer)]",
    dotClass: "bg-[color:var(--color-column-offer)]",
  },
] as const;

const buildColumns = (applications: JobApplication[]) =>
  jobApplicationStatusOrder.reduce<Record<JobApplicationStatus, JobApplication[]>>(
    (columns, status) => {
      columns[status] = applications.filter((application) => application.status === status);
      return columns;
    },
    {
      [JobApplicationStatus.Applied]: [],
      [JobApplicationStatus.Interviewing]: [],
      [JobApplicationStatus.Rejected]: [],
      [JobApplicationStatus.Offer]: [],
    },
  );

const flattenColumns = (columns: Record<JobApplicationStatus, JobApplication[]>) =>
  jobApplicationStatusOrder.flatMap((status) => columns[status]);

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
    sourceStatus === destinationStatus ? sourceItems : [...columns[destinationStatus]];
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

const Dashboard = () => {
  const { logout } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  const closeDialog = () => {
    setEditingApplication(null);
    setIsDialogOpen(false);
  };

  const openCreateDialog = () => {
    setEditingApplication(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (application: JobApplication) => {
    setEditingApplication(application);
    setIsDialogOpen(true);
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
      setApplications((current) => current.filter((application) => application.id !== id));
      setEditingApplication((current) => (current?.id === id ? null : current));
      toast.success("Application removed.");
    } catch (error) {
      console.error("Delete job application failed:", error);
      setErrorMessage("Could not delete the application.");
    }
  };

  const handleUpdate = async (id: string, input: JobApplicationUpdateInput) => {
    await updateJobApplication(id, input);
    setApplications((current) =>
      current.map((application) =>
        application.id === id
          ? {
              ...application,
              companyName: input.companyName,
              position: input.position,
              status: input.status,
              dateApplied: input.dateApplied,
            }
          : application
      )
    );
    toast.success("Application updated.");
  };

  const handleDragEnd = async (result: DropResult) => {
    const destination = result.destination;

    if (!destination) {
      return;
    }

    const sourceStatus = Number(result.source.droppableId) as JobApplicationStatus;
    const destinationStatus = Number(destination.droppableId) as JobApplicationStatus;

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

    if (sourceStatus === destinationStatus) {
      return;
    }

    try {
      // The board responds immediately on drop, then rolls back if the persisted status update fails.
      await updateJobApplication(reordered.movedApplication.id, {
        companyName: reordered.movedApplication.companyName,
        position: reordered.movedApplication.position,
        status: reordered.movedApplication.status,
        dateApplied: reordered.movedApplication.dateApplied,
      });

      toast.success(
        `${reordered.movedApplication.companyName} moved to ${jobApplicationStatusLabels[destinationStatus]}.`,
      );
    } catch (error) {
      console.error("Move job application failed:", error);
      setApplications(previousApplications);
      setErrorMessage("Could not update the application status.");
      toast.error("Could not update the application status.");
    }
  };

  return (
    <main className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
      <aside className="deco-sidebar sticky top-6 self-start border border-[color:var(--color-border-strong)] bg-[color:rgba(255,255,255,0.74)] p-6 shadow-[var(--shadow-panel)] backdrop-blur md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
          Job Application Tracker
        </p>
        <h1 className="mt-3 text-4xl leading-[0.95] text-[color:var(--color-foreground)]">
          Application dashboard
        </h1>
        <p className="mt-4 text-sm leading-6 text-[color:var(--color-muted-foreground)]">
          An Art Deco board for deliberate application management, from first outreach to final offer.
        </p>

        <Card className="mt-8 border-[color:var(--color-border-strong)] bg-[color:rgba(255,255,255,0.86)]">
          <CardHeader className="pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
              Summary
            </p>
            <CardTitle className="text-3xl">{applications.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[color:var(--color-muted-foreground)]">Total applications tracked</p>
          </CardContent>
        </Card>

        <nav className="mt-8 grid gap-2">
          {boardColumns.map((column) => (
            <a
              key={column.status}
              href={`#column-${column.title.toLowerCase()}`}
              className="flex items-center justify-between border border-transparent px-3 py-2 text-sm uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)] transition-colors hover:border-[color:var(--color-border)] hover:bg-[color:rgba(255,255,255,0.5)] hover:text-[color:var(--color-primary)]"
            >
              <span>{column.title}</span>
              <span className={column.accentClass}>{columns[column.status].length}</span>
            </a>
          ))}
        </nav>

        <div className="mt-8 grid gap-3">
          <Button className="w-full justify-center" onClick={openCreateDialog}>
            <BadgePlus className="h-4 w-4" />
            New Application
          </Button>
          <Button className="w-full justify-center" variant="outline" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>

      <section className="grid gap-6">
        <header className="flex flex-col gap-4 border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.52)] p-6 shadow-[var(--shadow-panel)] md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-primary)]">
              High-End Boutique Office
            </p>
            <div className="mt-2 flex items-center gap-3">
              <BriefcaseBusiness className="h-5 w-5 text-[color:var(--color-primary)]" />
              <h2 className="text-3xl text-[color:var(--color-foreground)]">Track every move with precision.</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm uppercase tracking-[0.14em] text-[color:var(--color-muted-foreground)]">
            <span className="inline-flex items-center gap-2">
              <Columns3 className="h-4 w-4 text-[color:var(--color-primary)]" />
              Drag to update status
            </span>
          </div>
        </header>

        {errorMessage ? (
          <p className="border border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm text-[color:var(--color-danger)]">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.72)] px-4 py-3 text-sm text-[color:var(--color-muted-foreground)]">
            Loading applications...
          </p>
        ) : null}

        {!isLoading && applications.length === 0 ? (
          <div className="border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.78)] px-5 py-10 text-center shadow-[var(--shadow-panel)]">
            <p className="font-heading text-2xl text-[color:var(--color-foreground)]">No applications yet.</p>
            <p className="mt-3 text-sm text-[color:var(--color-muted-foreground)]">
              No applications yet. Add your first one and it will appear here immediately.
            </p>
            <Button className="mt-6" onClick={openCreateDialog}>
              <BadgePlus className="h-4 w-4" />
              Add Application
            </Button>
          </div>
        ) : null}

        {!isLoading && applications.length > 0 ? (
          <DragDropContext onDragEnd={(result) => void handleDragEnd(result)}>
            <div className="grid gap-5 xl:grid-cols-4">
              {boardColumns.map((column) => (
                <section
                  className="kanban-column border border-[color:var(--color-border)] bg-[color:rgba(255,255,255,0.74)] p-4"
                  id={`column-${column.title.toLowerCase()}`}
                  key={column.status}
                >
                  <div className="border-b border-[color:var(--color-primary)] pb-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-2xl text-[color:var(--color-foreground)]">{column.title}</h3>
                        <p className="mt-1 text-sm text-[color:var(--color-muted-foreground)]">
                          {column.subtitle}
                        </p>
                      </div>
                      <span className={column.accentClass}>{columns[column.status].length}</span>
                    </div>
                  </div>

                  <Droppable droppableId={String(column.status)}>
                    {(droppableProvided, droppableSnapshot) => (
                      <div
                        className={`mt-4 min-h-[16rem] space-y-3 transition-colors ${
                          droppableSnapshot.isDraggingOver ? "bg-[color:rgba(212,175,55,0.06)]" : ""
                        }`}
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                      >
                        {columns[column.status].map((application, index) => (
                          <Draggable draggableId={application.id} index={index} key={application.id}>
                            {(draggableProvided, draggableSnapshot) => (
                              <article
                                className={`application-card border-l-[3px] ${column.borderClass} rounded-none border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-4 shadow-sm transition-shadow hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] ${
                                  draggableSnapshot.isDragging ? "shadow-[0_0_18px_rgba(212,175,55,0.18)]" : ""
                                }`}
                                key={application.id}
                                ref={draggableProvided.innerRef}
                                {...draggableProvided.draggableProps}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted-foreground)]">
                                      {application.companyName}
                                    </p>
                                    <h4 className="text-xl text-[color:var(--color-foreground)]">
                                      {application.position}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <div
                                      className="cursor-grab p-1 text-[color:var(--color-muted-foreground)]"
                                      {...draggableProvided.dragHandleProps}
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <Button
                                      aria-label="Edit"
                                      size="icon"
                                      type="button"
                                      variant="ghost"
                                      onClick={() => openEditDialog(application)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      aria-label="Delete"
                                      size="icon"
                                      type="button"
                                      variant="ghost"
                                      onClick={() => void handleDelete(application.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                  <Badge className="inline-flex items-center gap-2">
                                    <span className={`h-2 w-2 ${column.dotClass}`} />
                                    {jobApplicationStatusLabels[application.status]}
                                  </Badge>
                                  <p className="text-xs uppercase tracking-[0.12em] text-[color:var(--color-muted-foreground)]">
                                    Applied {formatAppliedDate(application.dateApplied)}
                                  </p>
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
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingApplication(null);
            }
          }}
        >
          <DialogContent className="p-0">
            <DialogHeader>
              <DialogTitle>{editingApplication ? "Update job application" : "Add Application"}</DialogTitle>
              <DialogDescription>
                Capture the company, role, and current status in the board.
              </DialogDescription>
            </DialogHeader>
            <JobApplicationForm
              editingApplication={editingApplication}
              onCancelEdit={closeDialog}
              onCreate={handleCreate}
              onSuccess={closeDialog}
              onUpdate={handleUpdate}
            />
          </DialogContent>
        </Dialog>
      </section>
    </main>
  );
};

export default Dashboard;
