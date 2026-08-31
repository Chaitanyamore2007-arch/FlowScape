import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [currentView, setCurrentView] = useState("dashboard"); // dashboard or profile

  // AI Matchmaker State
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState("");
  const [matchScores, setMatchScores] = useState({});
  const [sortByMatch, setSortByMatch] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchInternships();
      fetchApplications();
    }
  }, [session, filter, currentView]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthSuccess("");

    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error("Full name is required");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;

        // If email confirmation is required, session might be null
        if (!data.session) {
          setAuthSuccess(
            "Account created successfully! Please check your email to verify your account before logging in.",
          );
          setIsSignUp(false);
        } else {
          setAuthSuccess("Account created successfully! Welcome aboard.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const fetchInternships = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("internships")
        .select(`*, hr_contacts ( hr_name, linkedin_url )`)
        .order("posted_time", { ascending: false });
      if (filter !== "all") query = query.eq("tier", parseInt(filter));

      const { data, error } = await query;
      if (error) throw error;
      setInternships(data || []);
    } catch (error) {
      console.error("Error fetching internships:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      // Fetch user's tracked applications. If table doesn't exist yet, we catch the error gracefully.
      const { data, error } = await supabase
        .from("applications")
        .select("*, internships(*)")
        .eq("user_id", session.user.id);
      if (error) {
        console.log("Applications table might not exist yet.", error.message);
        return;
      }
      setApplications(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const trackApplication = async (internship) => {
    try {
      // Open link in new tab
      window.open(internship.direct_link, "_blank");

      // Save application to database
      const { error } = await supabase.from("applications").insert({
        user_id: session.user.id,
        internship_id: internship.id,
        status: "Applied",
      });

      if (!error) {
        fetchApplications(); // Refresh list
      }
    } catch (err) {
      console.error("Failed to track application:", err);
    }
  };

  const handleResumeUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setScanning(true);
    setScanStatus("PARSING RESUME...");

    try {
      const base64Str = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(file);
      });

      setScanStatus("ANALYZING MATCHES...");
      const jobData = internships.map((job) => ({
        id: job.id,
        role: job.role,
        company: job.company,
      }));

      const { data, error } = await supabase.functions.invoke("match-resume", {
        body: { base64Str, mimeType: file.type, jobData },
      });

      if (error) throw error;

      setScanStatus("SYNCING PROFILE...");

      // Parse the response which should be the JSON array from the edge function
      const parsedScores = data;
      const scoresMap = {};
      parsedScores.forEach((s) => {
        scoresMap[s.id] = { score: s.score, reason: s.reason };
      });

      setMatchScores(scoresMap);
      setSortByMatch(true);
      setCurrentView("dashboard"); // Switch to feed to see scores
    } catch (error) {
      console.error(error);
      alert(
        "Error during AI Matching. Make sure the Edge Function is deployed and active.",
      );
    } finally {
      setScanning(false);
      setScanStatus("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getTierLabel = (tier) => {
    switch (tier) {
      case 1:
        return "Tier 1 (Big Tech)";
      case 2:
        return "Tier 2 (Mid-Level/Unicorn)";
      case 3:
        return "Tier 3 (Maharashtra Local)";
      default:
        return "Unknown Tier";
    }
  };

  const getMatchStyles = (score) => {
    if (score >= 80)
      return {
        bg: "bg-[#00714d]/10",
        text: "text-[#00714d]",
        border: "border-t-[#00714d]",
        icon: "bolt",
      };
    if (score >= 50)
      return {
        bg: "bg-[#ec9700]/10",
        text: "text-[#5a3700]",
        border: "border-t-[#ec9700]",
        icon: "tune",
      };
    return {
      bg: "bg-[#ba1a1a]/10",
      text: "text-[#ba1a1a]",
      border: "border-t-[#ba1a1a]",
      icon: "warning",
    };
  };

  // -----------------------------
  // LOGIN SCREEN
  // -----------------------------
  if (!session) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-lg border border-[#E2E8F0] p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#15157d] tracking-tight">
              Nexus Intelligence
            </h1>
            <p className="text-sm text-[#464652] mt-2">
              AI-Powered Master Internship Tracker
            </p>
          </div>

          {authSuccess && (
            <div className="mb-4 text-[#00714d] text-sm font-medium p-4 bg-[#6cf8bb]/20 border border-[#00714d]/20 rounded-lg text-center">
              {authSuccess}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-[#464652] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-[#c7c5d4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15157d]"
                  placeholder="John Doe"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-[#464652] mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-[#c7c5d4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15157d]"
                placeholder="you@university.edu"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#464652] mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-[#c7c5d4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15157d]"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="text-red-600 text-sm font-medium p-3 bg-red-50 rounded-lg">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-[#15157d] text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all shadow-md flex items-center justify-center cursor-pointer"
            >
              {authLoading ? (
                <span className="material-symbols-outlined animate-spin">
                  refresh
                </span>
              ) : isSignUp ? (
                "Create Account"
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError("");
                setAuthSuccess("");
              }}
              className="text-sm text-[#15157d] hover:underline font-medium cursor-pointer"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------
  // MAIN DASHBOARD (Authenticated)
  // -----------------------------
  const userMetadata = session.user.user_metadata || {};
  const displayName =
    userMetadata.full_name || session.user.email.split("@")[0];
  const userInitial = displayName.charAt(0).toUpperCase();

  const displayedInternships = [...internships].sort((a, b) => {
    if (sortByMatch && matchScores[a.id] && matchScores[b.id]) {
      return matchScores[b.id].score - matchScores[a.id].score;
    }
    return 0;
  });

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] font-sans min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <nav className="hidden md:flex h-screen w-72 flex-col sticky left-0 top-0 bg-[#f8f9ff] border-r border-[#c7c5d4] p-6 z-50">
        {/* Profile Area */}
        <div className="flex items-center justify-between mb-8 p-2 group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-[#dce9ff] shrink-0 border border-gray-200 shadow-sm flex items-center justify-center font-bold text-[#15157d] text-xl">
              {userInitial}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span
                className="text-lg font-semibold text-[#15157d] truncate"
                title={displayName}
              >
                {displayName}
              </span>
              <span className="text-xs font-semibold text-[#464652]">
                Candidate Profile
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>

        {/* Resume Upload Dropzone */}
        <div
          onClick={() => !scanning && fileInputRef.current.click()}
          className={`mb-6 border-2 border-dashed border-[#c7c5d4] hover:border-[#15157d] rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-[#eff4ff] transition-colors duration-200 cursor-pointer relative overflow-hidden h-32`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleResumeUpload}
            accept="application/pdf"
            className="hidden"
          />
          <span className="material-symbols-outlined text-[#15157d] text-3xl mb-1">
            upload_file
          </span>
          <span className="text-sm font-semibold text-[#15157d]">
            Upload Resume
          </span>
          <span className="text-xs font-semibold text-[#464652] text-center">
            AI Match Analysis
          </span>
          {scanning && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-xl">
              <span className="material-symbols-outlined text-[#15157d] text-3xl animate-spin">
                memory
              </span>
              <span className="text-xs font-semibold text-[#15157d] mt-2 tracking-widest">
                {scanStatus}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-2 flex-1">
          <a
            onClick={() => {
              setCurrentView("dashboard");
              setFilter("all");
            }}
            className={`flex items-center gap-4 px-4 py-2 ${currentView === "dashboard" && filter === "all" ? "bg-[#6cf8bb] text-[#00714d] font-semibold border border-[#E2E8F0] shadow-sm" : "text-[#464652] hover:bg-[#dce9ff]"} transition-colors duration-200 cursor-pointer rounded-lg`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm">Job Feed</span>
          </a>
          <a
            onClick={() => {
              setCurrentView("profile");
            }}
            className={`flex items-center gap-4 px-4 py-2 ${currentView === "profile" ? "bg-[#6cf8bb] text-[#00714d] font-semibold border border-[#E2E8F0] shadow-sm" : "text-[#464652] hover:bg-[#dce9ff]"} transition-colors duration-200 cursor-pointer rounded-lg`}
          >
            <span className="material-symbols-outlined">person</span>
            <span className="text-sm">My Profile & Applications</span>
          </a>

          <div className="my-2 border-t border-[#c7c5d4]"></div>

          <a
            onClick={() => {
              setCurrentView("dashboard");
              setFilter("1");
            }}
            className={`flex items-center gap-4 px-4 py-2 ${currentView === "dashboard" && filter === "1" ? "bg-[#dce9ff] text-[#15157d] font-semibold" : "text-[#464652] hover:bg-[#dce9ff]"} transition-colors duration-200 cursor-pointer rounded-lg`}
          >
            <span className="material-symbols-outlined text-sm">star</span>
            <span className="text-sm">Tier 1: Big Tech</span>
          </a>
          <a
            onClick={() => {
              setCurrentView("dashboard");
              setFilter("2");
            }}
            className={`flex items-center gap-4 px-4 py-2 ${currentView === "dashboard" && filter === "2" ? "bg-[#dce9ff] text-[#15157d] font-semibold" : "text-[#464652] hover:bg-[#dce9ff]"} transition-colors duration-200 cursor-pointer rounded-lg`}
          >
            <span className="material-symbols-outlined text-sm">business</span>
            <span className="text-sm">Tier 2: Mid/Unicorn</span>
          </a>
        </div>

        <div className="mt-auto pt-4 border-t border-[#c7c5d4] text-center">
          <span className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-[14px]">lock</span>{" "}
            Secure Connection
          </span>
        </div>
      </nav>

      {/* Main Content Canvas */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {currentView === "dashboard" ? (
          <>
            {/* Dashboard Header */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-bold tracking-tight text-[#15157d]">
                  Welcome, {displayName.split(" ")[0]}
                </h1>
                <p className="text-base text-[#464652]">
                  Upload your resume to instantly sort opportunities based on
                  your profile.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-2">
                <button
                  onClick={() => {
                    setSortByMatch(!sortByMatch);
                  }}
                  disabled={Object.keys(matchScores).length === 0}
                  className={`ml-auto px-4 py-2 rounded-full font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${Object.keys(matchScores).length > 0 ? (sortByMatch ? "bg-[#15157d] text-white" : "bg-white border border-[#c7c5d4] text-[#15157d]") : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    sort
                  </span>
                  {sortByMatch ? "Sorted by AI Match" : "Sort by AI Match"}
                </button>
              </div>
            </section>

            {/* Dashboard Feed */}
            <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex justify-center items-center h-32">
                  <span className="material-symbols-outlined animate-spin text-4xl text-[#15157d]">
                    refresh
                  </span>
                </div>
              ) : displayedInternships.length === 0 ? (
                <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                  No internships found for this tier.
                </div>
              ) : (
                displayedInternships.map((job) => {
                  const match = matchScores[job.id];
                  const styles = match
                    ? getMatchStyles(match.score)
                    : { border: "border-t-[#E2E8F0]" };
                  const isApplied = applications.some(
                    (app) => app.internship_id === job.id,
                  );

                  return (
                    <article
                      key={job.id}
                      className={`bg-white border border-[#E2E8F0] border-t-2 ${styles.border} rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-4 relative overflow-hidden`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-[#464652] uppercase tracking-wider mb-1">
                            {getTierLabel(job.tier)}
                          </span>
                          <h3 className="text-lg text-[#15157d] font-bold leading-tight">
                            {job.role}
                          </h3>
                          <p className="text-sm text-[#464652] mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">
                              business
                            </span>{" "}
                            {job.company}
                            <span className="mx-1">•</span>
                            <span className="material-symbols-outlined text-[14px]">
                              location_on
                            </span>{" "}
                            {job.location}
                          </p>
                        </div>
                        {match && (
                          <div
                            className={`${styles.bg} ${styles.text} px-2 py-1 rounded flex items-center gap-1 text-xs font-bold shrink-0 ml-2`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {styles.icon}
                            </span>
                            {match.score}% Match
                          </div>
                        )}
                      </div>

                      <div className="flex-1 mt-2">
                        {match ? (
                          <p className="text-sm text-[#464652] bg-gray-50 p-3 rounded border border-gray-100">
                            {match.reason}
                          </p>
                        ) : job.hr_contacts && job.hr_contacts.length > 0 ? (
                          <div className="bg-[#eff4ff] border border-[#dce9ff] p-3 rounded">
                            <span className="text-xs font-semibold text-[#15157d] block mb-1">
                              Recruiter Connection found:
                            </span>
                            <a
                              href={job.hr_contacts[0].linkedin_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {job.hr_contacts[0].hr_name}{" "}
                              <span className="material-symbols-outlined text-[14px]">
                                open_in_new
                              </span>
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">
                            No AI match data or HR connections yet.
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-100">
                        <button
                          onClick={() => trackApplication(job)}
                          className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors text-center shadow-sm cursor-pointer ${isApplied ? "bg-green-100 text-green-800 border border-green-200" : "bg-[#15157d] text-white hover:bg-opacity-90"}`}
                        >
                          {isApplied ? "Applied ✓" : "Direct Apply"}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          </>
        ) : (
          <>
            {/* Profile & Applications View */}
            <section className="flex flex-col gap-4 mb-8">
              <h1 className="text-4xl font-bold tracking-tight text-[#15157d]">
                My Profile
              </h1>
              <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E2E8F0] flex items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-[#dce9ff] shrink-0 border border-gray-200 shadow-sm flex items-center justify-center font-bold text-[#15157d] text-4xl">
                  {userInitial}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {displayName}
                  </h2>
                  <p className="text-gray-500">{session.user.email}</p>
                  <div className="mt-4 flex gap-4">
                    <div className="bg-[#eff4ff] px-4 py-2 rounded-lg border border-[#dce9ff]">
                      <span className="block text-xl font-bold text-[#15157d]">
                        {applications.length}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        Jobs Applied
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-[#15157d]">
                Application History
              </h2>

              {applications.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                  You haven't applied to any internships yet. Check out the Job
                  Feed!
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Applied
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map((app) => (
                        <tr key={app.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {app.internships?.company || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {app.internships?.role || "Unknown"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {app.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(app.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
