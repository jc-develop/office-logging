import { describe, expect, it, vi, beforeEach } from "vitest";

interface MockOscillatorNode {
  type: string;
  frequency: { value: number; setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

interface MockGainNode {
  gain: { value: number; setValueAtTime: ReturnType<typeof vi.fn>; exponentialRampToValueAtTime: ReturnType<typeof vi.fn> };
  connect: ReturnType<typeof vi.fn>;
}

interface MockAudioContext {
  currentTime: number;
  sampleRate: number;
  createOscillator: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
  createBufferSource: ReturnType<typeof vi.fn>;
  createBiquadFilter: ReturnType<typeof vi.fn>;
  createBuffer: ReturnType<typeof vi.fn>;
  destination: string;
  state: string;
}

let mockAudioCtx: MockAudioContext;
let audioContextCallCount: number;

beforeEach(() => {
  vi.resetModules();
  audioContextCallCount = 0;

  mockAudioCtx = {
    currentTime: 0,
    sampleRate: 48000,
    state: "running",
    destination: "mock-destination",
    createOscillator: vi.fn((): MockOscillatorNode => ({
      type: "sine",
      frequency: { value: 440, setValueAtTime: vi.fn().mockReturnThis(), exponentialRampToValueAtTime: vi.fn().mockReturnThis() },
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createGain: vi.fn((): MockGainNode => ({
      gain: { value: 1, setValueAtTime: vi.fn().mockReturnThis(), exponentialRampToValueAtTime: vi.fn().mockReturnThis() },
      connect: vi.fn().mockReturnThis(),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      connect: vi.fn().mockReturnThis(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
      type: "bandpass",
      frequency: { value: 1200 },
      Q: { value: 2 },
      connect: vi.fn().mockReturnThis(),
    })),
    createBuffer: vi.fn(() => ({
      getChannelData: vi.fn(() => new Float32Array(100)),
    })),
  };

  function MockAudioContextCtor() {
    audioContextCallCount++;
    return mockAudioCtx;
  }
  (MockAudioContextCtor as any).prototype = {};

  vi.stubGlobal("AudioContext", MockAudioContextCtor);
});

describe("audio module", () => {
  it("exports all five play functions", async () => {
    const audio = await import("@/lib/audio");
    expect(typeof audio.playClickSound).toBe("function");
    expect(typeof audio.playTickSound).toBe("function");
    expect(typeof audio.playShutterSound).toBe("function");
    expect(typeof audio.playSuccessSound).toBe("function");
    expect(typeof audio.playErrorSound).toBe("function");
  });

  it("playClickSound creates one AudioContext and reuses it", async () => {
    const audio = await import("@/lib/audio");
    audio.playClickSound();
    audio.playClickSound();
    audio.playClickSound();
    expect(audioContextCallCount).toBe(1);
  });

  it("playTickSound creates oscillator and gain", async () => {
    const audio = await import("@/lib/audio");
    audio.playTickSound();
    expect(mockAudioCtx.createOscillator).toHaveBeenCalled();
    expect(mockAudioCtx.createGain).toHaveBeenCalled();
  });

  it("playShutterSound creates buffer source and filter", async () => {
    const audio = await import("@/lib/audio");
    audio.playShutterSound();
    expect(mockAudioCtx.createBufferSource).toHaveBeenCalled();
    expect(mockAudioCtx.createBiquadFilter).toHaveBeenCalled();
  });

  it("playSuccessSound creates multiple oscillators", async () => {
    const audio = await import("@/lib/audio");
    audio.playSuccessSound();
    expect(mockAudioCtx.createOscillator).toHaveBeenCalledTimes(4);
  });

  it("playErrorSound creates oscillators and uses sawtooth", async () => {
    const audio = await import("@/lib/audio");
    audio.playErrorSound();
    expect(mockAudioCtx.createOscillator).toHaveBeenCalledTimes(2);
  });

  it("handles missing AudioContext gracefully", async () => {
    vi.stubGlobal("AudioContext", undefined);
    const audio = await import("@/lib/audio");
    expect(() => audio.playClickSound()).not.toThrow();
    expect(() => audio.playSuccessSound()).not.toThrow();
  });

  it("handles closed AudioContext by creating a new one", async () => {
    const audio = await import("@/lib/audio");
    audio.playClickSound();
    expect(audioContextCallCount).toBe(1);

    mockAudioCtx.state = "closed";
    audio.playClickSound();
    expect(audioContextCallCount).toBe(2);
  });
});
