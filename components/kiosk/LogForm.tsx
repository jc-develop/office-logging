"use client";

import { useEffect, useRef, useState } from "react";
import CameraCapture, { type CameraCaptureHandle } from "@/components/shared/CameraCapture";
import DateTimeDisplay from "@/components/shared/DateTimeDisplay";
import ActionSelector from "./ActionSelector";
import PersonForm from "./PersonForm";
import SessionGreeting from "./SessionGreeting";
import SuccessCard from "./SuccessCard";
import { createMultipleLogs } from "@/lib/logs";
import { IS_MOCK, type LogType } from "@/lib/supabase";
import { playClickSound, playErrorSound, playSuccessSound } from "@/lib/audio";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success"; message: string; names: string[] }
  | { kind: "error"; message: string };

const ACTION_LABEL: Record<LogType, string> = {
  login: "Log In",
  logout: "Log Out",
  break: "Break",
};

const ACTION_GRADIENT: Record<LogType, string> = {
  login: "from-emerald-600 to-emerald-500 shadow-action-login-light hover:from-emerald-500 hover:to-emerald-400",
  logout: "from-red-600 to-red-500 shadow-action-logout-light hover:from-red-500 hover:to-red-400",
  break: "from-amber-500 to-amber-400 shadow-action-break-light hover:from-amber-400 hover:to-amber-300",
};

const ACTION_BADGE: Record<LogType, string> = {
  login: "bg-action-login-bg border border-action-login-light text-action-login",
  logout: "bg-action-logout-bg border border-action-logout-light text-action-logout",
  break: "bg-action-break-bg border border-action-break-light text-action-break",
};

const GREETINGS = [
  "🚀 Ready to build something amazing today?",
  "💡 Great products are made one check-in at a time!",
  "🔥 Innovation and passion fuel our growth here!",
  "🌟 Welcome back, builder! Let's crush today's goals!",
  "⚡ Stand out, build fast, and stay curious!",
  "🧠 Work hard, collaborate, and make an impact!",
];

const MAX_PEOPLE = 4;

export default function LogForm() {
  const [action, setAction] = useState<LogType | null>(null);
  const [people, setPeople] = useState<Array<{ name: string }>>([{ name: "" }]);
  const [image, setImage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [currentGreeting, setCurrentGreeting] = useState("");

  const greetingMatch = currentGreeting.match(/^([^\w\s]+)?\s*(.*)$/);
  const greetingEmoji = greetingMatch ? greetingMatch[1] : "";
  const greetingText = greetingMatch ? greetingMatch[2] : currentGreeting;

  useEffect(() => {
    setCurrentGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  }, [action]);

  const saving = status.kind === "saving";
  const canSave = !!action && !!image && people.every((person) => person.name.trim().length > 0) && !saving;
  const actionLabel = action ? ACTION_LABEL[action] : "";
  const autoResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef = useRef<CameraCaptureHandle | null>(null);

  function chooseAction(type: LogType) {
    playClickSound();
    setAction(type);
    setStatus({ kind: "idle" });
  }

  function reset() {
    if (autoResetRef.current) {
      clearTimeout(autoResetRef.current);
      autoResetRef.current = null;
    }
    playClickSound();
    setAction(null);
    setPeople([{ name: "" }]);
    setImage(null);
    setStatus({ kind: "idle" });
  }

  function addPerson() {
    playClickSound();
    setPeople((current) => [...current, { name: "" }]);
  }

  function removePerson(index: number) {
    playClickSound();
    setPeople((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function updatePersonName(index: number, value: string) {
    setPeople((current) => current.map((person, currentIndex) => (currentIndex === index ? { ...person, name: value } : person)));
  }

  async function handleSave() {
    if (!canSave || !action || !image) return;

    setStatus({ kind: "saving" });

    try {
      await createMultipleLogs(people, action, image);

      playSuccessSound();
      setStatus({
        kind: "success",
        message: action === "login" ? "Logged In Successfully!" : action === "break" ? "Break Logged!" : "Logged Out Successfully!",
        names: people.map((p) => p.name.trim()).filter(Boolean),
      });

      autoResetRef.current = setTimeout(reset, 5000);
    } catch (error) {
      playErrorSound();
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Something went wrong.",
      });
    }
  }

  if (!action) {
    return (
      <div className="flex w-[98%] max-w-6xl flex-col gap-3 rounded-[18px] border border-surface-200 bg-white p-4 shadow-[0_12px_30px_-10px_rgba(49,94,239,0.08)] animate-scaleIn">
        <DateTimeDisplay />

        <div className="mx-auto rounded-full bg-brand-blue-50 border border-brand-blue-200 px-3 py-1 text-[11px] font-semibold text-brand-blue-700 tracking-wide shadow-sm">
          {IS_MOCK ? "⚠️ Running in Local Demo Mode" : "⚡ Live Database Connected"}
        </div>

        {currentGreeting && (
          <SessionGreeting emoji={greetingEmoji} text={greetingText} variant="hero" />
        )}

        <p className="text-center text-xs font-bold uppercase tracking-wider text-ink-400">Choose Session Action</p>

        <ActionSelector onSelect={chooseAction} />
      </div>
    );
  }

  return (
    <div className="flex w-[98%] max-w-6xl flex-col gap-3 rounded-[18px] border border-surface-200 bg-white p-4 shadow-[0_12px_30px_-10px_rgba(49,94,239,0.08)] animate-scaleIn">
      <DateTimeDisplay />

      <div className="flex items-center justify-between border-b border-surface-100 pb-3">
        <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${ACTION_BADGE[action]}`}>{actionLabel}</span>
        <button type="button" onClick={reset} disabled={saving} className="cursor-pointer text-xs font-bold text-ink-500 transition hover:text-brand-blue-600 disabled:opacity-30">
          ← Change Action
        </button>
      </div>

      {status.kind === "success" ? (
        <SuccessCard message={status.message} names={status.names} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <PersonForm
              people={people}
              saving={saving}
              maxPeople={MAX_PEOPLE}
              onUpdateName={updatePersonName}
              onRemove={removePerson}
              onAdd={addPerson}
            />

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-500">Webcam Verification</label>
              <CameraCapture ref={cameraRef} onCapture={setImage} hideControls />
            </div>
          </div>

          {!saving && (
            <div className="flex items-center justify-center gap-3">
              {image ? (
                <button
                  type="button"
                  onClick={() => cameraRef.current?.retake()}
                  className="min-w-[200px] rounded-xl border border-surface-200 bg-white px-8 py-3 text-sm font-bold text-ink-700 transition hover:bg-surface-50 hover:text-brand-blue-600 shadow-sm cursor-pointer"
                >
                  🔄 Retake photo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => cameraRef.current?.capture()}
                  disabled={!cameraRef.current?.cameraReady || saving}
                  className="min-w-[200px] rounded-xl bg-brand-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md shadow-brand-blue-100 hover:bg-brand-blue-500 active:scale-98 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  📷 Capture Photo
                </button>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className={`min-w-[200px] rounded-xl bg-gradient-to-r ${ACTION_GRADIENT[action]} cursor-pointer px-8 py-3 text-sm font-bold text-white shadow-md transition duration-200 active:scale-98 disabled:cursor-not-allowed disabled:opacity-30`}
              >
                {saving ? "Logging…" : `Save & Complete ${actionLabel}`}
              </button>
            </div>
          )}

          {status.kind === "error" && (
            <p className="rounded-xl border border-brand-blue-200 bg-brand-blue-50 px-4 py-3 text-center text-xs font-bold text-brand-blue-700 animate-fadeIn">
              ⚠️ {status.message}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 border-t border-surface-100 pt-4 text-center text-[10px] font-semibold text-ink-400">
            🔒 Data Privacy Compliant: Photos are processed locally for security logs and are never shared.
          </div>
        </>
      )}
    </div>
  );
}
