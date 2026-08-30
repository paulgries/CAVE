#!/usr/bin/env python3
"""Extract opencode session transcripts into conversations/<session>.md.

Usage:
  python3 extract_conversations.py --dir .            # all sessions for this dir
  python3 extract_conversations.py --dir . --latest   # most recent session only
  python3 extract_conversations.py --dir . --id <session_id>

Reads the opencode sqlite store (~/.local/share/opencode/opencode.db) and writes
a readable markdown transcript per session. Used to commit AI-assisted
conversations for history (see AGENTS.md).
"""
import argparse, json, os, sqlite3, sys

DB = os.path.expanduser("~/.local/share/opencode/opencode.db")


def find_sessions(conn, directory):
    cur = conn.cursor()
    cur.execute(
        "SELECT id, title, slug, directory FROM session WHERE directory LIKE ? ORDER BY time_created",
        (f"%{directory}%",),
    )
    return cur.fetchall()


def messages_for(conn, sid):
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM message WHERE session_id=? ORDER BY time_created, id", (sid,)
    )
    return [r[0] for r in cur.fetchall()]


def message_role(conn, mid):
    cur = conn.cursor()
    cur.execute("SELECT data FROM message WHERE id=?", (mid,))
    row = cur.fetchone()
    if not row:
        return "?"
    return json.loads(row[0]).get("role", "?")


def parts_for(conn, mid):
    cur = conn.cursor()
    cur.execute(
        "SELECT data FROM part WHERE message_id=? ORDER BY time_created, id", (mid,)
    )
    out = []
    for (data,) in cur.fetchall():
        d = json.loads(data)
        t = d.get("type")
        if t == "text":
            out.append(("text", d.get("text", "")))
        elif t == "tool":
            st = d.get("state", {})
            out.append(
                (
                    "tool",
                    {
                        "name": d.get("tool", "?"),
                        "status": st.get("status", ""),
                        "input": st.get("input"),
                        "output": st.get("output", ""),
                    },
                )
            )
    return out


def render_transcript(conn, sid):
    lines = []
    for mid in messages_for(conn, sid):
        role = message_role(conn, mid)
        if role == "user":
            for kind, payload in parts_for(conn, mid):
                if kind == "text":
                    lines.append("## User\n")
                    lines.append(payload.strip())
                    lines.append("")
        else:
            lines.append("## Assistant\n")
            for kind, payload in parts_for(conn, mid):
                if kind == "text":
                    lines.append(payload.strip())
                    lines.append("")
                elif kind == "tool":
                    out = payload["output"]
                    if len(out) > 400:
                        out = out[:400] + "\n... (truncated)"
                    inp = ""
                    if payload["input"]:
                        inp = json.dumps(payload["input"], ensure_ascii=False)[:300]
                    lines.append(
                        f"`{payload['name']}` ({payload['status']})"
                        + (f" input: `{inp}`" if inp else "")
                    )
                    if out:
                        lines.append("```")
                        lines.append(out)
                        lines.append("```")
                    lines.append("")
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=".", help="project directory to match sessions")
    ap.add_argument("--latest", action="store_true", help="only most recent session")
    ap.add_argument("--id", help="specific session id")
    args = ap.parse_args()

    if not os.path.exists(DB):
        sys.exit("opencode db not found at " + DB)
    conn = sqlite3.connect(DB)

    if args.id:
        sessions = [(args.id, "", "", "")]
    else:
        sessions = find_sessions(conn, os.path.abspath(args.dir))
        if not sessions:
            sys.exit("no sessions found for directory")
    if args.latest and sessions:
        sessions = sessions[-1:]

    os.makedirs("conversations", exist_ok=True)
    for sid, title, slug, directory in sessions:
        body = render_transcript(conn, sid)
        out = f"# Session: {sid}\n\n"
        if title:
            out += f"**Title:** {title}\n"
        if slug:
            out += f"**Slug:** {slug}\n"
        if directory:
            out += f"**Dir:** {directory}\n"
        out += "\n---\n\n" + body
        path = os.path.join("conversations", f"{sid}.md")
        with open(path, "w") as fh:
            fh.write(out)
        print("wrote", path)
    conn.close()


if __name__ == "__main__":
    main()
