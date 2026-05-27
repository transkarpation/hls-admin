export async function onRequestError() {
  // required export
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWebSocketServer } = await import("@/lib/ws-server");
    startWebSocketServer();

    const { restoreJobs } = await import("@/lib/scheduler");
    await restoreJobs();
  }
}
