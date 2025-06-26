import { shell } from './base'
import trim from 'licia/trim'
import toNum from 'licia/toNum'

export interface IThermalZone {
  id: number
  type: string
  temperature: number // 温度值，单位为摄氏度
  raw: number // 原始温度值（通常以milli-celsius为单位）
  policy?: string
  mode?: string
  status?: string
}

export interface IThermalInfo {
  zones: IThermalZone[]
  throttlingStatus: number
  throttlingDescription: string
  availableZones: number
  validZones: number
}

// 温度传感器类型映射
const THERMAL_TYPE_MAP: Record<string, string> = {
  'AP': 'CPU',
  'CPU': 'CPU核心',
  'CPU0': 'CPU核心0',
  'CPU1': 'CPU核心1', 
  'CPU2': 'CPU核心2',
  'CPU3': 'CPU核心3',
  'CPU4': 'CPU核心4',
  'CPU5': 'CPU核心5',
  'CPU6': 'CPU核心6',
  'CPU7': 'CPU核心7',
  'GPU': 'GPU',
  'GPU0': 'GPU热点',
  'GPU1': 'GPU晶体',
  'gpu-usr': 'GPU用户',
  'gpu-step': 'GPU阶梯',
  'BAT': '电池',
  'battery': '电池',
  'SKIN': '设备表面',
  'skin': '设备表面',
  'USB': 'Type-C端口',
  'PA': '功率控制',
  'nsp0': 'NPU热点',
  'nsp1': 'NPU晶体',
  'soc': '系统芯片',
  'pm660-tz': '高通PM660电源管理芯片',
  'xo-therm': '晶振温度',
  'msm-therm': '高通MSM处理器温度',
  'emmc-therm': 'eMMC存储温度',
  'pa-therm0': '功放温度',
  'quiet-therm': '静态温度',
  'aoss0-usr': '系统待机控制器',
  'mdm-core-usr': '5G基带核心',
  'lpass-usr': '音频处理器',
  'camera-usr': '摄像头',
  'cpuss0-usr': '效率核心集群 (用户模式)',
  'cpuss1-usr': '性能核心集群 (用户模式)',
  'cpuss-0': '效率核心集群',
  'cpuss-1': '性能核心集群',
  'apc-0-max': '效率核心 (最高温)',
  'apc-1-max': '性能核心 (最高温)',
  'hexa-cpu-max': 'CPU最大值',
  'bms': '电池管理系统',
  
  // 扩展的传感器类型
  'modem': '5G基带芯片',
  'modem-pa': '5G功率放大器',
  'modem-core': '5G基带核心',
  'modem-skin': '5G芯片表面',
  'wifi': 'WiFi芯片',
  'wifi-pa': 'WiFi功放',
  'wlan': 'WLAN芯片',
  'bluetooth': '蓝牙芯片',
  'charger': '充电器',
  'charger-therm': '充电器温度',
  'pmic': '电源管理IC',
  'pmic-temp': '电源管理IC温度',
  
  // 摄像头相关
  'cam-therm': '摄像头温度',
  'camera-rear': '后置摄像头',
  'camera-front': '前置摄像头',
  'flash-therm': '闪光灯温度',
  
  // 内存相关
  'pop-mem': 'PoP堆叠内存',
  'ddr': 'DDR内存',
  'mem-therm': '内存温度',
  
  // 显示相关
  'lcd': '显示屏',
  'display': '显示模组',
  'backlight': '背光',
  
  // 其他常见传感器
  'tsens': '温度传感器',
  'thermal': '热传感器',
  'ambient': '环境温度',
  'pcb': 'PCB板温度',
  
  // 设备外壳相关
  'shell-back': '机身后盖',
  'shell-front': '机身前面板', 
  'shell-frame': '机身边框',
  'shell_back': '机身后盖',
  'shell_front': '机身前面板',
  'shell_frame': '机身边框',
  'shell back': '机身后盖',
  'shell front': '机身前面板',
  'shell frame': '机身边框',
  'hot-pock': '发热点监控',
  'hot_pock': '发热点监控',
  
  // 通信相关
  'mdmss-0': '5G基带芯片组0',
  'mdmss-1': '5G基带芯片组1', 
  'mdmss-2': '5G基带芯片组2',
  'mamss': '音频处理器',
  'rfboard': '射频前端模块',
  'sdr-mmw-therm': '毫米波传感器',
  'sdr_mmw_therm': '毫米波传感器',
  'mmw-ifico': '毫米波天线',
  'mmw_ifico': '毫米波天线',
  
  // 系统组件
  'system-n': '系统控制器',
  'System_n': '系统控制器',
  'dexo-0': '协处理器0',
  'dexo_0': '协处理器0',
  'sdro': '时钟振荡器',
  
  // PM8550系列电源管理IC
  'pm8550-tz': '主电源芯片',
  'pm8550_tz': '主电源芯片',
  'pm8550b-tz': '辅助电源芯片',
  'pm8550b_tz': '辅助电源芯片',
  'pm8550b-lite-tz': '低功耗电源芯片',
  'pm8550b_lite_tz': '低功耗电源芯片',
  'pm8550vs-c-tz': '电源管理C区',
  'pm8550vs_c_tz': '电源管理C区',
  'pm8550vs-d-tz': '电源管理D区',
  'pm8550vs_d_tz': '电源管理D区',
  'pm8550vs-e-tz': '电源管理E区',
  'pm8550vs_e_tz': '电源管理E区',
  'pm8550vs-g-tz': '电源管理G区',
  'pm8550vs_g_tz': '电源管理G区',
  'pm8550ve-tz': '显示电源芯片',
  'pm8550ve_tz': '显示电源芯片',
  'pmouton-t': '电源监控器',
  'pmouton_t': '电源监控器',
  
  // 媒体处理
  'video': '视频处理器',
  
  // 无线通信
  'wireless': '无线通信芯片',
  'dcxo-0': '通信时钟源0',
  'dcxo_0': '通信时钟源0',
  
  // 更多电源管理IC
  'pm8010n-tz': '外设电源芯片',
  'pm8010n_tz': '外设电源芯片',
  'pmr735d-tz': '射频电源芯片',
  'pmr735d_tz': '射频电源芯片'
}

// 获取温度阈值描述
function getThrottlingDescription(status: number): string {
  switch (status) {
    case 0:
      return '无限流'
    case 1:
      return '轻度限流 - UX不受影响'
    case 2:
      return '中度限流 - UX轻微受影响'
    case 3:
      return '严重限流 - UX明显受影响'
    case 4:
      return '临界限流 - 系统已降到最低性能'
    case 5:
      return '紧急状态 - 关键组件开始关闭'
    case 6:
      return '立即关机'
    default:
      return `未知状态: ${status}`
  }
}

// 验证传感器类型是否为已知类型
function validateSensorType(type: string): boolean {
  // 检查是否在预定义映射中
  if (THERMAL_TYPE_MAP.hasOwnProperty(type)) {
    return true
  }
  
  // 检查是否匹配已知的传感器类型模式
  const knownPatterns = [
    /^(cpu|apc\d*-cpu|kryo|gold|silver)[-_]?\d*/i,  // CPU相关
    /^(gpu|adreno|mali|sgx)[-_]?\d*/i,              // GPU相关
    /^(battery|bat|bms)[-_]?\d*/i,                  // 电池相关
    /^(skin|surface)[-_]?\d*/i,                     // 表面温度相关
    /^(soc|chip)[-_]?\d*/i,                         // 芯片相关
    /^(modem|mdm)[-_]?\w*/i,                        // 调制解调器相关
    /^(wifi|wlan|bt|bluetooth)[-_]?\w*/i,           // 无线通信相关
    /^(camera|cam)[-_]?\w*/i,                       // 摄像头相关
    /^(charger|pmic|pm\d+)[-_]?\w*/i,              // 电源管理相关
    /^(mem|ddr|pop)[-_]?\w*/i,                      // 内存相关
    /^(usb|type-c)[-_]?\w*/i,                       // USB相关
    /^(lcd|display|backlight)[-_]?\w*/i             // 显示相关
  ]
  
  return knownPatterns.some(pattern => pattern.test(type))
}

// 智能传感器分类器
interface SensorPattern {
  patterns: RegExp[]
  keywords: string[]
  name: string
  category: 'cpu' | 'gpu' | 'battery' | 'surface' | 'communication' | 'power' | 'system' | 'storage' | 'media' | 'ai'
  weight: number
}

// 智能识别规则 (按优先级排序)
const SENSOR_PATTERNS: SensorPattern[] = [
  // AI处理器 (高优先级，避免被CPU模式误判)
  {
    patterns: [/npu/i, /nsp/i, /ai/i, /neural/i, /hexagon/i],
    keywords: ['AI', '神经网络', '智能', 'NPU', '处理单元'],
    name: 'AI处理器',
    category: 'ai',
    weight: 12  // 提高权重，优先匹配AI
  },
  
  // CPU相关
  {
    patterns: [/cpu/i, /apc/i, /kryo/i, /gold/i, /silver/i, /hexa/i, /cpuss/i],
    keywords: ['处理器', '核心', '集群', 'core', 'cluster'],
    name: '处理器核心',
    category: 'cpu',
    weight: 10
  },
  
  // GPU相关
  {
    patterns: [/gpu/i, /adreno/i, /mali/i, /sgx/i],
    keywords: ['图形', '显卡', 'graphics'],
    name: '图形处理器',
    category: 'gpu', 
    weight: 10
  },
  
  // 电池相关
  {
    patterns: [/bat/i, /bms/i],
    keywords: ['电池', '电源', 'battery', 'power'],
    name: '电池',
    category: 'battery',
    weight: 10
  },
  
  // 设备表面
  {
    patterns: [/skin/i, /shell/i, /surface/i, /quiet/i, /hot.?pock/i],
    keywords: ['表面', '外壳', '机身', '热点'],
    name: '设备表面',
    category: 'surface',
    weight: 8
  },
  
  // 通信相关
  {
    patterns: [/mdm/i, /modem/i, /rf/i, /wireless/i, /wifi/i, /bt/i, /bluetooth/i, /wlan/i, /5g/i, /4g/i, /lte/i],
    keywords: ['通信', '无线', '射频', '基带', '网络'],
    name: '通信模块',
    category: 'communication',
    weight: 9
  },
  
  // 电源管理
  {
    patterns: [/pm\d+/i, /pmic/i, /charger/i, /pmr\d+/i],
    keywords: ['电源管理', '充电', 'IC'],
    name: '电源芯片',
    category: 'power',
    weight: 9
  },
  
  // 系统组件
  {
    patterns: [/soc/i, /aoss/i, /system/i, /msm/i, /dexo/i, /sdro/i],
    keywords: ['系统', '芯片', '控制器'],
    name: '系统组件',
    category: 'system',
    weight: 7
  },
  
  // 存储相关
  {
    patterns: [/ddr/i, /emmc/i, /ufs/i, /mem/i, /storage/i],
    keywords: ['内存', '存储', '闪存'],
    name: '存储组件',
    category: 'storage',
    weight: 8
  },
  
  // 媒体相关
  {
    patterns: [/camera/i, /cam/i, /video/i, /audio/i, /lpass/i, /flash/i],
    keywords: ['摄像头', '音频', '视频', '媒体'],
    name: '媒体组件',
    category: 'media',
    weight: 8
  }
]

// 智能识别传感器类型和分类
function intelligentSensorClassification(type: string): { name: string, category: string, confidence: number } {
  const lowerType = type.toLowerCase()
  const scores: { [key: string]: number } = {}
  
  // 对每个模式进行评分
  SENSOR_PATTERNS.forEach(pattern => {
    let score = 0
    
    // 正则匹配得分
    if (pattern.patterns.some(regex => regex.test(lowerType))) {
      score += pattern.weight
    }
    
    // 关键词匹配得分
    pattern.keywords.forEach(keyword => {
      if (lowerType.includes(keyword.toLowerCase()) || type.includes(keyword)) {
        score += pattern.weight * 0.3
      }
    })
    
    if (score > 0) {
      scores[pattern.category] = (scores[pattern.category] || 0) + score
    }
  })
  
  // 找到最高分类
  let bestCategory = 'unknown'
  let bestScore = 0
  let bestName = type
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
      const pattern = SENSOR_PATTERNS.find(p => p.category === category)
      if (pattern) {
        bestName = generateFriendlyName(type, pattern)
      }
    }
  }
  
  return {
    name: bestName,
    category: bestCategory,
    confidence: Math.min(bestScore / 10, 1) // 归一化到0-1
  }
}

// CPU专用友好名称生成
function generateCpuFriendlyName(originalType: string): string {
  const type = originalType.toLowerCase()
  
  // 检查是否是集群-核心格式 (cpu-X-Y)
  const clusterCoreMatch = type.match(/^cpu[-_](\d+)[-_](\d+)(?:[-_](\w+))?$/i)
  if (clusterCoreMatch) {
    const clusterId = parseInt(clusterCoreMatch[1])
    const coreId = clusterCoreMatch[2]
    const suffix = clusterCoreMatch[3]
    
    let coreName = `核心${coreId}`
    
    // 根据集群ID推断架构类型
    if (clusterId === 0) {
      coreName = `效率${coreName}`
    } else if (clusterId === 1) {
      coreName = `性能${coreName}`
    } else if (clusterId === 2) {
      coreName = `大${coreName}`
    } else if (clusterId === 3) {
      coreName = `超级${coreName}`
    } else {
      coreName = `集群${clusterId} ${coreName}`
    }
    
    if (suffix) {
      if (suffix.toLowerCase() === 'usr') {
        return `${coreName} 用户模式`
      } else if (suffix.toLowerCase() === 'step') {
        return `${coreName} 阶梯模式`
      }
      return `${coreName} ${suffix}模式`
    }
    
    return coreName
  }
  
  // 检查集群类型传感器
  if (type.includes('cpuss')) {
    const numberMatch = originalType.match(/\d+/)
    const num = numberMatch ? numberMatch[0] : ''
    return `CPU子系统${num}`
  }
  
  if (type.includes('apc')) {
    const numberMatch = originalType.match(/\d+/)
    const num = numberMatch ? numberMatch[0] : ''
    if (type.includes('max')) {
      return `CPU集群${num}最大值`
    }
    return `CPU集群${num}`
  }
  
  // 检查架构类型
  if (type.includes('gold') || type.includes('big')) {
    const numberMatch = originalType.match(/\d+/)
    const num = numberMatch ? numberMatch[0] : ''
    return `性能核心${num}`
  }
  
  if (type.includes('silver') || type.includes('little')) {
    const numberMatch = originalType.match(/\d+/)
    const num = numberMatch ? numberMatch[0] : ''
    return `效率核心${num}`
  }
  
  if (type.includes('kryo')) {
    const numberMatch = originalType.match(/\d+/)
    const num = numberMatch ? numberMatch[0] : ''
    return `Kryo核心${num}`
  }
  
  // 通用CPU核心
  const numberMatch = originalType.match(/\d+/)
  const num = numberMatch ? numberMatch[0] : ''
  return `CPU核心${num}`
}

// 生成友好的传感器名称
function generateFriendlyName(originalType: string, pattern: SensorPattern): string {
  const type = originalType.toLowerCase()
  
  // 提取数字（用于非CPU类传感器）
  const numberMatch = originalType.match(/\d+/)
  const number = numberMatch ? numberMatch[0] : ''
  
  // 根据模式生成名称
  switch (pattern.category) {
    case 'cpu':
      // 使用专用的CPU分类逻辑
      return generateCpuFriendlyName(originalType)
      
    case 'gpu':
      if (type.includes('adreno')) return `Adreno GPU${number}`
      if (type.includes('mali')) return `Mali GPU${number}`
      return `GPU${number}`
      
    case 'battery':
      return '电池'
      
    case 'surface':
      if (type.includes('back')) return '机身后盖'
      if (type.includes('front')) return '机身前面板'
      if (type.includes('frame')) return '机身边框'
      if (type.includes('hot')) return '发热点监控'
      return '设备表面'
      
    case 'communication':
      if (type.includes('mdm') || type.includes('modem')) return `5G基带${number}`
      if (type.includes('wifi') || type.includes('wlan')) return `WiFi芯片${number}`
      if (type.includes('bt') || type.includes('bluetooth')) return `蓝牙芯片${number}`
      if (type.includes('rf')) return '射频模块'
      return '通信模块'
      
    case 'power':
      if (type.includes('charger')) return '充电器'
      if (type.includes('pm')) return `电源芯片${number}`
      return '电源管理'
      
    case 'system':
      if (type.includes('aoss')) return '系统待机控制器'
      if (type.includes('soc')) return '系统芯片'
      return '系统组件'
      
    case 'storage':
      if (type.includes('ddr')) return `DDR内存${number}`
      if (type.includes('emmc')) return `eMMC存储${number}`
      return '存储组件'
      
    case 'media':
      if (type.includes('camera') || type.includes('cam')) return '摄像头'
      if (type.includes('audio') || type.includes('lpass')) return '音频处理器'
      if (type.includes('video')) return '视频处理器'
      return '媒体组件'
      
    case 'ai':
      if (type.includes('npu')) return `NPU${number}`
      return 'AI处理器'
      
    default:
      return originalType
  }
}

// 格式化温度传感器类型名称 (重构版)
function formatThermalType(type: string): string {
  // 首先查找预定义映射(保持兼容性)
  const mapped = THERMAL_TYPE_MAP[type]
  if (mapped) {
    return mapped
  }
  
  // 使用智能识别
  const classification = intelligentSensorClassification(type)
  
  // 如果置信度较高，使用智能识别结果
  if (classification.confidence > 0.3) {
    return classification.name
  }

  // 处理CPU集群-核心格式 (cpu-X-Y) 包括带后缀的情况
  const clusterCpuMatch = type.match(/^cpu[-_](\d+)[-_](\d+)(?:[-_](\w+))?$/i)
  if (clusterCpuMatch) {
    const clusterNum = parseInt(clusterCpuMatch[1])
    const coreNum = clusterCpuMatch[2]
    const suffix = clusterCpuMatch[3]
    
    let baseName
    // 智能推测集群架构类型（适应不同厂商的设计）
    if (clusterNum === 0) {
      // 集群0通常是效率核心（小核）
      baseName = `效率核心${coreNum} (集群${clusterNum})`
    } else if (clusterNum === 1) {
      // 集群1可能是性能核心或中核
      baseName = `性能核心${coreNum} (集群${clusterNum})`
    } else if (clusterNum === 2) {
      // 集群2可能是大核或超级核心
      baseName = `大核心${coreNum} (集群${clusterNum})`
    } else if (clusterNum === 3) {
      // 集群3通常是超级核心
      baseName = `超级核心${coreNum} (集群${clusterNum})`
    } else {
      // 未知集群配置
      baseName = `CPU核心${coreNum} (集群${clusterNum})`
    }
    
    // 处理后缀
    if (suffix) {
      if (suffix.toLowerCase() === 'usr') {
        return `${baseName} 用户模式`
      } else if (suffix.toLowerCase() === 'step') {
        return `${baseName} 阶梯模式`
      } else if (suffix.toLowerCase() === 'lowf') {
        return `${baseName} 低频模式`
      } else {
        return `${baseName} ${suffix}模式`
      }
    }
    
    return baseName
  }

  // 处理CPU核心编号（支持更多格式，但避免与预定义映射冲突）
  const cpuMatch = type.match(/^(apc\d*-cpu|kryo[-_]?cpu|gold[-_]?cpu|silver[-_]?cpu)[-_]?(\d+)/i)
  if (cpuMatch) {
    const coreNum = cpuMatch[2]
    // 区分不同的CPU集群
    if (type.toLowerCase().includes('apc')) {
      return `CPU集群核心${coreNum}`
    } else if (type.toLowerCase().includes('kryo')) {
      return `Kryo核心${coreNum}`
    } else if (type.toLowerCase().includes('gold')) {
      return `性能核心${coreNum}`
    } else if (type.toLowerCase().includes('silver')) {
      return `效率核心${coreNum}`
    }
    return `CPU核心${coreNum}`
  }
  
  // 单独处理标准CPU命名（避免与预定义映射冲突）
  const standardCpuMatch = type.match(/^cpu[-_]?(\d+)$/i)
  if (standardCpuMatch && !THERMAL_TYPE_MAP[type.toUpperCase()]) {
    return `CPU核心${standardCpuMatch[1]}`
  }
  
  // 处理GPU的更多变体
  const gpuMatch = type.match(/^(gpu|adreno|mali|sgx)[-_]?(\d*)/i)
  if (gpuMatch) {
    const gpuNum = gpuMatch[2]
    if (type.toLowerCase().includes('adreno')) {
      return gpuNum ? `Adreno GPU${gpuNum}` : 'Adreno GPU'
    } else if (type.toLowerCase().includes('mali')) {
      return gpuNum ? `Mali GPU${gpuNum}` : 'Mali GPU'
    } else if (type.toLowerCase().includes('sgx')) {
      return gpuNum ? `PowerVR SGX${gpuNum}` : 'PowerVR SGX'
    }
    return gpuNum ? `GPU${gpuNum}` : 'GPU'
  }

  // 处理CPU子系统和集群的特殊格式
  if (type.match(/^cpuss[-_]?\d+$/i)) {
    const cpussMatch = type.match(/^cpuss[-_]?(\d+)$/i)
    if (cpussMatch) {
      const clusterNum = cpussMatch[1]
      return `CPU子系统${clusterNum}`
    }
  }
  
  // 处理APC集群最大值格式
  if (type.match(/^apc[-_]\d+[-_]max$/i)) {
    const apcMatch = type.match(/^apc[-_](\d+)[-_]max$/i)
    if (apcMatch) {
      const clusterNum = apcMatch[1]
      return `CPU集群${clusterNum}最大值`
    }
  }

  // 处理复合格式（如apc-0-max-step）
  if (type.match(/^apc[-_]\d+[-_]max[-_]step$/i)) {
    const apcStepMatch = type.match(/^apc[-_](\d+)[-_]max[-_]step$/i)
    if (apcStepMatch) {
      const clusterNum = apcStepMatch[1]
      return `CPU集群${clusterNum}最大值 阶梯模式`
    }
  }

  // 处理带后缀的类型
  if (type.includes('-usr')) {
    return type.replace('-usr', ' 用户模式')
  }
  if (type.includes('-step')) {
    return type.replace('-step', ' 阶梯模式')
  }
  if (type.includes('-max')) {
    return type.replace('-max', ' 最大值')
  }
  if (type.includes('-lowf')) {
    return type.replace('-lowf', ' 低频模式')
  }
  if (type.includes('-adc')) {
    return type.replace('-adc', ' ADC传感器')
  }
  if (type.includes('-therm')) {
    return type.replace('-therm', ' 温度传感器')
  }

  // 如果是未知类型，记录警告
  if (!validateSensorType(type)) {
    console.warn(`检测到未知的温度传感器类型: ${type}`)
  }

  return type
}

// 验证温度值是否有效
function isValidTemperature(temp: number, type: string): boolean {
  // 首先检查是否为有效数字
  if (isNaN(temp) || !isFinite(temp)) return false
  
  // 0度或负值通常无效
  if (temp <= 0) return false
  
  // 电池电压传感器不是温度
  if (type.includes('vbat') || type.includes('ibat') || type.includes('voltage')) return false
  
  // 根据传感器类型设置不同的温度范围
  const lowerType = type.toLowerCase()
  
  // 环境温度范围更严格
  if (lowerType.includes('ambient')) {
    return temp >= -10 && temp <= 60
  }
  
  // 电池温度通常不会超过80度
  if (lowerType.includes('battery') || lowerType.includes('bat') || lowerType.includes('bms')) {
    return temp <= 80
  }
  
  // CPU/GPU温度可能较高，但超过120度通常不正常
  if (lowerType.includes('cpu') || lowerType.includes('gpu') || lowerType.includes('kryo') || 
      lowerType.includes('adreno') || lowerType.includes('mali')) {
    return temp <= 120
  }
  
  // 外壳温度通常不会超过60度
  if (lowerType.includes('skin') || lowerType.includes('surface')) {
    return temp <= 60
  }
  
  // 其他传感器的通用范围
  if (temp > 150) return false
  
  return true
}

// 动态获取thermal zone数量的辅助函数
async function getThermalZoneCount(deviceId: string, basePath: string): Promise<number> {
  try {
    // 尝试检查thermal zone目录的存在性来确定数量
    const result = await shell(deviceId, `ls ${basePath} | grep "thermal_zone" | wc -l`)
    const count = toNum(trim(result))
    return isNaN(count) ? 0 : count
  } catch {
    return 0
  }
}

// 获取热管理服务信息
export async function getThermalServiceInfo(deviceId: string): Promise<{
  throttlingStatus: number
  throttlingDescription: string
} | null> {
  try {
    const result = await shell(deviceId, 'dumpsys thermalservice')
    
    // 解析限流状态
    const statusMatch = result.match(/Thermal Status:\s*(\d+)/)
    const throttlingStatus = statusMatch ? toNum(statusMatch[1]) : 0
    
    return {
      throttlingStatus,
      throttlingDescription: getThrottlingDescription(throttlingStatus)
    }
  } catch (error) {
    console.error('Failed to get thermal service info:', error)
    return null
  }
}

// 获取所有温度区域信息
export async function getAllThermalZones(deviceId: string): Promise<IThermalZone[]> {
  const zones: IThermalZone[] = []
  
  try {
    // 动态获取thermal zone数量
    const thermalCount = await getThermalZoneCount(deviceId, '/sys/class/thermal/')
    const maxZones = Math.min(thermalCount > 0 ? thermalCount : 100, 200) // 设置合理的上限
    
    // 尝试从 /sys/class/thermal/ 获取温度信息
    for (let i = 0; i < maxZones; i++) {
      try {
        const [typeResult, tempResult] = await Promise.all([
          shell(deviceId, `cat /sys/class/thermal/thermal_zone${i}/type`),
          shell(deviceId, `cat /sys/class/thermal/thermal_zone${i}/temp`)
        ])
        
        const type = trim(typeResult)
        const rawTemp = toNum(trim(tempResult))
        
        if (type && !isNaN(rawTemp)) {
          // Android温度通常以毫摄氏度为单位
          let temperature = rawTemp
          if (rawTemp > 1000) {
            temperature = rawTemp / 1000
          }
          
          if (isValidTemperature(temperature, type)) {
            zones.push({
              id: i,
              type: formatThermalType(type),
              temperature: Math.round(temperature * 10) / 10, // 保留一位小数
              raw: rawTemp
            })
          }
        }
      } catch {
        // 如果某个zone不存在，继续尝试下一个
        continue
      }
    }
    
    // 如果上述方法失败，尝试从 /sys/devices/virtual/thermal/ 获取
    if (zones.length === 0) {
      const virtualThermalCount = await getThermalZoneCount(deviceId, '/sys/devices/virtual/thermal/')
      const maxVirtualZones = Math.min(virtualThermalCount > 0 ? virtualThermalCount : 50, 100)
      
      for (let i = 0; i < maxVirtualZones; i++) {
        try {
          const [typeResult, tempResult] = await Promise.all([
            shell(deviceId, `cat /sys/devices/virtual/thermal/thermal_zone${i}/type`),
            shell(deviceId, `cat /sys/devices/virtual/thermal/thermal_zone${i}/temp`)
          ])
          
          const type = trim(typeResult)
          const rawTemp = toNum(trim(tempResult))
          
          if (type && !isNaN(rawTemp)) {
            let temperature = rawTemp
            if (rawTemp > 1000) {
              temperature = rawTemp / 1000
            }
            
            if (isValidTemperature(temperature, type)) {
              zones.push({
                id: i,
                type: formatThermalType(type),
                temperature: Math.round(temperature * 10) / 10,
                raw: rawTemp
              })
            }
          }
        } catch {
          continue
        }
      }
    }
  } catch (error) {
    console.error('Failed to get thermal zones:', error)
  }
  
  return zones
}

// 导出智能识别函数供其他模块使用
export { intelligentSensorClassification }

// 获取完整的热管理信息
export async function getThermalInfo(deviceId: string): Promise<IThermalInfo> {
  const [zones, thermalServiceInfo, batteryTempFromDumpsys] = await Promise.all([
    getAllThermalZones(deviceId),
    getThermalServiceInfo(deviceId),
    getBatteryTemperatureFromDumpsys(deviceId)
  ])
  
  // 如果找到了电池相关的传感器，用dumpsys battery的数据替换，确保与性能面板一致
  const processedZones = zones.map(zone => {
    const lowerType = zone.type.toLowerCase()
    if (batteryTempFromDumpsys !== null && 
        (lowerType.includes('电池') || lowerType.includes('battery') || lowerType.includes('bat'))) {
      return {
        ...zone,
        temperature: Math.round(batteryTempFromDumpsys * 10) / 10, // 保留一位小数
        raw: Math.round(batteryTempFromDumpsys * 10) // 对应原始值
      }
    }
    return zone
  })
  
  const validZones = processedZones.length
  
  return {
    zones: processedZones.sort((a, b) => {
      // 按温度高低排序，高温传感器优先显示
      return b.temperature - a.temperature
    }),
    throttlingStatus: thermalServiceInfo?.throttlingStatus || 0,
    throttlingDescription: thermalServiceInfo?.throttlingDescription || '无限流',
    availableZones: validZones,
    validZones
  }
}

// 获取关键温度传感器信息（用于性能监控界面）
export async function getKeyThermalSensors(deviceId: string): Promise<{
  cpu?: number
  gpu?: number
  battery?: number
  skin?: number
  soc?: number
}> {
  const zones = await getAllThermalZones(deviceId)
  const keyTemps: any = {}
  
  for (const zone of zones) {
    const lowerType = zone.type.toLowerCase()
// CPU温度检测（支持更多CPU相关传感器）
    if (!keyTemps.cpu && 
        (lowerType.includes('cpu') || lowerType.includes('ap') || 
         lowerType.includes('kryo') || lowerType.includes('gold') || 
         lowerType.includes('silver') || lowerType.includes('处理器'))) {
      keyTemps.cpu = zone.temperature
    }
    
    // GPU温度检测（支持更多GPU相关传感器）
    if (!keyTemps.gpu && 
        (lowerType.includes('gpu') || lowerType.includes('adreno') || 
         lowerType.includes('mali') || lowerType.includes('sgx') || 
         lowerType.includes('显卡'))) {
      keyTemps.gpu = zone.temperature
    }
    
    // 电池温度检测
    if (!keyTemps.battery && 
        (lowerType.includes('电池') || lowerType.includes('battery') || 
         lowerType.includes('bat') || lowerType.includes('bms'))) {
      keyTemps.battery = zone.temperature
    }
    
    // 皮肤/表面温度检测
    if (!keyTemps.skin && 
        (lowerType.includes('skin') || lowerType.includes('表面') || 
         lowerType.includes('surface'))) {
      keyTemps.skin = zone.temperature
    }
    
    // SOC温度检测
    if (!keyTemps.soc && 
        (lowerType.includes('soc') || lowerType.includes('chip') || 
         lowerType.includes('系统芯片'))) {
      keyTemps.soc = zone.temperature
    }
  }
  
  return keyTemps
}

// 获取电池温度（使用与性能面板相同的数据源确保一致性）
export async function getBatteryTemperatureFromDumpsys(deviceId: string): Promise<number | null> {
  try {
    const result = await shell(deviceId, 'dumpsys battery')
    const tempMatch = result.match(/temperature:\s*(\d+)/)
    if (tempMatch) {
      // dumpsys battery 返回的温度单位是十分之一摄氏度
      return toNum(tempMatch[1]) / 10
    }
    return null
  } catch (error) {
    console.error('Failed to get battery temperature from dumpsys:', error)
    return null
  }
}