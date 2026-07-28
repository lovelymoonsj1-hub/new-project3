"use client";

import { useEffect, useMemo, useState } from "react";

type Subject = {
  name: string;
  icon: string;
  color: string;
  description: string;
};

type Result = {
  subject: string;
  title: string;
  text: string;
  checks: string[];
  collected: string;
};

type Saved = Result & {
  id: string;
  student: string;
  grade: string;
  created_at: string;
};

type DbRow = {
  id: string;
  student_identifier: string;
  grade: string;
  subject: string;
  title: string;
  draft_text: string;
  review_checks: string[];
  created_at: string;
};

const subjects: Subject[] = [
  { name: "국어", icon: "가", color: "coral", description: "읽기·표현" },
  { name: "수학", icon: "수", color: "blue", description: "탐구·문제 해결" },
  { name: "영어", icon: "E", color: "mint", description: "읽기·말하기" },
  { name: "사회", icon: "사", color: "violet", description: "관점·자료 분석" },
  { name: "과학", icon: "과", color: "amber", description: "관찰·실험" },
];

const seed: Saved[] = [
  {
    id: "demo-1",
    student: "2026-014",
    grade: "2학년",
    subject: "과학",
    title: "과학 세부능력 및 특기사항 초안",
    text:
      "기후 변화와 탄소 중립에 관심을 보이며 실험 자료를 주도적으로 수집하고, 표와 그래프로 관계를 정리함. 변인 통제의 필요성을 근거와 함께 설명하고 탐구 과정에서 생긴 질문을 확장하여 일상에서 실천할 수 있는 방안을 제안하는 모습이 관찰됨.",
    checks: ["단정적 표현 완화", "순위·비교 표현 없음"],
    collected: "기후 변화 | 탄소 중립 | 실험 자료 | 변인 통제",
    created_at: "2026-07-28T09:00:00+09:00",
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function buildResult(
  subject: string,
  grade: string,
  keywords: string,
  observation: string,
  model: string,
): Result {
  const key = keywords.trim() || "수업 참여와 탐구 활동";
  const note =
    observation.trim() || "근거를 비교하고 자신의 생각을 정리하는 과정";

  return {
    subject,
    title: `${subject} 세부능력 및 특기사항 초안`,
    collected: key
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .join(" | "),
    text: `${grade} 학생으로서 ${key}에 관심을 보이며 ${note}을 성실하게 수행함. 관련 자료를 주도적으로 살펴보고 핵심 내용을 ${subject} 교과 학습과 연결하여 구체적인 근거를 바탕으로 자신의 관점을 표현함. 탐구 과정에서 새롭게 생긴 질문을 확장하고 후속 탐구 방향을 제안하는 등 자기주도적으로 학습에 참여하는 모습이 관찰됨.`,
    checks: [
      `${model} 작성 설정 적용`,
      "단정적 표현 완화",
      "순위·비교 표현 없음",
    ],
  };
}

async function db<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | null> {
  if (!supabaseUrl || !supabaseKey) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`데이터베이스 요청 실패: ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export default function Home() {
  const [tab, setTab] = useState<"write" | "history" | "settings">("write");
  const [grade, setGrade] = useState("2학년");
  const [student, setStudent] = useState("2026-014");
  const [subject, setSubject] = useState("과학");
  const [keywords, setKeywords] = useState(
    "기후 변화, 탄소 중립, 실험 자료",
  );
  const [observation, setObservation] = useState(
    "실험 자료를 비교하고 변인을 통제하며 생활 속 실천 방안을 제안함",
  );
  const [results, setResults] = useState<Result[]>([]);
  const [saved, setSaved] = useState<Saved[]>(seed);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("Gemini 3.5 Flash-Lite");
  const [toast, setToast] = useState("");

  const active = useMemo(
    () => subjects.find((item) => item.name === subject) || subjects[4],
    [subject],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const rawSaved = localStorage.getItem("seteuk-saved");
      if (rawSaved) setSaved(JSON.parse(rawSaved));

      const rawSettings = localStorage.getItem("seteuk-settings");
      if (rawSettings) {
        const settings = JSON.parse(rawSettings);
        setApiKey(settings.apiKey || "");
        setModel(settings.model || "Gemini 3.5 Flash-Lite");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const run = () => {
    setRunning(true);
    setResults([]);
    setStep(1);
    window.setTimeout(() => setStep(2), 500);
    window.setTimeout(() => setStep(3), 1000);
    window.setTimeout(() => {
      setResults([
        buildResult(subject, grade, keywords, observation, model),
      ]);
      setStep(4);
      setRunning(false);
    }, 1500);
  };

  const save = async (result: Result) => {
    setSaving(true);
    let savedToSupabase = false;

    try {
      const response = await db<unknown>("seteuk_drafts", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          student_identifier: student,
          grade,
          subject: result.subject,
          title: result.title,
          draft_text: result.text,
          review_checks: result.checks,
        }),
      });
      savedToSupabase = response === null && Boolean(supabaseUrl && supabaseKey);
    } catch {
      savedToSupabase = false;
    }

    const item: Saved = {
      ...result,
      id: crypto.randomUUID(),
      student,
      grade,
      created_at: new Date().toISOString(),
    };
    const next = [item, ...saved];
    setSaved(next);
    localStorage.setItem("seteuk-saved", JSON.stringify(next));
    setSaving(false);
    notify(
      savedToSupabase
        ? "Supabase에 저장했습니다."
        : "기기에 저장했습니다. Supabase 연결 설정을 확인해 주세요.",
    );
  };

  const download = (result: Result) => {
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(
      new Blob([`${result.title}\n\n${result.text}`], {
        type: "text/plain;charset=utf-8",
      }),
    );
    anchor.download = `${result.subject}-세특-초안.txt`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  const load = async () => {
    try {
      const rows = await db<DbRow[]>(
        "seteuk_drafts?select=*&order=created_at.desc",
      );
      if (rows?.length) {
        setSaved(
          rows.map((row) => ({
            id: row.id,
            student: row.student_identifier,
            grade: row.grade,
            subject: row.subject,
            title: row.title,
            text: row.draft_text,
            checks: row.review_checks || [],
            collected: "Supabase 저장 결과",
            created_at: row.created_at,
          })),
        );
      }
    } catch {
      notify("저장 내역을 불러오지 못했습니다.");
    }
  };

  const saveSettings = () => {
    localStorage.setItem(
      "seteuk-settings",
      JSON.stringify({ apiKey, model }),
    );
    notify("개인 설정을 저장했습니다.");
  };

  const pageTitle =
    tab === "write"
      ? "세부능력 및 특기사항 초안 작성"
      : tab === "history"
        ? "저장 내역"
        : "개인 메뉴";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>세특 스튜디오</span>
        </div>
        <div className="workspace-label">나의 작업 공간</div>
        <button
          className={`nav-item ${tab === "write" ? "selected" : ""}`}
          onClick={() => setTab("write")}
        >
          <span>＋</span> 새 초안 작성
        </button>
        <button
          className={`nav-item ${tab === "history" ? "selected" : ""}`}
          onClick={() => {
            setTab("history");
            load();
          }}
        >
          <span>≡</span> 저장 내역 <b>{saved.length}</b>
        </button>
        <div className="side-spacer" />
        <button
          className={`nav-item ${tab === "settings" ? "selected" : ""}`}
          onClick={() => setTab("settings")}
        >
          <span>⚙</span> 개인 메뉴
        </button>
        <div className="profile">
          <div className="avatar">교</div>
          <div>
            <strong>교사 계정</strong>
            <small>나의 작업 공간</small>
          </div>
          <span>···</span>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <span className="eyebrow">2026학년도 · 2학기</span>
            <h1>{pageTitle}</h1>
          </div>
          <div className="header-actions">
            <span className="status-dot" />
            {supabaseUrl && supabaseKey
              ? "Supabase 연결됨"
              : "Supabase 설정 필요"}
            <span className="help">?</span>
          </div>
        </header>

        {tab === "settings" ? (
          <div className="settings-card">
            <span className="section-kicker">개인 메뉴</span>
            <h2>AI 작성 환경</h2>
            <p className="muted">
              작성 에이전트에서 사용할 Gemini API 키와 선호 모델을
              설정하세요.
            </p>
            <label>
              Gemini API 키
              <input
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
            </label>
            <label>
              선호 모델
              <select
                value={model}
                onChange={(event) => setModel(event.target.value)}
              >
                <option>Gemini 3.5 Flash-Lite</option>
                <option>Gemini 2.5 Flash</option>
                <option>Gemini 2.5 Pro</option>
              </select>
            </label>
            <button className="primary small" onClick={saveSettings}>
              설정 저장
            </button>
          </div>
        ) : tab === "history" ? (
          <div className="history-list">
            {saved.map((item) => {
              const itemSubject = subjects.find(
                (candidate) => candidate.name === item.subject,
              );
              return (
                <article className="history-card" key={item.id}>
                  <div
                    className={`subject-icon ${itemSubject?.color || "blue"}`}
                  >
                    {itemSubject?.icon || "교"}
                  </div>
                  <div className="history-main">
                    <div className="history-meta">
                      <span className="tag">{item.subject}</span>
                      <span>
                        {item.grade} · {item.student}
                      </span>
                      <time>
                        {new Intl.DateTimeFormat("ko-KR", {
                          dateStyle: "medium",
                        }).format(new Date(item.created_at))}
                      </time>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    <div className="check-row">
                      {item.checks.map((check) => (
                        <span key={check}>✓ {check}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="ghost"
                    onClick={() => {
                      setResults([item]);
                      setSubject(item.subject);
                      setTab("write");
                    }}
                  >
                    다시 보기
                  </button>
                </article>
              );
            })}
          </div>
        ) : (
          <>
            <div className="intro">
              <div>
                <span className="section-kicker">1단계 · 활동 입력</span>
                <h2>학생 활동을 입력해 주세요</h2>
                <p>
                  활동 키워드와 관찰 내용으로 과목별 세특 문구 초안을
                  작성합니다.
                </p>
              </div>
              <div className="step-badge">
                1 <span>/ 3</span>
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>학년</label>
                <select
                  value={grade}
                  onChange={(event) => setGrade(event.target.value)}
                >
                  <option>1학년</option>
                  <option>2학년</option>
                  <option>3학년</option>
                </select>
              </div>
              <div className="field">
                <label>
                  학생 식별값
                  <span className="hint">이름 대신 식별번호를 사용하세요</span>
                </label>
                <input
                  value={student}
                  onChange={(event) => setStudent(event.target.value)}
                />
              </div>
            </div>

            <div className="subject-label">
              <label>과목 선택</label>
              <span>한 번에 한 과목씩 작성합니다</span>
            </div>
            <div className="subject-grid">
              {subjects.map((item) => (
                <button
                  key={item.name}
                  className={`subject ${item.name === subject ? "active" : ""}`}
                  onClick={() => setSubject(item.name)}
                >
                  <span className={`subject-icon ${item.color}`}>
                    {item.icon}
                  </span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.description}</small>
                  </span>
                  {item.name === subject && <i>✓</i>}
                </button>
              ))}
            </div>

            <div className="field full">
              <label>
                학생 활동 키워드 <span className="required">필수</span>
              </label>
              <input
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="예: 미세먼지, 자료 분석, 모형 제작"
              />
              <small>여러 항목은 쉼표로 구분해 주세요.</small>
            </div>

            <div className="field full">
              <label>
                관찰 내용 <span className="optional">선택</span>
              </label>
              <textarea
                value={observation}
                onChange={(event) =>
                  setObservation(event.target.value.slice(0, 500))
                }
                rows={4}
                placeholder="학생의 활동 과정, 태도, 결과를 구체적으로 입력하세요."
              />
              <div className="textarea-foot">
                <small>구체적인 행동과 과정을 중심으로 작성하세요.</small>
                <span>{observation.length} / 500</span>
              </div>
            </div>

            <div className="agent-strip">
              <div className="agent-head">
                <span className="section-kicker">AI 에이전트 작업 흐름</span>
                <span className="ready">
                  {running ? "작업 중" : step === 4 ? "완료" : "준비됨"}
                </span>
              </div>
              <div className="agents">
                <div className={step >= 1 ? "active-agent" : ""}>
                  <span>01</span>
                  <strong>수집 에이전트</strong>
                  <small>활동 내용 정리</small>
                </div>
                <div className="arrow">→</div>
                <div className={step >= 2 ? "active-agent" : ""}>
                  <span>02</span>
                  <strong>작성 에이전트</strong>
                  <small>세특 초안 작성</small>
                </div>
                <div className="arrow">→</div>
                <div className={step >= 3 ? "active-agent" : ""}>
                  <span>03</span>
                  <strong>검토 에이전트</strong>
                  <small>표현 규정 점검</small>
                </div>
              </div>
            </div>

            <button
              className="primary generate"
              onClick={run}
              disabled={running || !keywords.trim()}
            >
              {running
                ? `${Math.min(step, 3)}번 에이전트 작업 중...`
                : `✦ ${subject} 세특 초안 생성`}
            </button>

            {results.length > 0 && (
              <div className="results">
                <div className="result-heading">
                  <div>
                    <span className="section-kicker">3단계 · 결과</span>
                    <h2>검토 완료된 초안</h2>
                  </div>
                  <span className="reviewed">✓ 검토 완료</span>
                </div>

                {results.map((result) => (
                  <article className="result-card" key={result.subject}>
                    <div className="result-title">
                      <span className={`subject-icon ${active.color}`}>
                        {active.icon}
                      </span>
                      <div>
                        <span className="tag">{result.subject}</span>
                        <h3>{result.title}</h3>
                      </div>
                      <button
                        className="icon-btn"
                        onClick={() => download(result)}
                        title="텍스트 다운로드"
                        aria-label="텍스트 다운로드"
                      >
                        ↓
                      </button>
                    </div>
                    <div className="collected">
                      <span>수집 내용</span>
                      {result.collected}
                    </div>
                    <p className="result-text">{result.text}</p>
                    <div className="check-row">
                      {result.checks.map((check) => (
                        <span key={check}>✓ {check}</span>
                      ))}
                    </div>
                    <div className="result-actions">
                      <button
                        className="ghost"
                        onClick={() => download(result)}
                      >
                        텍스트 다운로드
                      </button>
                      <button
                        className="primary small"
                        onClick={() => save(result)}
                        disabled={saving}
                      >
                        {saving ? "저장 중..." : "Supabase에 저장"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
