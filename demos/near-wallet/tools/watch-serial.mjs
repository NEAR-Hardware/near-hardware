// Minimal client for the watch's JSON-lines serial protocol (Node, macOS/Linux).
//
// It opens the tty directly instead of using node-serialport: serialport's
// macOS read poller only delivered the watch's replies after the next write
// (see RECIPE.md). A non-blocking fd polled every few ms is boring and works.
// Opening the tty raises DTR and RTS together; the S3's USB-serial-JTAG needs
// DTR high to send, and only resets on RTS high with DTR low, so this is safe.
import { execFileSync } from "node:child_process";
import fs from "node:fs";

export const WATCH_PORT = process.env.WATCH_PORT ?? "/dev/cu.usbmodem101";

export class Watch {
  constructor(path = WATCH_PORT) {
    this.path = path;
    this.nextId = 1;
    this.waiting = new Map();
    this.onEvent = () => {};
    this.buf = "";
  }

  async open() {
    const sttyFlag = process.platform === "darwin" ? "-f" : "-F";
    execFileSync("stty", [sttyFlag, this.path, "115200", "raw", "-echo", "-hupcl", "clocal"]);
    this.fd = fs.openSync(this.path, fs.constants.O_RDWR | fs.constants.O_NOCTTY | fs.constants.O_NONBLOCK);
    const chunk = Buffer.alloc(4096);
    this.timer = setInterval(() => {
      for (;;) {
        let n = 0;
        try {
          n = fs.readSync(this.fd, chunk, 0, chunk.length, null);
        } catch (e) {
          if (e.code !== "EAGAIN") this._fail(e);
          return;
        }
        if (n <= 0) return;
        this.buf += chunk.toString("utf8", 0, n);
        let i;
        while ((i = this.buf.indexOf("\n")) >= 0) {
          const line = this.buf.slice(0, i).trim();
          this.buf = this.buf.slice(i + 1);
          this._line(line);
        }
      }
    }, 5);
  }

  _fail(e) {
    for (const w of this.waiting.values()) {
      clearTimeout(w.timer);
      w.reject(e);
    }
    this.waiting.clear();
  }

  _line(line) {
    if (!line.startsWith("{")) return; // boot ROM chatter
    let msg;
    try { msg = JSON.parse(line); } catch { return; }
    if (msg.event) {
      this.onEvent(msg);
      this.waiting.get(msg.id)?.onEvent?.(msg);
      return;
    }
    const w = this.waiting.get(msg.id);
    if (!w) return;
    this.waiting.delete(msg.id);
    clearTimeout(w.timer);
    w.resolve(msg);
  }

  request(cmd, { timeoutMs = 5000, onEvent } = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        reject(new Error(`watch did not answer ${cmd.cmd} within ${timeoutMs} ms`));
      }, timeoutMs);
      this.waiting.set(id, { resolve, reject, timer, onEvent });
      const data = Buffer.from(JSON.stringify({ id, ...cmd }) + "\n");
      let off = 0;
      // non-blocking fd: retry on EAGAIN until the whole line is written
      const write = () => {
        while (off < data.length) {
          try {
            off += fs.writeSync(this.fd, data, off);
          } catch (e) {
            if (e.code === "EAGAIN") return setTimeout(write, 2);
            clearTimeout(timer);
            this.waiting.delete(id);
            return reject(e);
          }
        }
      };
      write();
    });
  }

  close() {
    clearInterval(this.timer);
    if (this.fd !== undefined) fs.closeSync(this.fd);
    this.fd = undefined;
  }
}
