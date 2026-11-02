<script setup lang="ts">
definePageMeta({ middleware: "admin" });

const config = useRuntimeConfig();
const toast = useToast();
const dialog = useDialog();
const { data, error, refresh, pending } = await useFetch("/api/admin/health");
const { data: metrics, refresh: refreshMetrics } = await useFetch<{
    summary: { requests: number; e4xx: number; e5xx: number };
    days: { date: string; requests: number; e4xx: number; e5xx: number }[];
}>("/api/admin/metrics", { query: { range: 7 } });

const rebuilding = ref(false);

async function rebuild() {
    const confirmed = await dialog.confirm({
        title: "Rebuild All Leaderboards?",
        message: "This will purge and recalculate all leaderboard rankings and XP ladders directly from verified test records.",
        confirmText: "Rebuild Leaderboards",
        danger: true,
    });
    if (!confirmed) return;

    let code = "";
    if (config.public.adminRequire2fa) {
        const input = await dialog.prompt({
            title: "2FA TOTP Code Required",
            message: "Enter your 6-digit TOTP code to authorize leaderboard recreation:",
            placeholder: "000000",
        });
        if (!input) return;
        code = input;
    }
    rebuilding.value = true;
    try {
        const result = await $fetch<{ tests: number }>(
            "/api/admin/leaderboards/rebuild",
            {
                method: "POST",
                headers: code ? { "x-admin-reauth": code } : {},
            },
        );
        toast.success(`Leaderboards rebuilt from ${result.tests} tests.`);
    } catch {
        toast.error("Rebuild failed. Ensure system services are operational.");
    } finally {
        rebuilding.value = false;
    }
}

function reload() {
    refresh();
    refreshMetrics();
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div
            class="flex flex-wrap items-center justify-between gap-4 rounded-box border border-base-300 bg-base-200/50 p-5 shadow-xs"
        >
            <div>
                <h1 class="text-xl font-bold tracking-tight">
                    System Health & Monitoring
                </h1>
                <p class="mt-0.5 text-xs text-base-content/60">
                    Database response times, cache latency, service availability,
                    and traffic metrics.
                </p>
            </div>

            <button
                type="button"
                class="btn btn-sm btn-ghost gap-1.5 border border-base-300"
                :disabled="pending"
                @click="reload"
            >
                <svg
                    class="size-3.5"
                    :class="{ 'animate-spin': pending }"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                >
                    <path
                        d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"
                    />
                </svg>
                <span class="text-xs">Re-check</span>
            </button>
        </div>

        <p v-if="error" class="alert alert-warning text-sm">
            Health data unavailable (database/auth not configured).
        </p>

    <!-- Health Checks Grid -->
    <div v-if="data" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="(check, name) in data.checks" :key="name" class="rounded-box border border-base-300 bg-base-200/30 p-4 transition-all">
        <div class="flex items-center justify-between">
          <p class="text-xs font-mono font-semibold uppercase tracking-wider text-base-content/60">{{ name }}</p>
          <span
            class="badge badge-xs font-mono uppercase"
            :class="check.ok
              ? 'badge-success'
              : (check.detail?.includes('not set') || check.detail?.includes('empty') || check.detail?.includes('not configured')
                ? 'badge-ghost text-base-content/50'
                : 'badge-error')"
          >
            {{ check.ok ? 'ONLINE' : (check.detail?.includes('not set') || check.detail?.includes('empty') || check.detail?.includes('not configured') ? 'UNSET' : 'DOWN') }}
          </span>
        </div>
        <p
          class="mt-2 font-mono text-2xl font-bold"
          :class="check.ok
            ? 'text-success'
            : (check.detail?.includes('not set') || check.detail?.includes('empty') || check.detail?.includes('not configured')
              ? 'text-base-content/40'
              : 'text-error')"
        >
          {{ check.ok ? (check.latencyMs !== undefined ? `${check.latencyMs}ms` : 'Ready') : (check.detail?.includes('not set') || check.detail?.includes('empty') || check.detail?.includes('not configured') ? 'Unset' : 'Failed') }}
        </p>
        <p class="mt-1 text-[11px] font-mono text-base-content/50 truncate" :title="check.detail">
          {{ check.detail || (check.ok ? 'Service healthy' : 'Not configured') }}
        </p>
      </div>
    </div>

        <!-- 7-Day Metrics Chart & Table -->
        <section
            v-if="metrics"
            class="rounded-box border border-base-300 bg-base-200/30 p-5 space-y-4"
        >
            <div
                class="flex flex-wrap items-center justify-between gap-2 border-b border-base-300 pb-3"
            >
                <div>
                    <h2 class="text-sm font-semibold">
                        Traffic & Error Histogram (Last 7 Days)
                    </h2>
                    <p class="text-xs text-base-content/50">
                        Aggregated hourly from system telemetry
                    </p>
                </div>
                <div class="flex items-center gap-3 font-mono text-xs">
                    <span
                        >Total:
                        <strong class="text-primary">{{
                            metrics.summary.requests
                        }}</strong></span
                    >
                    <span class="text-warning"
                        >{{ metrics.summary.e4xx }} 4xx</span
                    >
                    <span class="text-error"
                        >{{ metrics.summary.e5xx }} 5xx</span
                    >
                </div>
            </div>

            <div class="overflow-x-auto rounded-box border border-base-300">
                <table class="table table-xs font-mono">
                    <thead
                        class="bg-base-200/60 uppercase text-[10px] text-base-content/50"
                    >
                        <tr>
                            <th>Date (UTC)</th>
                            <th>Total Requests</th>
                            <th>4xx Client Errors</th>
                            <th>5xx Server Errors</th>
                            <th>Health Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="day in metrics.days"
                            :key="day.date"
                            class="hover:bg-base-200/50"
                        >
                            <td class="font-semibold">{{ day.date }}</td>
                            <td class="tabular-nums">
                                {{ day.requests.toLocaleString() }}
                            </td>
                            <td
                                class="tabular-nums"
                                :class="
                                    day.e4xx > 0 ? 'text-warning' : 'opacity-40'
                                "
                            >
                                {{ day.e4xx }}
                            </td>
                            <td
                                class="tabular-nums"
                                :class="
                                    day.e5xx > 0
                                        ? 'text-error font-bold'
                                        : 'opacity-40'
                                "
                            >
                                {{ day.e5xx }}
                            </td>
                            <td>
                                <span
                                    class="badge badge-xs"
                                    :class="
                                        day.e5xx > 0
                                            ? 'badge-error'
                                            : day.requests > 0
                                              ? 'badge-success'
                                              : 'badge-ghost'
                                    "
                                >
                                    {{
                                        day.e5xx > 0
                                            ? "Errors"
                                            : day.requests > 0
                                              ? "Normal"
                                              : "Idle"
                                    }}
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p
                v-if="!metrics.summary.requests"
                class="text-xs opacity-50 font-mono"
            >
                Metrics accumulate automatically as traffic hits public and
                internal APIs.
            </p>
        </section>

        <!-- Maintenance Operations -->
        <section class="rounded-box border border-base-300 bg-base-200/30 p-5">
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 class="text-sm font-semibold">
                        Cache & Leaderboard Maintenance
                    </h2>
                    <p class="text-xs text-base-content/50">
                        Recompute and synchronize all competitive leaderboard rankings and XP ladders
                        directly from verified records. Requires 2FA confirmation.
                    </p>
                </div>
                <button
                    type="button"
                    class="btn btn-warning btn-sm"
                    :disabled="rebuilding"
                    @click="rebuild"
                >
                    <svg
                        class="size-4"
                        :class="{ 'animate-spin': rebuilding }"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path
                            d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"
                        />
                    </svg>
                    <span>{{
                        rebuilding ? "Rebuilding…" : "Rebuild Leaderboards"
                    }}</span>
                </button>
            </div>
        </section>

        <!-- Runtime Environment Snapshot -->
        <div
            v-if="data"
            class="rounded-box border border-base-300 bg-base-200/20 p-4 font-mono text-xs flex flex-wrap items-center justify-between gap-4 text-base-content/60"
        >
            <div>
                Engine Version:
                <strong class="text-base-content">{{ data.version }}</strong>
            </div>
            <div>
                Deployment Region:
                <strong class="text-base-content">{{ data.region }}</strong>
            </div>
            <div>
                Node Runtime:
                <strong class="text-base-content">{{ data.node }}</strong>
            </div>
        </div>
    </div>
</template>
