import { useEffect, useState, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { t } from '../../../../common/util'
import { IThermalInfo, IThermalZone } from '../../../../common/types'
import store from '../../store'
import { notify } from 'share/renderer/lib/util'
import Style from './Thermal.module.scss'
import className from 'licia/className'
import isEmpty from 'licia/isEmpty'

const main = (window as any).main

// 传感器分类定义
const SENSOR_CATEGORIES = {
  cpu: {
    name: '🔥 处理器核心',
    description: 'CPU核心温度监控',
    keywords: [
      // 英文关键词
      'CPU', 'cpu', 'cpuss', 'hexa-cpu', 'AP', 'apc1-cpu', 'apc-', 'kryo', 'gold', 'silver',
      // 中文关键词 - 对应formatThermalType函数返回的中文名称
      '核心', '效率核心', '性能核心', '大核心', '超级核心', 'CPU核心', 'Kryo核心', 'CPU集群核心',
      'CPU子系统', 'CPU集群', '最大值'
      // 移除"处理器"关键词，避免与AI处理器冲突
    ],
    defaultExpanded: true // 默认展开重要分类
  },
  gpu: {
    name: '🎮 图形处理器',
    description: 'GPU图形芯片温度',
    keywords: ['GPU', 'gpu'],
    defaultExpanded: true
  },
  power: {
    name: '🔋 电源系统',
    description: '电池和电源管理',
    keywords: [
      '电池', 'battery', 'BAT', 'bms', 'PA', '功率', '充电器', 'charger',
      // PM8550系列电源管理IC (英文)
      'pm8550', 'pm660', 'pm8350', 'pm7325', 'pmouton', '电源管理',
      // 其他电源管理IC (英文)
      'pm8010', 'pmr735', '_tz',
      // 优化后的中文名称
      '主电源', '辅助电源', '低功耗电源', '显示电源', '外设电源', '射频电源',
      '电源芯片', '电源管理', '电源监控器'
    ],
    defaultExpanded: true
  },
  surface: {
    name: '📱 设备表面',
    description: '设备外壳表面温度',
    keywords: [
      'SKIN', 'skin', '设备表面', 'quiet-therm', '静态',
      // 手机外壳相关（英文）
      'shell', 'back', 'front', 'frame', 'hot_pock',
      // 手机外壳相关（中文）
      '后盖', '前面板', '边框', '发热点', '机身'
    ],
    defaultExpanded: false
  },
  system: {
    name: '🔧 系统组件',
    description: '主芯片和系统组件',
    keywords: [
      // 英文关键词
      'soc', '系统芯片', 'msm', 'aoss', 'MSM', 'System', 'system',
      'dexo', 'sdro',
      // 优化后的中文名称
      '系统控制器', '协处理器', '时钟振荡器', '系统待机控制器'
    ],
    defaultExpanded: false
  },
  communication: {
    name: '📡 通信组件',
    description: '网络和通信模块',
    keywords: [
      // 英文关键词
      '调制解调器', 'mdm-core', 'mdmss', 'USB', 'Type-C',
      'rfboard', 'rf', 'sdr', 'mmw', 'mamss',
      'wireless', '无线', 'dcxo', '晶振',
      // 优化后的中文名称
      '5G基带', '射频前端', '无线通信芯片', '通信时钟源',
      '毫米波', '芯片组', '前端模块'
    ],
    defaultExpanded: false
  },
  storage: {
    name: '💾 存储组件',
    description: '存储和时钟组件',
    keywords: [
      'emmc', 'eMMC', 'xo-therm', '晶振', 'DDR', 'ddr', '内存'
    ],
    defaultExpanded: false
  },
  media: {
    name: '📷 媒体组件',
    description: '摄像头和音频组件',
    keywords: [
      // 英文关键词
      'camera', '摄像头', 'lpass', 'video', '视频',
      // 优化后的中文名称
      '音频处理器', '视频处理器'
    ],
    defaultExpanded: false
  },
  ai: {
    name: '🧠 AI处理器',
    description: '神经网络处理单元',
    keywords: [
      // 英文关键词
      'nsp', 'NPU', 'npu', 'ai', 'AI', 'neural',
      // 智能识别生成的名称
      'AI处理器', 'NPU热点', 'NPU晶体',
      // 可能的命名变体
      'npu-thermal', 'ai-thermal', 'neural-proc'
    ],
    defaultExpanded: false
  }
}

export default observer(function Thermal() {
  const [thermalInfo, setThermalInfo] = useState<IThermalInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    // 初始化展开状态，默认展开重要分类
    const initialState: Record<string, boolean> = {}
    Object.entries(SENSOR_CATEGORIES).forEach(([key, category]) => {
      initialState[key] = category.defaultExpanded
    })
    initialState['uncategorized'] = false // 未分类默认收起
    return initialState
  })
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const { device } = store

  // 切换分类展开/收起状态
  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }))
  }

  // 获取温度等级样式类
  const getTempClass = (temperature: number): string => {
    if (temperature >= 70) return 'critical'
    if (temperature >= 60) return 'veryHot'
    if (temperature >= 50) return 'hot'
    if (temperature >= 40) return 'warm'
    return 'normal'
  }

  // 获取限流状态颜色
  const getThrottlingColor = (status: number): string => {
    if (status >= 5) return '#ff4757' // 红色 - 紧急/关机
    if (status >= 4) return '#ff6b6b' // 浅红 - 临界
    if (status >= 3) return '#ffa502' // 橙色 - 严重
    if (status >= 2) return '#f39c12' // 黄色 - 中等
    if (status >= 1) return '#3742fa' // 蓝色 - 轻度
    return '#2ed573' // 绿色 - 无限流
  }

  // 根据传感器类型分类 (使用智能识别)
  const categorizeSensors = (zones: IThermalZone[]) => {
    const categorized: Record<string, IThermalZone[]> = {}
    const uncategorized: IThermalZone[] = []

    // 初始化分类
    Object.keys(SENSOR_CATEGORIES).forEach(key => {
      categorized[key] = []
    })

    zones.forEach(zone => {
      let matched = false
      
      // 优先级分类顺序：AI > GPU > CPU > 其他（避免关键词冲突）
      const priorityOrder = ['ai', 'gpu', 'cpu', 'power', 'surface', 'communication', 'system', 'storage', 'media']
      
      // 首先尝试传统关键词匹配（按优先级顺序）
      for (const categoryKey of priorityOrder) {
        const category = SENSOR_CATEGORIES[categoryKey]
        if (category && category.keywords.some(keyword => 
          zone.type.toLowerCase().includes(keyword.toLowerCase()) ||
          zone.type.includes(keyword)
        )) {
          categorized[categoryKey].push(zone)
          matched = true
          break
        }
      }

      // 如果传统方法失败，使用智能识别
      if (!matched) {
        try {
          const classification = (window as any).main?.intelligentSensorClassification?.(zone.type)
          if (classification && classification.confidence > 0.3) {
            const categoryMap: Record<string, string> = {
              'cpu': 'cpu',
              'gpu': 'gpu', 
              'battery': 'power',
              'surface': 'surface',
              'communication': 'communication',
              'power': 'power',
              'system': 'system',
              'storage': 'storage',
              'media': 'media',
              'ai': 'ai'
            }
            
            const mappedCategory = categoryMap[classification.category]
            if (mappedCategory && categorized[mappedCategory]) {
              categorized[mappedCategory].push(zone)
              matched = true
            }
          }
        } catch (error) {
          // 智能识别失败，继续使用传统方法
        }
      }

      if (!matched) {
        uncategorized.push(zone)
      }
    })

    return { categorized, uncategorized }
  }

  const refreshThermalInfo = async () => {
    if (!device) return

    try {
      const info = await main.getThermalInfo(device.id)
      setThermalInfo(info)
      setLoading(false)
    } catch (error) {
      console.error('Failed to get thermal info:', error)
      notify(t('commonErr'), { icon: 'error' })
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!device || store.panel !== 'thermal') return

    // 立即获取一次数据
    refreshThermalInfo()

    // 每3秒更新一次
    intervalRef.current = setInterval(refreshThermalInfo, 3000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [device?.id, store.panel])

  if (loading) {
    return (
      <div className={className('panel-with-toolbar', Style.container)}>
        <div className={className('panel-body', Style.loading)}>
          <div className={Style.loadingText}>正在获取温度信息...</div>
        </div>
      </div>
    )
  }

  if (!thermalInfo || isEmpty(thermalInfo.zones)) {
    return (
      <div className={className('panel-with-toolbar', Style.container)}>
        <div className={className('panel-body', Style.empty)}>
          <div className={Style.emptyText}>
            未检测到温度传感器
            <br />
            <small>设备可能不支持温度监控或需要Root权限</small>
          </div>
        </div>
      </div>
    )
  }

  const { categorized, uncategorized } = categorizeSensors(thermalInfo.zones)

  // 渲染传感器卡片
  const renderSensorCard = (zone: IThermalZone) => {
    const tempClass = getTempClass(zone.temperature)
    
    return (
      <div key={zone.id} className={Style.sensorCard}>
        <div className={Style.sensorName}>{zone.type}</div>
        <div 
          className={`${Style.sensorTemp} ${Style[tempClass] || ''}`}
          data-temp-class={tempClass}
        >
          {zone.temperature.toFixed(1)}°C
        </div>
        <div className={Style.sensorZone}>Zone {zone.id}</div>
      </div>
    )
  }

  // 渲染分类区块
  const renderCategory = (categoryKey: string, zones: IThermalZone[]) => {
    if (zones.length === 0) return null

    const category = SENSOR_CATEGORIES[categoryKey as keyof typeof SENSOR_CATEGORIES]
    const maxTemp = Math.max(...zones.map(z => z.temperature))
    const avgTemp = zones.reduce((sum, z) => sum + z.temperature, 0) / zones.length
    const isExpanded = expandedCategories[categoryKey]

    return (
      <div key={categoryKey} className={Style.categorySection}>
        <div 
          className={Style.categoryHeader}
          onClick={() => toggleCategory(categoryKey)}
        >
          <div className={Style.categoryTitle}>
            <div className={Style.categoryHeaderLeft}>
              <span className={Style.categoryIcon}>{category.name}</span>
              <div className={Style.categoryInfo}>
                <div className={Style.categoryDesc}>{category.description}</div>
                <div className={Style.categoryStats}>
                  平均: {avgTemp.toFixed(1)}°C | 最高: {maxTemp.toFixed(1)}°C | 传感器: {zones.length}个
                </div>
              </div>
            </div>
            <div className={Style.categoryActions}>
              <div 
                className={`${Style.categoryMaxTemp} ${Style[getTempClass(maxTemp)] || ''}`}
                data-temp-class={getTempClass(maxTemp)}
              >
                {maxTemp.toFixed(1)}°C
              </div>
              <div className={className(Style.expandIcon, { [Style.expanded]: isExpanded })}>
                ▼
              </div>
            </div>
          </div>
        </div>
        <div className={className(Style.categoryContent, { [Style.collapsed]: !isExpanded })}>
          {zones.map(renderSensorCard)}
        </div>
      </div>
    )
  }

  return (
    <div className={className('panel-with-toolbar', Style.container)}>
      {/* 状态栏 */}
      <div className={Style.statusBar}>
        <div className={Style.statusItem}>
          <span className={Style.statusLabel}>热管理状态:</span>
          <span 
            className={Style.statusValue}
            style={{ color: getThrottlingColor(thermalInfo.throttlingStatus) }}
          >
            {thermalInfo.throttlingDescription}
          </span>
        </div>
        <div className={Style.statusItem}>
          <span className={Style.statusLabel}>有效传感器:</span>
          <span className={Style.statusValue}>
            {thermalInfo.validZones} / {thermalInfo.availableZones}
          </span>
        </div>
        <div className={Style.statusItem}>
          <button 
            className={Style.expandAllBtn}
            onClick={() => {
              const allExpanded = Object.values(expandedCategories).every(Boolean)
              const newState = Object.keys(expandedCategories).reduce((acc, key) => {
                acc[key] = !allExpanded
                return acc
              }, {} as Record<string, boolean>)
              setExpandedCategories(newState)
            }}
          >
            {Object.values(expandedCategories).every(Boolean) ? '全部收起' : '全部展开'}
          </button>
        </div>
      </div>

      {/* 分类显示区域 */}
      <div className={className('panel-body', Style.content)}>
        <div className={Style.categoriesContainer}>
          {Object.keys(SENSOR_CATEGORIES).map(categoryKey => 
            renderCategory(categoryKey, categorized[categoryKey])
          )}
          
          {/* 未分类的传感器 */}
          {uncategorized.length > 0 && (
            <div className={Style.categorySection}>
              <div 
                className={Style.categoryHeader}
                onClick={() => toggleCategory('uncategorized')}
              >
                <div className={Style.categoryTitle}>
                  <div className={Style.categoryHeaderLeft}>
                    <span className={Style.categoryIcon}>🔍 其他传感器</span>
                    <div className={Style.categoryInfo}>
                      <div className={Style.categoryDesc}>未分类的温度传感器</div>
                      <div className={Style.categoryStats}>
                        传感器: {uncategorized.length}个
                      </div>
                    </div>
                  </div>
                  <div className={Style.categoryActions}>
                    <div className={className(Style.expandIcon, { [Style.expanded]: expandedCategories['uncategorized'] })}>
                      ▼
                    </div>
                  </div>
                </div>
              </div>
              <div className={className(Style.categoryContent, { [Style.collapsed]: !expandedCategories['uncategorized'] })}>
                {uncategorized.map(renderSensorCard)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}) 