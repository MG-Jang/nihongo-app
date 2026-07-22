/*
 * 오프라인 지원. 전략은 네트워크 우선:
 * 온라인이면 항상 서버의 최신 파일을 받고(받는 김에 캐시를 갱신),
 * 오프라인일 때만 마지막으로 캐시된 사본으로 대신한다.
 * 단어를 자주 고치는 앱이라 캐시 우선으로 하면 낡은 화면이 붙어 다니게 된다.
 */
const CACHE = "nihongo-v2";
const CORE = [
  "./",
  "index.html",
  "kana.html",
  "chapter.html",
  "listen.html",
  "style.css",
  "chapters.js",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
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
    fetch(req)
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
