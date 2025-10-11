"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageWithLoader from "@/components/ImageWithLoader";
import { Request } from "@/types";

export default function UserDashboard() {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [matchCounts, setMatchCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/auth/signin");
      } else if (userRole === "admin") {
        router.replace("/dashboard/admin");
      }
    }
  }, [authLoading, user, userRole, router]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/requests/mine", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      const fetchedRequests = data.requests || [];
      setRequests(fetchedRequests);

      // Fetch match counts for each request
      const counts: Record<string, number> = {};
      for (const request of fetchedRequests) {
        try {
          const matchRes = await fetch(`/api/requests/${request.id}/matches`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            counts[request.id] = matchData.matches?.length || 0;
          }
        } catch (err) {
          console.error(`Error fetching matches for ${request.id}:`, err);
        }
      }
      setMatchCounts(counts);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this request? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/requests/${requestId}/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Remove request from local state
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
        // Remove from match counts
        setMatchCounts((prev) => {
          const newCounts = { ...prev };
          delete newCounts[requestId];
          return newCounts;
        });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete request");
      }
    } catch (error) {
      console.error("Error deleting request:", error);
      alert("Error deleting request");
    }
  };

  // Show loading during auth check or if user is not authenticated
  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {/* Spinner */}
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-border border-t-utaOrange"></div>
            {/* Inner pulse effect */}
            <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-utaOrange/20"></div>
          </div>
          <p className="text-sm text-muted font-medium animate-pulse">
            Loading your reports...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5">
        <div className="container-custom py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-xl md:text-2xl font-display font-bold tracking-tight hover:text-utaOrange transition-colors"
          >
            MavFind
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-6">
              {/* <Link
                href="/inventory"
                className="text-sm font-medium text-muted hover:text-fg transition-colors"
              >
                Browse Items
              </Link> */}
              <Link
                href="/dashboard/user"
                className="text-sm font-medium text-fg"
              >
                My Reports
              </Link>
            </nav>
            <div className="flex items-center gap-3 pl-6 border-l border-border">
              <span className="text-xs text-muted">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-muted hover:text-fg transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="container-custom py-4 space-y-4">
              {/* <Link
                href="/inventory"
                className="block text-sm font-medium text-muted hover:text-fg transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Items
              </Link> */}
              <Link
                href="/dashboard/user"
                className="block text-sm font-medium text-fg py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Reports
              </Link>
              <div className="pt-4 border-t border-border space-y-3">
                <span className="text-xs text-muted block truncate">
                  {user?.email}
                </span>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="w-full text-left text-sm font-medium text-muted hover:text-fg transition-colors py-2 px-3 rounded-lg hover:bg-white/5"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="container-custom section-padding pt-20 md:pt-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-2">
              My Reports
            </h1>
            <p className="text-sm md:text-base text-muted">
              Track your lost items and see potential matches we've found
            </p>
          </div>
          <button
            onClick={() => setShowReportForm(true)}
            className="btn-primary px-6 py-3 rounded-2xl whitespace-nowrap"
          >
            + Report Lost Item
          </button>
        </div>

        {/* Report Form Modal */}
        {showReportForm && (
          <ReportForm
            onClose={() => setShowReportForm(false)}
            onSuccess={() => {
              setShowReportForm(false);
              fetchRequests();
            }}
          />
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <div className="card-base p-12 text-center">
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-muted/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-semibold mb-2">No reports yet</p>
              <p className="text-sm text-muted">
                Lost something? Report it and we'll help you find it.
              </p>
            </div>
            <button
              onClick={() => setShowReportForm(true)}
              className="btn-primary px-6 py-3 rounded-2xl"
            >
              Report Your First Item
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {requests.map((request: any) => {
              const images = request.images || [];
              const firstImage = images.length > 0 ? images[0] : null;

              return (
                <div
                  key={request.id}
                  className="card-base overflow-hidden hover-lift h-full flex flex-col"
                >
                  {/* Image Section */}
                  <div className="relative w-full h-32 bg-bgElevated overflow-hidden flex-shrink-0">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={request.attributes?.category || "Request image"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-10 h-10 text-muted/30"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5">
                      <StatusBadge status={request.status} />
                    </div>
                    {images.length > 1 && (
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
                        {images.length}
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-3 flex-1 flex flex-col">
                    {/* Category Badge */}
                    {(request.category || request.attributes?.category) && (
                      <div className="mb-2">
                        <span className="inline-block text-xs px-2 py-0.5 rounded-md bg-utaOrange/10 text-utaOrange font-semibold capitalize">
                          {request.category || request.attributes?.category}
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-muted leading-relaxed mb-2 line-clamp-2 flex-1">
                      {request.attributes?.genericDescription ||
                        request.description ||
                        "No description"}
                    </p>

                    <div className="text-xs text-muted/70 mb-2 pt-2 border-t border-white/5">
                      {new Date(request.createdAt).toLocaleString("en-US", {
                        timeZone: "America/Chicago",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>

                    {/* Matches Button */}
                    <Link
                      href={`/dashboard/user/requests/${request.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-2 bg-bgElevated hover:bg-white/5 rounded-lg transition-all group">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg
                            className="w-4 h-4 text-utaOrange flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          <p className="text-xs font-medium text-fg truncate">
                            {matchCounts[request.id] === undefined ? (
                              <span className="text-muted">Loading...</span>
                            ) : matchCounts[request.id] === 0 ? (
                              <span className="text-muted">
                                Search ongoing, check later
                              </span>
                            ) : (
                              "Matches"
                            )}
                          </p>
                        </div>
                        <svg
                          className="w-3 h-3 text-muted group-hover:text-fg group-hover:translate-x-0.5 transition-all flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </Link>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(request.id);
                      }}
                      className="mt-2 w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: any = {
    submitted: "warning",
    under_review: "info",
    approved: "success",
    matched: "info",
    claimed: "default",
    rejected: "danger",
  };

  const colors: any = {
    warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    success: "bg-green-500/10 text-green-400 border border-green-500/20",
    default: "bg-white/10 text-muted border border-white/10",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
  };

  const variant = variants[status] || "default";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[variant]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ReportForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Check if description mentions sensitive items
  const hasSensitiveItem = () => {
    const lowerDesc = description.toLowerCase();
    const sensitiveKeywords = [
      "credit card",
      "debit card",
      "wallet",
      "phone",
      "mobile",
      "iphone",
      "android",
      "cell phone",
      "smartphone",
    ];
    return sensitiveKeywords.some((keyword) => lowerDesc.includes(keyword));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);

      // Process each file, converting HEIC to JPEG if needed
      for (const file of filesArray) {
        let processedFile = file;

        // Check if file is HEIC/HEIF and convert to JPEG
        if (
          file.type === "image/heic" ||
          file.type === "image/heif" ||
          file.name.toLowerCase().endsWith(".heic") ||
          file.name.toLowerCase().endsWith(".heif")
        ) {
          try {
            const heic2any = (await import("heic2any")).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.9,
            });

            // Create a new File from the blob
            const blob = Array.isArray(convertedBlob)
              ? convertedBlob[0]
              : convertedBlob;
            processedFile = new File(
              [blob],
              file.name.replace(/\.heic$/i, ".jpg"),
              {
                type: "image/jpeg",
              }
            );
          } catch (error) {
            console.error("Error converting HEIC:", error);
            alert(
              "Error converting HEIC image. Please try a different format."
            );
            continue;
          }
        }

        setImages((prev) => [...prev, processedFile]);

        // Generate preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(processedFile);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    if (isRecording) {
      // Stop recording if already recording
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });

        // Send to Whisper API for transcription
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            // Append transcription to existing description
            setDescription((prev) => {
              const separator = prev ? " " : "";
              return prev + separator + data.text;
            });
          } else {
            alert("Failed to transcribe audio");
          }
        } catch (error) {
          console.error("Transcription error:", error);
          alert("Error transcribing audio");
        } finally {
          setIsTranscribing(false);
        }

        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Store recorder to allow manual stop
      (window as any).currentRecorder = mediaRecorder;

      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 30000); // Max 30 seconds
    } catch (error) {
      console.error("Microphone access denied:", error);
      alert("Microphone access required for voice input");
    }
  };

  const stopRecording = () => {
    const recorder = (window as any).currentRecorder;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
    setIsRecording(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: at least description or images
    if (!description && images.length === 0) {
      alert("Please provide a description or upload images");
      return;
    }

    setSubmitting(true);

    try {
      const token = await user?.getIdToken();
      const formData = new FormData();
      if (description) {
        formData.append("description", description);
      }
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        // Close modal and refresh immediately - processing happens in background
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || "Error submitting report");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error submitting report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card-base max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto relative">
        {/* Loading Overlay */}
        {submitting && (
          <div className="absolute inset-0 bg-bg/95 backdrop-blur-sm rounded-2xl flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-utaOrange border-t-transparent mx-auto mb-6"></div>
              <h3 className="text-xl font-bold mb-2">
                Processing your report...
              </h3>
              <p className="text-sm text-muted max-w-sm">
                We're analyzing your item with AI and searching for potential
                matches. This may take a moment.
              </p>
            </div>
          </div>
        )}

        <h2 className="text-3xl font-extrabold tracking-tight mb-6">
          Report Lost Item
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Helpful Tips */}
          <div className="p-4 bg-utaOrange/10 border border-utaOrange/20 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-utaOrange flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-fg mb-2">
                  Be specific to improve matches!
                </p>
                <p className="text-xs text-muted leading-relaxed">
                  Include:{" "}
                  <span className="text-fg font-medium">
                    brand, color, size, model, distinguishing features
                  </span>{" "}
                  (scratches, stickers, accessories). Where and when you lost it
                  helps too!
                </p>
              </div>
            </div>
          </div>

          {/* Warning for sensitive items */}
          {hasSensitiveItem() && (
            <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-xl animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-400 mb-2">
                    Lost a Credit Card, Wallet, or Phone?
                  </p>
                  <p className="text-xs text-red-300 leading-relaxed mb-3">
                    For security reasons,{" "}
                    <span className="font-semibold">
                      do not submit a request here
                    </span>
                    . These items require immediate reporting to UTA Police.
                  </p>
                  <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                    <p className="text-xs font-semibold text-red-400 mb-2">
                      Contact UTA Police:
                    </p>
                    <p className="text-xs text-fg">
                      📞{" "}
                      <a
                        href="tel:817-272-3003"
                        className="text-red-400 hover:text-red-300 underline font-semibold"
                      >
                        817-272-3003
                      </a>{" "}
                      (Emergency: 911)
                      <br />
                      📍 Meadow Run Hall, 701 Planetarium Pl
                      <br />
                      🕐 Available 24/7
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-muted">
                Description (optional)
              </label>
              <span className="text-xs text-muted">
                {description.length} characters
              </span>
            </div>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="input-base pr-12"
                placeholder="e.g., Blue Nike backpack with a white Nike logo, has a small coffee stain on the front pocket, contains a MacBook Pro..."
                disabled={isRecording}
              />
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`absolute right-3 top-3 p-3 rounded-xl transition-all duration-300 ${
                  isRecording
                    ? "bg-red-500 text-white scale-110 shadow-lg shadow-red-500/50"
                    : "bg-bgElevated hover:bg-utaBlue/20 text-muted hover:text-fg hover:scale-105"
                }`}
                title={isRecording ? "Stop recording" : "Record description"}
              >
                {isRecording ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
            {isRecording && (
              <div className="mt-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </div>
                    <span className="text-sm text-red-400 font-medium">
                      Recording in progress...
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors underline"
                  >
                    Stop
                  </button>
                </div>

                {/* Audio wave animation */}
                <div className="flex items-center justify-center gap-1 h-12">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-400 rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      }}
                    />
                  ))}
                </div>

                <p className="text-xs text-center text-muted mt-2">
                  Speak clearly into your microphone
                </p>
              </div>
            )}

            {isTranscribing && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                  <span className="text-sm text-blue-400 font-medium">
                    Transcribing audio...
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-3">
              Images (optional)
            </label>

            <div className="relative">
              <input
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={handleImageChange}
                id="image-upload"
                className="hidden"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border hover:border-utaOrange/50 rounded-xl cursor-pointer transition-all hover:bg-bgElevated group"
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <svg
                    className="w-10 h-10 text-muted group-hover:text-utaOrange transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted group-hover:text-fg transition-colors">
                      Click to upload images
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Supports JPG, PNG, HEIC, HEIF
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {imagePreviews.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted">
                    {imagePreviews.length}{" "}
                    {imagePreviews.length === 1 ? "image" : "images"} selected
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImages([]);
                      setImagePreviews([]);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <ImageWithLoader
                      key={index}
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      onRemove={() => removeImage(index)}
                      showRemoveButton={true}
                      label={`Image ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Put Request"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
