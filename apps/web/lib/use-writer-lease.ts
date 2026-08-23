"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type WriterLeaseStatus = "probing" | "writer" | "conflict";

interface LeaseMessage {
  readonly type: "probe" | "lease" | "takeover";
  readonly ownerId: string;
  readonly expiresAt: number;
}

export interface WriterLease {
  readonly status: WriterLeaseStatus;
  readonly takeOver: () => void;
}

const LEASE_MS = 5_000;
const HEARTBEAT_MS = 1_500;
const PROBE_MS = 300;

export function useWriterLease(documentId: string): WriterLease {
  const ownerIdRef = useRef<string>("");
  const channelRef = useRef<BroadcastChannel | null>(null);
  const statusRef = useRef<WriterLeaseStatus>("probing");
  const foreignExpiryRef = useRef(0);
  const [status, setStatus] = useState<WriterLeaseStatus>("probing");

  const updateStatus = useCallback((next: WriterLeaseStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const post = useCallback((type: LeaseMessage["type"]) => {
    const channel = channelRef.current;
    if (!channel) return;
    channel.postMessage({
      type,
      ownerId: ownerIdRef.current,
      expiresAt: Date.now() + LEASE_MS,
    } satisfies LeaseMessage);
  }, []);

  useEffect(() => {
    ownerIdRef.current = crypto.randomUUID();
    foreignExpiryRef.current = 0;
    updateStatus("probing");
    if (typeof BroadcastChannel === "undefined") {
      updateStatus("writer");
      return;
    }

    const channel = new BroadcastChannel(`animflow-studio:${documentId}`);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<LeaseMessage>) => {
      const message = event.data;
      if (!message || message.ownerId === ownerIdRef.current) return;
      if (message.type === "probe") {
        if (statusRef.current === "writer") post("lease");
        return;
      }
      if (message.type === "takeover") {
        foreignExpiryRef.current = message.expiresAt;
        updateStatus("conflict");
        return;
      }
      foreignExpiryRef.current = message.expiresAt;
      if (statusRef.current === "writer" && ownerIdRef.current < message.ownerId) {
        post("lease");
      } else {
        updateStatus("conflict");
      }
    };

    post("probe");
    const probeTimer = window.setTimeout(() => {
      if (statusRef.current === "probing") {
        updateStatus("writer");
        post("lease");
      }
    }, PROBE_MS);
    const heartbeat = window.setInterval(() => {
      if (statusRef.current === "writer") {
        post("lease");
      } else if (statusRef.current === "conflict" && foreignExpiryRef.current < Date.now()) {
        updateStatus("probing");
        post("probe");
        window.setTimeout(() => {
          if (statusRef.current === "probing") updateStatus("writer");
        }, PROBE_MS);
      }
    }, HEARTBEAT_MS);

    return () => {
      window.clearTimeout(probeTimer);
      window.clearInterval(heartbeat);
      channel.close();
      channelRef.current = null;
    };
  }, [documentId, post, updateStatus]);

  const takeOver = useCallback(() => {
    updateStatus("writer");
    post("takeover");
    post("lease");
  }, [post, updateStatus]);

  return { status, takeOver };
}
