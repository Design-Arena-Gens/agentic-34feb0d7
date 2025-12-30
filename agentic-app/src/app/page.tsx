"use client";

import { useEffect, useMemo, useState } from "react";

type AgentStatus = "Idle" | "Planning" | "Executing" | "Completed";

type Agent = {
  id: string;
  name: string;
  archetype: string;
  description: string;
  specialty: string[];
  personality: string;
  goal: string;
  tools: string[];
  status: AgentStatus;
  lastRun?: string;
  outcome?: string;
  timeline: string[];
};

type Archetype = {
  id: string;
  title: string;
  description: string;
  defaults: Pick<Agent, "specialty" | "personality" | "tools"> & {
    starterGoal: string;
  };
};

const STORAGE_KEY = "agentic-app-agents";

const archetypes: Archetype[] = [
  {
    id: "researcher",
    title: "Insight Researcher",
    description:
      "Aggregates knowledge, validates sources, and produces concise research briefs.",
    defaults: {
      specialty: [
        "Source vetting",
        "Competitive scans",
        "Highlight extraction",
      ],
      personality: "Calm, methodical, citation-first communicator.",
      tools: ["Web Search", "Note Synthesizer", "Source Tracker"],
      starterGoal:
        "Map emerging trends in your domain with high-signal citations.",
    },
  },
  {
    id: "planner",
    title: "Launch Planner",
    description:
      "Turns ambiguous ideas into structured execution calendars with dependencies.",
    defaults: {
      specialty: ["Roadmapping", "Risk surfacing", "Dependency mapping"],
      personality: "Energetic facilitator who loves clarity and crisp deliverables.",
      tools: ["Timeline Builder", "Milestone Matrix", "Risk Radar"],
      starterGoal: "Draft the next 4-week plan with measurable checkpoints.",
    },
  },
  {
    id: "creator",
    title: "Content Crafter",
    description:
      "Designs on-brand copy, visual prompts, and social plans for multi-channel presence.",
    defaults: {
      specialty: ["Narrative arcs", "Voice matching", "Campaign sequencing"],
      personality: "Playful storyteller with sharp attention to voice consistency.",
      tools: ["Tone Matcher", "Storyboard Canvas", "Hook Generator"],
      starterGoal:
        "Outline a content kit that aligns with your current theme and audience.",
    },
  },
];

const sampleMoments = [
  "Clarifies project framing with stakeholder-ready language.",
  "Surfaces hidden blockers early and proposes mitigation paths.",
  "Creates reusable templates that accelerate downstream work.",
  "Synthesizes learnings into a narrative that teams rally behind.",
  "Finds signal in noisy requirements and keeps everyone focused.",
];

const orchestrateTimeline = (agent: Agent, goal: string) => {
  const steps = [
    `Aligns on objective: ${goal}`,
    `Maps strength-driven approach using ${agent.tools.join(", ")}`,
    `Breaks work into milestones leveraging ${agent.specialty[0]}`,
    `Checks in with stakeholders to confirm direction`,
    `Delivers packaged outcome tailored to the request`,
  ];
  return steps;
};

const buildOutcome = (agent: Agent) => {
  const highlight =
    sampleMoments[Math.floor(Math.random() * sampleMoments.length)];
  return `${agent.name} (${agent.archetype}) reports back: ${highlight}`;
};

const createAgent = (archetype: Archetype, name: string, goal?: string): Agent => {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return {
    id,
    name,
    archetype: archetype.title,
    description: archetype.description,
    personality: archetype.defaults.personality,
    specialty: archetype.defaults.specialty,
    tools: archetype.defaults.tools,
    goal: goal?.trim() || archetype.defaults.starterGoal,
    status: "Idle",
    timeline: [],
  };
};

const generateNameSuffix = () =>
  Math.floor(Math.random() * 900 + 100).toString();

export default function Home() {
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype>(
    archetypes[0],
  );
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentName, setAgentName] = useState("Baseline Agent");
  const [agentGoal, setAgentGoal] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Agent[];
        setAgents(parsed);
        if (parsed.length > 0) {
          setAgentName(`${selectedArchetype.title.split(" ")[0]} ${generateNameSuffix()}`);
        }
      } else {
        const bootAgents = archetypes.map((archetype, index) =>
          createAgent(archetype, `${archetype.title.split(" ")[0]} ${index + 1}`),
        );
        setAgents(bootAgents);
        setAgentName(`${selectedArchetype.title.split(" ")[0]} ${generateNameSuffix()}`);
      }
    } catch {
      const fallback = archetypes.map((archetype, index) =>
        createAgent(archetype, `${archetype.title.split(" ")[0]} ${index + 1}`),
      );
      setAgents(fallback);
      setAgentName(`${selectedArchetype.title.split(" ")[0]} ${generateNameSuffix()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  }, [agents]);

  const selectedArchetypeInfo = useMemo(
    () =>
      `${selectedArchetype.defaults.personality} Best at: ${selectedArchetype.defaults.specialty.join(", ")}`,
    [selectedArchetype],
  );

  const handleCreate = () => {
    const trimmed = agentName.trim();
    if (!trimmed) return;
    const newAgent = createAgent(selectedArchetype, trimmed, agentGoal);
    setAgents((prev) => [newAgent, ...prev]);
    setAgentName(
      `${selectedArchetype.title.split(" ")[0]} ${generateNameSuffix()}`,
    );
    setAgentGoal("");
  };

  const handleRun = (agent: Agent) => {
    const timeline = orchestrateTimeline(agent, agent.goal);
    const outcome = buildOutcome(agent);

    setAgents((prev) =>
      prev.map((entry) =>
        entry.id === agent.id
          ? {
              ...entry,
              status: "Executing",
              timeline,
            }
          : entry,
      ),
    );

    setTimeout(() => {
      setAgents((prev) =>
        prev.map((entry) =>
          entry.id === agent.id
            ? {
                ...entry,
                status: "Completed",
                lastRun: new Date().toISOString(),
                outcome,
              }
            : entry,
        ),
      );
    }, 600);
  };

  const handleReset = (agent: Agent) => {
    setAgents((prev) =>
      prev.map((entry) =>
        entry.id === agent.id
          ? { ...entry, status: "Idle", timeline: [], outcome: undefined }
          : entry,
      ),
    );
  };

  const handleRemove = (agent: Agent) => {
    setAgents((prev) => prev.filter((entry) => entry.id !== agent.id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-24 pt-20">
        <header className="flex flex-col gap-4">
          <span className="w-fit rounded-full border border-slate-800 bg-slate-950/60 px-4 py-1 text-xs tracking-widest text-slate-400">
            AGENT WORKSHOP
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Launch a bench of normal operators that tackle your day-to-day work.
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300">
            Choose an archetype, give it a name, state the mission, and press
            launch. Each agent comes with a playbook, preferred tools, and an
            execution timeline so you can keep them accountable.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 shadow-xl shadow-slate-950/40">
            <h2 className="text-lg font-medium text-slate-200">
              Configure a normal agent
            </h2>
            <p className="text-sm text-slate-400">
              Dial-in the vibe and mission. Your squad lives in local storage,
              so you can come back any time.
            </p>
            <div className="mt-6 flex flex-col gap-6">
              <div className="grid gap-4">
                <label className="text-sm font-medium text-slate-300">
                  Agent archetype
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {archetypes.map((archetype) => {
                    const isActive = archetype.id === selectedArchetype.id;
                    return (
                      <button
                        key={archetype.id}
                        onClick={() => setSelectedArchetype(archetype)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-cyan-400/80 bg-cyan-500/10 text-cyan-100 shadow-lg shadow-cyan-500/10"
                            : "border-slate-800 bg-slate-950/50 text-slate-200 hover:border-cyan-500/40 hover:bg-slate-900"
                        }`}
                      >
                        <div className="text-sm font-semibold">
                          {archetype.title}
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                          {archetype.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <p className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-300">
                  {selectedArchetypeInfo}
                </p>
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-slate-300">
                  Agent name
                </label>
                <input
                  value={agentName}
                  onChange={(event) => setAgentName(event.target.value)}
                  placeholder="e.g. Launch Navigator"
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
                />
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium text-slate-300">
                  Mission focus
                </label>
                <textarea
                  value={agentGoal}
                  onChange={(event) => setAgentGoal(event.target.value)}
                  rows={4}
                  placeholder="What should this agent tackle first?"
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/20"
                />
              </div>

              <button
                onClick={handleCreate}
                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/40"
              >
                Add normal agent
              </button>
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-xl shadow-slate-950/50">
            <h3 className="text-lg font-semibold text-slate-100">
              What makes them “normal”?
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>
                Straightforward scopes, predictable cadence, and dependable
                outputs.
              </li>
              <li>
                Human-readable playbooks that teammates can audit and reuse.
              </li>
              <li>
                Tool stacks that stay inside your existing workflows.
              </li>
              <li>
                Timeline receipts so you always know how work progressed.
              </li>
            </ul>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
              Tip: run an agent after creating it to see its timeline and final
              message. Reset to clear the run and set up a fresh iteration.
            </div>
          </aside>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-slate-200">Active roster</h2>
            <p className="text-xs uppercase tracking-widest text-slate-500">
              {agents.length} agents stored locally
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <article
                key={agent.id}
                className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-lg shadow-slate-950/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">
                      {agent.name}
                    </h3>
                    <p className="text-xs uppercase tracking-wide text-cyan-300/80">
                      {agent.archetype}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      agent.status === "Idle"
                        ? "bg-slate-800 text-slate-300"
                        : agent.status === "Executing"
                          ? "bg-orange-400/20 text-orange-300"
                          : agent.status === "Completed"
                            ? "bg-emerald-400/20 text-emerald-300"
                            : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <p className="text-sm text-slate-300">{agent.description}</p>

                <div className="grid gap-2 text-xs text-slate-400">
                  <div>
                    <span className="font-semibold text-slate-300">
                      Personality:
                    </span>{" "}
                    {agent.personality}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300">
                      Specialties:
                    </span>{" "}
                    {agent.specialty.join(" · ")}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-300">Tools:</span>{" "}
                    {agent.tools.join(" · ")}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-300">
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Mission
                  </div>
                  <p className="mt-2 text-slate-200">{agent.goal}</p>
                </div>

                {agent.timeline.length > 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Timeline
                    </div>
                    <ul className="mt-3 space-y-2 text-xs text-slate-300">
                      {agent.timeline.map((step, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[10px] font-semibold text-slate-300">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {agent.outcome && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
                    <div className="font-semibold uppercase tracking-wide">
                      Outcome
                    </div>
                    <p className="mt-2 text-emerald-100">{agent.outcome}</p>
                  </div>
                )}

                {agent.lastRun && (
                  <p className="text-[11px] text-slate-500">
                    Last run:{" "}
                    {new Date(agent.lastRun).toLocaleString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap gap-3">
                  <button
                    onClick={() => handleRun(agent)}
                    className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/40"
                  >
                    Run agent
                  </button>
                  <button
                    onClick={() => handleReset(agent)}
                    className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-700/60"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => handleRemove(agent)}
                    className="ml-auto rounded-xl border border-red-700/40 px-4 py-2 text-xs font-semibold text-red-300 transition hover:border-red-500 hover:text-red-200 focus:outline-none focus:ring-4 focus:ring-red-600/30"
                  >
                    Archive
                  </button>
                </div>
              </article>
            ))}
            {agents.length === 0 && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-center text-sm text-slate-400">
                Your roster is empty. Configure an archetype and add a normal
                agent to get started.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-sm text-slate-300">
          <h2 className="text-lg font-semibold text-slate-200">Operating notes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {archetypes.map((archetype) => (
              <div
                key={archetype.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="text-sm font-semibold text-slate-100">
                  {archetype.title}
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {archetype.defaults.personality}
                </p>
                <div className="mt-3 text-xs text-slate-300">
                  <div className="font-semibold text-slate-200">Toolkit</div>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    {archetype.defaults.specialty.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400">
            Every agent runs locally in your browser. When you refresh, we reload
            the squad from your device storage so your normal operators persist
            without needing any backend.
          </p>
        </section>
      </div>
    </div>
  );
}
