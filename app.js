/*
 * 서비스 워커 등록과 자동 갱신.
 *
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
