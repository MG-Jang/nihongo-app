/*
 * 모든 페이지의 <head> 에서 가장 먼저 실행되는 공통 스크립트.
 *   1) 테마를 적용한다 (화면이 그려지기 전에 해야 색이 번쩍이지 않는다)
 *   2) 서비스 워커를 등록하고, 새 버전이 오면 화면을 자동으로 갱신한다
 */

/* ── 테마 ────────────────────────────────
 * 저장값은 auto|light|dark|black. CSS 에는 항상 구체적인 값(light|dark|black)만 넘긴다.
 * auto 를 여기서 풀어 주므로 CSS 쪽에 prefers-color-scheme 분기를 둘 필요가 없다.
 */
const THEME_KEY = "theme";
const THEMES = ["auto", "light", "dark", "black"];

function savedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEMES.includes(v) ? v : "auto";
  } catch {
    return "auto";   // 저장소가 막혀 있어도 앱은 돌아가야 한다
  }
}

function applyTheme(name) {
  const dark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = name === "auto" ? (dark ? "dark" : "light") : name;
  document.documentElement.dataset.theme = resolved;

  // 주소창·상태바 색도 테마를 따라가게 한다
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = { light: "#6366f1", dark: "#0c0f1d", black: "#000000" }[resolved];
}

function setTheme(name) {
  try { localStorage.setItem(THEME_KEY, name); } catch {}
  applyTheme(name);
}

applyTheme(savedTheme());

// 자동일 때는 시스템 설정이 바뀌면 따라 바뀌어야 한다
if (window.matchMedia) {
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (savedTheme() === "auto") applyTheme("auto");
  });
}

/* ── 서비스 워커 ─────────────────────────
 * 새 워커가 제어권을 넘겨받으면 = 새 버전이 배포된 것이므로 페이지를 한 번 새로고침한다.
 * 이게 없으면 앱을 열어 둔 채로는 낡은 단어 데이터가 계속 보인다.
 */
if ("serviceWorker" in navigator) {
  // 이미 워커가 제어 중일 때만 감시한다. 첫 방문의 제어권 이동은 정상이라 새로고침할 필요가 없다.
  if (navigator.serviceWorker.controller) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;   // 새로고침이 무한히 반복되지 않도록 한 번만
      reloaded = true;
      location.reload();
    });
  }
  navigator.serviceWorker.register("sw.js");
}
