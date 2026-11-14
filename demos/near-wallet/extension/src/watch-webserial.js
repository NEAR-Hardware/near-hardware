// The watch's JSON-lines protocol over Web Serial (extension pages only).
export const ESPRESSIF_VID = 0x303a;

export class WatchConnection {
  constructor(port) {
    this.port = port;
    this.nextId = 1;
    this.waiting = new Map();
    this.onEvent = () => {};
    this.onClose = () => {};
    this.closed = false;
  }

  static async granted() {
    const ports = await navigator.serial.getPorts();
    return ports.find((p) => p.getInfo().usbVendorId === ESPRESSIF_VID) ?? null;
  }

  // needs a user gesture
  static async choose() {
    return navigator.serial.requestPort({ filters: [{ usbVendorId: ESPRESSIF_VID }] });
  }

  async open() {
    try {
      await this.port.open({ baudRate: 115200, bufferSize: 65536 });
    } catch (e) {
      if (String(e).includes("already open")) return;
      throw new Error("Could not open the watch. Close any serial monitor or script using it and try again.");
    }
    // The S3's USB-serial-JTAG only sends while DTR is set. RTS high with DTR
    // low would reset the chip, so keep DTR on and RTS off.
    await this.port.setSignals({ dataTerminalReady: true, requestToSend: false });
    this.writer = this.port.writable.getWriter();
    this._readLoop();
  }

  async _readLoop() {
    const decoder = new TextDecoder();
    let buf = "";
    try {
      this.reader = this.port.readable.getReader();
      for (;;) {
        const { value, done } = await this.reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          this._line(line);
        }
      }
    } catch {
      // unplugged
    } finally {
      this._closed(new Error("The watch was disconnected"));
    }
  }

  _line(line) {
    if (!line.startsWith("{")) return;
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

  _closed(err) {
    if (this.closed) return;
    this.closed = true;
    for (const w of this.waiting.values()) {
      clearTimeout(w.timer);
      w.reject(err);
    }
    this.waiting.clear();
    this.onClose(err);
  }

  request(cmd, { timeoutMs = 5000, onEvent } = {}) {
    if (this.closed) return Promise.reject(new Error("The watch is not connected"));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        reject(new Error(`The watch did not answer (${cmd.cmd})`));
      }, timeoutMs);
      this.waiting.set(id, { resolve, reject, timer, onEvent });
      this._send(JSON.stringify({ id, ...cmd }) + "\n").catch(reject);
      this._poke();
    });
  }

  _send(text) {
    // one writer, so serialize writes
    this.chain = (this.chain ?? Promise.resolve()).catch(() => {}).then(() => this.writer.write(new TextEncoder().encode(text)));
    return this.chain;
  }

  // On macOS, node-serialport only saw this device's replies after its next
  // write. Chrome may well be fine, but while a request is outstanding we send
  // empty lines (the firmware ignores them) so a reply can never sit unread.
  _poke() {
    if (this.poker) return;
    this.poker = setInterval(() => {
      if (!this.waiting.size || this.closed) {
        clearInterval(this.poker);
        this.poker = null;
        return;
      }
      this._send("\n").catch(() => {});
    }, 150);
  }

  async close() {
    try { await this.reader?.cancel(); } catch {}
    try { this.writer?.releaseLock(); } catch {}
    try { await this.port.close(); } catch {}
    this._closed(new Error("closed"));
  }
}
