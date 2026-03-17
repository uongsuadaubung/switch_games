import { getVersion } from "@tauri-apps/api/app";
import { GITHUB_RELEASES_API } from "$lib/constants";

interface ReleaseInfo {
  latestVersion: string;
  releaseUrl: string;
  releaseNotes: string;
}

/** So sánh semver đơn giản: "1.2.3" > "1.2.0" → true */
function isNewer(latest: string, current: string): boolean {
  const toNumArr = (v: string) =>
    v
      .replace(/^v/, "")
      .split(".")
      .map((p) => parseInt(p, 10) || 0);

  const l = toNumArr(latest);
  const c = toNumArr(current);

  for (let i = 0; i < Math.max(l.length, c.length); i++) {
    const li = l[i] ?? 0;
    const ci = c[i] ?? 0;
    if (li > ci) return true;
    if (li < ci) return false;
  }
  return false;
}

function createUpdateStore() {
  let hasUpdate = $state(false);
  let latestVersion = $state("");
  let currentVersion = $state("");
  let releaseUrl = $state("");
  let releaseNotes = $state("");
  let dismissed = $state(false);

  async function checkForUpdate(): Promise<void> {
    try {
      const [appVersion, response] = await Promise.all([
        getVersion(),
        fetch(GITHUB_RELEASES_API, {
          headers: { Accept: "application/vnd.github+json" },
        }),
      ]);

      currentVersion = appVersion;

      if (!response.ok) {
        // Lỗi rate limit hoặc mạng → bỏ qua, không hiện gì
        console.warn(`GitHub API lỗi: ${response.status}`);
        return;
      }

      const data: unknown = await response.json();
      if (
        !data ||
        typeof data !== "object" ||
        !("tag_name" in data) ||
        !("html_url" in data)
      ) {
        console.warn("GitHub API trả về dữ liệu không hợp lệ");
        return;
      }

      const release = data as ReleaseInfo & {
        tag_name: string;
        html_url: string;
        body?: string;
      };

      const tag = typeof release.tag_name === "string" ? release.tag_name : "";
      const fetchedVersion = tag.replace(/^v/, "");

      latestVersion = fetchedVersion;
      releaseUrl =
        typeof release.html_url === "string" ? release.html_url : "";
      releaseNotes =
        typeof release.body === "string" ? release.body : "";
      hasUpdate = isNewer(fetchedVersion, appVersion);
    } catch (e) {
      // Lỗi mạng / offline → bỏ qua, không crash app
      console.warn("Không kiểm tra được bản cập nhật:", e);
    }
  }

  function dismiss() {
    dismissed = true;
  }

  return {
    get hasUpdate() {
      return hasUpdate && !dismissed;
    },
    get latestVersion() {
      return latestVersion;
    },
    get currentVersion() {
      return currentVersion;
    },
    get releaseUrl() {
      return releaseUrl;
    },
    get releaseNotes() {
      return releaseNotes;
    },
    checkForUpdate,
    dismiss,
  };
}

export const updateStore = createUpdateStore();
