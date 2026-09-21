/*
 * 오프라인 지원. 전략은 네트워크 우선:
 * 온라인이면 항상 서버의 최신 파일을 받고(받는 김에 캐시를 갱신),
 * 오프라인일 때만 마지막으로 캐시된 사본으로 대신한다.
 * 단어를 자주 고치는 앱이라 캐시 우선으로 하면 낡은 화면이 붙어 다니게 된다.
 */
const CACHE = "nihongo-v12";
const CORE = [
  "./",
  "index.html",
  "kana.html",
  "ch.html",
  "chapter.html",
  "listen.html",
  "list.html",
  "style.css",
  "app.js",
  "chapters.js",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
];

/*
 * 네트워크로 나갈 때는 브라우저 HTTP 캐시를 반드시 거쳐 검사하게 한다.
 * GitHub Pages가 max-age=600을 주기 때문에, 그냥 fetch 하면 "네트워크 우선"이라 해도
 * 실제로는 10분짜리 낡은 사본을 받아 그대로 캐시에 덮어쓰게 된다.
 * no-cache 는 매번 서버에 물어보되 안 바뀌었으면 304만 받아 오므로 낭비도 적다.
 */
const fresh = req => fetch(req, { cache: "no-cache" });

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(CORE.map(u => fresh(u).then(r => c.put(u, r)))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  e.respondWith(
    fresh(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() =>
        // ignoreSearch: chapter.html?ch=1 도 캐시된 chapter.html 로 응답할 수 있게
        caches.match(req, { ignoreSearch: true }).then(r =>
          r || (req.mode === "navigate" ? caches.match("index.html") : undefined)
        )
      )
  );
});
