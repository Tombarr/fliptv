/**
 * Type declarations extending TypeScript's lib/lib.dom.d.ts.
 * https://github.com/Microsoft/TypeScript/blob/master/lib/lib.dom.d.ts
 */

 type DOMRequestReadyState = 'done' | 'pending';

 export interface DOMRequest {
   onsuccess?: () => any;
   onerror?: () => any;
   error?: Error;
   result?: any;
   readyState?: DOMRequestReadyState;
 }

 export declare interface App {
  manifest: Object;
  manifestURL: string;
  origin: string;
  installOrigin: string;
  installTime: number;
  state: string;
  launch: Function;
  downloadAvailable: boolean;
  checkForUpdate: () => DOMRequest;
}

export declare interface DOMApplicationsRegistry {
  install(url: string, params?: Object): DOMRequest;
  installPackage(url: string, params?: Object): DOMRequest;
  getSelf(): DOMRequest;
  getInstalled(): DOMRequest;
  checkInstalled(manifestUrl: string): DOMRequest;
}

 export interface MozActivity extends DOMRequest {
   new (options: Object): MozActivity;
 }

declare global {
  interface AudioContext {
    mozAudioChannelType?: string;
  }

  interface Window {
    mozAudioContext: AudioContext;
    webkitAudioContext: AudioContext;
    oAudioContext: AudioContext;
    msAudioContext: AudioContext;
    msCrypto: Crypto;
    mozIndexedDB: IDBFactory;
    webkitIndexedDB: IDBFactory;
    msIndexedDB: IDBFactory;
    OIndexedDB: IDBFactory;
    MozActivity: MozActivity;
  }

  interface Navigator {
    deviceMemory?: number;
  }

  namespace indexedDB {
    interface IDBTransaction {
      commit?: () => void;
    }
  }
}

export interface KaiosDocument extends Document {
  readonly mozFullScreen: boolean;
  readonly webkitIsFullScreen: boolean;

  readonly mozFullScreenElement: Element;
  readonly msFullscreenElement: Element;
  readonly webkitFullscreenElement: Element;

  readonly mozFullScreenEnabled: boolean;
  readonly msFullscreenEnabled: boolean;
  readonly webkitFullscreenEnabled: boolean;

  readonly mozHidden: boolean;
  readonly msHidden: boolean;
  readonly webkitHidden: boolean;

  mozCancelFullScreen(): Promise<void>;
  msExitFullscreen(): Promise<void>;
  webkitExitFullscreen(): Promise<void>;
}

export interface KaiosHTMLElement extends HTMLElement {
  mozRequestFullScreen(): Promise<void>;
  mozRequestFullScreenWithKeys(): Promise<void>;
  msRequestFullscreen(): Promise<void>;
  webkitRequestFullscreen(allowKeyboardInput?: number): Promise<void>;
}

export interface KaiosHTMLMediaElement extends HTMLMediaElement {
  mozAudioChannelType?: string;
}

export interface KaiosHTMLAudioElement extends HTMLAudioElement {
  mozAutoplayEnabled?: boolean;
}

export interface MozWakeLock {
  readonly topic: WakeLockTopic;
  unlock(): undefined;
}

export enum WakeLockTopic {
  Screen = "screen",
  Cpu = "cpu",
  Wifi = "wifi",
  Gps = "gps",
}

type WakeLockState = 'unlocked' | 'locked-foreground' | 'locked-background';
type HeadphoneStatus = 'off' | 'headset' |  'headphone' | 'lineout' | 'unknown';

export interface AudioChannelManager extends EventTarget {
  readonly headphones: boolean;
  readonly headphonesStatus?: HeadphoneStatus;
  readonly telephonySpeaker?: boolean;
  volumeControlChannel: string;
  onheadphoneschange: () => void;
}

export interface VolumeManager {
  requestUp(): undefined;
  requestDown(): undefined;
  requestShow(): undefined;
}

export type TCPSocketBinaryType = "arraybuffer" | "string";
export type TCPReadyState = "connecting" | "open" | "closing" | "closed";

export interface SocketOptions {
  useSecureTransport?: boolean;
  binaryType?: TCPSocketBinaryType;
}

export interface MozTCPSocket extends EventTarget {
  open(host: string, port: number, options?: SocketOptions): MozTCPSocket;

  suspend(): void;
  close(): void;
  resume(): void;

  send(data: string | ArrayBuffer, byteOffset: number, byteLength: number): boolean;

  readonly readyState: TCPReadyState;
}

// See https://github.com/kaiostech/gecko-b2g/blob/gonk/dom/webidl/B2G.webidl
export interface B2G extends EventTarget {
  readonly mozAudioChannelManager?: AudioChannelManager;
  requestWakeLock?(aTopic: WakeLockTopic): MozWakeLock;
  getWakeLockState?(aTopic: WakeLockTopic): WakeLockState;
}

export interface KaiosNavigator extends Navigator {
  requestWakeLock?(string: WakeLockTopic): MozWakeLock;
  readonly volumeManager?: VolumeManager;
  readonly mozAudioChannelManager?: AudioChannelManager;
  minimizeMemoryUsage?(): void;
  mozTCPSocket: MozTCPSocket;
  getFeature(name: string): Promise<any>;
  hasFeature(name: string): Promise<any>;

  readonly b2g?: B2G;
  readonly mozApps?: DOMApplicationsRegistry;
}

export interface KaiosScreen extends Screen {
  lockOrientation?(orientation: OrientationLockType): boolean;
  mozLockOrientation?(orientation: OrientationLockType): boolean;
  msLockOrientation?(orientation: OrientationLockType): boolean;

  unlockOrientation?(): boolean;
  mozUnlockOrientation?(): boolean;
  msUnlockOrientation?(): boolean;

  readonly mozOrientation?: OrientationLockType;
  readonly msOrientation?: OrientationLockType;
}
