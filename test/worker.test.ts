import { describe, expect, it, vi } from "vitest";

import worker from "../src/worker";

describe("worker", () => {
  it("returns a health response for /api/health", async () => {
    const assetsFetch = vi.fn();
    const request = new Request("https://example.com/api/health");

    const response = await worker.fetch(
      request,
      { ASSETS: { fetch: assetsFetch } } as unknown as Env,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ status: "ok" });
    expect(assetsFetch).not.toHaveBeenCalled();
  });

  it("serves non-API requests from the static assets binding", async () => {
    const assetResponse = new Response("landing page");
    const assetsFetch = vi.fn().mockResolvedValue(assetResponse);
    const request = new Request("https://example.com/");

    const response = await worker.fetch(
      request,
      { ASSETS: { fetch: assetsFetch } } as unknown as Env,
    );

    expect(response).toBe(assetResponse);
    expect(assetsFetch).toHaveBeenCalledOnce();
    expect(assetsFetch).toHaveBeenCalledWith(request);
  });
});
