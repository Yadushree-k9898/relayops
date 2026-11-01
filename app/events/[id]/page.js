"use client";

import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import Link from "next/link";
import {ArrowLeft, Clock3, RefreshCw, Webhook, CheckCircle2, AlertCircle} from "lucide-react";

function Status({value}) {
  const label = value === "dead_letter" ? "Dead letter" : value;
  return <span className={"pill " + value}>{label}</span>;
}

function date(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params?.id;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [retrying, setRetrying] = useState("");

  async function load() {
    if (!eventId) return;
    setLoading(true);
    try {
      const response = await fetch("/api/events/" + eventId, {cache: "no-store"});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load event.");
      setEvent(body.event);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [eventId]);

  async function retry(deliveryId) {
    setRetrying(deliveryId);
    setNotice("");
    try {
      const response = await fetch("/api/events/" + deliveryId + "/retry", {method: "POST"});
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not queue this delivery.");
      setNotice("Delivery queued. Run the worker from the overview to process it.");
      await load();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setRetrying("");
    }
  }

  if (loading) {
    return <main className="detail-shell"><div className="panel detail-loading">Loading event details…</div></main>;
  }

  if (!event) {
    return <main className="detail-shell">
      <Link href="/" className="back-link"><ArrowLeft size={15}/> Back to overview</Link>
      <div className="panel detail-loading">{notice || "Event not found."}</div>
    </main>;
  }

  const deliveries = event.deliveries || [];
  const delivered = deliveries.filter(item => item.status === "delivered").length;
  const needsAttention = deliveries.filter(item => item.status === "dead_letter").length;

  return <main className="detail-shell">
    <div className="detail-top">
      <div>
        <Link href="/" className="back-link"><ArrowLeft size={15}/> Back to overview</Link>
        <div className="eyebrow" style={{marginTop: 20}}>Event inspector</div>
        <h1>{event.type}</h1>
        <div className="muted small">Event ID: <code>{event.id}</code></div>
      </div>
      <div className="detail-created"><Clock3 size={14}/> Created {date(event.createdAt)}</div>
    </div>

    {notice && <div className="panel detail-notice">{notice}</div>}

    <section className="detail-stats">
      <div className="panel detail-stat"><span className="muted small">Destinations</span><strong>{deliveries.length}</strong></div>
      <div className="panel detail-stat"><span className="muted small">Delivered</span><strong>{delivered}</strong></div>
      <div className="panel detail-stat"><span className="muted small">Needs attention</span><strong>{needsAttention}</strong></div>
    </section>

    <section className="panel detail-section">
      <div className="head"><div><div className="title">Event payload</div><div className="muted small">The JSON data accepted by RelayOps</div></div><Webhook size={16}/></div>
      <div className="body"><pre className="payload-view">{JSON.stringify(event.payload, null, 2)}</pre></div>
    </section>

    <section className="detail-section">
      <div className="detail-section-heading">
        <div><div className="title">Delivery destinations</div><div className="muted small">Each destination has its own delivery state and attempt history.</div></div>
        <span className="muted small">{deliveries.length} total</span>
      </div>

      {!deliveries.length && <div className="panel empty">No destination matched this event when it was created.</div>}

      {deliveries.map(delivery => <article className="panel delivery-card" key={delivery.id}>
        <div className="delivery-card-head">
          <div className="delivery-endpoint">
            <div className="endpoint-icon"><Webhook size={16}/></div>
            <div><div className="title">{delivery.endpoint.name}</div><div className="muted small url-text">{delivery.endpoint.url}</div></div>
          </div>
          <div className="delivery-actions">
            <Status value={delivery.status}/>
            {delivery.status === "dead_letter" && <button className="btn primary" disabled={retrying === delivery.id} onClick={() => retry(delivery.id)}>
              <RefreshCw size={13}/>{retrying === delivery.id ? "Queuing…" : "Retry delivery"}
            </button>}
          </div>
        </div>

        <div className="delivery-meta">
          <span>Attempts: <b>{delivery.attemptCount} / {delivery.maxAttempts}</b></span>
          <span>Last updated: <b>{date(delivery.updatedAt)}</b></span>
          {delivery.nextAttemptAt && delivery.status === "retrying" && <span>Next retry: <b>{date(delivery.nextAttemptAt)}</b></span>}
        </div>

        {delivery.lastError && <div className="last-error"><AlertCircle size={14}/>{delivery.lastError}{delivery.lastStatusCode ? " (HTTP " + delivery.lastStatusCode + ")" : ""}</div>}

        <div className="attempt-heading">ATTEMPT HISTORY</div>
        {!delivery.attempts.length && <div className="muted small no-attempts">No network attempts have been recorded yet. Run the worker to process this delivery.</div>}
        {delivery.attempts.map((attempt, index) => <div className="attempt-row" key={attempt.id}>
          <div className="attempt-marker">{attempt.status === "succeeded" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}</div>
          <div className="attempt-content">
            <div className="attempt-title"><b>Attempt {index + 1}</b><Status value={attempt.status}/><span className="muted small">{date(attempt.createdAt)}</span></div>
            <div className="attempt-meta">
              {attempt.statusCode ? <span>HTTP {attempt.statusCode}</span> : <span>No HTTP response</span>}
              {attempt.durationMs !== null && <span>{attempt.durationMs} ms</span>}
            </div>
            {attempt.error && <div className="attempt-error">{attempt.error}</div>}
            {attempt.responseBody && <details className="response-details"><summary>Response body</summary><pre>{attempt.responseBody}</pre></details>}
          </div>
        </div>)}
      </article>)}
    </section>
  </main>;
}
