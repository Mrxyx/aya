export interface IDevice {
  id: string
  name: string
  serialno: string
  androidVersion: string
  sdkVersion: string
  type: 'emulator' | 'device' | 'offline' | 'unauthorized' | 'unknown'
}

export interface IAvd {
  id: string
  name: string
  abi: string
  sdkVersion: string
  memory: number
  internalStorage: number
  resolution: string
  folder: string
  pid: number
}

export interface IPackageInfo {
  icon: string
  label: string
  enabled: boolean
  packageName: string
  versionName: string
  apkPath: string
  apkSize: number
  system: boolean
  firstInstallTime: number
  lastUpdateTime: number
  minSdkVersion?: number
  targetSdkVersion?: number
  dataSize?: number
  cacheSize?: number
  appSize?: number
  signatures: string[]
}

export type IpcGetFps = (deviceId: string, pkg: string) => Promise<number>
export type IpcGetDevices = () => Promise<IDevice[]>
export type IpcSetScreencastAlwaysOnTop = (alwaysOnTop: boolean) => void
export type IpcListForwards = (
  deviceId: string
) => Promise<Array<{ local: string; remote: string }>>
export type IpcListReverses = IpcListForwards
export type IpcForward = (
  deviceId: string,
  local: string,
  remote: string
) => void
export type IpcReverse = (
  deviceId: string,
  remote: string,
  local: string
) => void
export type IpcDumpWindowHierarchy = (deviceId: string) => Promise<string>
export type IpcGetPackageInfos = (
  deviceId: string,
  packageNames: string[]
) => Promise<IPackageInfo[]>
export type IpcGetAvds = (forceRefresh?: boolean) => Promise<IAvd[]>
export type IpcStartAvd = (avdId: string) => Promise<void>
export type IpcStopAvd = IpcStartAvd
export type IpcWipeAvdData = (avdId: string) => Promise<void>
export type IpcPairDevice = (
  host: string,
  port: number,
  password: string
) => Promise<void>

export interface IThermalZone {
  id: number
  type: string
  temperature: number
  raw: number
}

export interface IThermalInfo {
  zones: IThermalZone[]
  throttlingStatus: number
  throttlingDescription: string
  availableZones: number
  validZones: number
}

export type IpcGetThermalInfo = (deviceId: string) => Promise<IThermalInfo>
export type IpcGetKeyThermalSensors = (deviceId: string) => Promise<{
  cpu?: number
  gpu?: number
  battery?: number
  skin?: number
  soc?: number
}>
export type IpcGetAllThermalZones = (deviceId: string) => Promise<IThermalZone[]>
export type IpcGetThermalServiceInfo = (deviceId: string) => Promise<{
  throttlingStatus: number
  throttlingDescription: string
} | null>
