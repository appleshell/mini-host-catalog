# DIY配置功能 - 技术设计方案

## 核心原则

**关键约束：AI只能从厂家能力数据中选择，不能自由发挥**

```
用户需求 → AI理解需求 → 从厂家数据库选择零部件 → 验证兼容性 → 返回方案
         ↑                                              ↓
         └──────────── 不符合规则，重新生成 ──────────────┘
```

---

## 一、数据结构设计

### 1.1 零部件库 (components)

```typescript
interface Component {
  id: string
  category: 'cpu' | 'memory' | 'storage' | 'motherboard' | 'case' | 'power' | 'cooling' | 'network'
  name: string
  brand: string
  model: string

  // 规格参数
  specs: {
    // CPU
    cores?: number
    threads?: number
    tdp?: number
    generation?: string

    // 内存
    type?: 'DDR4' | 'DDR5'
    capacity?: number  // GB
    speed?: number     // MHz

    // 存储
    storageType?: 'SSD' | 'HDD' | 'eMMC'
    storageCapacity?: number  // GB
    interface?: 'SATA' | 'NVMe' | 'M.2'

    // 其他通用参数
    [key: string]: any
  }

  // 价格区间
  priceRange: {
    min: number
    typical: number
    max: number
  }

  // 兼容性标签（用于匹配）
  compatibilityTags: string[]  // ['intel-12th', 'ddr4', 'low-power']

  // 适用场景
  useCases: string[]  // ['office', 'industrial', 'edge-computing']

  // 库存状态
  availability: 'in-stock' | 'pre-order' | 'custom-order'
  leadTime: number  // 交期（天）
  moq: number       // 最小起订量

  // 更新时间
  updatedAt: Date
}
```

### 1.2 兼容性规则 (compatibility_rules)

```typescript
interface CompatibilityRule {
  id: string
  name: string
  description: string

  // 规则类型
  type: 'required' | 'forbidden' | 'recommended'

  // 条件：如果选择了X
  condition: {
    componentId?: string
    category?: string
    tags?: string[]
    specs?: Record<string, any>
  }

  // 那么必须/禁止/推荐
  then: {
    action: 'require' | 'forbid' | 'recommend'
    target: {
      componentId?: string
      category?: string
      tags?: string[]
      specs?: Record<string, any>
    }
  }

  // 错误提示
  errorMessage: string
}
```

**示例规则：**
```json
[
  {
    "id": "rule-001",
    "name": "无风扇散热TDP限制",
    "type": "required",
    "condition": {
      "category": "cooling",
      "specs": { "fanless": true }
    },
    "then": {
      "action": "require",
      "target": {
        "category": "cpu",
        "specs": { "tdp": { "$lte": 15 } }
      }
    },
    "errorMessage": "无风扇散热只能配TDP≤15W的CPU"
  },
  {
    "id": "rule-002",
    "name": "DDR4内存兼容性",
    "type": "required",
    "condition": {
      "category": "memory",
      "specs": { "type": "DDR4" }
    },
    "then": {
      "action": "require",
      "target": {
        "category": "cpu",
        "tags": ["ddr4-support"]
      }
    },
    "errorMessage": "该CPU不支持DDR4内存"
  }
]
```

### 1.3 厂家定制能力 (customization_capabilities)

```typescript
interface CustomizationCapability {
  id: string
  category: string
  name: string
  description: string

  // 可定制的参数
  customizableParams: {
    param: string
    options: any[]
    priceImpact: number  // 价格影响（元）
  }[]

  // 限制条件
  constraints: {
    moq: number          // 最小起订量
    leadTime: number     // 交期（天）
    extraCost: number    // 额外成本
  }

  // 适用场景
  applicableScenarios: string[]
}
```

**示例：**
```json
{
  "id": "custom-001",
  "category": "motherboard",
  "name": "增加串口数量",
  "description": "可定制2-8个RS232/RS485串口",
  "customizableParams": [
    {
      "param": "serialPorts",
      "options": [2, 4, 6, 8],
      "priceImpact": 50  // 每增加2个串口+50元
    }
  ],
  "constraints": {
    "moq": 10,
    "leadTime": 14,
    "extraCost": 200
  },
  "applicableScenarios": ["industrial", "iot"]
}
```

---

## 二、AI Prompt设计（核心）

### 2.1 系统Prompt模板

```markdown
你是一个专业的迷你主机配置专家。你的任务是根据用户需求，从给定的零部件库中选择合适的配件，生成配置方案。

## 重要约束（必须严格遵守）：

1. **只能从提供的零部件库中选择**，不能推荐库中不存在的产品
2. **必须遵守兼容性规则**，不能生成不兼容的配置
3. **必须考虑厂家定制能力**，超出标准配置的需求要检查是否可定制
4. **价格计算使用typical价格**，并给出价格区间
5. **必须返回结构化JSON格式**，不要返回自然语言描述

## 零部件库：
{components_json}

## 兼容性规则：
{compatibility_rules_json}

## 厂家定制能力：
{customization_capabilities_json}

## 输出格式要求：

返回JSON格式，包含2-3个方案：

```json
{
  "solutions": [
    {
      "name": "方案名称",
      "description": "一句话描述",
      "components": [
        {
          "category": "cpu",
          "componentId": "cpu-001",
          "name": "Intel N100",
          "quantity": 1,
          "price": 550
        }
      ],
      "customizations": [
        {
          "capabilityId": "custom-001",
          "description": "增加4个串口",
          "extraCost": 100
        }
      ],
      "totalPrice": {
        "min": 3200,
        "typical": 3500,
        "max": 3800
      },
      "pros": ["优点1", "优点2"],
      "cons": ["缺点1"],
      "suitability": "适用场景说明",
      "leadTime": 7,
      "moq": 1
    }
  ],
  "reasoning": "为什么推荐这些方案的简短说明"
}
```

## 用户需求：
{user_requirements}
```

---

## 三、后端实现

### 3.1 API端点设计

```typescript
// POST /api/diy/generate
interface GenerateConfigRequest {
  requirements: {
    useCase: string          // 使用场景描述
    performance: string      // 性能要求
    budget: {
      min?: number
      max?: number
    }
    specialRequirements: string[]  // 特殊需求
    quantity: number         // 采购数量
  }
  conversationId?: string    // 对话ID（用于调整方案）
}

interface GenerateConfigResponse {
  conversationId: string
  solutions: Solution[]
  reasoning: string
  timestamp: Date
}
```

### 3.2 核心流程

```typescript
async function generateConfiguration(req: GenerateConfigRequest) {
  // 1. 加载厂家数据
  const components = await loadComponents()
  const rules = await loadCompatibilityRules()
  const capabilities = await loadCustomizationCapabilities()

  // 2. 构建AI Prompt
  const prompt = buildPrompt({
    components,
    rules,
    capabilities,
    userRequirements: req.requirements
  })

  // 3. 调用Claude API（使用结构化输出）
  const aiResponse = await callClaudeAPI(prompt, {
    temperature: 0.3,  // 降低随机性
    max_tokens: 4000
  })

  // 4. 解析AI返回的JSON
  const solutions = JSON.parse(aiResponse)

  // 5. 后端验证（关键！）
  const validatedSolutions = await validateSolutions(solutions, {
    components,
    rules,
    capabilities
  })

  // 6. 如果验证失败，重新生成或返回错误
  if (!validatedSolutions.allValid) {
    // 记录错误，可能需要人工介入
    await logValidationError(validatedSolutions.errors)

    // 尝试修复或重新生成
    return await retryGeneration(req, validatedSolutions.errors)
  }

  // 7. 保存对话历史
  await saveConversation({
    conversationId: generateId(),
    requirements: req.requirements,
    solutions: validatedSolutions.solutions
  })

  return validatedSolutions
}
```

### 3.3 验证逻辑（防止AI乱来）

```typescript
async function validateSolutions(solutions: Solution[], context: Context) {
  const errors: ValidationError[] = []

  for (const solution of solutions) {
    // 验证1：所有零部件必须存在于库中
    for (const comp of solution.components) {
      const exists = context.components.find(c => c.id === comp.componentId)
      if (!exists) {
        errors.push({
          solutionId: solution.name,
          type: 'component_not_found',
          message: `零部件 ${comp.componentId} 不存在于库中`
        })
      }
    }

    // 验证2：检查兼容性规则
    const compatibilityCheck = checkCompatibility(
      solution.components,
      context.rules
    )
    if (!compatibilityCheck.valid) {
      errors.push({
        solutionId: solution.name,
        type: 'compatibility_violation',
        message: compatibilityCheck.errors.join('; ')
      })
    }

    // 验证3：检查定制能力
    for (const custom of solution.customizations || []) {
      const capability = context.capabilities.find(c => c.id === custom.capabilityId)
      if (!capability) {
        errors.push({
          solutionId: solution.name,
          type: 'customization_not_available',
          message: `定制能力 ${custom.capabilityId} 不存在`
        })
      }

      // 检查MOQ
      if (solution.moq < capability.constraints.moq) {
        errors.push({
          solutionId: solution.name,
          type: 'moq_not_met',
          message: `定制需要最小起订量 ${capability.constraints.moq}`
        })
      }
    }

    // 验证4：价格计算是否正确
    const calculatedPrice = calculateTotalPrice(solution.components, solution.customizations)
    const priceDiff = Math.abs(calculatedPrice.typical - solution.totalPrice.typical)
    if (priceDiff > 100) {  // 允许100元误差
      errors.push({
        solutionId: solution.name,
        type: 'price_mismatch',
        message: `价格计算不正确，期望 ${calculatedPrice.typical}，实际 ${solution.totalPrice.typical}`
      })
    }
  }

  return {
    allValid: errors.length === 0,
    solutions: errors.length === 0 ? solutions : [],
    errors
  }
}
```

---

## 四、前端设计

### 4.1 用户交互流程

```
步骤1: 描述需求
┌─────────────────────────────┐
│ 请描述您的需求：            │
│ [文本框]                    │
│ 例如：需要10台办公电脑...   │
│                             │
│ 快速选择：                  │
│ [办公] [工控] [边缘计算]    │
└─────────────────────────────┘
         ↓
步骤2: 补充细节（可选）
┌─────────────────────────────┐
│ 预算范围：[3000] - [5000]  │
│ 采购数量：[10] 台           │
│ 特殊要求：                  │
│ ☑ 无风扇  ☑ 双网口          │
│ ☐ 多串口  ☐ 工业级          │
└─────────────────────────────┘
         ↓
步骤3: 查看方案
┌─────────────────────────────┐
│ 为您推荐3个方案：           │
│                             │
│ [方案A] [方案B] [方案C]     │
│  高性能   性价比   经济型   │
└─────────────────────────────┘
         ↓
步骤4: 调整需求（可选）
┌─────────────────────────────┐
│ 不满意？调整需求：          │
│ [增加内存到16GB]            │
│ [重新生成方案]              │
└─────────────────────────────┘
```

### 4.2 方案展示设计（关键信息，不啰嗦）

```tsx
// 方案卡片组件
<SolutionCard>
  {/* 头部：方案名称和价格 */}
  <Header>
    <Title>高性能工控方案</Title>
    <Price>¥4,200 - 4,800</Price>
    <Badge>推荐</Badge>
  </Header>

  {/* 核心配置（只显示关键信息）*/}
  <KeySpecs>
    <Spec icon="cpu">Intel N100 4核</Spec>
    <Spec icon="memory">16GB DDR4</Spec>
    <Spec icon="storage">512GB NVMe</Spec>
    <Spec icon="special">双网口 + 无风扇</Spec>
  </KeySpecs>

  {/* 优缺点（简洁）*/}
  <ProsCons>
    <Pros>
      ✓ 性能强劲，适合多任务
      ✓ 无风扇设计，静音稳定
    </Pros>
    <Cons>
      ⚠ 价格稍高
    </Cons>
  </ProsCons>

  {/* 交期和起订量 */}
  <Logistics>
    <Item>交期：7天</Item>
    <Item>起订：1台</Item>
  </Logistics>

  {/* 操作按钮 */}
  <Actions>
    <Button variant="primary">选择此方案</Button>
    <Button variant="ghost">查看详情</Button>
  </Actions>
</SolutionCard>
```

### 4.3 详细配置展开（点击"查看详情"）

```tsx
<DetailedView>
  {/* 完整配置清单 */}
  <ConfigList>
    <ConfigItem>
      <Category>处理器</Category>
      <Component>Intel N100</Component>
      <Specs>4核4线程, TDP 6W</Specs>
      <Price>¥550</Price>
    </ConfigItem>
    <ConfigItem>
      <Category>内存</Category>
      <Component>DDR4 16GB</Component>
      <Specs>3200MHz</Specs>
      <Price>¥360</Price>
    </ConfigItem>
    {/* ... 其他配件 */}
  </ConfigList>

  {/* 定制项（如果有）*/}
  <Customizations>
    <CustomItem>
      <Name>增加4个RS232串口</Name>
      <Cost>+¥200</Cost>
      <Note>需定制，交期14天，起订10台</Note>
    </CustomItem>
  </Customizations>

  {/* 总价明细 */}
  <PriceBreakdown>
    <Row>
      <Label>标准配件</Label>
      <Value>¥4,000</Value>
    </Row>
    <Row>
      <Label>定制费用</Label>
      <Value>¥200</Value>
    </Row>
    <Row highlight>
      <Label>总计（参考价）</Label>
      <Value>¥4,200 - 4,800</Value>
    </Row>
    <Note>实际价格根据采购量和市场行情确定</Note>
  </PriceBreakdown>
</DetailedView>
```

### 4.4 调整需求功能

```tsx
<AdjustmentPanel>
  <Input
    placeholder="例如：把内存改成32GB"
    value={adjustment}
    onChange={setAdjustment}
  />
  <Button onClick={regenerate}>
    重新生成方案
  </Button>

  {/* 快速调整选项 */}
  <QuickAdjust>
    <Option onClick={() => adjust('increase_memory')}>
      增加内存
    </Option>
    <Option onClick={() => adjust('add_storage')}>
      增加存储
    </Option>
    <Option onClick={() => adjust('lower_budget')}>
      降低预算
    </Option>
  </QuickAdjust>
</AdjustmentPanel>
```

---

## 五、数据管理

### 5.1 数据库表设计

```sql
-- 零部件库
CREATE TABLE components (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  specs JSON NOT NULL,
  price_min INTEGER NOT NULL,
  price_typical INTEGER NOT NULL,
  price_max INTEGER NOT NULL,
  compatibility_tags JSON,
  use_cases JSON,
  availability TEXT,
  lead_time INTEGER,
  moq INTEGER,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 兼容性规则
CREATE TABLE compatibility_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  condition JSON NOT NULL,
  then_action JSON NOT NULL,
  error_message TEXT,
  enabled BOOLEAN DEFAULT TRUE
);

-- 定制能力
CREATE TABLE customization_capabilities (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  customizable_params JSON,
  constraints JSON,
  applicable_scenarios JSON
);

-- DIY对话历史
CREATE TABLE diy_conversations (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  requirements JSON NOT NULL,
  solutions JSON NOT NULL,
  selected_solution_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 转化为线索
CREATE TABLE diy_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  solution_index INTEGER NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_wechat TEXT,
  quantity INTEGER,
  notes TEXT,
  status TEXT DEFAULT '待跟进',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES diy_conversations(id)
);
```

### 5.2 数据维护界面（管理后台）

```tsx
// 管理后台：零部件管理
<ComponentManagement>
  <Toolbar>
    <Button>添加零部件</Button>
    <Button>批量导入</Button>
    <Button>导出数据</Button>
  </Toolbar>

  <Table>
    <Column field="name">名称</Column>
    <Column field="category">类别</Column>
    <Column field="price_typical">参考价</Column>
    <Column field="availability">库存状态</Column>
    <Column field="updated_at">更新时间</Column>
    <Column actions>
      <EditButton />
      <DeleteButton />
    </Column>
  </Table>
</ComponentManagement>

// 兼容性规则管理
<RuleManagement>
  <RuleEditor>
    <Field label="规则名称">
      <Input />
    </Field>
    <Field label="条件">
      <JsonEditor />
    </Field>
    <Field label="动作">
      <Select options={['require', 'forbid', 'recommend']} />
    </Field>
  </RuleEditor>
</RuleManagement>
```

---

## 六、安全与边界控制

### 6.1 防止AI乱报价的措施

**1. 结构化输出强制约束**
```typescript
// 使用Claude的结构化输出功能
const schema = {
  type: "object",
  properties: {
    solutions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          components: {
            type: "array",
            items: {
              properties: {
                componentId: {
                  type: "string",
                  enum: validComponentIds  // 只能从库中选择
                }
              }
            }
          }
        }
      }
    }
  }
}
```

**2. 价格计算由后端控制**
```typescript
// AI只返回componentId，价格由后端计算
function calculatePrice(componentIds: string[]) {
  let total = 0
  for (const id of componentIds) {
    const component = componentsDB.get(id)
    total += component.priceRange.typical
  }
  return {
    min: total * 0.9,
    typical: total,
    max: total * 1.15
  }
}
```

**3. 多层验证**
```typescript
// 验证层级
1. AI输出验证 - 检查JSON格式
2. 数据存在性验证 - 所有ID必须在库中
3. 兼容性验证 - 符合规则
4. 价格验证 - 重新计算价格
5. 业务逻辑验证 - MOQ、交期等
```

**4. 人工审核机制**
```typescript
// 对于特殊情况，标记为需要人工审核
if (solution.hasCustomization || solution.totalPrice > 10000) {
  solution.requiresManualReview = true
  await notifyAdmin(solution)
}
```

### 6.2 限制入口设计

**方式1：白名单机制**
```typescript
// 只允许从预定义的零部件中选择
const ALLOWED_COMPONENTS = {
  cpu: ['cpu-001', 'cpu-002', 'cpu-003'],
  memory: ['mem-001', 'mem-002'],
  // ...
}

// Prompt中明确列出
const prompt = `
可选CPU：
- cpu-001: Intel N100 (¥550)
- cpu-002: Intel N305 (¥850)
- cpu-003: AMD Ryzen 5500U (¥1200)

可选内存：
- mem-001: DDR4 8GB (¥180)
- mem-002: DDR4 16GB (¥360)

你只能从以上列表中选择，不能推荐其他产品。
`
```

**方式2：规则引擎**
```typescript
// 定义决策树
const decisionTree = {
  useCase: {
    'office': {
      cpu: ['cpu-001', 'cpu-002'],
      memory: ['mem-001'],
      maxBudget: 3500
    },
    'industrial': {
      cpu: ['cpu-003', 'cpu-004'],
      memory: ['mem-002', 'mem-003'],
      requiredFeatures: ['fanless', 'wide-temp']
    }
  }
}

// AI只能在决策树范围内选择
```

**方式3：分步生成**
```typescript
// 不是一次性生成完整方案，而是分步骤
async function generateStepByStep(requirements) {
  // 步骤1：选择CPU（从5个候选中选1个）
  const cpu = await selectCPU(requirements, cpuCandidates)

  // 步骤2：根据CPU选择兼容内存
  const compatibleMemory = getCompatibleMemory(cpu)
  const memory = await selectMemory(requirements, compatibleMemory)

  // 步骤3：选择存储
  const storage = await selectStorage(requirements, storageCandidates)

  // 每一步都有明确的候选列表，AI只能从中选择
}
```

---

## 七、实施路线图

### Phase 1: 数据准备（1-2周）

**目标：建立基础数据库**

- [ ] 整理20-30个常用零部件
- [ ] 定义10-15条核心兼容性规则
- [ ] 记录3-5种定制能力
- [ ] 创建数据库表结构
- [ ] 开发数据管理界面

**产出：**
- 零部件数据库（Excel → 导入数据库）
- 规则文档
- 管理后台基础功能

---

### Phase 2: AI集成与验证（1周）

**目标：验证AI能否生成合理方案**

- [ ] 编写Prompt模板
- [ ] 集成Claude API
- [ ] 实现后端验证逻辑
- [ ] 测试10个典型场景
- [ ] 调整Prompt直到准确率>90%

**测试场景：**
1. 办公电脑，预算3000元
2. 工控机，需要双网口+无风扇
3. 边缘计算，需要高性能+多串口
4. 超低预算，2000元以内
5. 高端配置，预算不限
6. ...

**产出：**
- 可用的AI配置生成API
- 验证通过的Prompt模板

---

### Phase 3: 内部工具（1周）

**目标：销售人员使用的内部工具**

- [ ] 开发管理后台的DIY功能
- [ ] 简单的需求输入界面
- [ ] 方案展示和编辑
- [ ] 转为线索功能
- [ ] 培训销售人员使用

**为什么先做内部工具：**
- 验证功能实用性
- 收集真实反馈
- 发现问题并改进
- 积累成功案例

**产出：**
- 管理后台DIY模块
- 使用文档

---

### Phase 4: 客户端功能（2周）

**目标：对外开放给客户使用**

- [ ] 开发前端用户界面
- [ ] 优化交互体验
- [ ] 添加方案对比功能
- [ ] 实现需求调整功能
- [ ] 添加转为询盘功能

**产出：**
- 客户端DIY配置页面
- 完整的用户流程

---

### Phase 5: 优化与扩展（持续）

**目标：根据使用情况持续改进**

- [ ] 收集用户反馈
- [ ] 优化AI准确率
- [ ] 扩充零部件库
- [ ] 添加更多定制能力
- [ ] 性能优化

---

## 八、成本估算

### 8.1 开发成本

- **Phase 1-2（数据+AI）**: 2-3周，1人
- **Phase 3（内部工具）**: 1周，1人
- **Phase 4（客户端）**: 2周，1人

**总计：5-6周开发时间**

### 8.2 运营成本

**AI API费用：**
- Claude API: ~$0.02/次生成
- 假设每天50次生成：$1/天 = $30/月
- 年成本：~$360

**数据维护：**
- 每月更新价格：2小时
- 添加新产品：按需

**总运营成本：很低**

---

## 九、风险与应对

### 风险1：AI生成不合理方案

**应对：**
- 严格的后端验证
- 人工审核机制
- 持续优化Prompt
- 收集错误案例改进

### 风险2：数据维护负担

**应对：**
- 从小规模开始（20-30个零部件）
- 只维护常用产品
- 价格用区间，不需要频繁更新
- 开发批量导入工具

### 风险3：用户期望过高

**应对：**
- 明确标注"参考方案"
- 强调需要人工确认
- 提供调整和咨询入口
- 设定合理的免责声明

### 风险4：竞争对手抄袭

**应对：**
- 核心价值在数据和规则，不在功能本身
- 持续优化用户体验
- 建立客户信任

---

## 十、成功指标

### 业务指标

- **使用率**: 每月使用DIY功能的用户数
- **转化率**: 使用DIY后提交询盘的比例
- **成交率**: DIY生成方案的最终成交率
- **客单价**: DIY订单的平均金额

### 技术指标

- **准确率**: AI生成方案通过验证的比例 (目标>90%)
- **响应时间**: 生成方案的平均时间 (目标<5秒)
- **错误率**: 需要人工干预的比例 (目标<10%)

### 用户体验指标

- **满意度**: 用户对方案的满意度评分
- **调整次数**: 平均每个用户调整需求的次数
- **完成率**: 完成整个流程的用户比例

---

## 十一、总结

这个DIY配置功能的核心是：

✅ **约束AI在厂家能力范围内**
✅ **数据驱动，不是AI自由发挥**
✅ **多层验证，确保准确性**
✅ **简单易用的用户界面**
✅ **分阶段实施，降低风险**

**关键成功因素：**
1. 高质量的零部件数据和规则
2. 精心设计的Prompt模板
3. 严格的后端验证逻辑
4. 持续的优化和改进

**建议：**
从Phase 1-3开始（内部工具），验证可行性后再做Phase 4（客户端）。

---

## 附录：示例数据

### 示例：零部件数据

```json
{
  "id": "cpu-n100",
  "category": "cpu",
  "name": "Intel N100",
  "brand": "Intel",
  "model": "N100",
  "specs": {
    "cores": 4,
    "threads": 4,
    "tdp": 6,
    "generation": "12th",
    "baseFreq": 1.0,
    "maxFreq": 3.4
  },
  "priceRange": {
    "min": 480,
    "typical": 550,
    "max": 650
  },
  "compatibilityTags": ["intel-12th", "ddr4-support", "ddr5-support", "low-power"],
  "useCases": ["office", "light-industrial", "edge-computing"],
  "availability": "in-stock",
  "leadTime": 3,
  "moq": 1,
  "updatedAt": "2026-03-01"
}
```

### 示例：兼容性规则

```json
{
  "id": "rule-fanless-tdp",
  "name": "无风扇散热TDP限制",
  "type": "required",
  "condition": {
    "category": "cooling",
    "specs": { "fanless": true }
  },
  "then": {
    "action": "require",
    "target": {
      "category": "cpu",
      "specs": { "tdp": { "$lte": 15 } }
    }
  },
  "errorMessage": "无风扇散热只能配TDP≤15W的CPU"
}
```

### 示例：用户需求 → AI输出

**输入：**
```json
{
  "useCase": "需要10台工控机，用于车间设备监控",
  "performance": "不需要太高性能，能运行监控软件即可",
  "budget": { "min": 2500, "max": 3500 },
  "specialRequirements": ["无风扇", "双网口", "24小时运行"],
  "quantity": 10
}
```

**AI输出：**
```json
{
  "solutions": [
    {
      "name": "工控标准方案",
      "description": "无风扇静音设计，双网口，适合24小时运行",
      "components": [
        { "category": "cpu", "componentId": "cpu-n100", "name": "Intel N100", "quantity": 1, "price": 550 },
        { "category": "memory", "componentId": "mem-ddr4-8g", "name": "DDR4 8GB", "quantity": 1, "price": 180 },
        { "category": "storage", "componentId": "ssd-256g", "name": "256GB SSD", "quantity": 1, "price": 200 },
        { "category": "motherboard", "componentId": "mb-dual-lan", "name": "双网口主板", "quantity": 1, "price": 800 },
        { "category": "case", "componentId": "case-fanless", "name": "无风扇机箱", "quantity": 1, "price": 400 }
      ],
      "customizations": [],
      "totalPrice": { "min": 2800, "typical": 3130, "max": 3400 },
      "pros": [
        "无风扇设计，完全静音",
        "双网口满足网络冗余需求",
        "低功耗，适合24小时运行",
        "工业级稳定性"
      ],
      "cons": [
        "性能中等，不适合复杂计算"
      ],
      "suitability": "非常适合车间设备监控场景，稳定可靠",
      "leadTime": 7,
      "moq": 1
    }
  ],
  "reasoning": "根据您的需求，推荐Intel N100平台，TDP仅6W，配合无风扇散热完全满足24小时运行要求。双网口主板提供网络冗余。8GB内存足够运行监控软件。总价在预算范围内，10台起订有批量优惠空间。"
}
```

---

**文档完成！准备好开始实施了吗？**
```
